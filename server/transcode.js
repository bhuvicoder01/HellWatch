const { S3Client, GetObjectCommand, PutObjectCommand } = require('@aws-sdk/client-s3');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const s3 = new S3Client({ region: process.env.AWS_REGION });

async function transcode() {
  const { inputKey, outputPrefix, videoId, bucket } = process.env;
  
  // Validate required parameters
  if (!inputKey || !videoId || !bucket) {
    console.error('Missing required parameters:', { inputKey, videoId, bucket });
    process.exit(1);
  }
  
  console.log('Starting transcoding with params:', { inputKey, videoId, bucket });
  
  const inputFile = `/tmp/input.mp4`;
  const outputDir = `/tmp/output`;
  
  try {
    // Download input from S3
    console.log('Downloading input file...');
    const getCommand = new GetObjectCommand({ Bucket: bucket, Key: inputKey });
    const data = await s3.send(getCommand);
    const writeStream = fs.createWriteStream(inputFile);
    await new Promise((resolve, reject) => {
      data.Body.pipe(writeStream);
      writeStream.on('finish', resolve);
      writeStream.on('error', reject);
    });

    // Create output directory
    fs.mkdirSync(outputDir, { recursive: true });

    // Transcode to multiple qualities
    const qualities = [
      { name: '480p', resolution: '854x480', bitrate: '800k' },
      { name: '720p', resolution: '1280x720', bitrate: '1500k' },
      { name: '1080p', resolution: '1920x1080', bitrate: '2500k' }
    ];

    for (const quality of qualities) {
      const outputFile = path.join(outputDir, `${videoId}_${quality.name}.mp4`);
      const cmd = `ffmpeg -i ${inputFile} -c:v libx264 -b:v ${quality.bitrate} -s ${quality.resolution} -c:a aac -b:a 128k -y ${outputFile}`;
      
      console.log(`Transcoding ${quality.name}...`);
      await new Promise((resolve, reject) => {
        exec(cmd, (error, stdout, stderr) => {
          if (error) reject(error);
          else resolve();
        });
      });

      // Upload to S3
      const s3Key = `${outputPrefix}${videoId}_${quality.name}.mp4`;
      const fileStream = fs.createReadStream(outputFile);
      await s3.send(new PutObjectCommand({
        Bucket: bucket,
        Key: s3Key,
        Body: fileStream,
        ContentType: 'video/mp4'
      }));
      console.log(`Uploaded ${quality.name}`);
    }

    // Generate thumbnail
    const thumbFile = path.join(outputDir, `${videoId}_thumb.jpg`);
    const thumbCmd = `ffmpeg -i ${inputFile} -vf "thumbnail,scale=320:240" -frames:v 1 -y ${thumbFile}`;
    
    await new Promise((resolve, reject) => {
      exec(thumbCmd, (error) => {
        if (error) reject(error);
        else resolve();
      });
    });

    const thumbStream = fs.createReadStream(thumbFile);
    await s3.send(new PutObjectCommand({
      Bucket: bucket,
      Key: `thumbnails/${videoId}_thumb.jpg`,
      Body: thumbStream,
      ContentType: 'image/jpeg'
    }));

    console.log('Transcoding completed successfully');
  } catch (error) {
    console.error('Transcoding failed:', error);
    process.exit(1);
  }
}

transcode();