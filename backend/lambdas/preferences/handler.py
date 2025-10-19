import json
import boto3
import os
from datetime import datetime
from decimal import Decimal

# Initialize AWS clients
dynamodb = boto3.resource('dynamodb', region_name='us-east-2')

# Environment variables
USER_PREFERENCES_TABLE = os.environ.get('USER_PREFERENCES_TABLE', 'user_preferences')

# DynamoDB table
preferences_table = dynamodb.Table(USER_PREFERENCES_TABLE)


def lambda_handler(event, context):
    """
    Handle user preferences save and retrieval
    Supports both GET (retrieve) and POST (save) operations
    """
    try:
        http_method = event.get('httpMethod', 'GET')
        
        if http_method == 'GET':
            return handle_get_preferences(event)
        elif http_method == 'POST':
            return handle_save_preferences(event)
        else:
            return error_response(405, 'Method not allowed')
    
    except Exception as e:
        print(f"Error: {str(e)}")
        return error_response(500, f'Internal server error: {str(e)}')


def handle_get_preferences(event):
    """
    GET /preferences/get?userId=<userId>
    Retrieve user preferences from DynamoDB
    """
    try:
        # Get userId from query parameters
        query_params = event.get('queryStringParameters', {})
        if not query_params:
            query_params = {}
        
        user_id = query_params.get('userId')
        
        if not user_id:
            return error_response(400, 'userId query parameter is required')
        
        # Retrieve from DynamoDB
        response = preferences_table.get_item(Key={'userId': user_id})
        
        if 'Item' not in response:
            # Return empty preferences if user hasn't saved any yet
            return success_response({
                'preferences': {
                    'allergies': [],
                    'budget': 0,
                    'spent': 0,
                    'customPreferences': ''
                }
            })
        
        item = response['Item']
        
        # Convert DynamoDB Decimal to float for JSON serialization
        preferences = {
            'allergies': item.get('allergies', []),
            'budget': float(item.get('budget', 0)),
            'spent': float(item.get('spent', 0)),
            'customPreferences': item.get('customPreferences', ''),
            'lastUpdated': item.get('lastUpdated', '')
        }
        
        return success_response({'preferences': preferences})
    
    except Exception as e:
        print(f"Error retrieving preferences: {str(e)}")
        return error_response(500, f'Error retrieving preferences: {str(e)}')


def handle_save_preferences(event):
    """
    POST /preferences/save
    Save user preferences to DynamoDB
    
    Expected body:
    {
        "userId": "session_abc123_1234567890",
        "allergies": ["peanuts", "dairy"],
        "budget": 500,
        "spent": 150,
        "customPreferences": "Low carb, vegetarian"
    }
    """
    try:
        body = json.loads(event.get('body', '{}'))
        
        user_id = body.get('userId')
        if not user_id:
            return error_response(400, 'userId is required')
        
        # Validate and prepare data
        allergies = body.get('allergies', [])
        if not isinstance(allergies, list):
            return error_response(400, 'allergies must be an array')
        
        budget = body.get('budget', 0)
        try:
            budget = float(budget)
        except (ValueError, TypeError):
            return error_response(400, 'budget must be a number')
        
        spent = body.get('spent', 0)
        try:
            spent = float(spent)
        except (ValueError, TypeError):
            return error_response(400, 'spent must be a number')
        
        custom_preferences = body.get('customPreferences', '')
        if not isinstance(custom_preferences, str):
            custom_preferences = str(custom_preferences)
        
        # Save to DynamoDB
        preferences_table.put_item(
            Item={
                'userId': user_id,
                'allergies': allergies,
                'budget': Decimal(str(budget)),
                'spent': Decimal(str(spent)),
                'customPreferences': custom_preferences,
                'lastUpdated': datetime.utcnow().isoformat()
            }
        )
        
        return success_response({
            'message': 'Preferences saved successfully',
            'userId': user_id
        })
    
    except json.JSONDecodeError:
        return error_response(400, 'Invalid JSON in request body')
    except Exception as e:
        print(f"Error saving preferences: {str(e)}")
        return error_response(500, f'Error saving preferences: {str(e)}')


def success_response(data):
    """
    Return a successful API response
    """
    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
        },
        'body': json.dumps(data)
    }


def error_response(status_code, message):
    """
    Return an error API response
    """
    return {
        'statusCode': status_code,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
        },
        'body': json.dumps({'error': message})
    }
