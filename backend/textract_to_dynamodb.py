import boto3
import json

# Initialize AWS clients
textract = boto3.client('textract', region_name='us-east-1')
dynamodb = boto3.resource('dynamodb', region_name='us-east-1')

# Replace with your table name
table = dynamodb.Table('Users')

# S3 file to process
bucket = 'textract-documents-savrai'
document = 'grocery-receipts-rolled-up-together-D66517.jpg'

print(f"🧠 Extracting text from s3://{bucket}/{document}")

response = textract.detect_document_text(
    Document={'S3Object': {'Bucket': bucket, 'Name': document}}
)

# Combine all LINE blocks into one string
extracted_text = "\n".join(
    [block['Text'] for block in response['Blocks'] if block['BlockType'] == 'LINE']
)

# Write to DynamoDB
item = {
    'user_id': 'user123',          # you can make this dynamic later
    'document_id': document,
    's3_url': f's3://{bucket}/{document}',
    'content': extracted_text
}

table.put_item(Item=item)

print("SUCCESSFULLY: Stored extracted text in DynamoDB")
