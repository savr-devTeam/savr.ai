#!/bin/bash

# Savr.ai Deployment Script
# This script will deploy the entire infrastructure when you have proper AWS permissions

set -e

echo "🚀 Starting Savr.ai Deployment..."

# Check AWS credentials
echo "📋 Checking AWS credentials..."
aws sts get-caller-identity

# Check if CDK is installed
if ! command -v cdk &> /dev/null; then
    echo "❌ CDK not found. Installing..."
    npm install -g aws-cdk
fi

# Navigate to infrastructure directory
cd infra

# Activate virtual environment and install dependencies
echo "📦 Setting up Python environment..."
if [ ! -d ".venv" ]; then
    python -m venv .venv
fi

source .venv/bin/activate  # Linux/Mac
# .venv\Scripts\activate.bat  # Windows

pip install -r requirements.txt

# Bootstrap CDK (only needed once per account/region)
echo "🔧 Bootstrapping CDK..."
cdk bootstrap

# Synthesize CloudFormation templates
echo "🏗️  Synthesizing CloudFormation templates..."
cdk synth

# Deploy all stacks
echo "🚀 Deploying infrastructure..."
cdk deploy --all --require-approval never

echo "✅ Deployment complete!"
echo ""
echo "📋 Next steps:"
echo "1. Note the API Gateway URL from the output above"
echo "2. Update your frontend environment variables"
echo "3. Request Bedrock model access if needed"
echo "4. Test the endpoints"