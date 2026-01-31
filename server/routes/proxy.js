const express = require('express');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { url } = req.query;
    if (!url) return res.status(400).send('URL required');
    
    const response = await fetch(url);
    const buffer = await response.arrayBuffer();
    
    res.set('Content-Type', response.headers.get('content-type') || 'image/jpeg');
    res.send(Buffer.from(buffer));
  } catch (error) {
    res.status(500).send('Error fetching image');
  }
});

module.exports = router;