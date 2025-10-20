from aws_cdk import (
    Stack,
    aws_iam as iam,
    Fn,
)
from constructs import Construct


class IamRolesStack(Stack):
    def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # Create Lambda execution role
        self.lambda_execution_role = iam.Role(
            self,
            "LambdaExecutionRole",
            assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
            description="Execution role for Savr.ai Lambda functions",
            managed_policies=[
                # Basic Lambda execution - CloudWatch Logs
                iam.ManagedPolicy.from_aws_managed_policy_name(
                    "service-role/AWSLambdaBasicExecutionRole"
                ),
                # X-Ray tracing
                iam.ManagedPolicy.from_aws_managed_policy_name(
                    "AWSXRayDaemonWriteAccess"
                )
            ],
        )

        # DynamoDB permissions - Scoped to specific tables
        self.lambda_execution_role.add_to_policy(
            iam.PolicyStatement(
                sid="DynamoDBAccess",
                effect=iam.Effect.ALLOW,
                actions=[
                    "dynamodb:GetItem",
                    "dynamodb:PutItem",
                    "dynamodb:UpdateItem",
                    "dynamodb:Query",
                    "dynamodb:BatchGetItem",
                    "dynamodb:BatchWriteItem",
                ],
                resources=[
                    # Specific table ARNs
                    Fn.sub("arn:aws:dynamodb:${AWS::Region}:${AWS::AccountId}:table/MealPlans"),
                    Fn.sub("arn:aws:dynamodb:${AWS::Region}:${AWS::AccountId}:table/UserPreferences"),
                    Fn.sub("arn:aws:dynamodb:${AWS::Region}:${AWS::AccountId}:table/Receipts"),
                    # Allow access to indexes
                    Fn.sub("arn:aws:dynamodb:${AWS::Region}:${AWS::AccountId}:table/MealPlans/index/*"),
                    Fn.sub("arn:aws:dynamodb:${AWS::Region}:${AWS::AccountId}:table/UserPreferences/index/*"),
                    Fn.sub("arn:aws:dynamodb:${AWS::Region}:${AWS::AccountId}:table/Receipts/index/*"),
                ]
            )
        )

        # S3 permissions - Scoped to specific bucket
        self.lambda_execution_role.add_to_policy(
            iam.PolicyStatement(
                sid="S3ReceiptsBucketAccess",
                effect=iam.Effect.ALLOW,
                actions=[
                    "s3:GetObject",
                    "s3:PutObject",
                    "s3:DeleteObject",
                    "s3:GetObjectVersion",
                ],
                resources=[
                    Fn.sub("arn:aws:s3:::savr-receipts-${AWS::AccountId}-${AWS::Region}/*")
                ]
            )
        )

        # S3 bucket listing permission (for presigned URLs)
        self.lambda_execution_role.add_to_policy(
            iam.PolicyStatement(
                sid="S3BucketListAccess",
                effect=iam.Effect.ALLOW,
                actions=[
                    "s3:ListBucket",
                    "s3:GetBucketLocation",
                ],
                resources=[
                    Fn.sub("arn:aws:s3:::savr-receipts-${AWS::AccountId}-${AWS::Region}")
                ]
            )
        )

        # Textract permissions - Scoped to necessary actions only
        self.lambda_execution_role.add_to_policy(
            iam.PolicyStatement(
                sid="TextractAccess",
                effect=iam.Effect.ALLOW,
                actions=[
                    "textract:AnalyzeExpense",
                    "textract:AnalyzeDocument",
                ],
                resources=["*"]  # Textract doesn't support resource-level permissions
            )
        )

        # Bedrock permissions - Scoped to specific models and inference profiles
        self.lambda_execution_role.add_to_policy(
            iam.PolicyStatement(
                sid="BedrockAccess",
                effect=iam.Effect.ALLOW,
                actions=[
                    "bedrock:InvokeModel",
                    "bedrock:InvokeModelWithResponseStream",
                ],
                resources=[
                    # Claude inference profiles (cross-region, need both us-east-1 and us-east-2)
                    "arn:aws:bedrock:us-east-1:422228628828:inference-profile/us.anthropic.claude-sonnet-4-5-20250929-v1:0",
                    "arn:aws:bedrock:us-east-2:422228628828:inference-profile/us.anthropic.claude-sonnet-4-5-20250929-v1:0",
                    # Foundation models
                    Fn.sub("arn:aws:bedrock:*::foundation-model/anthropic.claude-*"),
                ]
            )
        )
        
        # AWS Marketplace permissions for Bedrock model access
        self.lambda_execution_role.add_to_policy(
            iam.PolicyStatement(
                sid="BedrockMarketplaceAccess",
                effect=iam.Effect.ALLOW,
                actions=[
                    "aws-marketplace:ViewSubscriptions",
                    "aws-marketplace:Subscribe",
                ],
                resources=["*"]
            )
        )

        # CloudWatch Logs - Enhanced permissions for custom log groups
        self.lambda_execution_role.add_to_policy(
            iam.PolicyStatement(
                sid="CloudWatchLogsAccess",
                effect=iam.Effect.ALLOW,
                actions=[
                    "logs:CreateLogGroup",
                    "logs:CreateLogStream",
                    "logs:PutLogEvents",
                ],
                resources=[
                    Fn.sub("arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/lambda/savr-*:*")
                ]
            )
        )

        # X-Ray permissions - Already covered by managed policy above
        # But adding explicit permissions for clarity
        self.lambda_execution_role.add_to_policy(
            iam.PolicyStatement(
                sid="XRayAccess",
                effect=iam.Effect.ALLOW,
                actions=[
                    "xray:PutTraceSegments",
                    "xray:PutTelemetryRecords",
                ],
                resources=["*"]  # X-Ray doesn't support resource-level permissions
            )
        )