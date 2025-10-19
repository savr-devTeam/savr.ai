from aws_cdk import (
    Stack,
    aws_apigateway as apigateway,
    aws_lambda as _lambda,
)
from constructs import Construct


class ApiGatewayStack(Stack):
    def __init__(self, scope: Construct, construct_id: str, lambda_functions=None, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # Create API Gateway with CORS
        self.api = apigateway.RestApi(
            self,
            "SavrApi",
            rest_api_name="Savr API",
            description="API for Savr meal planning application",
            default_cors_preflight_options=apigateway.CorsOptions(
                allow_origins=apigateway.Cors.ALL_ORIGINS,
                allow_methods=apigateway.Cors.ALL_METHODS,
                allow_headers=["Content-Type", "X-Amz-Date", "Authorization", "X-Api-Key"]
            )
        )

        if lambda_functions:
            # Create API resources and methods
            
            # /auth/login endpoint
            auth_resource = self.api.root.add_resource("auth")
            login_resource = auth_resource.add_resource("login")
            login_integration = apigateway.LambdaIntegration(
                lambda_functions.get("auth_login")
            )
            login_resource.add_method("GET", login_integration)
            
            # /auth/callback endpoint
            callback_resource = auth_resource.add_resource("callback")
            callback_integration = apigateway.LambdaIntegration(
                lambda_functions.get("auth_callback")
            )
            callback_resource.add_method("POST", callback_integration)
            callback_resource.add_method("GET", callback_integration)
            
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

            # /upload endpoint for receipt uploads
            upload_resource = self.api.root.add_resource("upload")
            upload_integration = apigateway.LambdaIntegration(
                lambda_functions.get("api_upload")
            )
            upload_resource.add_method("POST", upload_integration)

        # Output the API Gateway URL
        from aws_cdk import CfnOutput
        CfnOutput(
            self,
            "SavrApiEndpoint",
            value=self.api.url,
            description="Savr API Gateway endpoint URL"
        )
