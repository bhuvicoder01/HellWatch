const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

const s3 = new S3Client({
  region: 'ap-south-1',
  credentials: {
    accessKeyId: process.env.accessKeyId,
    secretAccessKey: process.env.secretAccessKey
  }
});

const BUCKET = 'bhuvisvbhuvistestvideosdatabucketmumbairegion';

// small helper to promisify exec
function runCommand(cmd) {
  return new Promise((resolve, reject) => {
    exec(cmd, (error, stdout, stderr) => {
      if (error) {
        // log stderr for debugging
        // console.error('FFmpeg error:', error.message);
        // console.error('FFmpeg stderr:', stderr);
        return reject(error);
      }
      // log stdout for debugging
      // console.log('FFmpeg stdout:', stdout);
      resolve({ stdout, stderr });
    });
  });
}

class TranscodingService {
  static async transcodeVideo(inputPath, videoId) {
    console.log(`Starting transcoding for video ${videoId} at path: ${inputPath}`);
    
    // quick sanity check that ffmpeg exists
    try {
      await runCommand('ffmpeg -version');
      console.log('FFmpeg version check passed');
    } catch (e) {
      console.log('FFmpeg not available, skipping transcoding');
      return {};
    }

    const qualities = [
      { name: 'low', resolution: '854x480', bitrate: '1000k' },
      { name: 'medium', resolution: '1280x720', bitrate: '2500k' },
      { name: 'high', resolution: '1920x1080', bitrate: '5000k' }
    ];

    const results = {};
    const tempDir = path.join(__dirname, '../temp');
    // console.log(`Temp directory: ${tempDir}`);

    // Ensure temp directory exists
    if (!fs.existsSync(tempDir)) {
      // console.log('Creating temp directory');
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // Verify input file exists
    if (!fs.existsSync(inputPath)) {
      // console.error(`Input file does not exist: ${inputPath}`);
      throw new Error(`Input file does not exist: ${inputPath}`);
    }
    // console.log('Input file verified, starting quality transcoding');

    for (const quality of qualities) {
      console.log(`Starting ${quality.name} quality transcoding`);
      const outputPath = path.join(tempDir, `${videoId}_${quality.name}.mp4`);

      // build ffmpeg command
      const cmd = [
        'ffmpeg',
        '-y', // overwrite
        '-i', `"${inputPath}"`,
        '-c:v', 'libx264',
        '-b:v', quality.bitrate,
        '-s', quality.resolution,
        '-c:a', 'aac',
        '-b:a', '128k',
        `"${outputPath}"`
      ].join(' ');
      
      // console.log(`FFmpeg command: ${cmd}`);

      try {
        await runCommand(cmd);
        console.log(`FFmpeg transcoding completed for ${quality.name}`);

        // upload to S3
        const s3Key = `videos/${videoId}_${quality.name}.mp4`;
        console.log(`Uploading to S3: ${s3Key}`);
        const fileStream = fs.createReadStream(outputPath);

        await s3.send(new PutObjectCommand({
          Bucket: BUCKET,
          Key: s3Key,
          Body: fileStream,
          ContentType: 'video/mp4'
        }));
        // console.log(`S3 upload completed for ${quality.name}`);

        results[quality.name] = s3Key;

        // cleanup
        fs.unlinkSync(outputPath);
        console.log(`Transcoding done for ${quality.name}`);
      } catch (error) {
        console.error(`Error transcoding ${quality.name}:`, error.message);
      }
    }
    
    console.log('All transcoding completed, results:', results);
    return results;
  }

  static async generateThumbnail(inputPath, videoId) {
    console.log(`Starting thumbnail generation for video ${videoId}`);
    
    try {
      await runCommand('ffmpeg -version');
      console.log('FFmpeg available for thumbnail generation');
    } catch (e) {
      console.log('FFmpeg not available, skipping thumbnail generation');
      return null;
    }

    const tempDir = path.join(__dirname, '../temp');
    console.log(`Thumbnail temp directory: ${tempDir}`);
    
    // Ensure temp directory exists
    if (!fs.existsSync(tempDir)) {
      console.log('Creating temp directory for thumbnail');
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // Verify input file exists
    if (!fs.existsSync(inputPath)) {
      console.error(`Input file does not exist for thumbnail: ${inputPath}`);
      throw new Error(`Input file does not exist: ${inputPath}`);
    }
    console.log('Input file verified for thumbnail generation');

    const thumbnailPath = path.join(tempDir, `${videoId}_thumb.jpg`);
    console.log(`Thumbnail output path: ${thumbnailPath}`);

    // grab a frame at 10% of the duration
    const cmd = [
      'ffmpeg',
      '-y',
      '-i', `"${inputPath}"`,
      '-vf', "thumbnail,scale=320:240",
      '-frames:v', '1',
      '-qscale:v', '2',
      '-ss', '00:00:03', // or use a fixed timestamp; 10% is harder via pure CLI without probing
      `"${thumbnailPath}"`
    ].join(' ');
    
    console.log(`Thumbnail FFmpeg command: ${cmd}`);

    try {
      await runCommand(cmd);
      console.log('Thumbnail generation completed');

      const s3Key = `thumbnails/${videoId}_thumb.jpg`;
      console.log(`Uploading thumbnail to S3: ${s3Key}`);
      const fileStream = fs.createReadStream(thumbnailPath);

      await s3.send(new PutObjectCommand({
        Bucket: BUCKET,
        Key: s3Key,
        Body: fileStream,
        ContentType: 'image/jpeg'
      }));
      console.log('Thumbnail uploaded to S3 successfully');

      fs.unlinkSync(thumbnailPath);
      console.log('Thumbnail temp file cleaned up');

      return s3Key;
    } catch (error) {
      console.error('Thumbnail generation failed:', error.message);
      return null;
    }
  }
}

module.exports = TranscodingService;
