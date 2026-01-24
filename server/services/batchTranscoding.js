const { BatchClient, SubmitJobCommand, DescribeJobsCommand } = require('@aws-sdk/client-batch');

class BatchTranscodingService {
  constructor() {
    this.client = new BatchClient({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
      }
    });
    this.jobQueue = process.env.BATCH_JOB_QUEUE;
    this.jobDefinition = process.env.BATCH_JOB_DEFINITION;
    this.bucket = process.env.AWS_BUCKET;
  }

  async submitTranscodingJob(inputKey, videoId) {
    if (!videoId) {
      throw new Error('videoId is required for batch transcoding');
    }
    
    const jobParams = {
      jobName: `transcode-${videoId}-${Date.now()}`,
      jobQueue: this.jobQueue,
      jobDefinition: this.jobDefinition,
      parameters: {
        inputKey: inputKey,
        outputPrefix: `videos/transcoded/${videoId}/`,
        videoId: videoId,
        bucket: this.bucket
      },
      timeout: {
        attemptDurationSeconds: 3600 // 1 hour timeout
      }
    };

    try {
      const command = new SubmitJobCommand(jobParams);
      const response = await this.client.send(command);
      console.log('Batch job submitted:', response.jobId);
      return {
        jobId: response.jobId,
        jobName: response.jobName,
        status: 'SUBMITTED'
      };
    } catch (error) {
      console.error('Batch job submission failed:', error);
      throw error;
    }
  }

  async getJobStatus(jobId) {
    try {
      const command = new DescribeJobsCommand({ jobs: [jobId] });
      const response = await this.client.send(command);
      const job = response.jobs[0];
      
      return {
        jobId: job.jobId,
        status: job.jobStatus,
        statusReason: job.statusReason,
        createdAt: job.createdAt,
        startedAt: job.startedAt,
        stoppedAt: job.stoppedAt
      };
    } catch (error) {
      console.error('Failed to get batch job status:', error);
      throw error;
    }
  }

  extractOutputKeys(videoId) {
    return {
      qualities: {
        low: `videos/transcoded/${videoId}/${videoId}_480p.mp4`,
        medium: `videos/transcoded/${videoId}/${videoId}_720p.mp4`,
        high: `videos/transcoded/${videoId}/${videoId}_1080p.mp4`
      },
      thumbnail: `thumbnails/${videoId}_thumb.jpg`
    };
  }
}

module.exports = BatchTranscodingService;