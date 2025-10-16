import json
import boto3
import os
from boto3.dynamodb.conditions import Key

# Initialize AWS clients
dynamodb = boto3.resource('dynamodb')

# Environment variables
MEAL_PLANS_TABLE = os.environ.get('MEAL_PLANS_TABLE')

# DynamoDB table
meal_plans_table = dynamodb.Table(MEAL_PLANS_TABLE)


def lambda_handler(event, context):
    """
    Retrieve meal plans for a user
    """
    try:
        # Get query parameters
        query_params = event.get('queryStringParameters') or {}
        user_id = query_params.get('userId', 'anonymous')
        plan_date = query_params.get('planDate')  # Optional: specific date
        limit = int(query_params.get('limit', 10))  # Default to 10 plans
        
        if plan_date:
            # Get specific meal plan
            meal_plan = get_specific_meal_plan(user_id, plan_date)
            return create_response(200, {
                'success': True,
                'mealPlan': meal_plan,
                'message': 'Meal plan retrieved successfully'
            })
        else:
            # Get recent meal plans
            meal_plans = get_recent_meal_plans(user_id, limit)
            return create_response(200, {
                'success': True,
                'mealPlans': meal_plans,
                'count': len(meal_plans),
                'message': 'Meal plans retrieved successfully'
            })
        
    except Exception as e:
        print(f"Error retrieving meal plans: {str(e)}")
        return create_response(500, {
            'success': False,
            'error': 'Failed to retrieve meal plans',
            'details': str(e)
        })


def get_specific_meal_plan(user_id, plan_date):
    """
    Get a specific meal plan by user ID and date
    """
    try:
        response = meal_plans_table.get_item(
            Key={
                'user_id': user_id,
                'plan_date': plan_date
            }
        )
        
        item = response.get('Item')
        if item:
            return format_meal_plan(item)
        else:
            return None
            
    except Exception as e:
        print(f"Error getting specific meal plan: {str(e)}")
        return None


def get_recent_meal_plans(user_id, limit):
    """
    Get recent meal plans for a user
    """
    try:
        response = meal_plans_table.query(
            KeyConditionExpression=Key('user_id').eq(user_id),
            ScanIndexForward=False,  # Most recent first
            Limit=limit
        )
        
        meal_plans = []
        for item in response.get('Items', []):
            meal_plans.append(format_meal_plan(item))
            
        return meal_plans
        
    except Exception as e:
        print(f"Error getting recent meal plans: {str(e)}")
        return []


def format_meal_plan(item):
    """
    Format meal plan item for response
    """
    return {
        'planId': item.get('plan_id'),
        'planDate': item.get('plan_date'),
        'mealPlan': item.get('meal_plan', {}),
        'preferencesUsed': item.get('preferences_used', {}),
        'createdAt': item.get('created_at'),
        'status': item.get('status', 'active')
    }


def create_response(status_code, body):
    """
    Create standardized API response
    """
    return {
        'statusCode': status_code,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
        },
        'body': json.dumps(body)
    }