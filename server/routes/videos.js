// video.routes.js
const express = require("express");
const router = express.Router();
const Video = require('../models/Videos'); // your model file
const { S3Client, HeadObjectCommand, GetObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3");
const { getUploadUrl, getUploadRate, completeUpload, thumbnailUpload } = require("../services/s3");
const { listVideos, getThumbnail, getVideoById, streamVideo, deleteVideo, updateVideo } = require("../controllers/videoController");



// GET /api/videos  -> list all videos
router.get("/", listVideos);

router.get('/upload-url', getUploadUrl)
router.get('/upload-rate/:key', getUploadRate)
router.post('/complete-upload', thumbnailUpload.single('thumbnail'), completeUpload)
router.get('/:id/thumbnail', getThumbnail);

router.get("/:id",getVideoById);

// GET /api/videos/stream/:id  -> stream a specific video with chunks
router.get("/stream/:id",streamVideo);

// DELETE /videos/:id -> delete video and its S3 objects
router.delete("/:id",deleteVideo);

// PUT /videos/:id -> update video
router.put("/:id",updateVideo);

module.exports = router;
