// Generate user ID from auth context or create anonymous
export const getUserId = (user) => {
    return user?.id || user?.email || `anonymous-${Date.now()}`
}

export const saveUserPreferences = (preferences) => {
    localStorage.setItem('savr_preferences', JSON.stringify(preferences))
}

export const getUserPreferences = () => {
    const saved = localStorage.getItem('savr_preferences')
    return saved ? JSON.parse(saved) : null
}