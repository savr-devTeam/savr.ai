import json
import boto3
import os
from datetime import datetime
from decimal import Decimal

# Initialize AWS clients
textract_client = boto3.client('textract')
dynamodb = boto3.resource('dynamodb')
s3_client = boto3.client('s3')

# Environment variables
RECEIPTS_BUCKET = os.environ.get('RECEIPTS_BUCKET')
RECEIPTS_TABLE = os.environ.get('RECEIPTS_TABLE')

# DynamoDB table
receipts_table = dynamodb.Table(RECEIPTS_TABLE)


def lambda_handler(event, context):
    """
    Parse receipt using Amazon Textract
    This is a placeholder implementation - your friend can enhance this
    """
    try:
        # Handle S3 event trigger
        if 'Records' in event:
            # Triggered by S3 upload
            for record in event['Records']:
                bucket = record['s3']['bucket']['name']
                key = record['s3']['object']['key']
                
                # Process the uploaded receipt
                result = process_receipt(bucket, key)
                
                return {
                    'statusCode': 200,
                    'body': json.dumps({
                        'success': True,
                        'message': 'Receipt processed successfully',
                        'result': result
                    }, cls=DecimalEncoder)
                }
        
        # Handle direct API call
        body = json.loads(event.get('body', '{}'))
        s3_key = body.get('s3Key')
        
        if not s3_key:
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 's3Key is required'}, cls=DecimalEncoder)
            }
        
        # Process the receipt
        result = process_receipt(RECEIPTS_BUCKET, s3_key)
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'success': True,
                'message': 'Receipt processed successfully',
                'result': result
            }, cls=DecimalEncoder)
        }
        
    except Exception as e:
        print(f"Error processing receipt: {str(e)}")
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'success': False,
                'error': 'Failed to process receipt',
                'details': str(e)
            }, cls=DecimalEncoder)
        }


def process_receipt(bucket, key):
    """
    Process receipt using Textract and save to DynamoDB
    """
    try:
        # Extract user_id from S3 key (format: receipts/user_id/timestamp-filename)
        path_parts = key.split('/')
        user_id = path_parts[1] if len(path_parts) > 1 else 'anonymous'
        
        # Call Textract to analyze the receipt
        response = textract_client.analyze_expense(
            Document={
                'S3Object': {
                    'Bucket': bucket,
                    'Name': key
                }
            }
        )
        
        # Parse Textract response
        parsed_items = parse_textract_response(response)
        
        # Generate receipt ID (use filename from S3 key which already has timestamp)
        receipt_id = key.split('/')[-1]  # Just use the filename
        
        # Save to DynamoDB
        receipts_table.put_item(
            Item={
                'user_id': user_id,
                'receipt_id': receipt_id,
                'items': parsed_items,
                's3_key': key,
                'processed_at': datetime.now().isoformat(),
                'status': 'processed'
            }
        )
        
        return {
            'receipt_id': receipt_id,
            'items_found': len(parsed_items),
            'items': parsed_items
        }
        
    except Exception as e:
        print(f"Error in process_receipt: {str(e)}")
        # Save error record
        try:
            receipts_table.put_item(
                Item={
                    'user_id': user_id,
                    'receipt_id': f"error-{datetime.now().strftime('%Y%m%d-%H%M%S')}",
                    'items': [],
                    's3_key': key,
                    'processed_at': datetime.now().isoformat(),
                    'status': 'error',
                    'error': str(e)
                }
            )
        except:
            pass
        
        raise e


def parse_textract_response(response):
    """
    Parse Textract AnalyzeExpense response into structured items
    Your friend can enhance this parsing logic
    """
    items = []
    
    try:
        # Extract expense documents
        expense_documents = response.get('ExpenseDocuments', [])
        
        for doc in expense_documents:
            line_items = doc.get('LineItemGroups', [])
            
            for group in line_items:
                for line_item in group.get('LineItems', []):
                    item = {}
                    
                    # Extract line item fields
                    for field in line_item.get('LineItemExpenseFields', []):
                        field_type = field.get('Type', {}).get('Text', '')
                        field_value = field.get('ValueDetection', {}).get('Text', '')
                        
                        if field_type == 'ITEM':
                            item['name'] = field_value
                        elif field_type == 'PRICE':
                            try:
                                # Clean price string and convert to Decimal
                                price_str = field_value.replace('$', '').replace(',', '')
                                item['price'] = Decimal(price_str)
                            except:
                                item['price'] = Decimal('0')
                        elif field_type == 'QUANTITY':
                            try:
                                item['quantity'] = int(field_value)
                            except:
                                item['quantity'] = 1
                    
                    # Only add items with at least a name
                    if item.get('name'):
                        # Set defaults
                        item.setdefault('price', Decimal('0'))
                        item.setdefault('quantity', 1)
                        items.append(item)
        
        # If no line items found, try to extract from summary fields
        if not items:
            for doc in expense_documents:
                summary_fields = doc.get('SummaryFields', [])
                
                # This is a basic fallback - your friend can improve this
                total_amount = Decimal('0')
                vendor_name = 'Unknown Store'
                
                for field in summary_fields:
                    field_type = field.get('Type', {}).get('Text', '')
                    field_value = field.get('ValueDetection', {}).get('Text', '')
                    
                    if field_type == 'TOTAL':
                        try:
                            total_amount = Decimal(field_value.replace('$', '').replace(',', ''))
                        except:
                            pass
                    elif field_type == 'VENDOR_NAME':
                        vendor_name = field_value
                
                # Create a generic item if we found a total
                if total_amount > 0:
                    items.append({
                        'name': f'Purchase from {vendor_name}',
                        'price': total_amount,
                        'quantity': 1
                    })
        
    except Exception as e:
        print(f"Error parsing Textract response: {str(e)}")
        # Return empty list if parsing fails
        items = []
    
    return items


class DecimalEncoder(json.JSONEncoder):
    """Helper to encode Decimal values from DynamoDB"""
    def default(self, obj):
        if isinstance(obj, Decimal):
            return float(obj)
        return super(DecimalEncoder, self).default(obj)