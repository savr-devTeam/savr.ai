# AWS Bedrock AI Receipt Analysis - Implementation Guide

## Overview
This guide explains how to implement AI-powered receipt analysis using **AWS Bedrock** (Claude AI) and integrate it with your Savr.ai application.

## Architecture

```
User uploads receipt → S3 → Textract (parse text) → Bedrock AI (analyze) → DynamoDB (store insights) → Frontend displays
```

## What You Already Have ✅

1. **Textract Integration** (`backend/lambdas/parse_receipt/handler.py`)
   - Extracts text and line items from receipt images
   - Stores basic parsed data in DynamoDB

2. **Bedrock Integration** (`backend/lambdas/generate_plan/handler.py`)
   - Uses Claude 3.5 Sonnet for meal plan generation
   - Already configured with proper IAM permissions

## New AI Receipt Analysis Features 🆕

I've created `backend/lambdas/analyze_receipt_ai/handler.py` which adds:

### 1. **Intelligent Item Categorization**
- Automatically categorizes items (produce, protein, dairy, grains, snacks, etc.)
- Groups related items for better organization

### 2. **Nutritional Assessment**
- Health score (1-10) for your grocery purchases
- Identifies healthy vs unhealthy items
- Provides nutritional balance feedback

### 3. **Budget Analysis**
- Tracks total spending
- Compares against weekly budget
- Suggests money-saving opportunities

### 4. **AI Recipe Suggestions**
- Generates 3-5 recipes using purchased ingredients
- Includes prep time, servings, and estimated cost
- Personalized based on dietary restrictions

### 5. **Smart Recommendations**
- Identifies missing pantry essentials
- Suggests healthier alternatives
- Provides weekly meal plan ideas

## Step-by-Step Implementation

### Step 1: Update CDK Infrastructure

Add the new Lambda to `infra/stacks/lambda_stack.py`:

```python
# Add this to your lambda_stack.py

# AI Receipt Analysis Lambda
analyze_receipt_ai_lambda = _lambda.Function(
    self, "AnalyzeReceiptAI",
    runtime=_lambda.Runtime.PYTHON_3_11,
    handler="handler.lambda_handler",
    code=_lambda.Code.from_asset("../backend/lambdas/analyze_receipt_ai"),
    timeout=Duration.seconds(60),
    memory_size=512,
    environment={
        "RECEIPTS_TABLE": dynamodb_stack.receipts_table.table_name,
        "USER_PREFERENCES_TABLE": dynamodb_stack.user_preferences_table.table_name,
    }
)

# Grant permissions
dynamodb_stack.receipts_table.grant_read_write_data(analyze_receipt_ai_lambda)
dynamodb_stack.user_preferences_table.grant_read_data(analyze_receipt_ai_lambda)

# Grant Bedrock access
analyze_receipt_ai_lambda.add_to_role_policy(
    iam.PolicyStatement(
        effect=iam.Effect.ALLOW,
        actions=[
            "bedrock:InvokeModel",
            "bedrock:InvokeModelWithResponseStream"
        ],
        resources=[
            f"arn:aws:bedrock:{self.region}::foundation-model/anthropic.claude-3-5-sonnet-20241022-v2:0"
        ]
    )
)
```

### Step 2: Add API Gateway Route

In `infra/stacks/api_gateway_stack.py`:

```python
# Add new route for AI analysis
analyze_ai_integration = apigateway.LambdaIntegration(
    lambda_stack.analyze_receipt_ai_lambda
)

receipts_resource = api.root.add_resource("receipts")
analyze_resource = receipts_resource.add_resource("analyze")
analyze_resource.add_method("POST", analyze_ai_integration)
```

### Step 3: Deploy Infrastructure

```bash
cd infra
cdk deploy --all
```

### Step 4: Update Frontend to Use AI Analysis

Add this to your `frontend/src/services/api.js`:

```javascript
// Analyze receipt with AI
export const analyzeReceiptWithAI = async (receiptId, userId) => {
  try {
    const response = await axios.post(`${API_URL}/receipts/analyze`, {
      receiptId,
      userId
    });
    return response.data;
  } catch (error) {
    console.error('Error analyzing receipt:', error);
    throw error;
  }
};
```

### Step 5: Update Receipt Upload Flow

Modify `frontend/src/pages/ReceiptScan.jsx` or Dashboard to trigger AI analysis:

```javascript
const handleReceiptUpload = async (file) => {
  try {
    // 1. Upload to S3
    const uploadResult = await uploadReceipt(file);
    
    // 2. Wait for Textract parsing (automatic via S3 trigger)
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // 3. Trigger AI analysis
    const aiAnalysis = await analyzeReceiptWithAI(
      uploadResult.receiptId,
      currentUserId
    );
    
    // 4. Display insights
    setReceiptInsights(aiAnalysis.insights);
    
    // Show categorized items
    console.log('Categories:', aiAnalysis.insights.categories);
    console.log('Recipe Suggestions:', aiAnalysis.insights.recipeSuggestions);
    console.log('Health Score:', aiAnalysis.insights.nutritionalAssessment.healthScore);
    
  } catch (error) {
    console.error('Receipt processing failed:', error);
  }
};
```

## Using Bedrock Agent (Optional Advanced Feature)

For more advanced capabilities, you can create a Bedrock Agent that handles multi-step reasoning:

### Create Bedrock Agent

```python
# In your CDK stack
bedrock_agent = bedrock.CfnAgent(
    self, "SavrReceiptAgent",
    agent_name="savr-receipt-analyzer",
    instruction="""You are a nutritionist assistant that helps users:
    1. Analyze grocery receipts for nutritional value
    2. Suggest healthy recipes based on purchased items
    3. Provide budget-conscious meal planning advice
    4. Identify missing ingredients for complete meals
    """,
    foundation_model="anthropic.claude-3-5-sonnet-20241022-v2:0",
    agent_resource_role_arn=agent_role.role_arn
)

# Add action groups for the agent
action_group = bedrock.CfnAgentActionGroup(
    self, "ReceiptAnalysisActions",
    action_group_name="receipt-actions",
    agent_id=bedrock_agent.attr_agent_id,
    action_group_executor={
        "lambda": analyze_receipt_ai_lambda.function_arn
    },
    api_schema={
        "payload": json.dumps({
            "openapi": "3.0.0",
            "info": {"title": "Receipt Analysis API", "version": "1.0.0"},
            "paths": {
                "/analyze": {
                    "post": {
                        "description": "Analyze a grocery receipt",
                        "parameters": [
                            {"name": "receiptId", "in": "query", "required": True}
                        ]
                    }
                }
            }
        })
    }
)
```

## IAM Permissions Required

Ensure your Lambda execution role has these permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "bedrock:InvokeModel",
        "bedrock:InvokeModelWithResponseStream"
      ],
      "Resource": "arn:aws:bedrock:*::foundation-model/anthropic.claude-*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:UpdateItem",
        "dynamodb:Query"
      ],
      "Resource": [
        "arn:aws:dynamodb:*:*:table/receipts-table",
        "arn:aws:dynamodb:*:*:table/user-preferences-table"
      ]
    }
  ]
}
```

## Testing

### Test the AI Analysis Lambda

```bash
# Create test event
cat > test-event.json << EOF
{
  "body": "{\"receiptId\": \"20241019-receipt-001\", \"userId\": \"test-user\"}"
}
EOF

# Invoke Lambda
aws lambda invoke \
  --function-name AnalyzeReceiptAI \
  --payload file://test-event.json \
  --region us-east-1 \
  output.json

# View results
cat output.json
```

### Example API Response

```json
{
  "success": true,
  "receiptId": "20241019-receipt-001",
  "insights": {
    "categories": {
      "produce": [
        {"name": "Bananas", "price": 2.99},
        {"name": "Lettuce", "price": 1.49}
      ],
      "protein": [
        {"name": "Chicken Breast", "price": 12.99}
      ]
    },
    "nutritionalAssessment": {
      "healthScore": 8,
      "healthyItemsCount": 15,
      "unhealthyItemsCount": 2,
      "balanceDescription": "Excellent variety of fresh produce and lean proteins"
    },
    "budgetAnalysis": {
      "totalSpent": 87.43,
      "budgetStatus": "Under budget by $12.57",
      "savingsOpportunities": [
        "Buy store brand cereal to save $3",
        "Frozen vegetables instead of fresh saves $4"
      ]
    },
    "recipeSuggestions": [
      {
        "name": "Grilled Chicken Caesar Salad",
        "ingredients": ["chicken breast", "lettuce", "parmesan"],
        "prepTime": "20 mins",
        "servings": 4,
        "estimatedCost": 8.50
      }
    ],
    "mealPlanIdeas": [
      "Monday: Chicken stir-fry with vegetables",
      "Tuesday: Banana smoothie bowls"
    ],
    "healthTips": [
      "Great job on buying fresh vegetables!",
      "Consider whole grain bread instead of white"
    ]
  }
}
```

## Cost Optimization

### Bedrock Pricing (Claude 3.5 Sonnet)
- Input: $3 per million tokens
- Output: $15 per million tokens
- Average receipt analysis: ~1,500 tokens = $0.02 per receipt

### Optimization Tips
1. **Cache results** - Store AI insights in DynamoDB
2. **Batch processing** - Analyze multiple receipts together
3. **Use smaller models** for simple categorization
4. **Set token limits** - Max 3,000 tokens per analysis

## Next Steps

1. **Deploy the new Lambda function**
2. **Test with sample receipts**
3. **Integrate UI components** to display insights
4. **Add user feedback loop** to improve AI accuracy
5. **Implement caching** to reduce API costs

## Troubleshooting

### Error: "Model not found"
- Ensure you have access to Claude 3.5 Sonnet in your AWS region
- Request model access in Bedrock console

### Error: "Throttling"
- Bedrock has rate limits (default: 10 req/min)
- Request limit increase in AWS Service Quotas

### Error: "Insufficient permissions"
- Check Lambda execution role has Bedrock invoke permissions
- Verify DynamoDB table permissions

## Support Resources

- [AWS Bedrock Documentation](https://docs.aws.amazon.com/bedrock/)
- [Claude API Reference](https://docs.anthropic.com/claude/reference)
- [Bedrock Agent Guide](https://docs.aws.amazon.com/bedrock/latest/userguide/agents.html)

---

**Questions?** Check the Savr.ai team Discord or AWS documentation!

