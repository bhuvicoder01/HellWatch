// video.routes.js
const express = require("express");
const router = express.Router();
const { getAudioUploadUrl, getUploadRate,  thumbnailUpload, completeSongUpload } = require("../services/s3");
const authMiddleware = require("../middleware/Auth");
const { listAudios, getSongThumbnail, streamAudio } = require("../controllers/songController");



// GET /api/videos  -> list all videos
router.get("/", listAudios);

router.get('/upload-url',authMiddleware, getAudioUploadUrl)
router.get('/upload-rate/:key', getUploadRate)
router.post('/complete-upload', thumbnailUpload.single('thumbnail'), completeSongUpload)
router.get('/:id/thumbnail', getSongThumbnail);
router.get("/stream/:id",streamAudio);


module.exports = router;
