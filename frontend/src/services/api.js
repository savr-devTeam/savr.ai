import axios from 'axios'

const API_BASE_URL = 'https://2bficji0m1.execute-api.us-east-2.amazonaws.com/prod'

const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 60000,
    headers: {
        'Content-Type': 'application/json'
    }
})

// API Functions
export const generateMealPlan = async (preferences, userId) => {
    const response = await api.post('/generate-plan', {
        userId,
        preferences
    })
    return response.data
}

export const uploadReceipt = async (file) => {
    // Step 1: Get presigned URL
    const uploadData = await api.post('/upload', {
        fileName: file.name,
        contentType: file.type
    })

    // Step 2: Upload to S3
    await axios.put(uploadData.data.uploadUrl, file, {
        headers: {
            'Content-Type': file.type
        }
    })

    return uploadData.data
}

export const parseReceipt = async (s3Key) => {
    const response = await api.post('/parse-receipt', {
        s3Key
    })
    return response.data
}

export const getMealPlans = async (userId, planDate = null) => {
    const params = new URLSearchParams({
        userId
    })
    if (planDate) params.append('planDate', planDate)

    const response = await api.get(`/meal-plan?${params}`)
    return response.data
}

export default api