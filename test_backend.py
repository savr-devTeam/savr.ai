#!/usr/bin/env python3
"""
Test script to validate backend Lambda functions locally
Run this to test your code logic without AWS dependencies
"""

import json
import sys
import os
from unittest.mock import Mock, patch

def test_generate_plan_logic():
    """Test the meal plan generation logic"""
    print("=== Testing Generate Plan Lambda ===")
    
    # Mock environment variables
    os.environ['MEAL_PLANS_TABLE'] = 'test-meal-plans'
    os.environ['USER_PREFERENCES_TABLE'] = 'test-user-preferences'
    os.environ['RECEIPTS_TABLE'] = 'test-receipts'
    
    # Sample request
    test_event = {
        'body': json.dumps({
            'userId': 'test-user-123',
            'preferences': {
                'budget': 100,
                'dietaryRestrictions': 'vegetarian, no nuts',
                'nutritionGoal': 'weight-loss',
                'caloricTarget': 1800,
                'proteinTarget': 120,
                'carbTarget': 150,
                'fatTarget': 60
            }
        })
    }
    
    # Mock AWS services
    with patch('boto3.client') as mock_client, \
         patch('boto3.resource') as mock_resource:
        
        # Mock successful Bedrock response
        mock_bedrock = Mock()
        mock_bedrock.invoke_model.return_value = {
            'body': Mock(read=lambda: json.dumps({
                'content': [{
                    'text': json.dumps({
                        "weeklyPlan": {
                            "monday": {
                                "breakfast": {"name": "Oatmeal", "calories": 350},
                                "lunch": {"name": "Salad", "calories": 400},
                                "dinner": {"name": "Pasta", "calories": 500}
                            }
                        },
                        "weeklyTotals": {"avgDailyCalories": 1800, "estimatedCost": 85},
                        "shoppingList": ["oats", "vegetables", "pasta"],
                        "tips": ["Meal prep on Sundays"]
                    })
                }]
            }).encode())
        }
        
        # Mock DynamoDB
        mock_table = Mock()
        mock_table.get_item.return_value = {'Item': {}}
        mock_table.put_item.return_value = {}
        mock_table.query.return_value = {'Items': []}
        
        mock_dynamodb = Mock()
        mock_dynamodb.Table.return_value = mock_table
        
        mock_client.return_value = mock_bedrock
        mock_resource.return_value = mock_dynamodb
        
        # Import and test
        sys.path.insert(0, 'backend/lambdas/generate_plan')
        from backend.lambdas.generate_plan.handler import lambda_handler
        
        result = lambda_handler(test_event, Mock())
        
        if result['statusCode'] == 200:
            print("✅ Generate Plan Lambda: SUCCESS")
            body = json.loads(result['body'])
            print(f"   Plan ID: {body.get('planId', 'N/A')}")
            print(f"   Message: {body.get('message', 'N/A')}")
        else:
            print("❌ Generate Plan Lambda: FAILED")
            print(f"   Error: {json.loads(result['body']).get('error', 'Unknown')}")

def test_get_meal_plan_logic():
    """Test the get meal plan logic"""
    print("\n=== Testing Get Meal Plan Lambda ===")
    
    os.environ['MEAL_PLANS_TABLE'] = 'test-meal-plans'
    
    test_event = {
        'queryStringParameters': {
            'userId': 'test-user-123',
            'limit': '5'
        }
    }
    
    with patch('boto3.resource') as mock_resource:
        # Mock DynamoDB response
        mock_table = Mock()
        mock_table.query.return_value = {
            'Items': [{
                'plan_id': 'test-plan-1',
                'plan_date': '2024-01-15',
                'meal_plan': {'weeklyPlan': {}},
                'created_at': '2024-01-15T10:00:00Z',
                'status': 'active'
            }]
        }
        
        mock_dynamodb = Mock()
        mock_dynamodb.Table.return_value = mock_table
        mock_resource.return_value = mock_dynamodb
        
        sys.path.insert(0, 'backend/lambdas/get_meal_plan')
        from backend.lambdas.get_meal_plan.handler import lambda_handler
        
        result = lambda_handler(test_event, Mock())
        
        if result['statusCode'] == 200:
            print("✅ Get Meal Plan Lambda: SUCCESS")
            body = json.loads(result['body'])
            print(f"   Plans found: {body.get('count', 0)}")
        else:
            print("❌ Get Meal Plan Lambda: FAILED")
            print(f"   Error: {json.loads(result['body']).get('error', 'Unknown')}")

def test_api_upload_logic():
    """Test the API upload logic"""
    print("\n=== Testing API Upload Lambda ===")
    
    os.environ['RECEIPTS_BUCKET'] = 'test-receipts-bucket'
    
    test_event = {
        'body': json.dumps({
            'fileName': 'test-receipt.jpg',
            'contentType': 'image/jpeg'
        })
    }
    
    with patch('boto3.client') as mock_client:
        # Mock S3 client
        mock_s3 = Mock()
        mock_s3.generate_presigned_url.return_value = 'https://test-presigned-url.com'
        mock_client.return_value = mock_s3
        
        sys.path.insert(0, 'backend/lambdas/api_upload')
        from backend.lambdas.api_upload.handler import lambda_handler
        
        result = lambda_handler(test_event, Mock())
        
        if result['statusCode'] == 200:
            print("✅ API Upload Lambda: SUCCESS")
            body = json.loads(result['body'])
            print(f"   Upload URL generated: {bool(body.get('uploadUrl'))}")
            print(f"   S3 Key: {body.get('s3Key', 'N/A')}")
        else:
            print("❌ API Upload Lambda: FAILED")
            print(f"   Error: {json.loads(result['body']).get('error', 'Unknown')}")

def test_infrastructure_config():
    """Test CDK infrastructure configuration"""
    print("\n=== Testing Infrastructure Configuration ===")
    
    try:
        # Test CDK app import
        sys.path.insert(0, 'infra')
        import app
        print("✅ CDK app configuration: SUCCESS")
        
        # Test stack imports
        from stacks.s3_stack import S3Stack
        from stacks.dynamodb_stack import DynamoDBStack
        from stacks.lambda_stack import LambdaStack
        from stacks.api_gateway_stack import ApiGatewayStack
        from stacks.iam_roles_stack import IamRolesStack
        
        print("✅ All CDK stacks import: SUCCESS")
        
    except Exception as e:
        print(f"❌ Infrastructure configuration: FAILED")
        print(f"   Error: {str(e)}")

if __name__ == '__main__':
    print("🧪 Running Savr.ai Backend Tests")
    print("=" * 50)
    
    try:
        test_generate_plan_logic()
        test_get_meal_plan_logic()
        test_api_upload_logic()
        test_infrastructure_config()
        
        print("\n" + "=" * 50)
        print("✅ All tests completed!")
        print("\n📋 Next steps:")
        print("1. Fix any failed tests above")
        print("2. Get proper AWS IAM permissions")
        print("3. Run: deploy.bat (Windows) or ./deploy.sh (Linux/Mac)")
        print("4. Request Bedrock model access")
        print("5. Test with real AWS services")
        
    except Exception as e:
        print(f"\n❌ Test suite failed: {str(e)}")
        print("Check your Python environment and dependencies")