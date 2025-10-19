import json
import boto3
import os
from datetime import datetime, timedelta
import uuid

# Initialize AWS clients
bedrock_runtime = boto3.client('bedrock-runtime', region_name='us-east-1')
dynamodb = boto3.resource('dynamodb')

# Environment variables
MEAL_PLANS_TABLE = os.environ.get('MEAL_PLANS_TABLE')
USER_PREFERENCES_TABLE = os.environ.get('USER_PREFERENCES_TABLE')
RECEIPTS_TABLE = os.environ.get('RECEIPTS_TABLE')

# DynamoDB tables
meal_plans_table = dynamodb.Table(MEAL_PLANS_TABLE)
user_preferences_table = dynamodb.Table(USER_PREFERENCES_TABLE)
receipts_table = dynamodb.Table(RECEIPTS_TABLE)


def lambda_handler(event, context):
    """
    Generate AI-powered meal plans using Bedrock Claude
    """
    try:
        # Parse request body
        body = json.loads(event.get('body', '{}'))
        user_id = body.get('userId') or 'anonymous'
        
        # Get user preferences from request or database
        preferences = get_user_preferences(user_id, body.get('preferences', {}))
        
        # Get recent grocery purchases
        grocery_items = get_recent_grocery_items(user_id)
        
        # Generate meal plan using Bedrock Claude
        meal_plan = generate_meal_plan_with_ai(preferences, grocery_items)
        
        # Save meal plan to DynamoDB
        plan_id = save_meal_plan(user_id, meal_plan, preferences)
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
            },
            'body': json.dumps({
                'success': True,
                'planId': plan_id,
                'mealPlan': meal_plan,
                'message': 'Meal plan generated successfully'
            })
        }
        
    except Exception as e:
        print(f"Error generating meal plan: {str(e)}")
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'success': False,
                'error': 'Failed to generate meal plan',
                'details': str(e)
            })
        }


def get_user_preferences(user_id, request_preferences):
    """
    Get user preferences from database or use provided preferences
    """
    try:
        # Try to get stored preferences first
        response = user_preferences_table.get_item(Key={'user_id': user_id})
        stored_preferences = response.get('Item', {})
        
        # Merge with request preferences (request takes priority)
        preferences = {
            'budget': request_preferences.get('budget') or stored_preferences.get('budget', 100),
            'dietaryRestrictions': request_preferences.get('dietaryRestrictions') or stored_preferences.get('dietaryRestrictions', ''),
            'nutritionGoal': request_preferences.get('nutritionGoal') or stored_preferences.get('nutritionGoal', 'maintenance'),
            'caloricTarget': request_preferences.get('caloricTarget') or stored_preferences.get('caloricTarget', 2000),
            'proteinTarget': request_preferences.get('proteinTarget') or stored_preferences.get('proteinTarget', 150),
            'carbTarget': request_preferences.get('carbTarget') or stored_preferences.get('carbTarget', 200),
            'fatTarget': request_preferences.get('fatTarget') or stored_preferences.get('fatTarget', 65)
        }
        
        # Save updated preferences if new ones provided
        if request_preferences:
            save_user_preferences(user_id, preferences)
            
        return preferences
        
    except Exception as e:
        print(f"Error getting user preferences: {str(e)}")
        # Return default preferences
        return {
            'budget': 100,
            'dietaryRestrictions': '',
            'nutritionGoal': 'maintenance',
            'caloricTarget': 2000,
            'proteinTarget': 150,
            'carbTarget': 200,
            'fatTarget': 65
        }


def save_user_preferences(user_id, preferences):
    """
    Save user preferences to DynamoDB
    """
    try:
        user_preferences_table.put_item(
            Item={
                'user_id': user_id,
                'preferences': preferences,
                'updated_at': datetime.now().isoformat()
            }
        )
    except Exception as e:
        print(f"Error saving user preferences: {str(e)}")


def get_recent_grocery_items(user_id):
    """
    Get recent grocery purchases from receipts table
    """
    try:
        # Query recent receipts (last 30 days)
        response = receipts_table.query(
            KeyConditionExpression='user_id = :user_id',
            ExpressionAttributeValues={':user_id': user_id},
            ScanIndexForward=False,  # Most recent first
            Limit=10  # Last 10 receipts
        )
        
        grocery_items = []
        for receipt in response.get('Items', []):
            items = receipt.get('items', [])
            grocery_items.extend(items)
            
        return grocery_items[:50]  # Limit to 50 most recent items
        
    except Exception as e:
        print(f"Error getting grocery items: {str(e)}")
        return []


def generate_meal_plan_with_ai(preferences, grocery_items):
    """
    Use Bedrock Claude to generate personalized meal plan
    """
    try:
        # Create the prompt for Claude
        prompt = create_meal_plan_prompt(preferences, grocery_items)
        
        # Call Bedrock Claude 4.5 Sonnet (most intelligent model)
        response = bedrock_runtime.invoke_model(
            modelId='us.anthropic.claude-sonnet-4-5-20250514-v1:0',
            body=json.dumps({
                'anthropic_version': 'bedrock-2023-05-31',
                'max_tokens': 4000,
                'messages': [
                    {
                        'role': 'user',
                        'content': prompt
                    }
                ],
                'temperature': 0.7
            })
        )
        
        # Parse response
        response_body = json.loads(response['body'].read())
        meal_plan_text = response_body['content'][0]['text']
        
        # Parse the structured meal plan from Claude's response
        meal_plan = parse_meal_plan_response(meal_plan_text)
        
        return meal_plan
        
    except Exception as e:
        print(f"Error calling Bedrock: {str(e)}")
        # Return a fallback meal plan
        return create_fallback_meal_plan(preferences)


def create_meal_plan_prompt(preferences, grocery_items):
    """
    Create a detailed prompt for Claude to generate meal plans
    """
    grocery_list = "\n".join([f"- {item.get('name', 'Unknown item')}" for item in grocery_items[:20]])
    
    prompt = f"""You are a professional nutritionist and meal planning expert. Create a personalized 7-day meal plan based on the following information:

USER PREFERENCES:
- Weekly Budget: ${preferences['budget']}
- Dietary Restrictions/Allergies: {preferences['dietaryRestrictions'] or 'None specified'}
- Nutrition Goal: {preferences['nutritionGoal']}
- Daily Caloric Target: {preferences['caloricTarget']} calories
- Protein Target: {preferences['proteinTarget']}g
- Carb Target: {preferences['carbTarget']}g  
- Fat Target: {preferences['fatTarget']}g

AVAILABLE GROCERY ITEMS (from recent purchases):
{grocery_list if grocery_list.strip() else 'No recent grocery data available'}

REQUIREMENTS:
1. Create a 7-day meal plan (Monday-Sunday)
2. Include breakfast, lunch, dinner, and 1-2 snacks per day
3. Prioritize using available grocery items when possible
4. Stay within the weekly budget
5. Meet nutritional goals and respect dietary restrictions
6. Include simple, practical recipes
7. Provide estimated prep time for each meal

RESPONSE FORMAT (JSON):
{{
  "weeklyPlan": {{
    "monday": {{
      "breakfast": {{"name": "Meal Name", "ingredients": ["ingredient1", "ingredient2"], "calories": 400, "protein": 20, "carbs": 45, "fat": 15, "prepTime": "10 mins"}},
      "lunch": {{"name": "Meal Name", "ingredients": ["ingredient1", "ingredient2"], "calories": 500, "protein": 25, "carbs": 55, "fat": 18, "prepTime": "15 mins"}},
      "dinner": {{"name": "Meal Name", "ingredients": ["ingredient1", "ingredient2"], "calories": 600, "protein": 35, "carbs": 60, "fat": 20, "prepTime": "25 mins"}},
      "snacks": [{{"name": "Snack Name", "ingredients": ["ingredient1"], "calories": 150, "protein": 8, "carbs": 15, "fat": 6, "prepTime": "5 mins"}}]
    }},
    "tuesday": {{ ... }},
    "wednesday": {{ ... }},
    "thursday": {{ ... }},
    "friday": {{ ... }},
    "saturday": {{ ... }},
    "sunday": {{ ... }}
  }},
  "weeklyTotals": {{
    "totalCalories": 14000,
    "avgDailyCalories": 2000,
    "totalProtein": 1050,
    "totalCarbs": 1400,
    "totalFat": 455,
    "estimatedCost": 85
  }},
  "shoppingList": ["item1", "item2", "item3"],
  "tips": ["tip1", "tip2", "tip3"]
}}

Generate a practical, healthy, and budget-friendly meal plan that helps achieve the user's nutrition goals."""

    return prompt


def parse_meal_plan_response(response_text):
    """
    Parse Claude's response into structured meal plan data
    """
    try:
        # Try to extract JSON from the response
        start_idx = response_text.find('{')
        end_idx = response_text.rfind('}') + 1
        
        if start_idx != -1 and end_idx != -1:
            json_str = response_text[start_idx:end_idx]
            meal_plan = json.loads(json_str)
            return meal_plan
        else:
            raise ValueError("No JSON found in response")
            
    except Exception as e:
        print(f"Error parsing meal plan response: {str(e)}")
        # Return a simple fallback structure
        return {
            "weeklyPlan": {},
            "weeklyTotals": {
                "totalCalories": 14000,
                "avgDailyCalories": 2000,
                "estimatedCost": 100
            },
            "shoppingList": [],
            "tips": ["Meal plan generated with limited data"]
        }


def create_fallback_meal_plan(preferences):
    """
    Create a simple fallback meal plan if AI generation fails
    """
    return {
        "weeklyPlan": {
            "monday": {
                "breakfast": {"name": "Oatmeal with Berries", "calories": 350, "prepTime": "5 mins"},
                "lunch": {"name": "Grilled Chicken Salad", "calories": 450, "prepTime": "15 mins"},
                "dinner": {"name": "Baked Salmon with Vegetables", "calories": 550, "prepTime": "25 mins"}
            }
        },
        "weeklyTotals": {
            "avgDailyCalories": int(preferences['caloricTarget']),
            "estimatedCost": int(preferences['budget'])
        },
        "shoppingList": ["Oats", "Berries", "Chicken", "Salmon", "Mixed Vegetables"],
        "tips": ["This is a basic meal plan. Upload receipts for personalized recommendations."]
    }


def save_meal_plan(user_id, meal_plan, preferences):
    """
    Save generated meal plan to DynamoDB
    """
    try:
        plan_id = str(uuid.uuid4())
        plan_date = datetime.now().strftime('%Y-%m-%d')
        
        meal_plans_table.put_item(
            Item={
                'user_id': user_id,
                'plan_date': plan_date,
                'plan_id': plan_id,
                'meal_plan': meal_plan,
                'preferences_used': preferences,
                'created_at': datetime.now().isoformat(),
                'status': 'active'
            }
        )
        
        return plan_id
        
    except Exception as e:
        print(f"Error saving meal plan: {str(e)}")
        return None