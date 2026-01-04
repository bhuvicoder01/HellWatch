const express = require('express');
const { spawn } = require('child_process');
const { createProxyMiddleware } = require('http-proxy-middleware');
const os = require('os');
const http = require('http');
const cors=require('cors')

const app = express();

app.use(cors({
  origin:['https://hell-watch.vercel.app','http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Origin', 'X-Requested-With', 'Accept', 'x-client-key', 'x-client-token', 'x-client-secret', 'Authorization'],
  credentials: true,
  preflightContinue: true
}))

let backends = [];
let backendIndex = 0;
const BASE_PORT = 3000;
const NETWORK = 'hellwatch_hellwatch'; // run `docker network ls | grep hellwatch` to confirm

// Track active requests per backend
const activeRequests = new Map();

// Track last request time per backend
const lastRequestTime = new Map();

// -------- Health check inside Docker network --------
const checkServerHealth = (containerName, maxRetries = 5) =>
  new Promise((resolve) => {
    let attempts = 0;

    const tryOnce = () => {
      const req = http.get(`http://${containerName}:${BASE_PORT}/health`, (res) => {
        if (res.statusCode === 200) {
          console.log(`✅ ${containerName} is healthy`);
          resolve(true);
        } else if (++attempts < maxRetries) {
          setTimeout(tryOnce, 1000);
        } else {
          console.log(`❌ ${containerName} failed health (status ${res.statusCode})`);
          resolve(false);
        }
      });

      req.on('error', () => {
        if (++attempts < maxRetries) {
          setTimeout(tryOnce, 1000);
        } else {
          console.log(`❌ ${containerName} unreachable after ${maxRetries} attempts`);
          resolve(false);
        }
      });

      req.setTimeout(2000);
    };

    tryOnce();
  });

// -------- SPAWN BACKEND + VERIFY --------
const spawnServer = async (id) => {
  const name = `dyn-server-${id}`;
  console.log(`🐳 Spawning ${name}...`);

  spawn('docker', [
    'run',
    '-d',
    '--rm',
    '--network', NETWORK,
    '--name', name,
    'hellwatch-server:latest'
  ]);

  console.log(`⏳ Waiting for ${name} to be healthy...`);
  const ok = await checkServerHealth(name);

  if (ok) {
    const url = `http://${name}:${BASE_PORT}`;
    backends.push(url);
    activeRequests.set(url, 0);
    lastRequestTime.set(url, 0);
    console.log(`✅ ${name} added (Total: ${backends.length})`);
  } else {
    console.log(`🗑️ Stopping unhealthy ${name}`);
    spawn('docker', ['stop', name]);
  }
};

// -------- KILL BACKEND --------
const killServer = () => {
  if (backends.length <= 1) return false;

  const now = Date.now();
  // Find a backend that hasn't had a request in the last 5 seconds
  const idleBackend = backends.find(backend => (now - (lastRequestTime.get(backend) || 0)) > 5000);
  if (!idleBackend) {
    return false;
  }

  const index = backends.indexOf(idleBackend);
  backends.splice(index, 1);
  activeRequests.delete(idleBackend);
  lastRequestTime.delete(idleBackend);

  const name = idleBackend.split('//')[1].split(':')[0];

  console.log(`🗑️ Stopping ${name}`);
  spawn('docker', ['stop', name]);
  console.log(`❌ ${name} removed (Total: ${backends.length})`);
  return true;
};

// -------- INITIAL SERVER --------
(async () => {
  console.log('🚀 LB starting, spawning first backend...');
  await spawnServer(1);
})();

// -------- AUTO SCALE --------
let prevTarget = 1;
let prevCurrent = 1;
let skipCount = 0;

setInterval(async () => {
  const load = os.loadavg()[0];

  const target =
    load > 2 ? 4 :
    load > 1 ? 3 :
    load > 0.5 ? 2 : 1;

  const current = backends.length;

  if (target !== prevTarget || current !== prevCurrent) {
    console.log(`📊 Load:${load.toFixed(2)} Target:${target} Current:${current}`);
    prevTarget = target;
    prevCurrent = current;
  }

  while (backends.length < target) {
    await spawnServer(backends.length + 1);
  }
  while (backends.length > target) {
    if (killServer()) {
      skipCount = 0; // reset on successful kill
    } else {
      skipCount++;
      if (skipCount % 10 === 0) {
        console.log(`⏳ Skipped kill ${skipCount} times, all backends recently active`);
      }
    }
  }
}, 10000);

// -------- LB HEALTH (not proxied) --------
app.get('/health', (req, res) => {
  const now = Date.now();
  const lastRequests = {};
  for (const [backend, time] of lastRequestTime) {
    lastRequests[backend] = time ? now - time : 'never';
  }
  res.json({
    status: 'healthy',
    role: 'load-balancer',
    backends: backends.length,
    backendsList: backends,
    load: os.loadavg()[0].toFixed(2),
    activeRequests: Object.fromEntries(activeRequests),
    lastRequestTime: lastRequests
  });
});

// -------- PROXY /api/* → backends --------
app.use('/api', (req, res, next) => {
  // if (req.path === '/health') return next(); // don't proxy LB health

  if (backends.length === 0) {
    return res.status(503).json({ error: 'No backends available' });
  }

  const target = backends[backendIndex++ % backends.length];
  console.log(`🔄 ${req.method} ${req.path} → ${target}${req.path.replace(/^\/api/, '')}`);

  // Increment active requests
  activeRequests.set(target, (activeRequests.get(target) || 0) + 1);
  lastRequestTime.set(target, Date.now());

  createProxyMiddleware({
    target,
    changeOrigin: false,
    proxyTimeout: 10000,
    timeout: 10000,
    pathRewrite: { '^/api': '' }, // /api/videos → /videos
    onProxyRes: (proxyRes, req, res) => {
      // Decrement active requests
      activeRequests.set(target, (activeRequests.get(target) || 0) - 1);
    },
    onError: (err, req, res) => {
      // Decrement on error too
      activeRequests.set(target, (activeRequests.get(target) || 0) - 1);
      console.error('Proxy error:', err.message);
      res.status(500).json({ error: 'Proxy error' });
    }
  })(req, res, next);
});

const server = app.listen(8080, () => {
  console.log('🚀 Dynamic Load Balancer running on port 8080');
});
server.setMaxListeners(1000);
