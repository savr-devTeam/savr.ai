import json
import os
import secrets
import base64
import hashlib
from urllib.parse import urlencode

def lambda_handler(event, context):
    """
    Initiate Cognito OAuth login flow with PKCE
    """
    try:
        # Get environment variables
        cognito_domain = os.environ.get('COGNITO_DOMAIN')
        client_id = os.environ.get('COGNITO_CLIENT_ID')
        redirect_uri = os.environ.get('REDIRECT_URI')
        
        if not all([cognito_domain, client_id, redirect_uri]):
            return error_response(500, 'Missing Cognito configuration')
        
        # Generate PKCE parameters
        code_verifier = base64.urlsafe_b64encode(secrets.token_bytes(32)).decode('utf-8').rstrip('=')
        code_challenge = base64.urlsafe_b64encode(
            hashlib.sha256(code_verifier.encode()).digest()
        ).decode('utf-8').rstrip('=')
        state = secrets.token_urlsafe(32)
        
        # Build authorization URL
        auth_params = {
            'client_id': client_id,
            'response_type': 'code',
            'scope': 'openid email phone profile',
            'redirect_uri': redirect_uri,
            'code_challenge': code_challenge,
            'code_challenge_method': 'S256',
            'state': state,
        }
        
        auth_url = f"{cognito_domain}/oauth2/authorize?{urlencode(auth_params)}"
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
            },
            'body': json.dumps({
                'authUrl': auth_url,
                'codeVerifier': code_verifier,
                'state': state
            })
        }
    
    except Exception as e:
        print(f"Error in auth login: {str(e)}")
        return error_response(500, str(e))


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
