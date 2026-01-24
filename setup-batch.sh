#!/bin/bash

# HellWatch AWS Batch Setup Script

echo "🚀 Setting up AWS Batch for HellWatch..."

# Get default VPC and subnets
VPC_ID=$(aws ec2 describe-vpcs --filters "Name=is-default,Values=true" --query 'Vpcs[0].VpcId' --output text)
SUBNET_IDS=$(aws ec2 describe-subnets --filters "Name=vpc-id,Values=$VPC_ID" --query 'Subnets[*].SubnetId' --output text | tr '\t' ',')

echo "Using VPC: $VPC_ID"
echo "Using Subnets: $SUBNET_IDS"

# Deploy CloudFormation stack
aws cloudformation deploy \
  --template-file aws-batch-setup.yaml \
  --stack-name hellwatch-batch-stack \
  --parameter-overrides \
    VpcId=$VPC_ID \
    SubnetIds=$SUBNET_IDS \
  --capabilities CAPABILITY_NAMED_IAM

if [ $? -eq 0 ]; then
  echo "✅ AWS Batch setup completed successfully!"
  
  # Get outputs
  echo "📋 Stack Outputs:"
  aws cloudformation describe-stacks \
    --stack-name hellwatch-batch-stack \
    --query 'Stacks[0].Outputs[*].[OutputKey,OutputValue]' \
    --output table
else
  echo "❌ AWS Batch setup failed!"
  exit 1
fi