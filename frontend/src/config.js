// API Configuration
export const API_CONFIG = {
  BASE_URL: 'https://2bficji0m1.execute-api.us-east-2.amazonaws.com/prod/',
};

// Helper function to build endpoint URLs
export const getEndpoint = (path) => {
  return `${API_CONFIG.BASE_URL}${path}`;
};
