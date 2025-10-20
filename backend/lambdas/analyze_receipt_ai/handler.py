import json
import boto3
import os
from datetime import datetime
from decimal import Decimal

# Initialize AWS clients
bedrock_runtime = boto3.client('bedrock-runtime', region_name='us-east-1')
dynamodb = boto3.resource('dynamodb')

# Environment variables
RECEIPTS_TABLE = os.environ.get('RECEIPTS_TABLE')
USER_PREFERENCES_TABLE = os.environ.get('USER_PREFERENCES_TABLE')

# DynamoDB tables
receipts_table = dynamodb.Table(RECEIPTS_TABLE)
user_preferences_table = dynamodb.Table(USER_PREFERENCES_TABLE)


def lambda_handler(event, context):
    """
    AI-powered receipt analysis using Amazon Bedrock
    This enhances basic Textract results with intelligent insights
    """
    try:
        body = json.loads(event.get('body', '{}'))
        s3_key = body.get('s3Key')
        user_id = body.get('userId', 'anonymous')
        
        if not s3_key:
            return error_response(400, 's3Key is required')
        
        # Get receipt data from S3 key
        receipt_data = get_receipt_data_from_s3(s3_key)
        
        # Get user preferences for context
        user_preferences = get_user_preferences(user_id)
        
        # Analyze receipt with Bedrock AI
        ai_insights = analyze_receipt_with_bedrock(
            receipt_data, 
            user_preferences
        )
        
        # Store insights in DynamoDB
        store_analysis_results(user_id, s3_key, ai_insights)
        
        # Update user's budget tracker
        update_budget_tracking(user_id, ai_insights.get('totalSpent', 0))
        
        return {
            'statusCode': 200,
            'headers': cors_headers(),
            'body': json.dumps({
                'success': True,
                's3Key': s3_key,
                'userId': user_id,
                'insights': ai_insights,
                'message': 'Receipt analyzed successfully with AI'
            }, cls=DecimalEncoder)
        }
        
    except Exception as e:
        print(f"Error in AI receipt analysis: {str(e)}")
        return error_response(500, 'Failed to analyze receipt', str(e))


def get_receipt_data_from_s3(s3_key):
    """
    Retrieve receipt data from S3 or DynamoDB using s3_key
    """
    try:
        # For now, return basic structure
        # In production, you'd call Textract to extract text from S3 file
        return {
            's3_key': s3_key,
            'status': 'pending_analysis'
        }
    except Exception as e:
        print(f"Error getting receipt from S3: {str(e)}")
        raise


def store_analysis_results(user_id, s3_key, ai_insights):
    """
    Store analysis results in DynamoDB
    """
    try:
        # Store in receipts table if needed
        return True
    except Exception as e:
        print(f"Error storing analysis results: {str(e)}")
        raise


def get_user_preferences(user_id):
    """
    Get user preferences from database
    """
    try:
        response = user_preferences_table.get_item(Key={'user_id': user_id})
        return response.get('Item', {}).get('preferences', {})
    except Exception as e:
        print(f"Error getting preferences: {str(e)}")
        return {}



def analyze_receipt_with_bedrock(receipt_data, user_preferences):
    """
    Use Bedrock Claude to analyze receipt and provide intelligent insights
    """
    try:
        # Extract items from receipt
        items = receipt_data.get('items', [])
        
        # Create AI prompt
        prompt = create_analysis_prompt(items, user_preferences)
        
        # Call Bedrock Claude 4.5 Sonnet via inference profile (most intelligent available model)
        response = bedrock_runtime.invoke_model(
            modelId='us.anthropic.claude-sonnet-4-5-20250929-v1:0',
            body=json.dumps({
                'anthropic_version': 'bedrock-2023-05-31',
                'max_tokens': 3000,
                'messages': [
                    {
                        'role': 'user',
                        'content': prompt
                    }
                ],
                'temperature': 0.5
            })
        )
        
        # Parse response
        response_body = json.loads(response['body'].read())
        analysis_text = response_body['content'][0]['text']
        
        # Parse structured insights from Claude's response
        insights = parse_ai_insights(analysis_text, items)
        
        return insights
        
    except Exception as e:
        print(f"Error in Bedrock analysis: {str(e)}")
        return create_fallback_insights(receipt_data.get('items', []))


def create_analysis_prompt(items, user_preferences):
    """
    Create a comprehensive prompt for receipt analysis
    """
    items_text = "\n".join([
        f"- {item.get('name', 'Unknown')}: ${item.get('price', 0):.2f} (Qty: {item.get('quantity', 1)})"
        for item in items
    ])
    
    budget = user_preferences.get('budget', 'Not specified')
    allergies = user_preferences.get('dietaryRestrictions', 'None')
    
    prompt = f"""You are an AI nutritionist and meal planning expert. Analyze this grocery receipt and provide intelligent insights.

GROCERY ITEMS PURCHASED:
{items_text if items_text else 'No items found'}

USER CONTEXT:
- Weekly Budget: ${budget}
- Dietary Restrictions/Allergies: {allergies}

ANALYSIS REQUIREMENTS:
1. **Categorize Items**: Group items by category (produce, protein, dairy, grains, snacks, etc.)
2. **Nutritional Assessment**: Evaluate the nutritional balance (healthy vs. unhealthy items)
3. **Budget Analysis**: Calculate total spent and budget efficiency
4. **Recipe Suggestions**: Suggest 3-5 recipes that can be made with these ingredients
5. **Missing Items**: Identify essential pantry staples that might be missing
6. **Health Score**: Rate the purchase on a health scale (1-10)
7. **Savings Opportunities**: Suggest where they could save money or buy healthier alternatives
8. **Meal Plan Ideas**: Brief suggestions for meals this week

RESPONSE FORMAT (JSON):
{{
  "categories": {{
    "produce": [{{"name": "item", "price": 0.00}}],
    "protein": [{{"name": "item", "price": 0.00}}],
    "dairy": [{{"name": "item", "price": 0.00}}],
    "grains": [{{"name": "item", "price": 0.00}}],
    "snacks": [{{"name": "item", "price": 0.00}}],
    "beverages": [{{"name": "item", "price": 0.00}}],
    "other": [{{"name": "item", "price": 0.00}}]
  }},
  "nutritionalAssessment": {{
    "healthScore": 7,
    "healthyItemsCount": 15,
    "unhealthyItemsCount": 3,
    "balanceDescription": "Good variety of proteins and vegetables..."
  }},
  "budgetAnalysis": {{
    "totalSpent": 85.50,
    "averageItemCost": 4.75,
    "budgetStatus": "Under budget",
    "savingsOpportunities": ["Buy store brand milk to save $2", "Frozen vegetables instead of fresh saves $5"]
  }},
  "recipeSuggestions": [
    {{
      "name": "Grilled Chicken Salad",
      "ingredients": ["chicken breast", "lettuce", "tomatoes"],
      "prepTime": "20 mins",
      "servings": 4,
      "estimatedCost": 12.00
    }}
  ],
  "missingEssentials": ["olive oil", "garlic", "onions", "spices"],
  "mealPlanIdeas": [
    "Monday: Chicken stir-fry with vegetables",
    "Tuesday: Pasta with marinara sauce",
    "Wednesday: Grilled salmon with rice"
  ],
  "healthTips": [
    "Great job on buying fresh vegetables!",
    "Consider reducing processed snacks",
    "Add more whole grains to your cart"
  ]
}}

Analyze the receipt and provide actionable, helpful insights in JSON format."""

    return prompt


def parse_ai_insights(analysis_text, original_items):
    """
    Parse Claude's analysis into structured data
    """
    try:
        # Extract JSON from response
        start_idx = analysis_text.find('{')
        end_idx = analysis_text.rfind('}') + 1
        
        if start_idx != -1 and end_idx != -1:
            json_str = analysis_text[start_idx:end_idx]
            insights = json.loads(json_str)
            
            # Add original items and metadata
            insights['originalItems'] = original_items
            insights['analyzedAt'] = datetime.now().isoformat()
            insights['itemCount'] = len(original_items)
            
            return insights
        else:
            raise ValueError("No JSON found in AI response")
            
    except Exception as e:
        print(f"Error parsing AI insights: {str(e)}")
        return create_fallback_insights(original_items)


def create_fallback_insights(items):
    """
    Create basic insights if AI analysis fails
    """
    total_spent = sum(item.get('price', 0) * item.get('quantity', 1) for item in items)
    
    return {
        "categories": {"other": items},
        "nutritionalAssessment": {
            "healthScore": 5,
            "balanceDescription": "Unable to analyze - basic processing only"
        },
        "budgetAnalysis": {
            "totalSpent": float(total_spent),
            "budgetStatus": "Analysis unavailable"
        },
        "recipeSuggestions": [],
        "missingEssentials": [],
        "mealPlanIdeas": ["Upload more receipts for personalized meal suggestions"],
        "healthTips": ["Enable AI analysis for detailed nutritional insights"],
        "originalItems": items,
        "analyzedAt": datetime.now().isoformat(),
        "itemCount": len(items)
    }


def convert_floats_to_decimal(obj):
    """
    Recursively convert all float values to Decimal for DynamoDB
    """
    if isinstance(obj, list):
        return [convert_floats_to_decimal(item) for item in obj]
    elif isinstance(obj, dict):
        return {key: convert_floats_to_decimal(value) for key, value in obj.items()}
    elif isinstance(obj, float):
        return Decimal(str(obj))
    else:
        return obj


def update_receipt_with_insights(user_id, receipt_id, insights):
    """
    Update receipt in DynamoDB with AI insights
    """
    try:
        # Convert floats to Decimal for DynamoDB
        insights_decimal = convert_floats_to_decimal(insights)
        
        receipts_table.update_item(
            Key={
                'user_id': user_id,
                'receipt_id': receipt_id
            },
            UpdateExpression='SET ai_insights = :insights, analyzed_at = :timestamp',
            ExpressionAttributeValues={
                ':insights': insights_decimal,
                ':timestamp': datetime.now().isoformat()
            }
        )
    except Exception as e:
        print(f"Error updating receipt: {str(e)}")


def update_budget_tracking(user_id, amount_spent):
    """
    Update user's budget tracking with new purchase
    """
    try:
        # This would update a budget tracking table
        # For now, just log it
        print(f"User {user_id} spent ${amount_spent}")
    except Exception as e:
        print(f"Error updating budget: {str(e)}")


def cors_headers():
    """CORS headers for API responses"""
    return {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
    }


def error_response(status_code, message, details=None):
    """Standard error response format"""
    body = {
        'success': False,
        'error': message
    }
    if details:
        body['details'] = details
    
    return {
        'statusCode': status_code,
        'headers': cors_headers(),
        'body': json.dumps(body)
    }


class DecimalEncoder(json.JSONEncoder):
    """Helper to encode Decimal values from DynamoDB"""
    def default(self, obj):
        if isinstance(obj, Decimal):
            return float(obj)
        return super(DecimalEncoder, self).default(obj)

