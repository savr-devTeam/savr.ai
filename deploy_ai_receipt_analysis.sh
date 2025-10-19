#!/bin/bash

echo "🚀 Deploying AI-Powered Receipt Analysis for Savr.ai"
echo "======================================================"

# Check if AWS CLI is configured
if ! aws sts get-caller-identity &> /dev/null; then
    echo "❌ AWS CLI not configured. Please run 'aws configure' first."
    exit 1
fi

# Check Bedrock model access
echo "✅ Checking Bedrock model access..."
REGION="us-east-1"
MODEL="anthropic.claude-3-5-sonnet-20241022-v2:0"

if aws bedrock list-foundation-models --region $REGION --query "modelSummaries[?modelId=='$MODEL']" | grep -q "$MODEL"; then
    echo "✅ Bedrock Claude 3.5 Sonnet access confirmed"
else
    echo "⚠️  Warning: Claude 3.5 Sonnet may not be available in your account"
    echo "   Visit AWS Console → Bedrock → Model Access to enable it"
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Navigate to infrastructure directory
cd infra || exit 1

# Bootstrap CDK (if not already done)
echo "📦 Bootstrapping CDK..."
cdk bootstrap

# Deploy all stacks
echo "🏗️  Deploying stacks..."
cdk deploy --all --require-approval never

# Get API Gateway URL
echo ""
echo "✅ Deployment complete!"
echo ""
echo "📝 Your API Gateway URL:"
aws cloudformation describe-stacks \
    --stack-name ApiGatewayStack \
    --query 'Stacks[0].Outputs[?OutputKey==`SavrApiEndpoint`].OutputValue' \
    --output text

echo ""
echo "🧪 Test the AI analysis endpoint:"
echo "POST https://your-api-url/analyze-receipt"
echo ""
echo "📖 See BEDROCK_AI_IMPLEMENTATION_GUIDE.md for usage instructions"

