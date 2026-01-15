const { S3Client, PutObjectCommand, GetObjectCommand, CreateMultipartUploadCommand, UploadPartCommand, CompleteMultipartUploadCommand, AbortMultipartUploadCommand } = require('@aws-sdk/client-s3')
const { NodeHttpHandler } = require("@smithy/node-http-handler");
const { Agent } = require('https')
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner')
const multerS3 = require('multer-s3')
const multer = require('multer')
const fs = require('fs')
const path = require('path')
const upload = require('./upload')
const videoModel = require('../models/Videos')
const TranscodingService = require('./transcoding');
const audioModel = require('../models/Audio');
const userModel = require('../models/User');


const agent = new Agent({
  keepAlive: true,
  maxSockets: 1000
})
// 1. Configure the S3 Client
const s3 = new S3Client(
  {
    region: 'ap-south-1',
    credentials: {
      accessKeyId: process.env.accessKeyId,
      secretAccessKey: process.env.secretAccessKey
    },
    maxAttempts: 3,
    requestHandler: new NodeHttpHandler(
      {
        httpsAgent: agent,
        requestTimeout: 3000000,
        connectionTimeout: 3000000,
        socketAcquisitionWarningTimeout: 3000000
      }
    ),
    connectionTimeout: 3000000,
    httpOptions: {
      maxSockets: 1000
    }
  }
)

// Track upload progress
const uploadProgress = new Map();

// Export uploadProgress for WebSocket access
module.exports.uploadProgress = uploadProgress;

// Broadcast upload progress via WebSocket
const broadcastProgress = (key, progress) => {
  if (!global.wss) return;
  
  global.wss.clients.forEach(client => {
    if (client.uploadKey === key && client.readyState === 1) {
      client.send(JSON.stringify({
        type: 'progress',
        key,
        uploadRate: progress.uploadRate,
        elapsed: progress.elapsed
      }));
    }
  });
};

const uploadThumbnailToS3 = async (filePath, videoKey) => {
  try {
    const thumbnailKey = `thumbnails/${Date.now()}-${videoKey.split('/').pop().replace(/\.[^/.]+$/, '')}.jpg`;
    const fileBuffer = fs.readFileSync(filePath);

    const uploadCommand = new PutObjectCommand({
      Bucket: 'bhuvisvbhuvistestvideosdatabucketmumbairegion',
      Key: thumbnailKey,
      Body: fileBuffer,
      ContentType: 'image/jpeg'
    });

    await s3.send(uploadCommand);

    // Clean up local file
    fs.unlinkSync(filePath);

    return thumbnailKey;
  } catch (error) {
    throw error;
  }
};







// 2. Configure multer-s3 storage
const s3Storage = new multerS3({
  s3: s3,
  bucket: 'bhuvisvbhuvistestvideosdatabucketmumbairegion',
  // acl: 'public-read', // Set appropriate access control
  metadata: (req, file, cb) => {
    cb(null, { fieldName: file.fieldname });
  },
  key: (req, file, cb) => {
    // Define the file name/key in S3 (e.g., use a timestamp to ensure uniqueness)
    cb(null, `uploads/${Date.now().toString()}-${file.originalname}`);
  },
});

// 3. Create the upload middleware instance
const multerUpload = multer({
  storage: s3Storage,
  limits: { fileSize: 1024 * 1024 * 10 }, // Limit file size (e.g., 5MB)
  // Optional: Add file filters here if needed
});


const getUploadUrl = async (req, res) => {
  try {
    const { fileName, fileType, fileSize } = req.query;

    const key = `videos/${Date.now()}-${fileName}`;

    // Initialize upload tracking
    uploadProgress.set(key, {
      startTime: Date.now(),
      fileSize: parseInt(fileSize) || 0,
      uploadRate: 0
    });

    // Start progress monitoring
    const progressInterval = setInterval(() => {
      const progress = uploadProgress.get(key);
      if (!progress) {
        clearInterval(progressInterval);
        return;
      }

      const elapsed = (Date.now() - progress.startTime) / 1000;
      const uploadRate = elapsed > 0 ? (progress.fileSize / (1024 * 1024)) / elapsed : 0;
      
      broadcastProgress(key, { uploadRate: uploadRate.toFixed(2), elapsed: elapsed.toFixed(1) });
    }, 1000);

    // Store interval for cleanup
    uploadProgress.get(key).interval = progressInterval;

    const command = new PutObjectCommand({
      Bucket: 'bhuvisvbhuvistestvideosdatabucketmumbairegion',
      Key: key,
      ContentType: fileType,
    });

    const url = await getSignedUrl(s3, command, { expiresIn: 3600 * 24 });

    return res.json({
      uploadUrl: url,
      fileKey: key,
      fileUrl: `https://bhuvisvbhuvistestvideosdatabucketmumbairegion.s3.amazonaws.com/${key}`
    });
  }
  catch (error) {
    console.error(error)
    res.status(500).json({ error: error })
  }
};

const getAudioUploadUrl = async (req, res) => {
  try {
    const { fileName, fileType, fileSize } = req.query;

    const key = `songs/${Date.now()}-${fileName}`;

    // Initialize upload tracking
    uploadProgress.set(key, {
      startTime: Date.now(),
      fileSize: parseInt(fileSize) || 0,
      uploadRate: 0
    });

    // Start progress monitoring
    const progressInterval = setInterval(() => {
      const progress = uploadProgress.get(key);
      if (!progress) {
        clearInterval(progressInterval);
        return;
      }

      const elapsed = (Date.now() - progress.startTime) / 1000;
      const uploadRate = elapsed > 0 ? (progress.fileSize / (1024 * 1024)) / elapsed : 0;
      
      broadcastProgress(key, { uploadRate: uploadRate.toFixed(2), elapsed: elapsed.toFixed(1) });
    }, 1000);

    uploadProgress.get(key).interval = progressInterval;

    const command = new PutObjectCommand({
      Bucket: 'bhuvisvbhuvistestvideosdatabucketmumbairegion',
      Key: key,
      ContentType: fileType,
    });

    const url = await getSignedUrl(s3, command, { expiresIn: 3600 * 24 });

    return res.json({
      uploadUrl: url,
      fileKey: key,
      fileUrl: `https://bhuvisvbhuvistestvideosdatabucketmumbairegion.s3.amazonaws.com/${key}`
    });
  }
  catch (error) {
    console.error(error)
    res.status(500).json({ error: error })
  }
};


// Multipart upload functions
const initiateMultipartUpload = async (req, res) => {
  try {
    const { fileName, fileType } = req.body;
    const key = `videos/${Date.now()}-${fileName}`;

    const command = new CreateMultipartUploadCommand({
      Bucket: 'bhuvisvbhuvistestvideosdatabucketmumbairegion',
      Key: key,
      ContentType: fileType
    });

    const result = await s3.send(command);
    
    res.json({
      uploadId: result.UploadId,
      key: key
    });
  } catch (error) {
    console.error('Error initiating multipart upload:', error);
    res.status(500).json({ error: error.message });
  }
};

const getPresignedUrls = async (req, res) => {
  try {
    const { key, uploadId, parts } = req.body;
    const urls = [];

    for (let i = 1; i <= parts; i++) {
      const command = new UploadPartCommand({
        Bucket: 'bhuvisvbhuvistestvideosdatabucketmumbairegion',
        Key: key,
        UploadId: uploadId,
        PartNumber: i
      });

      const url = await getSignedUrl(s3, command, { expiresIn: 3600*24 });
      urls.push({ partNumber: i, url });
    }

    console.log('Generated URLs:', urls); // Debug log
    res.json({ urls });
  } catch (error) {
    console.error('Error generating presigned URLs:', error);
    res.status(500).json({ error: error.message });
  }
};

const completeMultipartUpload = async (req, res) => {
  try {
    const { key, uploadId, parts } = req.body;

    const command = new CompleteMultipartUploadCommand({
      Bucket: 'bhuvisvbhuvistestvideosdatabucketmumbairegion',
      Key: key,
      UploadId: uploadId,
      MultipartUpload: {
        Parts: parts.map(part => ({
          ETag: part.etag,
          PartNumber: part.partNumber
        }))
      }
    });

    const result = await s3.send(command);
    
    res.json({
      location: result.Location,
      key: key
    });
  } catch (error) {
    console.error('Error completing multipart upload:', error);
    res.status(500).json({ error: error.message });
  }
};

const abortMultipartUpload = async (req, res) => {
  try {
    const { key, uploadId } = req.body;

    const command = new AbortMultipartUploadCommand({
      Bucket: 'bhuvisvbhuvistestvideosdatabucketmumbairegion',
      Key: key,
      UploadId: uploadId
    });

    await s3.send(command);
    res.json({ message: 'Upload aborted successfully' });
  } catch (error) {
    console.error('Error aborting multipart upload:', error);
    res.status(500).json({ error: error.message });
  }
};

const completeSongUpload = async (req, res) => {
  const { key, title,artist,album,albumartist } = req.body;
  const progress = uploadProgress.get(key);

  try {
    // Clear progress interval
    if (progress?.interval) {
      clearInterval(progress.interval);
    }

    const owner = await userModel.findById(req.user._id)
    await audioModel.create({ key,title,album,artist,albumartist, 'owner.id': req.user._id, 'owner.username': owner?.username, 'owner.pic': owner?.avatar?.url, 'owner.email': owner?.email })

    let thumbnailKey = null;

    if (req.file) {
      try {
        thumbnailKey = await uploadThumbnailToS3(req.file.path, key);
      } catch (error) {
        if (fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
        throw error;
      }
    }

    const audio = await audioModel.findOneAndUpdate(
      { key },
      { thumbnail: thumbnailKey },
      { new: true }
    );

    // Start transcoding in background
    // if (video) {
    //   setTimeout(async () => {
    //     try {
    //       const tempPath = path.join(__dirname, '../temp', `${video._id}_original.mp4`);

    //       const getCommand = new GetObjectCommand({
    //         Bucket: 'bhuvisvbhuvistestvideosdatabucketmumbairegion ',
    //         Key: video.key
    //       });
    //       const data = await s3.send(getCommand);
    //       const writeStream = fs.createWriteStream(tempPath);

    //       await new Promise((resolve, reject) => {
    //         data.Body.pipe(writeStream);
    //         writeStream.on('finish', resolve);
    //         writeStream.on('error', reject);
    //       });

    //       const qualities = await TranscodingService.transcodeVideo(tempPath, video._id);
    //       const autoThumbnail = await TranscodingService.generateThumbnail(tempPath, video._id);

    //       video.qualities = new Map(Object.entries(qualities));
    //       if (!video.thumbnail) video.thumbnail = autoThumbnail;
    //       await video.save();

    //       if (fs.existsSync(tempPath)) {
    //         fs.unlinkSync(tempPath);
    //       }

    //       console.log(`Transcoding completed for video ${video._id}`);
    //     } catch (error) {
    //       console.error('Transcoding failed:', error);
    //     }
    //   }, 2000);
    // }

    // if (progress) {
    //   const elapsed = (Date.now() - progress.startTime) / 1000;
    //   const finalRate = elapsed > 0 ? (progress.fileSize / (1024 * 1024)) / elapsed : 0;
    //   uploadProgress.delete(key);
    //   return res.json({ 
    //     finalUploadRate: finalRate.toFixed(2),
    //     thumbnailKey,
    //     message: 'Upload completed, transcoding started'
    //   });
    // }

    res.json({ finalUploadRate: 0, thumbnailKey, message: 'Upload completed, transcoding started' });
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
  } catch (error) {
    console.error('Error in completeUpload:', error);

    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    if (progress) {
      const elapsed = (Date.now() - progress.startTime) / 1000;
      const finalRate = elapsed > 0 ? (progress.fileSize / (1024 * 1024)) / elapsed : 0;
      uploadProgress.delete(key);
      return res.json({ finalUploadRate: finalRate.toFixed(2) });
    }

    res.json({ finalUploadRate: 0 });
  }
};

const completeVideoUpload = async (req, res) => {
  const { key, title } = req.body;
  const progress = uploadProgress.get(key);

  try {
    // Clear progress interval
    if (progress?.interval) {
      clearInterval(progress.interval);
    }

    const owner = await userModel.findById(req.user._id)
    await videoModel.create({ key, title: title, 'owner.id': req.user._id, 'owner.username': owner?.username, 'owner.pic': owner?.avatar?.url, 'owner.email': owner?.email })

    let thumbnailKey = null;

    if (req.file) {
      try {
        thumbnailKey = await uploadThumbnailToS3(req.file.path, key);
      } catch (error) {
        if (fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
        throw error;
      }
    }

    const video = await videoModel.findOneAndUpdate(
      { key },
      { thumbnail: thumbnailKey },
      { new: true }
    );

    // Start transcoding in background
    if (video) {
      setTimeout(async () => {
        try {
          const tempDir = path.join(__dirname, '../temp');
          const tempPath = path.join(tempDir, `${video._id}_original.mp4`);

          // Ensure temp directory exists
          if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
          }

          const getCommand = new GetObjectCommand({
            Bucket: 'bhuvisvbhuvistestvideosdatabucketmumbairegion',
            Key: video.key
          });
          const data = await s3.send(getCommand);

          // Check if S3 response has Body
          if (!data.Body) {
            throw new Error('No data received from S3');
          }

          const writeStream = fs.createWriteStream(tempPath);

          await new Promise((resolve, reject) => {
            data.Body.pipe(writeStream);
            writeStream.on('finish', resolve);
            writeStream.on('error', reject);
          });

          // Verify file was created successfully
          if (!fs.existsSync(tempPath)) {
            throw new Error(`Failed to create temp file: ${tempPath}`);
          }

          const qualities = await TranscodingService.transcodeVideo(tempPath, video._id);
          const autoThumbnail = await TranscodingService.generateThumbnail(tempPath, video._id);

          video.qualities = new Map(Object.entries(qualities));
          if (!video.thumbnail) video.thumbnail = autoThumbnail;
          await video.save();

          if (fs.existsSync(tempPath)) {
            fs.unlinkSync(tempPath);
          }

          console.log(`Transcoding completed for video ${video._id}`);
        } catch (error) {
          console.error('Transcoding failed:', error);
        }
      }, 2000);
    }

    if (progress) {
      const elapsed = (Date.now() - progress.startTime) / 1000;
      const finalRate = elapsed > 0 ? (progress.fileSize / (1024 * 1024)) / elapsed : 0;
      uploadProgress.delete(key);
      return res.json({
        finalUploadRate: finalRate.toFixed(2),
        thumbnailKey,
        message: 'Upload completed, transcoding started'
      });
    }

    res.json({ finalUploadRate: 0, thumbnailKey, message: 'Upload completed, transcoding started' });
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
  } catch (error) {
    console.error('Error in completeUpload:', error);

    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    if (progress) {
      const elapsed = (Date.now() - progress.startTime) / 1000;
      const finalRate = elapsed > 0 ? (progress.fileSize / (1024 * 1024)) / elapsed : 0;
      uploadProgress.delete(key);
      return res.json({ finalUploadRate: finalRate.toFixed(2) });
    }

    res.json({ finalUploadRate: 0 });
  }
};


module.exports = {
  s3,
  upload: multerUpload,
  getAudioUploadUrl,
  getUploadUrl,
  completeSongUpload,
  completeVideoUpload,
  thumbnailUpload: upload,
  initiateMultipartUpload,
  getPresignedUrls,
  completeMultipartUpload,
  abortMultipartUpload,
  uploadProgress
};