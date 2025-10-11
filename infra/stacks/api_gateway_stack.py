from aws_cdk import (
    Stack,
    aws_apigateway as apigateway,
    aws_lambda as _lambda,
)
from constructs import Construct


class ApiGatewayStack(Stack):
    def __init__(self, scope: Construct, construct_id: str, lambda_functions=None, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # Create API Gateway
        self.api = apigateway.RestApi(
            self,
            "SavrApi",
            rest_api_name="Savr API",
            description="API for Savr meal planning application",
        )

        if lambda_functions:
            # Create API resources and methods
            # /generate-plan endpoint
            generate_plan_resource = self.api.root.add_resource("generate-plan")
            generate_plan_integration = apigateway.LambdaIntegration(
                lambda_functions.get("generate_plan")
            )
            generate_plan_resource.add_method("POST", generate_plan_integration)

            # /meal-plan endpoint  
            meal_plan_resource = self.api.root.add_resource("meal-plan")
            get_meal_plan_integration = apigateway.LambdaIntegration(
                lambda_functions.get("get_meal_plan")
            )
            meal_plan_resource.add_method("GET", get_meal_plan_integration)

            # /parse-receipt endpoint
            parse_receipt_resource = self.api.root.add_resource("parse-receipt")
            parse_receipt_integration = apigateway.LambdaIntegration(
                lambda_functions.get("parse_receipt")
            )
            parse_receipt_resource.add_method("POST", parse_receipt_integration)
