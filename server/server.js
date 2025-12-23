const express = require('express');
require('dotenv').config();
const cors = require('cors');
const cookieParser = require('cookie-parser');



const app = express();
app.use(cookieParser());
app.use(cors({
  origin:['https://hell-watch.vercel.app','http://localhost:3000'],
  methods: ['GET', 'POST','PATCH', 'PUT', 'DELETE', 'OPTIONS'], // Explicitly allow methods
  allowedHeaders: ['Content-Type', 'Authorization'], // Allow necessary headers
  credentials: true,
  optionsSuccessStatus: 200, // some legacy browsers (IE11, various SmartTVs) choke on 204
  preflightContinue: false}
));
app.use(express.json({ limit: '50mb' })); // increase size as needed
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
//file and service paths
const videoRoutes = require('./routes/videos');
const MongoDB = require('./services/db');

MongoDB.connect(process.env.MONGODB_URI);

// Health check — used by LB
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    instance: process.env.HOSTNAME || process.pid,
    time: new Date().toISOString()
  });
});

// Videos API (no /api prefix here)
app.use('/videos', videoRoutes);
app.use('/auth', require('./routes/auth'));

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`🚀 Backend running on port ${PORT}`);
});

server.setMaxListeners(1000);
