from aws_cdk import (
    Stack,
    aws_s3 as s3,
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
        )
