const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

const s3 = new S3Client({
  region: 'us-east-1',
  credentials: {
    accessKeyId: process.env.accessKeyId,
    secretAccessKey: process.env.secretAccessKey
  }
});

const BUCKET = 'bhuvistestvideosdatabucket';

// small helper to promisify exec
function runCommand(cmd) {
  return new Promise((resolve, reject) => {
    exec(cmd, (error, stdout, stderr) => {
      if (error) {
        // log stderr for debugging
        console.error('FFmpeg error:', error.message);
        console.error('FFmpeg stderr:', stderr);
        return reject(error);
      }
      resolve({ stdout, stderr });
    });
  });
}

class TranscodingService {
  static async transcodeVideo(inputPath, videoId) {
    // quick sanity check that ffmpeg exists
    try {
      await runCommand('ffmpeg -version');
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

    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    for (const quality of qualities) {
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

      try {
        await runCommand(cmd);

        // upload to S3
        const s3Key = `videos/${videoId}_${quality.name}.mp4`;
        const fileStream = fs.createReadStream(outputPath);

        await s3.send(new PutObjectCommand({
          Bucket: BUCKET,
          Key: s3Key,
          Body: fileStream,
          ContentType: 'video/mp4'
        }));

        results[quality.name] = s3Key;

        // cleanup
        fs.unlinkSync(outputPath);
      } catch (error) {
        console.error(`Error transcoding ${quality.name}:`, error.message);
      }
    }

    return results;
  }

  static async generateThumbnail(inputPath, videoId) {
    try {
      await runCommand('ffmpeg -version');
    } catch (e) {
      console.log('FFmpeg not available, skipping thumbnail generation');
      return null;
    }

    const tempDir = path.join(__dirname, '../temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const thumbnailPath = path.join(tempDir, `${videoId}_thumb.jpg`);

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

    try {
      await runCommand(cmd);

      const s3Key = `thumbnails/${videoId}_thumb.jpg`;
      const fileStream = fs.createReadStream(thumbnailPath);

      await s3.send(new PutObjectCommand({
        Bucket: BUCKET,
        Key: s3Key,
        Body: fileStream,
        ContentType: 'image/jpeg'
      }));

      fs.unlinkSync(thumbnailPath);

      return s3Key;
    } catch (error) {
      console.error('Thumbnail generation failed:', error.message);
      return null;
    }
  }
}

module.exports = TranscodingService;
