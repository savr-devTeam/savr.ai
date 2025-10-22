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
        
        # Get pantry items from request (NEW: direct pantry items)
        pantry_items = body.get('pantryItems', [])
        
        print(f"Received request - userId: {user_id}, pantryItems: {pantry_items}")
        
        # Get user preferences from request or database
        preferences = get_user_preferences(user_id, body.get('preferences', {}))
        
        # Get recent grocery purchases (fallback if no pantry items provided)
        if not pantry_items:
            grocery_items = get_recent_grocery_items(user_id)
        else:
            # Convert pantry item strings to dict format
            grocery_items = [{'name': item} for item in pantry_items]
        
        print(f"Grocery items for meal generation: {grocery_items}")
        
        # Generate meal plan using Bedrock Claude
        meal_plan = generate_meal_plan_with_ai(preferences, grocery_items)
        
        print(f"Generated meal plan with {len(meal_plan.get('meals', []))} meals")
        
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
                'meals': meal_plan.get('meals', []),  # NEW: return meals array for frontend
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
        
        # Call Bedrock Claude 3.5 Sonnet via inference profile
        response = bedrock_runtime.invoke_model(
            modelId='us.anthropic.claude-3-5-sonnet-20241022-v2:0',
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
        
        print(f"DEBUG: Claude response length: {len(meal_plan_text)}")
        print(f"DEBUG: Claude response preview: {meal_plan_text[:500]}...")
        
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
    Parse Claude's response into structured meal plan data and format for frontend
    """
    try:
        # Try to extract JSON from the response
        start_idx = response_text.find('{')
        end_idx = response_text.rfind('}') + 1
        
        if start_idx != -1 and end_idx != -1:
            json_str = response_text[start_idx:end_idx]
            meal_plan_data = json.loads(json_str)
            
            # Convert to frontend format with Pexels images
            weekly_plan = meal_plan_data.get('weeklyPlan', {})
            print(f"DEBUG: weeklyPlan keys: {list(weekly_plan.keys())}")
            
            meal_plan_data['meals'] = format_meals_for_frontend(weekly_plan)
            print(f"DEBUG: Generated {len(meal_plan_data['meals'])} meals")
            
            return meal_plan_data
        else:
            raise ValueError("No JSON found in response")
            
    except Exception as e:
        print(f"Error parsing meal plan response: {str(e)}")
        # Return a simple fallback structure
        return {
            "weeklyPlan": {},
            "meals": [],
            "weeklyTotals": {
                "totalCalories": 14000,
                "avgDailyCalories": 2000,
                "estimatedCost": 100
            },
            "shoppingList": [],
            "tips": ["Meal plan generated with limited data"]
        }


def get_meal_image(meal_name, meal_type):
    """
    Get meal image from Pexels API
    """
    return get_pexels_image(meal_name, meal_type)


def get_pexels_image(meal_name, meal_type):
    """
    Get meal image from Pexels API based on meal name
    """
    import urllib.request
    import urllib.parse
    
    try:
        # Pexels API key from environment
        pexels_api_key = os.environ.get('PEXELS_API_KEY', '')
        
        if not pexels_api_key:
            print("Warning: PEXELS_API_KEY not set, using default images")
            return get_default_image(meal_type)
        
        # Create search query from meal name (e.g., "Grilled Chicken Salad" -> "grilled chicken salad food")
        query = f"{meal_name} food"
        encoded_query = urllib.parse.quote(query)
        
        # Call Pexels API
        url = f"https://api.pexels.com/v1/search?query={encoded_query}&per_page=1"
        req = urllib.request.Request(url)
        req.add_header('Authorization', pexels_api_key)
        
        with urllib.request.urlopen(req, timeout=5) as response:
            data = json.loads(response.read())
            if data.get('photos') and len(data['photos']) > 0:
                return data['photos'][0]['src']['large']
        
        # If no results for specific meal, try generic meal type
        return get_default_image(meal_type)
        
    except Exception as e:
        print(f"Error fetching from Pexels for {meal_name}: {str(e)}")
        return get_default_image(meal_type)


def get_default_image(meal_type):
    """
    Default fallback images (no API needed) - high quality Pexels images
    """
    fallbacks = {
        'breakfast': 'https://images.pexels.com/photos/376464/pexels-photo-376464.jpeg?auto=compress&cs=tinysrgb&w=800',
        'lunch': 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=800',
        'dinner': 'https://images.pexels.com/photos/262959/pexels-photo-262959.jpeg?auto=compress&cs=tinysrgb&w=800'
    }
    return fallbacks.get(meal_type.lower(), fallbacks['lunch'])


def format_meals_for_frontend(weekly_plan):
    """
    Convert weekly plan to flat array of meals with AI-generated images
    Format expected by GenerateMeals.jsx
    """
    meals = []
    
    print(f"DEBUG: Formatting meals from weekly_plan with keys: {list(weekly_plan.keys())}")
    
    for day_name, day_meals in weekly_plan.items():
        print(f"DEBUG: Processing day {day_name} with meal types: {list(day_meals.keys()) if isinstance(day_meals, dict) else 'not a dict'}")
        
        if not isinstance(day_meals, dict):
            continue
            
        for meal_type in ['breakfast', 'lunch', 'dinner']:
            meal_data = day_meals.get(meal_type)
            if meal_data:
                meal_name = meal_data.get('name', 'Untitled Meal')
                print(f"DEBUG: Getting Pexels image for {meal_type}: {meal_name}")
                
                # Get image from Pexels
                img_url = get_meal_image(meal_name, meal_type)
                
                # Format for frontend
                meals.append({
                    'title': meal_name,
                    'meal': meal_type.capitalize(),
                    'cals': meal_data.get('calories', 0),
                    'p': meal_data.get('protein', 0),
                    'c': meal_data.get('carbs', 0),
                    'f': meal_data.get('fat', 0),
                    'img': img_url,
                    'ingredients': meal_data.get('ingredients', []),
                    'prepTime': meal_data.get('prepTime', 'N/A')
                })
    
    print(f"DEBUG: Formatted {len(meals)} total meals with Pexels images")
    return meals


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