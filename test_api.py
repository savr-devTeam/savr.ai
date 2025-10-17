#!/usr/bin/env python3
"""
Test script for Savr.ai Lambda functions via API Gateway
"""

import requests
import json

# API Endpoint
API_BASE_URL = "https://2bficji0m1.execute-api.us-east-2.amazonaws.com/prod/"

def test_api_health():
    """Test if API Gateway is responding"""
    print("\n🔍 Testing API Gateway Health...")
    try:
        response = requests.get(API_BASE_URL, timeout=5)
        print(f"✅ API Gateway is responding (Status: {response.status_code})")
        return True
    except Exception as e:
        print(f"❌ API Gateway error: {e}")
        return False

def test_generate_plan():
    """Test Generate Meal Plan Lambda"""
    print("\n🔍 Testing Generate Plan Lambda...")
    endpoint = f"{API_BASE_URL}generate-plan"
    
    payload = {
        "ingredients": ["chicken", "rice", "broccoli"],
        "dietary_restrictions": ["vegetarian"],
        "servings": 4
    }
    
    try:
        response = requests.post(endpoint, json=payload, timeout=30)
        print(f"Status: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        if response.status_code == 200:
            print("✅ Generate Plan Lambda working!")
        else:
            print(f"⚠️  Unexpected status code: {response.status_code}")
    except Exception as e:
        print(f"❌ Error: {e}")

def test_get_meal_plan():
    """Test Get Meal Plan Lambda"""
    print("\n🔍 Testing Get Meal Plan Lambda...")
    endpoint = f"{API_BASE_URL}meal-plan"
    
    payload = {
        "user_id": "test-user-123"
    }
    
    try:
        response = requests.get(endpoint, params=payload, timeout=10)
        print(f"Status: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        if response.status_code == 200:
            print("✅ Get Meal Plan Lambda working!")
        else:
            print(f"⚠️  Status code: {response.status_code}")
    except Exception as e:
        print(f"❌ Error: {e}")

def test_api_upload():
    """Test API Upload (Presigned URL) Lambda"""
    print("\n🔍 Testing API Upload Lambda...")
    endpoint = f"{API_BASE_URL}upload"
    
    payload = {
        "fileName": "receipt.jpg",
        "fileType": "image/jpeg"
    }
    
    try:
        response = requests.post(endpoint, json=payload, timeout=10)
        print(f"Status: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        if response.status_code == 200:
            print("✅ API Upload Lambda working!")
        else:
            print(f"⚠️  Status code: {response.status_code}")
    except Exception as e:
        print(f"❌ Error: {e}")

def test_parse_receipt():
    """Test Parse Receipt Lambda"""
    print("\n🔍 Testing Parse Receipt Lambda...")
    endpoint = f"{API_BASE_URL}parse-receipt"
    
    # Using s3Key format instead of receipt_url
    payload = {
        "s3Key": "receipts/test-receipt.jpg"
    }
    
    try:
        response = requests.post(endpoint, json=payload, timeout=30)
        print(f"Status: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        if response.status_code == 200:
            print("✅ Parse Receipt Lambda working!")
        else:
            print(f"⚠️  Status code: {response.status_code}")
    except Exception as e:
        print(f"❌ Error: {e}")

def main():
    """Run all tests"""
    print("=" * 60)
    print("🚀 Savr.ai Backend Lambda Tests")
    print("=" * 60)
    
    # Check API health first
    if not test_api_health():
        print("\n❌ API Gateway is not responding. Cannot proceed with tests.")
        return
    
    # Run Lambda tests
    test_generate_plan()
    test_get_meal_plan()
    test_api_upload()
    test_parse_receipt()
    
    print("\n" + "=" * 60)
    print("✅ Test Suite Complete!")
    print("=" * 60)

if __name__ == "__main__":
    main()
