// video.routes.js
const express = require("express");
const router = express.Router();
const Video = require('../models/Videos'); // your model file
const { S3Client, HeadObjectCommand, GetObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3");
const { getUploadUrl, getUploadRate, completeUpload, thumbnailUpload } = require("../services/s3");

const s3=new S3Client(
    {
        region:'us-east-1',
        credentials:{
            accessKeyId:process.env.accessKeyId,
            secretAccessKey:process.env.secretAccessKey
        }
    }
)

const BUCKET = 'bhuvistestvideosdatabucket';

// GET /api/videos  -> list all videos
router.get("/", async (req, res) => {
  try {
    const videos = await Video.find().sort({ createdAt: -1 }); // latest first
    // send only what React needs
    const formatted = videos.map(v => ({
      id: v._id,
      title: v?.title,
      key: v.key,
      thumbnail: v.thumbnail,
      createdAt: v.createdAt
    }));
    res.json(formatted);
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
});

router.get('/upload-url', getUploadUrl)
router.get('/upload-rate/:key', getUploadRate)
router.post('/complete-upload', thumbnailUpload.single('thumbnail'), completeUpload)
router.get('/:id/thumbnail', async (req, res) => {
  try {
    const { id } = req.params;
    const video = await Video.findById(id);
    if (!video || !video.thumbnail) {
      return res.sendStatus(404);
    }
    
    const command = new GetObjectCommand({
      Bucket: BUCKET,
      Key: video.thumbnail
    });
    
    const data = await s3.send(command);
    res.setHeader('Content-Type', 'image/jpeg');
    data.Body.pipe(res);
  } catch (error) {
    console.error(error);
    res.sendStatus(500);
  }
});

router.get("/:id", async (req, res) => {
  try {
    const videoDoc = await Video.findById(req.params.id);
    if (!videoDoc) return res.sendStatus(404);

    const formatted = {
      id: videoDoc._id,
      title: videoDoc.title,
      key: videoDoc.key,
      thumbnail: videoDoc.thumbnail,
      createdAt: videoDoc.createdAt
    };
    res.json(formatted);
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
});

// GET /api/videos/stream/:id  -> stream a specific video with chunks
router.get("/stream/:id", async (req, res) => {
  try {
    const videoDoc = await Video.findById(req.params.id);
    if (!videoDoc) return res.sendStatus(404);

    const key = videoDoc.key;
    const range = req.headers.range;
    if (!range) {
      return res.status(416).send("Requires Range header");
    }

    // 1. Get total size
    const headData = await s3.send(
      new HeadObjectCommand({ Bucket: BUCKET, Key: key })
    );
    const videoSize = headData.ContentLength;

    const CHUNK_SIZE = 2 * 1024 * 1024; // 2 MB
    const start = Number(range.replace(/\D/g, ""));
    const end = Math.min(start + CHUNK_SIZE, videoSize - 1);
    const contentLength = end - start + 1;

    res.writeHead(206, {
      "Content-Range": `bytes ${start}-${end}/${videoSize}`,
      "Accept-Ranges": "bytes",
      "Content-Length": contentLength,
      "Content-Type": headData.ContentType || "video/mp4"
    });

    const command = new GetObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Range: `bytes=${start}-${end}`
    });

    const data = await s3.send(command);
    data.Body.pipe(res);
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
});

// DELETE /videos/:id -> delete video and its S3 objects
router.delete("/:id", async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) return res.sendStatus(404);

    // Delete video from S3
    await s3.send(new DeleteObjectCommand({
      Bucket: BUCKET,
      Key: video.key
    }));

    // Delete thumbnail from S3 if exists
    if (video.thumbnail) {
      await s3.send(new DeleteObjectCommand({
        Bucket: BUCKET,
        Key: video.thumbnail
      }));
    }

    // Delete from database
    await Video.findByIdAndDelete(req.params.id);
    res.sendStatus(204);
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
});

// PUT /videos/:id -> update video metadata
router.put("/:id", async (req, res) => {
  try {
    const { title } = req.body;
    const video = await Video.findByIdAndUpdate(
      req.params.id,
      { title },
      { new: true }
    );
    if (!video) return res.sendStatus(404);
    
    res.json({
      id: video._id,
      title: video?.title,
      key: video.key,
      thumbnail: video?.thumbnail,
      createdAt: video.createdAt
    });
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
});

module.exports = router;
