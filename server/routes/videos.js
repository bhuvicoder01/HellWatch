// video.routes.js
const express = require("express");
const router = express.Router();
const Video = require('../models/Videos'); // your model file
const { S3Client, HeadObjectCommand, GetObjectCommand } = require("@aws-sdk/client-s3");
const { getUploadUrl, getUploadRate, completeUpload } = require("../services/s3");

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
      key: v.key,
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
router.post('/complete-upload', completeUpload)

router.get("/:id", async (req, res) => {
  try {
    const videoDoc = await Video.findById(req.params.id);
    if (!videoDoc) return res.sendStatus(404);

    const formatted = {
      id: videoDoc._id,
      key: videoDoc.key,
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

    const CHUNK_SIZE = 3 * 1024 * 1024; // 3 MB
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

module.exports = router;
