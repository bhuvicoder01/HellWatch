const { listenerCount } = require("../models/User");
const Video = require("../models/Videos");
const TranscodingService = require("../services/transcoding");
const { S3Client, GetObjectCommand, HeadObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3");

const s3=new S3Client(
    {
        region:'us-east-1',
        credentials:{
            accessKeyId:process.env.accessKeyId,
            secretAccessKey:process.env.secretAccessKey
        },
        maxAttempts: 3,
        requestHandler: {
            maxSockets: 1000
        }
    }
)
const BUCKET = 'bhuvistestvideosdatabucket';

class videoController {
    static async listVideos(req, res) {
      try {
        const videos = await Video.find().sort({ createdAt: -1 }); // latest first
        // send only what React needs
        const formatted = videos.map(v => ({
          id: v._id,
          owner: v?.owner,
          title: v?.title,
          key: v.key,
          thumbnail: v.thumbnail,
          qualities: Object.fromEntries(v.qualities || new Map()),
          createdAt: v.createdAt
        }));
        res.json(formatted);
      } catch (err) {
        console.error(err);
        res.sendStatus(500);
      }
    }
    static async getThumbnail(req, res) {
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
    }

     static async getVideoById(req, res) {
  try {
    const videoDoc = await Video.findById(req.params.id);
    if (!videoDoc) return res.sendStatus(404);

    const formatted = {
      id: videoDoc._id,
      owner: videoDoc?.owner,
      title: videoDoc.title,
      key: videoDoc.key,
      thumbnail: videoDoc.thumbnail,
      qualities: Object.fromEntries(videoDoc.qualities || new Map()),
      createdAt: videoDoc.createdAt
    };
    res.json(formatted);
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
}

 static async streamVideo(req, res) {
  try {
    const videoDoc = await Video.findById(req.params.id);
    if (!videoDoc) return res.sendStatus(404);

    const quality = req.query.quality || 'high';
    let key = videoDoc.key;
    
    // Use quality-specific key if available
    if (quality !== 'original' && videoDoc.qualities && videoDoc.qualities.get(quality)) {
      key = videoDoc.qualities.get(quality);
    }

    const range = req.headers.range;
    if (!range) {
      return res.status(416).send("Requires Range header");
    }

    // Get total size
    const headData = await s3.send(
      new HeadObjectCommand({ Bucket: BUCKET, Key: key })
    );
    const videoSize = headData.ContentLength;


    const CHUNK_SIZE = 3 * 1024 * 1024; // 3MB
    const start = Number(range.replace(/\D/g, ""));
    const end = Math.min(start + CHUNK_SIZE, videoSize - 1);
    const contentLength = end - start + 1;

    res.writeHead(206, {
      "Content-Range": `bytes ${start}-${end}/${videoSize}`,
      "Accept-Ranges": "bytes",
      "Content-Length": contentLength,
      "Content-Type": headData.ContentType || "video/mp4",
      "X-Quality": quality
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
}
static async deleteVideo(req, res) {
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
}
static async updateVideo(req, res) {
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
      owner: video?.owner,
      title: video?.title,
      key: video.key,
      thumbnail: video?.thumbnail,
      createdAt: video.createdAt
    });
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
}

static async addQuality(req, res) {
  try {
    const { quality, key } = req.body;
    const video = await Video.findById(req.params.id);
    if (!video) return res.sendStatus(404);
    
    if (!video.qualities) video.qualities = new Map();
    video.qualities.set(quality, key);
    await video.save();
    
    res.json({ message: 'Quality added', qualities: Object.fromEntries(video.qualities) });
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
}

static async transcodeVideo(req, res) {
  try {
    const { videoPath, videoId } = req.body;
    
    // Start transcoding process
    const qualities = await TranscodingService.transcodeVideo(videoPath, videoId);
    const thumbnail = await TranscodingService.generateThumbnail(videoPath, videoId);
    
    // Update video document with quality versions
    const video = await Video.findById(videoId);
    if (!video) return res.sendStatus(404);
    
    video.qualities = new Map(Object.entries(qualities));
    video.thumbnail = thumbnail;
    await video.save();
    
    res.json({ 
      message: 'Transcoding completed', 
      qualities: Object.fromEntries(video.qualities),
      thumbnail: video.thumbnail
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Transcoding failed' });
  }
}

}
module.exports=videoController;