const audioModel = require("../models/Audio");
const { listenerCount } = require("../models/User");
const Video = require("../models/Videos");
const S3= require("../services/s3");
const TranscodingService = require("../services/transcoding");
const MediaConvertService = require("../services/mediaConvert");
const { S3Client, GetObjectCommand, HeadObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3");

const s3=S3.s3
const BUCKET = process.env.AWS_BUCKET;

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
          stats:videoDoc?.stats,
          popularity:Object.fromEntries(videoDoc?.popularity || new Map()),
          thumbnail: videoDoc.thumbnail,
          qualities: Object.fromEntries(videoDoc?.qualities || new Map()),
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

    console.log(key)
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

    for (const qualityKey of video.qualities ? video.qualities.values() : []) {
      await s3.send(new DeleteObjectCommand({
        Bucket: BUCKET,
        Key: qualityKey
      }));
    }

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
    res.status(500).json({Error:err});
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
    const { inputKey, videoId } = req.body;
    
    // Start MediaConvert transcoding job (includes thumbnail)
    const result = await MediaConvertService.createTranscodingJob(inputKey, videoId);
    
    // Update video document with job info
    const video = await Video.findById(videoId);
    if (!video) return res.sendStatus(404);
    
    video.transcodingJobId = result.job.Id;
    video.transcodingStatus = 'SUBMITTED';
    video.qualities = new Map(Object.entries(result.qualities));
    await video.save();
    
    res.json({ 
      message: 'Transcoding job submitted', 
      jobId: result.job.Id,
      status: 'SUBMITTED',
      qualities: result.qualities
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Transcoding job failed' });
  }
}

static async getTranscodingStatus(req, res) {
  try {
    const { id } = req.params;
    const video = await Video.findById(id);
    if (!video || !video.transcodingJobId) {
      return res.sendStatus(404);
    }
    
    const job = await MediaConvertService.getJobStatus(video.transcodingJobId);
    
    if (job.Status === 'COMPLETE') {
      // Update video with transcoded file paths
      const qualities = {
        low: `videos/${id}/${video.key.split('/').pop().replace('.mp4', '_480p.mp4')}`,
        medium: `videos/${id}/${video.key.split('/').pop().replace('.mp4', '_720p.mp4')}`,
        high: `videos/${id}/${video.key.split('/').pop().replace('.mp4', '_1080p.mp4')}`
      };
      
      video.qualities = new Map(Object.entries(qualities));
      video.transcodingStatus = 'COMPLETE';
      await video.save();
    } else if (job.Status === 'ERROR') {
      video.transcodingStatus = 'ERROR';
      await video.save();
    }
    
    res.json({
      status: job.Status,
      progress: job.JobPercentComplete || 0,
      qualities: video.qualities ? Object.fromEntries(video.qualities) : {},
      thumbnail: video.thumbnail
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to get transcoding status' });
  }
}

static async updateVideoMetadata(req,res){
  try {
    // const {title, description, tags,} = req.query;
    // const video = await Video.findByIdAndUpdate(
    //   req.params.id,
    //   { title, description, tags },
    //   { new: true }
    // );
    const {liked,disliked}=req.query
    // console.log(req.query.liked,req.query.disliked);
    // console.log(req.params.id)
    const video=await Video.findById(req.params.id);
    // console.log(video)
    if (!video) return res.sendStatus(404);
    if(liked==='1'){
      const current = video.popularity.get(req.user._id)
      if(current === 'liked') {
        video.popularity.delete(req.user._id)
      } else {
        video.popularity.set(req.user._id,'liked')
      }
    }
    if(disliked==='1'){
      const current = video.popularity.get(req.user._id)
      if(current === 'disliked') {
        video.popularity.delete(req.user._id)
      } else {
        video.popularity.set(req.user._id,'disliked')
      }
    }
    const totalLikes = Array.from(video.popularity.entries()).filter(([key, value]) => value === 'liked').length
    video.stats.likes = totalLikes
    const totalDislikes = Array.from(video.popularity.entries()).filter(([key, value]) => value === 'disliked').length
    video.stats.dislikes = totalDislikes
    
    // video.views+=Number(views)
    const result=await video.save();
    // console.log(result.stats)
    // console.log(result.popularity)
    

    res.json({populairty:result.popularity})
    // res.json({
    //   id: video._id,
    //   owner: video?.owner,
    //   title: video?.title,
    //   description: video?.description,
    //   tags: video?.tags,
    //   key: video.key,
    //   thumbnail: video?.thumbnail,
    //   createdAt: video.createdAt
    // });
    
  } catch (error) {
    console.error(error);
  }
}

static async trackView(req, res) {
  try {
    const { id } = req.params;
    const { watchedPercentage, userId, ipAddress } = req.body;
    
    if (watchedPercentage < 10) {
      return res.json({ message: 'View not counted - insufficient watch time' });
    }
    
    const video = await Video.findById(id);
    if (!video) return res.sendStatus(404);
    
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    let existingView;
    
    if (userId) {
      // For logged-in users, check by userId
      existingView = video.viewHistory.find(view => 
        view.userId && view.userId.toString() === userId && view.timestamp > oneDayAgo
      );
    } else if (ipAddress) {
      // For anonymous users, check by IP
      existingView = video.viewHistory.find(view => 
        view.ip === ipAddress && view.timestamp > oneDayAgo && !view.userId
      );
    } else {
      return res.status(400).json({ message: 'Either userId or ipAddress is required' });
    }
    
    if (!existingView) {
      const viewEntry = { watchedPercentage };
      if (userId) {
        viewEntry.userId = userId;
      } else {
        viewEntry.ip = ipAddress;
      }
      
      video.viewHistory.push(viewEntry);
      video.stats.views += 1;
      await video.save();
      res.json({ message: 'View counted', views: video.stats.views });
    } else {
      res.json({ message: 'View already counted today', views: video.stats.views });
    }
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
}

}
module.exports=videoController;