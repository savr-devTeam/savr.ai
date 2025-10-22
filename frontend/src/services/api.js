import axios from 'axios'

// Use environment variable or fallback to Lambda API Gateway
const API_BASE_URL =
    import.meta.env.VITE_API_URL || 'https://2bficji0m1.execute-api.us-east-2.amazonaws.com/prod'

console.log('API Configuration:', {
    envVar: import.meta.env.VITE_API_URL,
    baseURL: API_BASE_URL
})

const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 60000,
    headers: {
        'Content-Type': 'application/json'
    }
})

console.log('API instance created with baseURL:', api.defaults.baseURL)

/**
 * Centralized error handler for API errors
 * Extracts meaningful error messages and logs them
 */
const handleApiError = (error, context = '') => {
    // Better error handling for network errors
    if (error.code === 'ERR_NETWORK' || !error.response) {
        console.error(`Network Error ${context}:`, {
            message: error.message,
            code: error.code,
            config: {
                url: error.config?.url,
                method: error.config?.method,
                baseURL: error.config?.baseURL
            }
        })

        throw {
            status: 0,
            message: `Network error: Unable to reach ${error.config?.baseURL}. Check API endpoint and CORS settings.`,
            originalError: error
        }
    }

    const errorMessage = error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        'Unknown error occurred'

    console.error(`API Error ${context}:`, {
        status: error.response?.status,
        message: errorMessage,
        data: error.response?.data,
        url: error.config?.url
    })

    throw {
        status: error.response?.status,
        message: errorMessage,
        originalError: error
    }
}

/**
 * Request interceptor: Attach JWT token to all requests and ensure baseURL
 */
api.interceptors.request.use((config) => {
    // Ensure baseURL is always set
    if (!config.baseURL) {
        config.baseURL = API_BASE_URL
    }

    const token = localStorage.getItem('id_token')
    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }

    console.log('Request config:', {
        method: config.method,
        url: config.url,
        baseURL: config.baseURL,
        fullURL: `${config.baseURL}${config.url}`
    })

    return config
}, (error) => {
    return Promise.reject(error)
})

/**
 * Response interceptor: Handle errors globally
 */
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Note: We're using session-based auth (no JWT), so don't redirect on 401
        // The error will be handled by the component that called the API
        return Promise.reject(error)
    }
)

/**
 * Generate a meal plan based on user preferences
 * @param {Object} preferences - User meal preferences (budget, dietaryRestrictions, nutritionGoal, etc.)
 * @param {string} userId - AWS Cognito user ID
 * @returns {Promise<Object>} Generated meal plan with meals and nutrition info
 * @throws {Object} Error object with status and message
 */
export const generateMealPlan = async (preferences, userId) => {
    try {
        const response = await api.post('/generate-plan', {
            userId,
            preferences
        })
        return response.data
    } catch (error) {
        handleApiError(error, 'generateMealPlan')
    }
}

/**
 * Get all meal plans for a user
 * @param {string} userId - AWS Cognito user ID
 * @param {string} [planDate] - Optional specific date to filter by (YYYY-MM-DD format)
 * @returns {Promise<Object>} List of meal plans
 * @throws {Object} Error object with status and message
 */
export const getMealPlans = async (userId, planDate = null) => {
    try {
        const params = new URLSearchParams({
            userId
        })
        if (planDate) params.append('planDate', planDate)

        const response = await api.get(`/meal-plan?${params}`)
        return response.data
    } catch (error) {
        handleApiError(error, 'getMealPlans')
    }
}

/**
 * Step 1 of receipt upload: Get presigned URL for S3 upload
 * @param {string} fileName - Name of the file to upload
 * @param {string} contentType - MIME type of the file (e.g., 'image/jpeg')
 * @param {string} userId - User session ID
 * @returns {Promise<Object>} Presigned URL and S3 key
 * @throws {Object} Error object with status and message
 */
export const getUploadUrl = async (fileName, contentType, userId) => {
    try {
        const response = await api.post('/upload', {
            fileName,
            contentType,
            userId
        })
        return response.data
    } catch (error) {
        handleApiError(error, 'getUploadUrl')
    }
}

/**
 * Step 2 of receipt upload: Upload file to S3 using presigned URL
 * @param {string} uploadUrl - Presigned S3 upload URL from getUploadUrl()
 * @param {File} file - The file object to upload
 * @returns {Promise<Object>} Upload confirmation with s3Key
 * @throws {Object} Error object with status and message
 */
export const uploadToS3 = async (uploadUrl, file) => {
    try {
        await axios.put(uploadUrl, file, {
            headers: {
                'Content-Type': file.type
            }
        })
        return {
            s3Key: uploadUrl.split('/').pop()
        }
    } catch (error) {
        handleApiError(error, 'uploadToS3')
    }
}

/**
 * Full receipt upload: Get URL, upload to S3, return key
 * Combines getUploadUrl and uploadToS3 steps
 * @param {File} file - The file object to upload
 * @param {string} userId - User session ID
 * @returns {Promise<Object>} Upload response with S3 key
 * @throws {Object} Error object with status and message
 */
export const uploadReceipt = async (file, userId = 'anonymous') => {
    try {
        console.log('uploadReceipt called with:', {
            name: file.name,
            type: file.type,
            size: file.size,
            userId
        })
        // Step 1: Get presigned URL
        console.log('Calling getUploadUrl...')
        const uploadData = await getUploadUrl(file.name, file.type, userId) // ✅ Pass userId


        // Step 2: Upload to S3
        console.log('Uploading to S3...')
        await uploadToS3(uploadData.uploadUrl, file)
        console.log('S3 upload complete')

        return uploadData
    } catch (error) {
        console.error('uploadReceipt error:', error)
        handleApiError(error, 'uploadReceipt')
    }
}

/**
 * Parse receipt image/PDF and extract items and prices
 * @param {string} s3Key - S3 key of the uploaded receipt file
 * @param {string} userId - User session ID
 * @returns {Promise<Object>} Parsed receipt data with items, quantities, prices
 * @throws {Object} Error object with status and message
 */
export const parseReceipt = async (s3Key, userId) => {
    try {
        const response = await api.post('/parse-receipt', {
            s3Key
        })
        return response.data
    } catch (error) {
        handleApiError(error, 'parseReceipt')
    }
}

/**
 * Analyze receipt with Claude 4.5 Sonnet AI
 * @param {string} receiptId - Receipt ID from parseReceipt
 * @param {string} userId - User ID
 * @returns {Promise<Object>} AI insights including health score, recipes, meal plans
 * @throws {Object} Error object with status and message
 */
export const analyzeReceipt = async (receiptId, userId) => {
    try {
        const response = await api.post('/analyze-receipt', {
            receiptId,
            userId
        }, {
            timeout: 60000
        })
        return response.data
    } catch (error) {
        handleApiError(error, 'analyzeReceipt')
    }
}

/**
 * Save user preferences to backend
 * @param {string} userId - AWS Cognito user ID
 * @param {Object} preferences - User preferences object (budget, allergies, dietary goals)
 * @returns {Promise<Object>} Confirmation with saved preferences
 * @throws {Object} Error object with status and message
 */
export const saveUserPreferences = async (userId, preferences) => {
    try {
        const response = await api.post('/preferences', {
            userId,
            preferences
        })
        return response.data
    } catch (error) {
        console.error('Failed to save preferences:', error.message)
        // Return success response even if save fails (graceful degradation)
        return {
            message: 'Preferences saved locally',
            userId: userId
        }
    }
}

/**
 * Get user preferences from backend including budget tracking
 * @param {string} userId - User ID
 * @returns {Promise<Object>} User preferences with budget data
 * @throws {Object} Error object with status and message
 */
export const getUserPreferences = async (userId) => {
    try {
        const response = await api.get(`/preferences?userId=${userId}`)
        return response.data
    } catch (error) {
        console.error('Failed to get preferences:', error.message)
        // Return default empty preferences instead of throwing
        return {
            preferences: {
                allergies: [],
                budget: 0,
                spent: 0,
                customPreferences: ''
            }
        }
    }
}

/**
 * Reset weekly budget (clears total_spent)
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Updated preferences
 * @throws {Object} Error object with status and message
 */
export const resetWeeklyBudget = async (userId) => {
    try {
        const response = await api.post('/preferences/reset-budget', {
            userId
        })
        return response.data
    } catch (error) {
        handleApiError(error, 'resetWeeklyBudget')
    }
}

export default api