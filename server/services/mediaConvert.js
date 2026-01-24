const { MediaConvertClient, CreateJobCommand, GetJobCommand } = require('@aws-sdk/client-mediaconvert');

const mediaConvert = new MediaConvertClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

const BUCKET = process.env.AWS_BUCKET;
const MEDIACONVERT_ROLE = process.env.MEDIACONVERT_ROLE_ARN;
const MEDIACONVERT_ENDPOINT = process.env.MEDIACONVERT_ENDPOINT;

// Set MediaConvert endpoint if provided
if (MEDIACONVERT_ENDPOINT) {
  mediaConvert.config.endpoint = MEDIACONVERT_ENDPOINT;
}

class MediaConvertService {
  static async createTranscodingJob(inputKey, videoId) {
    const jobSettings = {
      Role: MEDIACONVERT_ROLE,
      Settings: {
        Inputs: [{
          FileInput: `s3://${BUCKET}/${inputKey}`,
          VideoSelector: {},
          AudioSelectors: {
            "Audio Selector 1": {
              DefaultSelection: "DEFAULT"
            }
          }
        }],
        OutputGroups: [
          {
            Name: "File Group",
            OutputGroupSettings: {
              Type: "FILE_GROUP_SETTINGS",
              FileGroupSettings: {
                Destination: `s3://${BUCKET}/videos/${videoId}/`
              }
            },
            Outputs: [
              {
                NameModifier: "_480p",
                VideoDescription: {
                  Width: 854,
                  Height: 480,
                  CodecSettings: {
                    Codec: "H_264",
                    H264Settings: {
                      Bitrate: 1000000,
                      RateControlMode: "CBR"
                    }
                  }
                },
                AudioDescriptions: [{
                  CodecSettings: {
                    Codec: "AAC",
                    AacSettings: {
                      Bitrate: 128000,
                      SampleRate: 48000,
                      CodingMode: "CODING_MODE_2_0"
                    }
                  }
                }],
                ContainerSettings: {
                  Container: "MP4"
                }
              },
              {
                NameModifier: "_720p",
                VideoDescription: {
                  Width: 1280,
                  Height: 720,
                  CodecSettings: {
                    Codec: "H_264",
                    H264Settings: {
                      Bitrate: 2500000,
                      RateControlMode: "CBR"
                    }
                  }
                },
                AudioDescriptions: [{
                  CodecSettings: {
                    Codec: "AAC",
                    AacSettings: {
                      Bitrate: 128000,
                      SampleRate: 48000,
                      CodingMode: "CODING_MODE_2_0"
                    }
                  }
                }],
                ContainerSettings: {
                  Container: "MP4"
                }
              },
              {
                NameModifier: "_1080p",
                VideoDescription: {
                  Width: 1920,
                  Height: 1080,
                  CodecSettings: {
                    Codec: "H_264",
                    H264Settings: {
                      Bitrate: 5000000,
                      RateControlMode: "CBR"
                    }
                  }
                },
                AudioDescriptions: [{
                  CodecSettings: {
                    Codec: "AAC",
                    AacSettings: {
                      Bitrate: 128000,
                      SampleRate: 48000,
                      CodingMode: "CODING_MODE_2_0"
                    }
                  }
                }],
                ContainerSettings: {
                  Container: "MP4"
                }
              }
            ]
          }
        ],
        TimecodeConfig: {
          Source: "ZEROBASED"
        }
      }
    };

    const command = new CreateJobCommand(jobSettings);
    const response = await mediaConvert.send(command);
    
    const originalFileName = inputKey.split('/').pop().replace(/\.[^/.]+$/, '');
    const qualities = {
      low: `videos/${videoId}/${originalFileName}_480p.mp4`,
      medium: `videos/${videoId}/${originalFileName}_720p.mp4`,
      high: `videos/${videoId}/${originalFileName}_1080p.mp4`
    };
    
    return {
      job: response.Job,
      qualities
    };
  }

  static async getJobStatus(jobId) {
    const command = new GetJobCommand({ Id: jobId });
    const response = await mediaConvert.send(command);
    return response.Job;
  }

  static async generateThumbnail(inputKey, videoId) {
    // Thumbnail generation is now included in the main transcoding job
    return null;
  }
}

module.exports = MediaConvertService;