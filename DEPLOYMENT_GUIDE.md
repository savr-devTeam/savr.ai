# Savr.ai Deployment Guide

## Prerequisites

### 1. AWS Account Setup
You need an AWS account with proper IAM permissions. Your current user needs these policies:
- `IAMFullAccess`
- `AmazonS3FullAccess`
- `AmazonDynamoDBFullAccess`
- `AWSLambda_FullAccess`
- `AmazonAPIGatewayAdministrator`
- `CloudFormationFullAccess`
- `AmazonTextractFullAccess`
- `AmazonBedrockFullAccess`

### 2. Bedrock Model Access
**IMPORTANT**: Request access to Claude models in AWS Bedrock:
1. Go to AWS Console → Bedrock → Model Access
2. Request access to `Claude 3.5 Sonnet` model
3. Wait for approval (usually instant)

### 3. Tools Installation
```bash
# Install Node.js and npm (if not already installed)
# Install AWS CLI
pip install awscli

# Install CDK
npm install -g aws-cdk

# Configure AWS credentials
aws configure
```

## Deployment Steps

### Option 1: Automated Deployment (Recommended)
```bash
# Windows
deploy.bat

# Linux/Mac
chmod +x deploy.sh
./deploy.sh
```

### Option 2: Manual Deployment
```bash
cd infra

# Set up Python environment
python -m venv .venv
source .venv/bin/activate  # Linux/Mac
# .venv\Scripts\activate.bat  # Windows

pip install -r requirements.txt

# Bootstrap CDK (first time only)
cdk bootstrap

# Deploy infrastructure
cdk deploy --all
```

## Post-Deployment

### 1. Get API Gateway URL
After deployment, CDK will output the API Gateway URL. It looks like:
```
ApiGatewayStack.SavrApiEndpoint = https://xxxxxxxxxx.execute-api.us-east-1.amazonaws.com/prod/
```

### 2. Update Frontend Environment
Create `frontend/.env` with:
```
VITE_API_BASE_URL=https://your-api-gateway-url.execute-api.us-east-1.amazonaws.com/prod
```

### 3. Test Endpoints
```bash
# Test meal plan generation
curl -X POST https://your-api-url/generate-plan \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-user",
    "preferences": {
      "budget": 100,
      "dietaryRestrictions": "vegetarian",
      "nutritionGoal": "weight-loss",
      "caloricTarget": 1800
    }
  }'

# Test receipt upload URL generation
curl -X POST https://your-api-url/upload \
  -H "Content-Type: application/json" \
  -d '{
    "fileName": "receipt.jpg",
    "contentType": "image/jpeg"
  }'
```

## Troubleshooting

### Permission Errors
If you get IAM permission errors:
1. Contact your AWS administrator
2. Request the policies listed in Prerequisites
3. Ensure you're in the correct AWS region

### Bedrock Access Denied
1. Go to AWS Console → Bedrock → Model Access
2. Request access to Claude models
3. Wait for approval and redeploy

### Lambda Function Errors
Check CloudWatch Logs:
1. Go to AWS Console → CloudWatch → Log Groups
2. Look for `/aws/lambda/LambdaStack-*` log groups
3. Check recent log streams for errors

## Architecture Overview

The deployment creates:
- **S3 Bucket**: Receipt storage
- **DynamoDB Tables**: User preferences, meal plans, receipts
- **Lambda Functions**: API handlers for meal planning and receipt processing
- **API Gateway**: REST API endpoints
- **IAM Roles**: Proper permissions for all services

## Cost Estimation

Expected monthly costs (light usage):
- Lambda: $0-5
- DynamoDB: $0-2
- S3: $0-1
- API Gateway: $0-3
- Bedrock: $5-20 (depends on usage)
- **Total: ~$10-30/month**

## Security Notes

- All S3 buckets have public access blocked
- Lambda functions use least-privilege IAM roles
- API Gateway has CORS configured for frontend access
- DynamoDB tables use on-demand billing for cost optimization