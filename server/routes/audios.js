// video.routes.js
const express = require("express");
const router = express.Router();
const { getAudioUploadUrl, thumbnailUpload, completeSongUpload } = require("../services/s3");
const authMiddleware = require("../middleware/Auth");
const { listAudios, getSongThumbnail, streamAudio, getAccessToken, spotifyLogin, spotifyCallback, refreshSpotifyToken } = require("../controllers/songController");



// GET /api/videos  -> list all videos
router.get("/", listAudios);

router.get('/upload-url',authMiddleware, getAudioUploadUrl)
router.post('/complete-upload',authMiddleware, thumbnailUpload.single('thumbnail'), completeSongUpload)
router.get('/:id/thumbnail', getSongThumbnail);
router.get("/stream/:id",streamAudio);
router.get("/spotify-token",getAccessToken)
router.get("/spotify-login", spotifyLogin)
router.get("/spotify-callback", spotifyCallback)
router.post("/spotify-refresh", refreshSpotifyToken)


module.exports = router;
