import express from 'express';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * Protected endpoint: Generate meal plan
 * POST /api/generate-plan
 * 
 * Request body:
 * {
 *   userId: string,
 *   preferences: {
 *     budget: number,
 *     dietaryRestrictions: string,
 *     nutritionGoal: string,
 *     caloricTarget: number,
 *     proteinTarget: number,
 *     carbTarget: number,
 *     fatTarget: number
 *   }
 * }
 */
router.post('/generate-plan', verifyToken, async (req, res) => {
  try {
    const { userId, preferences } = req.body;

    // Validate request
    if (!userId || !preferences) {
      return res.status(400).json({
        error: 'Bad request',
        message: 'userId and preferences are required'
      });
    }

    // Verify the token's user ID matches the request
    if (req.user.sub !== userId) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You can only generate meal plans for your own account'
      });
    }

    console.log(`🍽️ Generating meal plan for user ${userId}:`, preferences);

    // TODO: Call Lambda function or external service to generate meal plan
    // For now, return a mock response
    const mealPlan = {
      userId,
      generatedAt: new Date().toISOString(),
      preferences,
      meals: [
        {
          day: 'Monday',
          breakfast: 'Oatmeal with berries',
          lunch: 'Grilled chicken salad',
          dinner: 'Baked salmon with vegetables'
        }
      ],
      totalCost: preferences.budget || 0,
      nutritionSummary: {
        calories: preferences.caloricTarget || 2000,
        protein: preferences.proteinTarget || 150,
        carbs: preferences.carbTarget || 200,
        fat: preferences.fatTarget || 65
      }
    };

    res.json(mealPlan);
  } catch (error) {
    console.error('Error generating meal plan:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * Protected endpoint: Get presigned S3 upload URL
 * POST /api/upload
 * 
 * Request body:
 * {
 *   fileName: string,
 *   contentType: string (e.g., 'image/jpeg')
 * }
 */
router.post('/upload', verifyToken, async (req, res) => {
  try {
    const { fileName, contentType } = req.body;

    // Validate request
    if (!fileName || !contentType) {
      return res.status(400).json({
        error: 'Bad request',
        message: 'fileName and contentType are required'
      });
    }

    console.log(`📤 Generating upload URL for ${fileName}`);

    // TODO: Call AWS Lambda to get presigned URL from S3
    // For now, return a mock presigned URL
    const s3Key = `receipts/${req.user.sub}/${Date.now()}-${fileName}`;
    const mockPresignedUrl = `https://savr-receipts-422228628828-us-east-2.s3.amazonaws.com/${s3Key}?mock=true`;

    res.json({
      uploadUrl: mockPresignedUrl,
      s3Key: s3Key,
      expiresIn: 3600
    });
  } catch (error) {
    console.error('Error generating upload URL:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * Protected endpoint: Parse receipt
 * POST /api/parse-receipt
 * 
 * Request body:
 * {
 *   s3Key: string
 * }
 */
router.post('/parse-receipt', verifyToken, async (req, res) => {
  try {
    const { s3Key } = req.body;

    // Validate request
    if (!s3Key) {
      return res.status(400).json({
        error: 'Bad request',
        message: 's3Key is required'
      });
    }

    console.log(`🔍 Parsing receipt from ${s3Key}`);

    // TODO: Call AWS Lambda to parse receipt using Textract
    // For now, return a mock parsed receipt
    const parsedReceipt = {
      s3Key,
      userId: req.user.sub,
      parsedAt: new Date().toISOString(),
      items: [
        { name: 'Milk', quantity: 1, price: 3.50 },
        { name: 'Bread', quantity: 2, price: 2.50 },
        { name: 'Eggs', quantity: 12, price: 4.00 }
      ],
      total: 10.00,
      store: 'Local Grocery Store',
      date: new Date().toISOString()
    };

    res.json(parsedReceipt);
  } catch (error) {
    console.error('Error parsing receipt:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * Protected endpoint: Get user's meal plans
 * GET /api/meal-plan?userId=xxx&planDate=YYYY-MM-DD
 */
router.get('/meal-plan', verifyToken, async (req, res) => {
  try {
    const { userId, planDate } = req.query;

    // Validate request
    if (!userId) {
      return res.status(400).json({
        error: 'Bad request',
        message: 'userId query parameter is required'
      });
    }

    // Verify the token's user ID matches the request
    if (req.user.sub !== userId) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You can only access your own meal plans'
      });
    }

    console.log(`📋 Fetching meal plans for user ${userId}${planDate ? ` for date ${planDate}` : ''}`);

    // TODO: Query DynamoDB for user's meal plans
    // For now, return mock data
    const mealPlans = [
      {
        id: 'plan-1',
        userId,
        date: planDate || new Date().toISOString().split('T')[0],
        meals: [
          { type: 'breakfast', name: 'Oatmeal' },
          { type: 'lunch', name: 'Salad' },
          { type: 'dinner', name: 'Salmon' }
        ]
      }
    ];

    res.json(mealPlans);
  } catch (error) {
    console.error('Error fetching meal plans:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * Protected endpoint: Save user preferences
 * POST /api/preferences/save
 * 
 * Request body:
 * {
 *   userId: string,
 *   preferences: {
 *     budget: number,
 *     dietaryRestrictions: string[],
 *     allergies: string[]
 *   }
 * }
 */
router.post('/preferences/save', verifyToken, async (req, res) => {
  try {
    const { userId, preferences } = req.body;

    // Validate request
    if (!userId || !preferences) {
      return res.status(400).json({
        error: 'Bad request',
        message: 'userId and preferences are required'
      });
    }

    // Verify the token's user ID matches the request
    if (req.user.sub !== userId) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You can only save preferences for your own account'
      });
    }

    console.log(`💾 Saving preferences for user ${userId}:`, preferences);

    // TODO: Save to DynamoDB UserPreferences table
    // For now, just return success
    res.json({
      success: true,
      message: 'Preferences saved successfully',
      userId,
      preferences,
      savedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error saving preferences:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * Protected endpoint: Get user preferences
 * GET /api/preferences/get?userId=xxx
 */
router.get('/preferences/get', verifyToken, async (req, res) => {
  try {
    const { userId } = req.query;

    // Validate request
    if (!userId) {
      return res.status(400).json({
        error: 'Bad request',
        message: 'userId query parameter is required'
      });
    }

    // Verify the token's user ID matches the request
    if (req.user.sub !== userId) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You can only access your own preferences'
      });
    }

    console.log(`📖 Fetching preferences for user ${userId}`);

    // TODO: Query DynamoDB UserPreferences table
    // For now, return mock data
    const preferences = {
      userId,
      budget: 100,
      dietaryRestrictions: [],
      allergies: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    res.json(preferences);
  } catch (error) {
    console.error('Error fetching preferences:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

export default router;
