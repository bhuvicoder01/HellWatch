// Example usage after video upload completion

// 1. In your completeUpload function in s3.js, add transcoding trigger:
const TranscodingService = require('./transcoding');

// After saving video to database
const completeUpload = async (req, res) => {
  try {
    // ... existing upload logic ...
    
    // Save video to database first
    const video = new Video({
      owner: req.user?.id,
      title: req.body.title,
      key: req.body.key,
      thumbnail: thumbnailKey
    });
    await video.save();
    
    // Trigger transcoding in background
    setTimeout(async () => {
      try {
        const tempPath = path.join(__dirname, '../temp', `${video._id}_original.mp4`);
        
        // Download original from S3 to temp file
        const getCommand = new GetObjectCommand({
          Bucket: BUCKET,
          Key: video.key
        });
        const data = await s3.send(getCommand);
        const writeStream = fs.createWriteStream(tempPath);
        data.Body.pipe(writeStream);
        
        await new Promise((resolve, reject) => {
          writeStream.on('finish', resolve);
          writeStream.on('error', reject);
        });
        
        // Transcode video
        const qualities = await TranscodingService.transcodeVideo(tempPath, video._id);
        const thumbnail = await TranscodingService.generateThumbnail(tempPath, video._id);
        
        // Update video with qualities
        video.qualities = new Map(Object.entries(qualities));
        video.thumbnail = thumbnail;
        await video.save();
        
        // Clean up temp file
        fs.unlinkSync(tempPath);
        
        console.log(`Transcoding completed for video ${video._id}`);
      } catch (error) {
        console.error('Transcoding failed:', error);
      }
    }, 1000); // Start after 1 second
    
    res.json({ message: 'Upload completed, transcoding started' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 2. Client-side usage:
// After upload, the video will have multiple qualities available
// The player will automatically use the appropriate quality based on user selection

// 3. Manual transcoding endpoint:
// POST /api/videos/transcode
// Body: { videoPath: "/path/to/video.mp4", videoId: "video_id" }