import { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

// Configure axios defaults
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

axios.defaults.withCredentials = true;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [tokens, setTokens] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if user is already logged in on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      // Check if we have tokens in localStorage
      const storedTokens = localStorage.getItem('savr_tokens');
      const storedUser = localStorage.getItem('savr_user');

      if (storedTokens && storedUser) {
        setTokens(JSON.parse(storedTokens));
        setUser(JSON.parse(storedUser));
      }

      // Verify with backend
      const response = await axios.get(`${API_URL}/auth/user`);
      
      if (response.data.authenticated) {
        setUser(response.data.user);
      } else if (storedUser) {
        // Clear local storage if backend says not authenticated
        localStorage.removeItem('savr_tokens');
        localStorage.removeItem('savr_user');
        setUser(null);
        setTokens(null);
      }
    } catch (err) {
      console.error('Auth check failed:', err);
      // Clear local storage on error
      localStorage.removeItem('savr_tokens');
      localStorage.removeItem('savr_user');
      setUser(null);
      setTokens(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async () => {
    try {
      setError(null);
      const response = await axios.get(`${API_URL}/auth/login`);
      
      if (response.data.authUrl) {
        // Redirect to Cognito hosted UI
        window.location.href = response.data.authUrl;
      } else {
        throw new Error('No authorization URL received');
      }
    } catch (err) {
      console.error('Login failed:', err);
      setError(err.response?.data?.message || 'Login failed');
      throw err;
    }
  };

  const handleCallback = async (code, state) => {
    try {
      setLoading(true);
      setError(null);

      // Call backend to exchange code for tokens
      const response = await axios.get(`${API_URL}/auth/callback`, {
        params: { code, state }
      });

      if (response.data.success) {
        const { user: userData, tokens: tokenData } = response.data;
        
        // Store in state
        setUser(userData);
        setTokens(tokenData);

        // Store in localStorage for persistence
        localStorage.setItem('savr_user', JSON.stringify(userData));
        localStorage.setItem('savr_tokens', JSON.stringify(tokenData));

        return true;
      } else {
        throw new Error('Authentication failed');
      }
    } catch (err) {
      console.error('Callback handling failed:', err);
      setError(err.response?.data?.message || 'Authentication failed');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setError(null);
      const response = await axios.post(`${API_URL}/auth/logout`);

      // Clear local state
      setUser(null);
      setTokens(null);

      // Clear localStorage
      localStorage.removeItem('savr_user');
      localStorage.removeItem('savr_tokens');

      // Redirect to Cognito logout
      if (response.data.logoutUrl) {
        window.location.href = response.data.logoutUrl;
      } else {
        // Fallback to home page
        window.location.href = '/';
      }
    } catch (err) {
      console.error('Logout failed:', err);
      setError(err.response?.data?.message || 'Logout failed');
      
      // Clear local state anyway
      setUser(null);
      setTokens(null);
      localStorage.removeItem('savr_user');
      localStorage.removeItem('savr_tokens');
    }
  };

  const refreshToken = async () => {
    try {
      const response = await axios.post(`${API_URL}/auth/refresh`);

      if (response.data.success) {
        const { tokens: tokenData } = response.data;
        setTokens(tokenData);
        localStorage.setItem('savr_tokens', JSON.stringify(tokenData));
        return true;
      }
      return false;
    } catch (err) {
      console.error('Token refresh failed:', err);
      // If refresh fails, log user out
      await logout();
      return false;
    }
  };

  // Axios interceptor to add auth token to requests
  useEffect(() => {
    const requestInterceptor = axios.interceptors.request.use(
      (config) => {
        if (tokens?.access_token) {
          config.headers.Authorization = `Bearer ${tokens.access_token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    const responseInterceptor = axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        // If 401 and we haven't retried yet, try refreshing token
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          const refreshed = await refreshToken();
          if (refreshed) {
            // Retry original request with new token
            return axios(originalRequest);
          }
        }

        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.request.eject(requestInterceptor);
      axios.interceptors.response.eject(responseInterceptor);
    };
  }, [tokens]);

  const value = {
    user,
    tokens,
    loading,
    error,
    isAuthenticated: !!user,
    login,
    logout,
    handleCallback,
    refreshToken,
    checkAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;

