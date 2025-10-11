#!/usr/bin/env python3
import aws_cdk as cdk
from stacks.s3_stack import S3Stack
from stacks.dynamodb_stack import DynamoDBStack
from stacks.lambda_stack import LambdaStack
from stacks.api_gateway_stack import ApiGatewayStack
from stacks.iam_roles_stack import IamRolesStack

app = cdk.App()

# Define environment (use dummy values for now)
env = cdk.Environment(
    account="123456789012",  # Replace with your AWS account ID when you have access
    region="us-east-1"       # Replace with your preferred region
)

# Create stacks with proper dependencies
iam_stack = IamRolesStack(app, "IamRolesStack", env=env)
s3_stack = S3Stack(app, "S3Stack", env=env)
dynamodb_stack = DynamoDBStack(app, "DynamoDBStack", env=env)
lambda_stack = LambdaStack(app, "LambdaStack", iam_role=iam_stack.lambda_execution_role, env=env)

# Pass lambda functions to API Gateway
lambda_functions = {
    "generate_plan": lambda_stack.generate_plan_function,
    "get_meal_plan": lambda_stack.get_meal_plan_function,
    "parse_receipt": lambda_stack.parse_receipt_function
}
api_stack = ApiGatewayStack(app, "ApiGatewayStack", lambda_functions=lambda_functions, env=env)

app.synth()
