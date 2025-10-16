#!/usr/bin/env python3
"""
Simple validation script to check if your Savr.ai setup is ready for deployment
"""

import os
import json
import sys
from pathlib import Path

def check_file_exists(filepath, description):
    """Check if a file exists and return status"""
    if Path(filepath).exists():
        print(f"✅ {description}: {filepath}")
        return True
    else:
        print(f"❌ {description}: {filepath} (MISSING)")
        return False

def check_directory_structure():
    """Validate project directory structure"""
    print("=== Checking Project Structure ===")
    
    required_files = [
        ("infra/app.py", "CDK App"),
        ("infra/requirements.txt", "CDK Requirements"),
        ("infra/cdk.json", "CDK Config"),
        ("backend/lambdas/generate_plan/handler.py", "Generate Plan Lambda"),
        ("backend/lambdas/get_meal_plan/handler.py", "Get Meal Plan Lambda"),
        ("backend/lambdas/api_upload/handler.py", "API Upload Lambda"),
        ("backend/lambdas/parse_receipt/handler.py", "Parse Receipt Lambda"),
        ("frontend/package.json", "Frontend Package"),
        ("frontend/src/App.jsx", "Frontend App"),
    ]
    
    all_good = True
    for filepath, description in required_files:
        if not check_file_exists(filepath, description):
            all_good = False
    
    return all_good

def check_lambda_functions():
    """Check Lambda function implementations"""
    print("\n=== Checking Lambda Functions ===")
    
    functions_to_check = [
        "backend/lambdas/generate_plan/handler.py",
        "backend/lambdas/get_meal_plan/handler.py", 
        "backend/lambdas/api_upload/handler.py"
    ]
    
    all_good = True
    for func_path in functions_to_check:
        if Path(func_path).exists():
            with open(func_path, 'r') as f:
                content = f.read()
                if len(content.strip()) > 100:  # Basic check for non-empty
                    print(f"✅ {func_path}: Implemented ({len(content)} chars)")
                else:
                    print(f"❌ {func_path}: Empty or too small")
                    all_good = False
        else:
            print(f"❌ {func_path}: Missing")
            all_good = False
    
    return all_good

def check_infrastructure_stacks():
    """Check CDK stack definitions"""
    print("\n=== Checking Infrastructure Stacks ===")
    
    stack_files = [
        "infra/stacks/s3_stack.py",
        "infra/stacks/dynamodb_stack.py",
        "infra/stacks/lambda_stack.py",
        "infra/stacks/api_gateway_stack.py",
        "infra/stacks/iam_roles_stack.py"
    ]
    
    all_good = True
    for stack_file in stack_files:
        if not check_file_exists(stack_file, f"Stack: {Path(stack_file).stem}"):
            all_good = False
    
    return all_good

def check_deployment_files():
    """Check deployment and documentation files"""
    print("\n=== Checking Deployment Files ===")
    
    deployment_files = [
        ("deploy.bat", "Windows Deployment Script"),
        ("deploy.sh", "Linux/Mac Deployment Script"),
        ("DEPLOYMENT_GUIDE.md", "Deployment Guide"),
        ("README.md", "Project README")
    ]
    
    all_good = True
    for filepath, description in deployment_files:
        if not check_file_exists(filepath, description):
            all_good = False
    
    return all_good

def check_frontend_build():
    """Check if frontend can be built"""
    print("\n=== Checking Frontend ===")
    
    if not Path("frontend/package.json").exists():
        print("❌ Frontend package.json missing")
        return False
    
    # Check if node_modules exists
    if Path("frontend/node_modules").exists():
        print("✅ Frontend dependencies installed")
    else:
        print("⚠️  Frontend dependencies not installed (run: cd frontend && npm install)")
    
    # Check main files
    frontend_files = [
        "frontend/src/App.jsx",
        "frontend/src/main.jsx",
        "frontend/index.html"
    ]
    
    all_good = True
    for file in frontend_files:
        if not Path(file).exists():
            print(f"❌ {file} missing")
            all_good = False
        else:
            print(f"✅ {file} exists")
    
    return all_good

def generate_deployment_checklist():
    """Generate a deployment checklist"""
    print("\n=== Deployment Checklist ===")
    
    checklist = [
        "☐ AWS CLI installed and configured (aws configure)",
        "☐ Node.js and npm installed",
        "☐ CDK CLI installed (npm install -g aws-cdk)",
        "☐ Python virtual environment set up",
        "☐ AWS IAM permissions configured (see DEPLOYMENT_GUIDE.md)",
        "☐ Bedrock model access requested (Claude 3.5 Sonnet)",
        "☐ Choose AWS region (us-east-1 recommended for Bedrock)",
        "☐ Run deployment script: deploy.bat or ./deploy.sh",
        "☐ Update frontend environment variables with API URL",
        "☐ Test endpoints after deployment"
    ]
    
    for item in checklist:
        print(item)

def main():
    """Main validation function"""
    print("🔍 Savr.ai Setup Validation")
    print("=" * 50)
    
    checks = [
        check_directory_structure(),
        check_lambda_functions(),
        check_infrastructure_stacks(),
        check_deployment_files(),
        check_frontend_build()
    ]
    
    all_passed = all(checks)
    
    print("\n" + "=" * 50)
    if all_passed:
        print("✅ All validation checks passed!")
        print("🚀 Your Savr.ai setup is ready for deployment!")
    else:
        print("❌ Some validation checks failed.")
        print("🔧 Fix the issues above before deploying.")
    
    generate_deployment_checklist()
    
    print(f"\n📊 Validation Summary:")
    print(f"   Passed: {sum(checks)}/{len(checks)} checks")
    print(f"   Status: {'READY' if all_passed else 'NEEDS FIXES'}")

if __name__ == '__main__':
    main()