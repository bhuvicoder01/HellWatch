const express = require('express');
const { spawn } = require('child_process');
const { createProxyMiddleware } = require('http-proxy-middleware');
const os = require('os');
const http = require('http');
const cors=require('cors')

const app = express();

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Origin', 'X-Requested-With', 'Accept', 'x-client-key', 'x-client-token', 'x-client-secret', 'Authorization'],
  credentials: true,
  preflightContinue: true
}))

let backends = [];
let backendIndex = 0;
const BASE_PORT = 3000;
const NETWORK = 'hellwatch_hellwatch'; // run `docker network ls | grep hellwatch` to confirm

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
    backends.push(`http://${name}:${BASE_PORT}`);
    console.log(`✅ ${name} added (Total: ${backends.length})`);
  } else {
    console.log(`🗑️ Stopping unhealthy ${name}`);
    spawn('docker', ['stop', name]);
  }
};

// -------- KILL BACKEND --------
const killServer = () => {
  if (backends.length <= 1) return;

  const target = backends.pop(); // "http://dyn-server-2:3000"
  const name = target.split('//')[1].split(':')[0];

  console.log(`🗑️ Stopping ${name}`);
  spawn('docker', ['stop', name]);
  console.log(`❌ ${name} removed (Total: ${backends.length})`);
};

// -------- INITIAL SERVER --------
(async () => {
  console.log('🚀 LB starting, spawning first backend...');
  await spawnServer(1);
})();

// -------- AUTO SCALE --------
setInterval(async () => {
  const load = os.loadavg()[0];

  const target =
    load > 2 ? 4 :
    load > 1 ? 3 :
    load > 0.5 ? 2 : 1;

  console.log(`📊 Load:${load.toFixed(2)} Target:${target} Current:${backends.length}`);

  while (backends.length < target) {
    await spawnServer(backends.length + 1);
  }
  while (backends.length > target) {
    killServer();
  }
}, 10000);

// -------- LB HEALTH (not proxied) --------
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    role: 'load-balancer',
    backends: backends.length,
    backendsList: backends,
    load: os.loadavg()[0].toFixed(2)
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

  createProxyMiddleware({
    target,
    changeOrigin: false,
    proxyTimeout: 10000,
    timeout: 10000,
    pathRewrite: { '^/api': '' } // /api/videos → /videos
  })(req, res, next);
});

app.listen(8080, () => {
  console.log('🚀 Dynamic Load Balancer running on port 8080');
});
