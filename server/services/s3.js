const {S3Client,PutObjectCommand,GetObjectCommand} =require('@aws-sdk/client-s3')
const{getSignedUrl}=require('@aws-sdk/s3-request-presigner')
const multerS3=require('multer-s3')
const multer=require('multer')
const fs = require('fs')
const upload = require('./upload')
const videoModel = require('../models/Videos')

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


// 1. Configure the S3 Client
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




// 2. Configure multer-s3 storage
const s3Storage = multerS3({
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
const multerUpload = multer({
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

  const url = await getSignedUrl(s3, command, { expiresIn: 900 });
  await videoModel.create({key})

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

const completeUpload = async (req, res) => {
  const { key } = req.body;
  const progress = uploadProgress.get(key);
  
  try {
    let thumbnailKey = null;
    
    if (req.file) {
      try {
        thumbnailKey = await uploadThumbnailToS3(req.file.path, key);
      } catch (error) {
        // Ensure temp file is deleted even if upload fails
        if (fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
        throw error;
      }
    }
    
    await videoModel.findOneAndUpdate(
      { key },
      { thumbnail: thumbnailKey }
    );
    
    if (progress) {
      const elapsed = (Date.now() - progress.startTime) / 1000;
      const finalRate = elapsed > 0 ? (progress.fileSize / (1024 * 1024)) / elapsed : 0;
      uploadProgress.delete(key);
      return res.json({ 
        finalUploadRate: finalRate.toFixed(2),
        thumbnailKey
      });
    }
    
    res.json({ finalUploadRate: 0, thumbnailKey });
    if (fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
  } catch (error) {
    console.error('Error uploading thumbnail:', error);
    
    // Cleanup temp file if it still exists
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

module.exports={s3,upload:multerUpload,getUploadUrl,getUploadRate,completeUpload,thumbnailUpload:upload};