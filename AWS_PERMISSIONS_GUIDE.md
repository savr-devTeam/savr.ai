# AWS Permissions Guide for Savr.ai

## Required IAM Policies

Your AWS user `savrai-members` needs these managed policies attached:

### Core Deployment Policies
```json
{
    "policies": [
        "arn:aws:iam::aws:policy/IAMFullAccess",
        "arn:aws:iam::aws:policy/CloudFormationFullAccess",
        "arn:aws:iam::aws:policy/AmazonS3FullAccess",
        "arn:aws:iam::aws:policy/AmazonDynamoDBFullAccess",
        "arn:aws:iam::aws:policy/AWSLambda_FullAccess",
        "arn:aws:iam::aws:policy/AmazonAPIGatewayAdministrator"
    ]
}
```

### AI/ML Service Policies
```json
{
    "policies": [
        "arn:aws:iam::aws:policy/AmazonTextractFullAccess",
        "arn:aws:iam::aws:policy/AmazonBedrockFullAccess"
    ]
}
```

### Additional Required Policies
```json
{
    "policies": [
        "arn:aws:iam::aws:policy/AWSCloudFormationFullAccess",
        "arn:aws:iam::aws:policy/CloudWatchLogsFullAccess"
    ]
}
```

## Alternative: Custom Policy

If you prefer a more restrictive approach, create a custom policy:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "iam:*",
                "cloudformation:*",
                "s3:*",
                "dynamodb:*",
                "lambda:*",
                "apigateway:*",
                "textract:*",
                "bedrock:*",
                "logs:*",
                "ssm:GetParameter",
                "ssm:PutParameter",
                "ecr:*"
            ],
            "Resource": "*"
        }
    ]
}
```

## Steps for AWS Administrator

1. **Go to AWS Console → IAM → Users**
2. **Find user: `savrai-members`**
3. **Click "Add permissions" → "Attach policies directly"**
4. **Search and attach each policy listed above**
5. **Click "Add permissions"**

## Bedrock Model Access

**Important**: After attaching policies, request Bedrock model access:

1. **Go to AWS Console → Bedrock → Model Access**
2. **Click "Request model access"**
3. **Select: `Claude 3.5 Sonnet`**
4. **Submit request (usually approved instantly)**

## Region Considerations

**Recommended regions for full service availability:**
- `us-east-1` (N. Virginia) - Best Bedrock support
- `us-west-2` (Oregon) - Good alternative

**Current region:** `us-east-2` (Ohio)
- ✅ Lambda, API Gateway, DynamoDB, S3
- ✅ Textract
- ⚠️  Bedrock (check model availability)

## Verification Commands

After permissions are granted, run:

```bash
# Test basic access
aws sts get-caller-identity

# Test IAM permissions
aws iam list-attached-user-policies --user-name savrai-members

# Test Bedrock access (after model approval)
aws bedrock list-foundation-models --region us-east-1
```

## Cost Implications

**Estimated monthly costs with these permissions:**
- Development/Testing: $10-30/month
- Light Production: $30-100/month
- Heavy Usage: $100-500/month

**Main cost drivers:**
- Bedrock API calls (Claude usage)
- Lambda invocations
- API Gateway requests
- DynamoDB read/write units

## Security Best Practices

1. **Use least privilege** - Remove unused policies after deployment
2. **Enable CloudTrail** - Monitor API usage
3. **Set up billing alerts** - Monitor costs
4. **Regular access review** - Audit permissions quarterly

## Troubleshooting

**If deployment still fails after adding permissions:**
1. Wait 5-10 minutes for IAM propagation
2. Try a different region (us-east-1)
3. Check CloudTrail logs for specific permission denials
4. Ensure Bedrock model access is approved