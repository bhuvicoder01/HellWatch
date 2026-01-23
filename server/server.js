const express = require('express');
require('dotenv').config();
const cors = require('cors');
const cookieParser = require('cookie-parser');
const {exec}=require('child_process')
const jwt = require('jsonwebtoken');
const { WebSocketServer } = require('ws');



const app = express();
app.use(cookieParser());
app.use(cors({
  origin:['https://hell-watch.vercel.app','http://localhost:3000','https://hellwatch-ping-service.onrender.com'],
  methods: ['GET', 'POST','PATCH', 'PUT', 'DELETE',], // Explicitly allow methods
  allowedHeaders: ['Content-Type', 'Authorization'], // Allow necessary headers
  credentials: true,
  optionsSuccessStatus: 200,
  preflightContinue:false
}
));
app.use(express.json({ limit: '50mb' })); // increase size as needed
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
//file and service paths
const videoRoutes = require('./routes/videos');
const MongoDB = require('./services/db');
const authMiddleware = require('./middleware/Auth');
const rateLimiter = require('./services/rateLimiter');



// Function to generate Apple Music developer token
function generateAppleMusicToken() {
  const privateKey = process.env.APPLE_PRIVATE_KEY.replace(/\\n/g, '\n');
  const teamId = process.env.APPLE_TEAM_ID;
  const keyId = process.env.APPLE_KEY_ID;
  const payload = {
    iss: teamId,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600, // Expires in 1 hour
  };
  return jwt.sign(payload, privateKey, { algorithm: 'ES256', keyid: keyId });
}


// app.use(rateLimiter(10,50000))
// Health check — used by LB
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    instance: process.env.HOSTNAME || process.pid,
    time: new Date().toISOString()
  });
});
app.use('/songs', require('./routes/audios'));
app.use('/videos', videoRoutes);
app.use('/auth', require('./routes/auth'));

app.use('/public', require('./routes/public'));

// Apple Music search route
app.get('/apple-music/search', async (req, res) => {
  const query = req.query.term;
  if (!query) return res.status(400).json({ error: 'Query term required' });

  const token = generateAppleMusicToken();
  try {
    const response = await fetch(`https://api.music.apple.com/v1/catalog/us/search?term=${encodeURIComponent(query)}&types=songs`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      }
    });
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Apple Music developer token route
app.get('/apple-music/token', (req, res) => {
  try {
    const token = generateAppleMusicToken();
    res.json({ token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//ping reverse to ping service alive
app.use('/ping-reverse',async(req,res)=>{
  exec('curl https://hellwatch-ping-service.onrender.com', (error, stdout, stderr) => {
    if (error) {
        // console.error(`exec error: ${error}`);
        return res.status(500).send('Error executing curl command');
    }
    // console.log(`stdout: ${stdout}`);
    // console.error(`stderr: ${stderr}`);
    res.send('Pinged reverse service successfully');
  });
});


app.use('/page', async(req,res)=>{
const user=req.user
const resp=('http://localhost:5000/videos/stream/694e99ef8e45c5bdfade4d85')
const page = `<div class='container w-50'>hello from ${user?.username}
<video classname='' style={{maxWidth:'50px'}}  autoplay><source src='http://localhost:5000/videos/stream/694e99ef8e45c5bdfade4d85'/><video/>
</div>`;
res.writeHead(206, {
    'Content-Length': Buffer.byteLength(page),
    'Content-Type': 'text/plain',
  })
  .end(page);
})

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`🚀 Backend running on port ${PORT}`);
  MongoDB.connect(process.env.MONGODB_URI);
});

server.setMaxListeners(10000);

// WebSocket server for upload progress
const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
  console.log('WebSocket client connected');
  
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      if (data.type === 'subscribe') {
        ws.uploadKey = data.key;
      }
    } catch (error) {
      console.error('WebSocket message error:', error);
    }
  });

  ws.on('close', () => {
    console.log('WebSocket client disconnected');
  });
});

global.wss = wss;
