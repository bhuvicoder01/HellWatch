const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const router = express.Router();

const SPRINGBOOT_URL = process.env.SPRINGBOOT_STREAMING_URL || 'http://localhost:8080';

router.use('/stream/:id', createProxyMiddleware({
    target: SPRINGBOOT_URL,
    changeOrigin: true,
    router: (req) => SPRINGBOOT_URL,
    pathRewrite: (path, req) => {
        const videoId = req.params.id;
        const newPath = `/videos/stream/${videoId}${path}`;
        // console.log(`Proxying: ${req.originalUrl} -> ${newPath}`);
        return newPath;
    },
    onError: (err, req, res) => {
        console.error('Proxy error:', err);
        res.status(500).json({ error: 'Proxy failed', message: err.message });
    }
}));

module.exports = router;
