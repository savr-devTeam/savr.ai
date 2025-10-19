import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '../hooks/useNavigation'
import './AuthCallback.css';

function AuthCallback() {
  const navigate = useNavigation();
  const { handleCallback } = useAuth();
  const [status, setStatus] = useState('processing');
  const [message, setMessage] = useState('Processing authentication...');

  useEffect(() => {
    let processed = false; // Guard to prevent multiple executions

    const processCallback = async () => {
      if (processed) return; // Skip if already processing
      processed = true;

      try {
        // Extract code and state from URL
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const state = urlParams.get('state');
        const error = urlParams.get('error');
        const errorDescription = urlParams.get('error_description');

        if (error) {
          setStatus('error');
          setMessage(errorDescription || 'Authentication failed');
          setTimeout(() => {
            navigate('LandingPage');
          }, 3000);
          return;
        }

        if (!code) {
          setStatus('error');
          setMessage('No authorization code received');
          setTimeout(() => {
            navigate('LandingPage');
          }, 3000);
          return;
        }

        setMessage('Exchanging authorization code for tokens...');

        // Handle the callback
        const success = await handleCallback(code, state);

        if (success) {
          setStatus('success');
          setMessage('Login successful! Redirecting to dashboard...');

          // Redirect to dashboard after short delay
          setTimeout(() => {
            navigate('Dashboard');
          }, 1500);
        } else {
          setStatus('error');
          setMessage('Authentication failed. Please try again.');
          setTimeout(() => {
            navigate('LandingPage');
          }, 3000);
        }
      } catch (err) {
        console.error('Callback error:', err);
        setStatus('error');
        setMessage('An error occurred during authentication');
        setTimeout(() => {
          navigate('LandingPage');
        }, 3000);
      }
    };

    processCallback();
  }, [handleCallback, onNavigate]);

  return (
    <div className="auth-callback-container">
      <div className="auth-callback-card">
        <div className={`auth-status-icon ${status}`}>
          {status === 'processing' && (
            <div className="spinner"></div>
          )}
          {status === 'success' && (
            <svg className="checkmark" viewBox="0 0 52 52">
              <circle className="checkmark-circle" cx="26" cy="26" r="25" fill="none" />
              <path className="checkmark-check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8" />
            </svg>
          )}
          {status === 'error' && (
            <svg className="error-icon" viewBox="0 0 52 52">
              <circle className="error-circle" cx="26" cy="26" r="25" fill="none" />
              <path className="error-cross" fill="none" d="M16 16 36 36 M36 16 16 36" />
            </svg>
          )}
        </div>

        <h2 className="auth-status-title">
          {status === 'processing' && 'Authenticating...'}
          {status === 'success' && 'Success!'}
          {status === 'error' && 'Error'}
        </h2>

        <p className="auth-status-message">{message}</p>

        {status === 'error' && (
          <button
            className="auth-retry-button"
            onClick={() => navigate('LandingPage')}
          >
            Return to Home
          </button>
        )}
      </div>
    </div>
  );
}

export default AuthCallback;

