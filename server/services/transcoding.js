const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

// Try to find FFmpeg automatically or use system PATH
try {
  // Remove hardcoded paths - let fluent-ffmpeg find it
  // ffmpeg.setFfmpegPath('ffmpeg');
  // ffmpeg.setFfprobePath('ffprobe');
} catch (error) {
  console.log('FFmpeg not found in PATH, transcoding will be disabled');
}

const s3 = new S3Client({
  region: 'us-east-1',
  credentials: {
    accessKeyId: process.env.accessKeyId,
    secretAccessKey: process.env.secretAccessKey
  }
});

const BUCKET = 'bhuvistestvideosdatabucket';

class TranscodingService {
  static async transcodeVideo(inputPath, videoId) {
    // Check if FFmpeg is available
    try {
      await new Promise((resolve, reject) => {
        ffmpeg().getAvailableFormats((err) => {
          if (err) reject(err);
          else resolve();
        });
      });
    } catch (error) {
      console.log('FFmpeg not available, skipping transcoding');
      return {};
    }

    const qualities = [
      { name: 'low', resolution: '854x480', bitrate: '1000k' },
      { name: 'medium', resolution: '1280x720', bitrate: '2500k' },
      { name: 'high', resolution: '1920x1080', bitrate: '5000k' }
    ];

    const results = {};
    
    for (const quality of qualities) {
      try {
        const outputPath = path.join(__dirname, '../temp', `${videoId}_${quality.name}.mp4`);
        
        await new Promise((resolve, reject) => {
          ffmpeg(inputPath)
            .videoCodec('libx264')
            .audioCodec('aac')
            .size(quality.resolution)
            .videoBitrate(quality.bitrate)
            .audioBitrate('128k')
            .format('mp4')
            .output(outputPath)
            .on('end', resolve)
            .on('error', reject)
            .run();
        });

        // Upload to S3
        const s3Key = `videos/${videoId}_${quality.name}.mp4`;
        const fileStream = fs.createReadStream(outputPath);
        
        await s3.send(new PutObjectCommand({
          Bucket: BUCKET,
          Key: s3Key,
          Body: fileStream,
          ContentType: 'video/mp4'
        }));

        results[quality.name] = s3Key;
        
        // Clean up temp file
        fs.unlinkSync(outputPath);
        
      } catch (error) {
        console.error(`Error transcoding ${quality.name}:`, error.message);
      }
    }
    
    return results;
  }

  static async generateThumbnail(inputPath, videoId) {
    try {
      // Check if FFmpeg is available
      await new Promise((resolve, reject) => {
        ffmpeg().getAvailableFormats((err) => {
          if (err) reject(err);
          else resolve();
        });
      });
    } catch (error) {
      console.log('FFmpeg not available, skipping thumbnail generation');
      return null;
    }

    const thumbnailPath = path.join(__dirname, '../temp', `${videoId}_thumb.jpg`);
    
    try {
      await new Promise((resolve, reject) => {
        ffmpeg(inputPath)
          .screenshots({
            timestamps: ['10%'],
            filename: `${videoId}_thumb.jpg`,
            folder: path.join(__dirname, '../temp'),
            size: '320x240'
          })
          .on('end', resolve)
          .on('error', reject);
      });

      // Upload thumbnail to S3
      const s3Key = `thumbnails/${videoId}_thumb.jpg`;
      const fileStream = fs.createReadStream(thumbnailPath);
      
      await s3.send(new PutObjectCommand({
        Bucket: BUCKET,
        Key: s3Key,
        Body: fileStream,
        ContentType: 'image/jpeg'
      }));

      // Clean up temp file
      fs.unlinkSync(thumbnailPath);
      
      return s3Key;
    } catch (error) {
      console.error('Thumbnail generation failed:', error.message);
      return null;
    }
  }
}

module.exports = TranscodingService;