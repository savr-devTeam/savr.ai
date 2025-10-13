import json
import boto3
import os
from datetime import datetime

s3_client = boto3.client('s3')
RECEIPTS_BUCKET = os.environ.get('RECEIPTS_BUCKET')


def lambda_handler(event, context):
    """
    Lambda function to generate presigned upload URLs for S3
    Allows frontend to upload receipt images directly to S3
    """
    try:
        # Parse request body
        body = json.loads(event.get('body', '{}'))
        file_name = body.get('fileName')
        content_type = body.get('contentType', 'image/jpeg')
        
        if not file_name:
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'fileName is required'})
            }
        
        # Generate unique key for S3 object
        timestamp = datetime.now().strftime('%Y%m%d-%H%M%S')
        user_id = event.get('requestContext', {}).get('authorizer', {}).get('claims', {}).get('sub', 'anonymous')
        s3_key = f"receipts/{user_id}/{timestamp}-{file_name}"
        
        # Generate presigned URL for upload
        presigned_url = s3_client.generate_presigned_url(
            'put_object',
            Params={
                'Bucket': RECEIPTS_BUCKET,
                'Key': s3_key,
                'ContentType': content_type
            },
            ExpiresIn=300  # URL expires in 5 minutes
        )
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'uploadUrl': presigned_url,
                's3Key': s3_key,
                'expiresIn': 300
            })
        }
        
    except Exception as e:
        print(f"Error generating presigned URL: {str(e)}")
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Failed to generate upload URL'})
        }
