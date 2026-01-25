// video.routes.js
const express = require("express");
const router = express.Router();
const Video = require('../models/Videos'); // your model file
const { S3Client, HeadObjectCommand, GetObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3");
const { getUploadUrl, thumbnailUpload, completeVideoUpload, initiateMultipartUpload, getPresignedUrls, completeMultipartUpload, abortMultipartUpload } = require("../services/s3");
const { listVideos, getThumbnail, getVideoById, streamVideo, deleteVideo, updateVideo, addQuality, transcodeVideo, updateVideoMetadata, trackView } = require("../controllers/videoController");
const authMiddleware = require("../middleware/Auth");
const rateLimiter = require("../services/rateLimiter");



// GET /api/videos  -> list all videos
router.get("/", listVideos);

router.get('/upload-url',authMiddleware, getUploadUrl)
router.post('/complete-upload',authMiddleware, thumbnailUpload.single('thumbnail'), completeVideoUpload)

// Multipart upload routes
router.post('/multipart/initiate', authMiddleware, initiateMultipartUpload)
router.post('/multipart/urls', authMiddleware, getPresignedUrls)
router.post('/multipart/complete', authMiddleware, completeMultipartUpload)
router.post('/multipart/abort', authMiddleware, abortMultipartUpload)
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

router.put('/:id/actions',authMiddleware, updateVideoMetadata)

router.post('/:id/track-view', trackView)

module.exports = router;
