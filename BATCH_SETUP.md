# Quick AWS Batch Setup for HellWatch

## 1. Deploy Infrastructure
```bash
# Make script executable
chmod +x setup-batch.sh

# Run setup
./setup-batch.sh
```

## 2. Build and Push Docker Image (Optional - using public image for now)
```bash
# Create ECR repository
aws ecr create-repository --repository-name hellwatch-transcoder

# Get login token
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 330723289092.dkr.ecr.us-east-1.amazonaws.com

# Build image
docker build -f Dockerfile.batch -t hellwatch-transcoder .

# Tag image
docker tag hellwatch-transcoder:latest 330723289092.dkr.ecr.us-east-1.amazonaws.com/hellwatch-transcoder:latest

# Push image
docker push 330723289092.dkr.ecr.us-east-1.amazonaws.com/hellwatch-transcoder:latest
```

## 3. Test Transcoding Job
```bash
# Submit test job
aws batch submit-job \
  --job-name test-transcode \
  --job-queue hellwatch-transcoding-queue \
  --job-definition hellwatch-ffmpeg-job \
  --parameters inputKey=videos/test.mp4,videoId=test123,bucket=hellwatch-assets-bucket
```

## 4. Monitor Jobs
```bash
# List jobs
aws batch list-jobs --job-queue hellwatch-transcoding-queue

# Describe specific job
aws batch describe-jobs --jobs JOB_ID
```

## Cost Estimate:
- **c5.large spot**: $0.017/hour
- **60min video transcoding**: ~45min = $0.013
- **vs MediaConvert**: $1.35
- **Savings**: 99% cheaper!