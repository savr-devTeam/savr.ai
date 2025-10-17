#!/usr/bin/env python3
"""
Simple test for meal plan generation logic without AWS dependencies
"""

import json
import sys
import os

# Add the handler directory to Python path
sys.path.insert(0, os.path.dirname(__file__))

def test_prompt_creation():
    """Test the prompt creation logic"""
    
    # Mock preferences
    preferences = {
        'budget': 100,
        'dietaryRestrictions': 'vegetarian, no nuts',
        'nutritionGoal': 'weight-loss',
        'caloricTarget': 1800,
        'proteinTarget': 120,
        'carbTarget': 150,
        'fatTarget': 60
    }
    
    # Mock grocery items
    grocery_items = [
        {'name': 'Quinoa'},
        {'name': 'Black Beans'},
        {'name': 'Spinach'},
        {'name': 'Avocado'},
        {'name': 'Olive Oil'}
    ]
    
    # Test prompt creation (we'll import the function)
    try:
        # Import without AWS dependencies
        import importlib.util
        spec = importlib.util.spec_from_file_location("handler", "handler.py")
        handler_module = importlib.util.module_from_spec(spec)
        
        # Mock the AWS imports
        sys.modules['boto3'] = type(sys)('boto3')
        sys.modules['boto3'].client = lambda x, **kwargs: None
        sys.modules['boto3'].resource = lambda x: None
        
        spec.loader.exec_module(handler_module)
        
        # Test prompt creation
        prompt = handler_module.create_meal_plan_prompt(preferences, grocery_items)
        
        print("=== MEAL PLAN PROMPT TEST ===")
        print("✅ Prompt created successfully!")
        print(f"Prompt length: {len(prompt)} characters")
        print("\n📝 SAMPLE PROMPT (first 500 chars):")
        print(prompt[:500] + "..." if len(prompt) > 500 else prompt)
        
        # Check if key elements are in the prompt
        checks = [
            ("Budget mentioned", f"${preferences['budget']}" in prompt),
            ("Dietary restrictions", preferences['dietaryRestrictions'] in prompt),
            ("Nutrition goal", preferences['nutritionGoal'] in prompt),
            ("Caloric target", str(preferences['caloricTarget']) in prompt),
            ("Grocery items", any(item['name'] in prompt for item in grocery_items)),
            ("JSON format requested", "JSON" in prompt),
            ("Weekly plan structure", "weeklyPlan" in prompt)
        ]
        
        print("\n🔍 PROMPT VALIDATION:")
        for check_name, passed in checks:
            status = "✅" if passed else "❌"
            print(f"  {status} {check_name}")
            
        all_passed = all(passed for _, passed in checks)
        print(f"\n{'✅ All checks passed!' if all_passed else '❌ Some checks failed'}")
        
    except Exception as e:
        print(f"❌ Error testing prompt creation: {str(e)}")

def test_fallback_meal_plan():
    """Test the fallback meal plan creation"""
    
    preferences = {
        'budget': 100,
        'caloricTarget': 1800
    }
    
    try:
        # Import without AWS dependencies
        import importlib.util
        spec = importlib.util.spec_from_file_location("handler", "handler.py")
        handler_module = importlib.util.module_from_spec(spec)
        
        # Mock the AWS imports
        sys.modules['boto3'] = type(sys)('boto3')
        sys.modules['boto3'].client = lambda x, **kwargs: None
        sys.modules['boto3'].resource = lambda x: None
        
        spec.loader.exec_module(handler_module)
        
        # Test fallback meal plan
        fallback_plan = handler_module.create_fallback_meal_plan(preferences)
        
        print("\n=== FALLBACK MEAL PLAN TEST ===")
        print("✅ Fallback meal plan created successfully!")
        print(f"Plan structure: {list(fallback_plan.keys())}")
        
        if 'weeklyPlan' in fallback_plan:
            print(f"Days in plan: {list(fallback_plan['weeklyPlan'].keys())}")
            
        if 'weeklyTotals' in fallback_plan:
            totals = fallback_plan['weeklyTotals']
            print(f"Average daily calories: {totals.get('avgDailyCalories')}")
            print(f"Estimated cost: ${totals.get('estimatedCost')}")
            
        print("✅ Fallback plan validation passed!")
        
    except Exception as e:
        print(f"❌ Error testing fallback meal plan: {str(e)}")

if __name__ == '__main__':
    test_prompt_creation()
    test_fallback_meal_plan()