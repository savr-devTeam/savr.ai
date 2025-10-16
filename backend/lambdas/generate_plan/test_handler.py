#!/usr/bin/env python3
"""
Test script for the generate_plan Lambda function
Run this locally to test the meal plan generation logic
"""

import json
import os
import sys
from unittest.mock import Mock, patch

# Add the handler directory to Python path
sys.path.insert(0, os.path.dirname(__file__))

# Mock environment variables
os.environ['MEAL_PLANS_TABLE'] = 'test-meal-plans'
os.environ['USER_PREFERENCES_TABLE'] = 'test-user-preferences'
os.environ['RECEIPTS_TABLE'] = 'test-receipts'

def test_meal_plan_generation():
    """Test the meal plan generation with sample data"""
    
    # Sample event (API Gateway format)
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
    
    test_context = Mock()
    
    # Mock AWS services
    with patch('boto3.client') as mock_client, \
         patch('boto3.resource') as mock_resource:
        
        # Mock Bedrock response
        mock_bedrock = Mock()
        mock_bedrock.invoke_model.return_value = {
            'body': Mock(read=lambda: json.dumps({
                'content': [{
                    'text': json.dumps({
                        "weeklyPlan": {
                            "monday": {
                                "breakfast": {
                                    "name": "Vegetarian Oatmeal Bowl",
                                    "ingredients": ["oats", "almond milk", "berries", "nuts"],
                                    "calories": 350,
                                    "protein": 12,
                                    "carbs": 45,
                                    "fat": 8,
                                    "prepTime": "10 mins"
                                },
                                "lunch": {
                                    "name": "Quinoa Salad",
                                    "ingredients": ["quinoa", "vegetables", "olive oil"],
                                    "calories": 400,
                                    "protein": 15,
                                    "carbs": 50,
                                    "fat": 12,
                                    "prepTime": "15 mins"
                                },
                                "dinner": {
                                    "name": "Lentil Curry",
                                    "ingredients": ["lentils", "coconut milk", "spices"],
                                    "calories": 450,
                                    "protein": 18,
                                    "carbs": 55,
                                    "fat": 15,
                                    "prepTime": "30 mins"
                                }
                            }
                        },
                        "weeklyTotals": {
                            "avgDailyCalories": 1800,
                            "estimatedCost": 85
                        },
                        "shoppingList": ["oats", "quinoa", "lentils", "vegetables"],
                        "tips": ["Focus on plant-based proteins", "Meal prep on Sundays"]
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
        
        # Set up mocks
        mock_client.return_value = mock_bedrock
        mock_resource.return_value = mock_dynamodb
        
        # Import and test the handler
        from handler import lambda_handler
        
        # Call the function
        result = lambda_handler(test_event, test_context)
        
        # Print results
        print("=== MEAL PLAN GENERATION TEST ===")
        print(f"Status Code: {result['statusCode']}")
        
        if result['statusCode'] == 200:
            body = json.loads(result['body'])
            print("✅ SUCCESS!")
            print(f"Plan ID: {body.get('planId')}")
            print(f"Message: {body.get('message')}")
            
            meal_plan = body.get('mealPlan', {})
            weekly_plan = meal_plan.get('weeklyPlan', {})
            
            if weekly_plan:
                print("\n📅 SAMPLE MEAL PLAN:")
                for day, meals in weekly_plan.items():
                    print(f"\n{day.upper()}:")
                    for meal_type, meal_info in meals.items():
                        if isinstance(meal_info, dict):
                            print(f"  {meal_type}: {meal_info.get('name', 'Unknown')} ({meal_info.get('calories', 0)} cal)")
            
            totals = meal_plan.get('weeklyTotals', {})
            if totals:
                print(f"\n💰 WEEKLY TOTALS:")
                print(f"  Average Daily Calories: {totals.get('avgDailyCalories', 0)}")
                print(f"  Estimated Cost: ${totals.get('estimatedCost', 0)}")
                
        else:
            body = json.loads(result['body'])
            print("❌ ERROR!")
            print(f"Error: {body.get('error')}")
            print(f"Details: {body.get('details')}")

if __name__ == '__main__':
    test_meal_plan_generation()