# Quick Start: AI Receipt Analysis with Bedrock

## What I've Built for You 🚀

I've created a complete **AI-powered receipt analysis system** using AWS Bedrock and Claude AI that intelligently processes your grocery receipts.

## What It Does ✨

When a user uploads a receipt, the system:

1. **📸 Extracts Text** - Uses AWS Textract to read the receipt
2. **🤖 AI Analysis** - Claude AI analyzes the items and provides:
   - **Smart Categorization**: Groups items (produce, protein, dairy, etc.)
   - **Health Score**: Rates purchases 1-10 for healthiness
   - **Recipe Suggestions**: 3-5 recipes you can make with those items
   - **Budget Analysis**: Tracks spending and suggests savings
   - **Meal Ideas**: Weekly meal plan suggestions
   - **Missing Items**: Identifies pantry essentials you might need
   - **Health Tips**: Personalized nutritional advice

## Files Created 📁

```
backend/lambdas/analyze_receipt_ai/
├── handler.py              # AI analysis Lambda function
└── requirements.txt        # Dependencies

infra/
├── stacks/lambda_stack.py     # Updated with AI Lambda
├── stacks/api_gateway_stack.py # Added /analyze-receipt endpoint
└── app.py                      # Added function to deployment

BEDROCK_AI_IMPLEMENTATION_GUIDE.md  # Detailed implementation guide
deploy_ai_receipt_analysis.sh       # Deployment script
```

## How to Deploy 🛠️

### Option 1: Quick Deploy (Recommended)
```bash
./deploy_ai_receipt_analysis.sh
```

### Option 2: Manual Deploy
```bash
cd infra
cdk deploy --all
```

## How to Use It 💡

### From Frontend

```javascript
// After receipt is uploaded and parsed
const response = await fetch('https://your-api-url/analyze-receipt', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    receiptId: 'receipt-123',
    userId: 'user-456'
  })
});

const data = await response.json();
console.log(data.insights);
```

### Response Example

```json
{
  "success": true,
  "insights": {
    "healthScore": 8,
    "budgetAnalysis": {
      "totalSpent": 87.43,
      "budgetStatus": "Under budget by $12.57"
    },
    "recipeSuggestions": [
      {
        "name": "Grilled Chicken Salad",
        "ingredients": ["chicken", "lettuce"],
        "prepTime": "20 mins",
        "servings": 4
      }
    ],
    "mealPlanIdeas": [
      "Monday: Chicken stir-fry",
      "Tuesday: Pasta with vegetables"
    ],
    "healthTips": [
      "Great variety of fresh produce!",
      "Consider whole grain options"
    ]
  }
}
```

## Prerequisites ✅

1. **AWS Account** with Bedrock access
2. **Enable Claude 3.5 Sonnet**:
   - Go to AWS Console → Bedrock → Model Access
   - Request access to `anthropic.claude-3-5-sonnet-20241022-v2:0`
   - Wait for approval (usually instant)

3. **IAM Permissions**:
   - `bedrock:InvokeModel`
   - `dynamodb:GetItem`, `dynamodb:PutItem`, `dynamodb:UpdateItem`

## Integration with Your App

### Update Dashboard to Show AI Insights

Add this to your `Dashboard.jsx`:

```javascript
const [receiptInsights, setReceiptInsights] = useState(null);

const displayReceiptInsights = (insights) => {
  return (
    <div className="ai-insights-card">
      <h3>🤖 AI Analysis</h3>
      <div className="health-score">
        Health Score: {insights.nutritionalAssessment.healthScore}/10
      </div>
      <div className="recipe-suggestions">
        <h4>Recipe Ideas:</h4>
        {insights.recipeSuggestions.map(recipe => (
          <div key={recipe.name}>
            <strong>{recipe.name}</strong> - {recipe.prepTime}
          </div>
        ))}
      </div>
      <div className="budget-info">
        Total Spent: ${insights.budgetAnalysis.totalSpent}
      </div>
    </div>
  );
};
```

## Cost Estimates 💰

- **Textract**: ~$0.015 per receipt
- **Bedrock AI**: ~$0.02 per receipt analysis
- **Total**: ~$0.035 per receipt

For 1,000 receipts/month = **~$35/month**

## Next Steps 🎯

1. ✅ **Deploy** - Run `./deploy_ai_receipt_analysis.sh`
2. ✅ **Test** - Upload a sample receipt
3. ✅ **Integrate** - Add UI components to display insights
4. ✅ **Optimize** - Cache results to reduce costs

## Troubleshooting 🔧

### "Model access denied"
→ Enable Claude 3.5 Sonnet in Bedrock console

### "Throttling errors"
→ Default limit is 10 requests/min. Request increase in Service Quotas

### "No insights returned"
→ Check Lambda logs in CloudWatch for errors

## Documentation 📚

- **Full Guide**: `BEDROCK_AI_IMPLEMENTATION_GUIDE.md`
- **AWS Bedrock Docs**: https://docs.aws.amazon.com/bedrock/
- **Claude API**: https://docs.anthropic.com/claude/

---

**Built with ❤️ for Savr.ai - AWS AI Global Hackathon 2024**

