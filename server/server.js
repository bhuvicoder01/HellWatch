const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Health check — used by LB
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    instance: process.env.HOSTNAME || process.pid,
    time: new Date().toISOString()
  });
});

// Videos API (no /api prefix here)
app.get('/videos', (req, res) => {
  res.json([
    { id: 1, title: 'HellWatch Trailer', thumbnail: 'https://via.placeholder.com/300x200?text=Trailer' },
    { id: 2, title: 'Action Movie',     thumbnail: 'https://via.placeholder.com/300x200?text=Action' },
    { id: 3, title: 'Horror Flick',     thumbnail: 'https://via.placeholder.com/300x200?text=Horror' }
  ]);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Backend running on port ${PORT}`);
});
