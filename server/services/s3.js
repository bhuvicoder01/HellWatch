const {S3Client,PutObjectCommand,GetObjectCommand} =require('@aws-sdk/client-s3')
const { NodeHttpHandler } =require( "@smithy/node-http-handler");
const {Agent}=require('https')
const{getSignedUrl}=require('@aws-sdk/s3-request-presigner')
const multerS3=require('multer-s3')
const multer=require('multer')
const fs = require('fs')
const path = require('path')
const upload = require('./upload')
const videoModel = require('../models/Videos')
const TranscodingService = require('./transcoding');
const audioModel = require('../models/Audio');

const agent=new Agent({
    keepAlive:true,
    maxSockets:1000
})

// 1. Configure the S3 Client
const s3=new S3Client(
    {
        region:'us-east-1',
        credentials:{
            accessKeyId:process.env.accessKeyId,
            secretAccessKey:process.env.secretAccessKey
        },
        maxAttempts: 3,
        requestHandler:new NodeHttpHandler(
            {
              httpsAgent:agent,
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

const uploadThumbnailToS3 = async (filePath, videoKey) => {
  try {
    const thumbnailKey = `thumbnails/${Date.now()}-${videoKey.split('/').pop().replace(/\.[^/.]+$/, '')}.jpg`;
    const fileBuffer = fs.readFileSync(filePath);
    
    const uploadCommand = new PutObjectCommand({
      Bucket: 'bhuvistestvideosdatabucket',
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
    bucket: 'bhuvistestvideosdatabucket',
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
const multerUpload =multer({
    storage: s3Storage,
    limits: { fileSize: 1024 * 1024 * 10 }, // Limit file size (e.g., 5MB)
    // Optional: Add file filters here if needed
});


const  getUploadUrl = async (req, res) => {
  const { fileName, fileType, fileSize } = req.query;

  const key = `videos/${Date.now()}-${fileName}`;
  
  // Initialize upload tracking
  uploadProgress.set(key, {
    startTime: Date.now(),
    fileSize: parseInt(fileSize) || 0,
    uploadRate: 0
  });

  const command = new PutObjectCommand({
    Bucket: 'bhuvistestvideosdatabucket',
    Key: key,
    ContentType: fileType,
  });

  const url = await getSignedUrl(s3, command, { expiresIn: 3600*24 }); // 24 hours
  await videoModel.create({key,title:fileName})

  return res.json({
    uploadUrl: url,
    fileKey: key,
    fileUrl: `https://bhuvistestvideosdatabucket.s3.amazonaws.com/${key}`
  });
};

const  getAudioUploadUrl = async (req, res) => {
  const { fileName, fileType, fileSize } = req.query;

  const key = `songs/${Date.now()}-${fileName}`;
  
  // Initialize upload tracking
  uploadProgress.set(key, {
    startTime: Date.now(),
    fileSize: parseInt(fileSize) || 0,
    uploadRate: 0
  });

  const command = new PutObjectCommand({
    Bucket: 'bhuvistestvideosdatabucket',
    Key: key,
    ContentType: fileType,
  });

  const url = await getSignedUrl(s3, command, { expiresIn: 3600*24 }); // 24 hours
  await audioModel.create({key,title:fileName,owner:req.user._id})

  return res.json({
    uploadUrl: url,
    fileKey: key,
    fileUrl: `https://bhuvistestvideosdatabucket.s3.amazonaws.com/${key}`
  });
};


const getUploadRate = async (req, res) => {
  const { key } = req.params;
  const progress = uploadProgress.get(key);
  
  if (!progress) {
    return res.json({ uploadRate: 0 });
  }
  
  const elapsed = (Date.now() - progress.startTime) / 1000; // seconds
  const uploadRate = elapsed > 0 ? (progress.fileSize / (1024 * 1024)) / elapsed : 0; // MB/s
  
  res.json({ uploadRate: uploadRate.toFixed(2) });
};

const completeSongUpload = async (req, res) => {
  const { key } = req.body;
  const progress = uploadProgress.get(key);
  
  try {
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
    //         Bucket: 'bhuvistestvideosdatabucket',
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
  const { key } = req.body;
  const progress = uploadProgress.get(key);
  
  try {
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
          const tempPath = path.join(__dirname, '../temp', `${video._id}_original.mp4`);
          
          const getCommand = new GetObjectCommand({
            Bucket: 'bhuvistestvideosdatabucket',
            Key: video.key
          });
          const data = await s3.send(getCommand);
          const writeStream = fs.createWriteStream(tempPath);
          
          await new Promise((resolve, reject) => {
            data.Body.pipe(writeStream);
            writeStream.on('finish', resolve);
            writeStream.on('error', reject);
          });
          
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


module.exports={s3,upload:multerUpload,getAudioUploadUrl,getUploadUrl,getUploadRate,completeSongUpload,completeVideoUpload,thumbnailUpload:upload};