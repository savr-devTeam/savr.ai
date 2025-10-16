@echo off
REM Savr.ai Deployment Script for Windows
REM This script will deploy the entire infrastructure when you have proper AWS permissions

echo 🚀 Starting Savr.ai Deployment...

REM Check AWS credentials
echo 📋 Checking AWS credentials...
aws sts get-caller-identity
if %errorlevel% neq 0 (
    echo ❌ AWS credentials not configured properly
    exit /b 1
)

REM Check if CDK is installed
cdk --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ CDK not found. Installing...
    npm install -g aws-cdk
)

REM Navigate to infrastructure directory
cd infra

REM Set up Python environment
echo 📦 Setting up Python environment...
if not exist ".venv" (
    python -m venv .venv
)

call .venv\Scripts\activate.bat
pip install -r requirements.txt

REM Bootstrap CDK (only needed once per account/region)
echo 🔧 Bootstrapping CDK...
cdk bootstrap
if %errorlevel% neq 0 (
    echo ❌ CDK bootstrap failed. Check your IAM permissions.
    echo You need: IAMFullAccess, CloudFormationFullAccess, S3FullAccess
    exit /b 1
)

REM Synthesize CloudFormation templates
echo 🏗️  Synthesizing CloudFormation templates...
cdk synth

REM Deploy all stacks
echo 🚀 Deploying infrastructure...
cdk deploy --all --require-approval never

echo ✅ Deployment complete!
echo.
echo 📋 Next steps:
echo 1. Note the API Gateway URL from the output above
echo 2. Update your frontend environment variables
echo 3. Request Bedrock model access if needed
echo 4. Test the endpoints