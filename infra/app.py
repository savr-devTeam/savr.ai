#!/usr/bin/env python3
import aws_cdk as cdk
from stacks.s3_stack import S3Stack
from stacks.dynamodb_stack import DynamoDBStack
from stacks.lambda_stack import LambdaStack
from stacks.api_gateway_stack import ApiGatewayStack
from stacks.iam_roles_stack import IamRolesStack

app = cdk.App()

# Create each stack (you can pass dependencies later)
iam_stack = IamRolesStack(app, "IamRolesStack")
s3_stack = S3Stack(app, "S3Stack")
dynamodb_stack = DynamoDBStack(app, "DynamoDBStack")
lambda_stack = LambdaStack(app, "LambdaStack")
api_stack = ApiGatewayStack(app, "ApiGatewayStack")

app.synth()
