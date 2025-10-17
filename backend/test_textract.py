import boto3

# Initialize Textract client (make sure region matches your S3 bucket region)
textract = boto3.client('textract', region_name='us-east-1')

# S3 bucket and document name
bucket = 'textract-documents-savrai'
document = 'grocery-receipts-rolled-up-together-D66517.jpg'

print(f"🔍 Running Textract on s3://{bucket}/{document}")

try:
    response = textract.detect_document_text(
        Document={
            'S3Object': {
                'Bucket': bucket,
                'Name': document
            }
        }
    )

    print("\n✅ Detected text:\n")
    for block in response['Blocks']:
        if block['BlockType'] == 'LINE':
            print(block['Text'])

except Exception as e:
    print("\n❌ Error running Textract:\n")
    print(e)
