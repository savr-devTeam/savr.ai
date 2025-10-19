import json
import os
import boto3
import base64
import hashlib
from urllib.parse import urlencode
import urllib.request
import urllib.error

# Initialize Cognito client
cognito_client = boto3.client('cognito-idp', region_name='us-east-1')

def lambda_handler(event, context):
    """
    Handle Cognito OAuth callback and exchange code for tokens
    """
    try:
        # Get parameters - they could be in query string OR request body
        query_params = event.get('queryStringParameters', {}) or {}
        body_params = json.loads(event.get('body', '{}')) if event.get('body') else {}
        
        # Try to get from query params first (for GET requests), then body (for POST requests)
        code = query_params.get('code') or body_params.get('code')
        state = query_params.get('state') or body_params.get('state')
        code_verifier = body_params.get('codeVerifier')
        
        error = query_params.get('error')
        error_description = query_params.get('error_description')
        
        # Handle errors from Cognito
        if error:
            return error_response(400, error_description or error)
        
        if not code or not state:
            return error_response(400, 'Missing code or state parameter')
        
        if not code_verifier:
            return error_response(400, 'Missing code verifier')
        
        # Get environment variables
        cognito_domain = os.environ.get('COGNITO_DOMAIN')
        client_id = os.environ.get('COGNITO_CLIENT_ID')
        client_secret = os.environ.get('COGNITO_CLIENT_SECRET')
        redirect_uri = os.environ.get('REDIRECT_URI')
        
        if not all([cognito_domain, client_id, client_secret, redirect_uri]):
            return error_response(500, 'Missing Cognito configuration')
        
        # Exchange code for tokens
        token_endpoint = f"{cognito_domain}/oauth2/token"
        
        token_params = {
            'grant_type': 'authorization_code',
            'client_id': client_id,
            'client_secret': client_secret,
            'code': code,
            'redirect_uri': redirect_uri,
            'code_verifier': code_verifier,
        }
        
        try:
            # Make request to token endpoint
            data = urlencode(token_params).encode('utf-8')
            req = urllib.request.Request(
                token_endpoint,
                data=data,
                headers={'Content-Type': 'application/x-www-form-urlencoded'}
            )
            
            with urllib.request.urlopen(req) as response:
                tokens = json.loads(response.read().decode('utf-8'))
            
            # Decode ID token to get user info
            id_token = tokens.get('id_token', '')
            user_info = decode_token(id_token)
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'POST, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type'
                },
                'body': json.dumps({
                    'success': True,
                    'tokens': {
                        'idToken': tokens.get('id_token'),
                        'accessToken': tokens.get('access_token'),
                        'refreshToken': tokens.get('refresh_token')
                    },
                    'user': user_info
                })
            }
        
        except urllib.error.HTTPError as e:
            error_body = e.read().decode('utf-8')
            print(f"Token exchange failed: {error_body}")
            return error_response(400, f'Failed to exchange authorization code for tokens: {error_body}')
    
    except Exception as e:
        print(f"Error in auth callback: {str(e)}")
        import traceback
        traceback.print_exc()
        return error_response(500, str(e))


def decode_token(token):
    """
    Decode JWT token (without verification - done by API Gateway)
    """
    try:
        # Split token into parts
        parts = token.split('.')
        if len(parts) != 3:
            return {}
        
        # Add padding if needed
        payload = parts[1]
        padding = 4 - len(payload) % 4
        if padding != 4:
            payload += '=' * padding
        
        # Decode payload
        decoded = base64.urlsafe_b64decode(payload)
        return json.loads(decoded)
    except Exception as e:
        print(f"Error decoding token: {str(e)}")
        return {}


def error_response(status_code, message):
    """Helper to return error responses"""
    return {
        'statusCode': status_code,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps({'error': message})
    }
