from aws_cdk import (
    Stack,
    aws_lambda as _lambda,
    aws_iam as iam,
    Duration,
)
from constructs import Construct
import os


class LambdaStack(Stack):
    def __init__(
        self, 
        scope: Construct, 
        construct_id: str, 
        meal_plans_table,
        user_preferences_table,
        receipts_table,
        receipts_bucket,
        iam_role=None, 
        **kwargs
    ) -> None:
        super().__init__(scope, construct_id, **kwargs)


        # Auth functions
        self.auth_login_function = _lambda.Function(
            self,
            "AuthLoginFunction",
            runtime=_lambda.Runtime.PYTHON_3_9,
            handler="handler.lambda_handler",
            code=_lambda.Code.from_asset("../backend/lambdas/auth_login"),
            timeout=Duration.seconds(10),
            memory_size=128,
            role=iam_role,
            environment={
                "COGNITO_DOMAIN": "https://us-east-1lwfygbjd9.auth.us-east-1.amazoncognito.com",
                "COGNITO_CLIENT_ID": "68r61tb357f3dgk0lpsors0bsk",
                "REDIRECT_URI": "https://savr-ai-one.vercel.app/auth/callback",
            },
        )

        self.auth_callback_function = _lambda.Function(
            self,
            "AuthCallbackFunction",
            runtime=_lambda.Runtime.PYTHON_3_9,
            handler="handler.lambda_handler",
            code=_lambda.Code.from_asset("../backend/lambdas/auth_callback"),
            timeout=Duration.seconds(10),
            memory_size=128,
            role=iam_role,
            environment={
                "COGNITO_DOMAIN": "https://us-east-1lwfygbjd9.auth.us-east-1.amazoncognito.com",
                "COGNITO_CLIENT_ID": "68r61tb357f3dgk0lpsors0bsk",
                "COGNITO_CLIENT_SECRET": os.environ.get("COGNITO_CLIENT_SECRET", "your_client_secret_here"),
                "REDIRECT_URI": "https://savr-ai-one.vercel.app/auth/callback",
            },
        )

        self.api_upload_function = _lambda.Function(
            self,
            "ApiUploadFunction",
            runtime=_lambda.Runtime.PYTHON_3_9,
            handler="handler.lambda_handler",
            code=_lambda.Code.from_asset("../backend/lambdas/api_upload"),
            timeout=Duration.seconds(30),
            memory_size=256,
            role=iam_role,
            environment={
                "RECEIPTS_BUCKET": receipts_bucket.bucket_name,
            },
        )
        # allow presign target bucket writes
        receipts_bucket.grant_write(self.api_upload_function)


        # Create Lambda functions for each handler
        self.generate_plan_function = _lambda.Function(
            self,
            "GeneratePlanFunction",
            runtime=_lambda.Runtime.PYTHON_3_9,
            handler="handler.lambda_handler",
            code=_lambda.Code.from_asset("../backend/lambdas/generate_plan"),
            timeout=Duration.seconds(60),
            memory_size=512,
            role=iam_role,
            environment={
                "MEAL_PLANS_TABLE": meal_plans_table.table_name,
                "USER_PREFERENCES_TABLE": user_preferences_table.table_name,
                "RECEIPTS_TABLE": receipts_table.table_name,
                "PEXELS_API_KEY": os.environ.get("PEXELS_API_KEY", ""),
            },
        )
        # DDB access
        meal_plans_table.grant_read_write_data(self.generate_plan_function)
        user_preferences_table.grant_read_data(self.generate_plan_function)
        receipts_table.grant_read_data(self.generate_plan_function)
        # Bedrock invoke permissions (Claude 3.5 Sonnet only - no Titan needed)
        self.generate_plan_function.add_to_role_policy(
            iam.PolicyStatement(
                actions=["bedrock:InvokeModel"],
                resources=[
                    "arn:aws:bedrock:*::foundation-model/anthropic.claude-*",
                    "arn:aws:bedrock:*:*:inference-profile/*"
                ],
            )
        )


        self.get_meal_plan_function = _lambda.Function(
            self,
            "GetMealPlanFunction",
            runtime=_lambda.Runtime.PYTHON_3_9,
            handler="handler.lambda_handler",
            code=_lambda.Code.from_asset("../backend/lambdas/get_meal_plan"),
            timeout=Duration.seconds(30),
            memory_size=256,
            role=iam_role,
            environment={
                "MEAL_PLANS_TABLE": meal_plans_table.table_name,
            },
        )
        meal_plans_table.grant_read_data(self.get_meal_plan_function)


        self.parse_receipt_function = _lambda.Function(
            self,
            "ParseReceiptFunction",
            runtime=_lambda.Runtime.PYTHON_3_9,
            handler="handler.lambda_handler",
            code=_lambda.Code.from_asset("../backend/lambdas/parse_receipt"),
            timeout=Duration.seconds(60),
            memory_size=512,
            role=iam_role,
            environment={
                "RECEIPTS_BUCKET": receipts_bucket.bucket_name,
                "RECEIPTS_TABLE": receipts_table.table_name,
            },
        )
        # S3 read (for head/get object during OCR) + DDB write
        receipts_bucket.grant_read(self.parse_receipt_function)
        receipts_table.grant_read_write_data(self.parse_receipt_function)
        # Textract permission for AnalyzeExpense
        self.parse_receipt_function.add_to_role_policy(
            iam.PolicyStatement(
                actions=["textract:AnalyzeExpense"],
                resources=["*"],
            )
        )


        # AI Receipt Analysis Function (NEW)
        self.analyze_receipt_ai_function = _lambda.Function(
            self,
            "AnalyzeReceiptAIFunction",
            runtime=_lambda.Runtime.PYTHON_3_11,
            handler="handler.lambda_handler",
            code=_lambda.Code.from_asset("../backend/lambdas/analyze_receipt_ai"),
            timeout=Duration.seconds(60),
            memory_size=512,
            role=iam_role,
            environment={
                "RECEIPTS_TABLE": receipts_table.table_name,
                "USER_PREFERENCES_TABLE": user_preferences_table.table_name,
            },
        )
        # DDB access
        receipts_table.grant_read_write_data(self.analyze_receipt_ai_function)
        user_preferences_table.grant_read_write_data(self.analyze_receipt_ai_function)  # Write access for budget tracking
        # Bedrock invoke permissions for AI analysis (Claude 4.5 Sonnet)
        self.analyze_receipt_ai_function.add_to_role_policy(
            iam.PolicyStatement(
                actions=["bedrock:InvokeModel", "bedrock:InvokeModelWithResponseStream"],
                resources=[
                    "arn:aws:bedrock:*::foundation-model/us.anthropic.claude-sonnet-4-5*",
                    "arn:aws:bedrock:*::foundation-model/anthropic.claude-*"
                ],
            )
        )


        # User Preferences Function (Budget tracking)
        self.preferences_function = _lambda.Function(
            self,
            "PreferencesFunction",
            runtime=_lambda.Runtime.PYTHON_3_11,
            handler="handler.lambda_handler",
            code=_lambda.Code.from_asset("../backend/lambdas/preferences"),
            timeout=Duration.seconds(10),
            memory_size=256,
            role=iam_role,
            environment={
                "USER_PREFERENCES_TABLE": user_preferences_table.table_name,
            },
        )
        # DDB access
        user_preferences_table.grant_read_write_data(self.preferences_function)