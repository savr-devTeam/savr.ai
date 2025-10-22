from aws_cdk import (
    Stack,
    aws_s3 as s3,
    aws_s3_notifications as s3n,
    RemovalPolicy,
)
from constructs import Construct


class S3Stack(Stack):
    def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # Create S3 bucket for storing receipts and other files
        self.receipts_bucket = s3.Bucket(
            self,
            "ReceiptsBucket",
            bucket_name=f"savr-receipts-{self.account}-{self.region}",
            versioned=True,
            encryption=s3.BucketEncryption.S3_MANAGED,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            removal_policy=RemovalPolicy.DESTROY,       # safe cleanup for dev/demo
            auto_delete_objects=True,                   # delete all objects when stack is destroyed
            cors=[
                s3.CorsRule(
                    allowed_methods=[s3.HttpMethods.GET, s3.HttpMethods.PUT, s3.HttpMethods.POST],
                    allowed_origins=["*"],  # Allow all origins for development
                    allowed_headers=["*"],
                    exposed_headers=["ETag"],
                    max_age=3000
                )
            ]
        )

    def add_parse_trigger(self, parse_receipt_fn):
        """
        Add S3 event notification to trigger parse_receipt Lambda on upload
        This is called after the Lambda function is created
        """
        self.receipts_bucket.add_event_notification(
            s3.EventType.OBJECT_CREATED,
            s3n.LambdaDestination(parse_receipt_fn),
            s3.NotificationKeyFilter(prefix="receipts/")  # Only trigger for receipts folder
        )
