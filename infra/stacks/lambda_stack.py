from aws_cdk import (
    Stack,
    aws_lambda as _lambda,
    aws_iam as iam,
    Duration,
)
from constructs import Construct
import os


class LambdaStack(Stack):
    def __init__(self, scope: Construct, construct_id: str, iam_role=None, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # Create Lambda functions for each handler
        self.generate_plan_function = _lambda.Function(
            self,
            "GeneratePlanFunction",
            runtime=_lambda.Runtime.PYTHON_3_9,
            handler="handler.lambda_handler",
            code=_lambda.Code.from_asset("../backend/lambdas/generate_plan"),
            timeout=Duration.seconds(30),
            role=iam_role,
            environment={
                "MEAL_PLANS_TABLE": "MealPlans",
                "USER_PREFERENCES_TABLE": "UserPreferences"
            }
        )

        self.get_meal_plan_function = _lambda.Function(
            self,
            "GetMealPlanFunction", 
            runtime=_lambda.Runtime.PYTHON_3_9,
            handler="handler.lambda_handler",
            code=_lambda.Code.from_asset("../backend/lambdas/get_meal_plan"),
            timeout=Duration.seconds(30),
            role=iam_role,
            environment={
                "MEAL_PLANS_TABLE": "MealPlans"
            }
        )

        self.parse_receipt_function = _lambda.Function(
            self,
            "ParseReceiptFunction",
            runtime=_lambda.Runtime.PYTHON_3_9,
            handler="handler.lambda_handler", 
            code=_lambda.Code.from_asset("../backend/lambdas/parse_receipt"),
            timeout=Duration.seconds(30),
            role=iam_role,
            environment={
                "RECEIPTS_BUCKET": f"savr-receipts-{self.account}-{self.region}"
            }
        )
