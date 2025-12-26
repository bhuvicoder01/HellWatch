// video.routes.js
const express = require("express");
const router = express.Router();
const Video = require('../models/Videos'); // your model file
const { S3Client, HeadObjectCommand, GetObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3");
const { getUploadUrl, getUploadRate, thumbnailUpload, completeVideoUpload } = require("../services/s3");
const { listVideos, getThumbnail, getVideoById, streamVideo, deleteVideo, updateVideo, addQuality, transcodeVideo } = require("../controllers/videoController");
const authMiddleware = require("../middleware/Auth");



// GET /api/videos  -> list all videos
router.get("/", listVideos);

router.get('/upload-url',authMiddleware, getUploadUrl)
router.get('/upload-rate/:key', getUploadRate)
router.post('/complete-upload',authMiddleware, thumbnailUpload.single('thumbnail'), completeVideoUpload)
router.get('/:id/thumbnail', getThumbnail);

router.get("/:id",getVideoById);

// GET /api/videos/stream/:id  -> stream a specific video with chunks
router.get("/stream/:id",streamVideo);

// DELETE /videos/:id -> delete video and its S3 objects
router.delete("/:id",deleteVideo);

// PUT /videos/:id -> update video
router.put("/:id",updateVideo);

// POST /videos/:id/quality -> add quality version
router.post("/:id/quality", addQuality);

// POST /videos/transcode -> transcode video to multiple qualities
router.post("/transcode", transcodeVideo);

module.exports = router;
