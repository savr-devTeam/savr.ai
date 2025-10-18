#!/usr/bin/env python3
import aws_cdk as cdk
from stacks.s3_stack import S3Stack
from stacks.dynamodb_stack import DynamoDBStack
from stacks.lambda_stack import LambdaStack
from stacks.api_gateway_stack import ApiGatewayStack
from stacks.iam_roles_stack import IamRolesStack
from stacks.ec2_backend_stack import EC2BackendStack

app = cdk.App()

# Environment configuration
env = cdk.Environment(
    account="422228628828",
    region="us-east-2"
)

# Create stacks with proper dependencies
iam_stack = IamRolesStack(app, "IamRolesStack", env=env)
dynamodb_stack = DynamoDBStack(app, "DynamoDBStack", env=env)
s3_stack = S3Stack(app, "S3Stack", env=env)

lambda_stack = LambdaStack(
    app, 
    "LambdaStack",
    env=env,
    meal_plans_table=dynamodb_stack.meal_plans_table,
    user_preferences_table=dynamodb_stack.user_preferences_table,
    receipts_table=dynamodb_stack.receipts_table,
    receipts_bucket=s3_stack.receipts_bucket,
    iam_role=iam_stack.lambda_execution_role
)
# Pass lambda functions to API Gateway
lambda_functions = {
    "generate_plan": lambda_stack.generate_plan_function,
    "get_meal_plan": lambda_stack.get_meal_plan_function,
    "parse_receipt": lambda_stack.parse_receipt_function,
    "api_upload": lambda_stack.api_upload_function
}
api_stack = ApiGatewayStack(app, "ApiGatewayStack", env=env, lambda_functions=lambda_functions)

# Deploy EC2 backend
ec2_stack = EC2BackendStack(app, "EC2BackendStack", env=env)

app.synth()
