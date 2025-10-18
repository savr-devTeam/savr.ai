import express from 'express';
import { Issuer, generators } from 'openid-client';

const router = express.Router();

// Store for PKCE code verifiers (in production, use Redis or session store)
const codeVerifiers = new Map();

// Initialize Cognito client
let cognitoClient = null;

async function getCognitoClient() {
  if (cognitoClient) {
    return cognitoClient;
  }

  try {
    const issuerUrl = `https://cognito-idp.${process.env.COGNITO_REGION}.amazonaws.com/${process.env.COGNITO_USER_POOL_ID}`;
    
    const cognitoIssuer = await Issuer.discover(issuerUrl);
    
    cognitoClient = new cognitoIssuer.Client({
      client_id: process.env.COGNITO_CLIENT_ID,
      client_secret: process.env.COGNITO_CLIENT_SECRET,
      redirect_uris: [process.env.REDIRECT_URI],
      response_types: ['code'],
    });

    console.log('✅ Cognito OIDC client initialized');
    return cognitoClient;
  } catch (error) {
    console.error('❌ Failed to initialize Cognito client:', error);
    throw error;
  }
}

// Route: Initiate login
router.get('/login', async (req, res) => {
  try {
    const client = await getCognitoClient();

    // Generate PKCE code verifier and challenge
    const codeVerifier = generators.codeVerifier();
    const codeChallenge = generators.codeChallenge(codeVerifier);
    const state = generators.state();

    // Store code verifier for later use in callback
    codeVerifiers.set(state, codeVerifier);

    // Clean up old verifiers after 10 minutes
    setTimeout(() => codeVerifiers.delete(state), 10 * 60 * 1000);

    // Build authorization URL
    const authorizationUrl = client.authorizationUrl({
      scope: 'openid email phone profile',
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
      state: state,
    });

    console.log('🔐 Redirecting to Cognito login:', authorizationUrl);
    
    // Return authUrl, codeVerifier, and state to frontend
    // Frontend will store these and use them in callback
    res.json({ 
      authUrl: authorizationUrl,
      codeVerifier: codeVerifier,
      state: state
    });
  } catch (error) {
    console.error('Error in /login:', error);
    res.status(500).json({ 
      error: 'Failed to initiate login',
      message: error.message 
    });
  }
});

// Route: Handle OAuth callback
router.get('/callback', async (req, res) => {
  try {
    const client = await getCognitoClient();
    const params = client.callbackParams(req);
    
    const { code, state } = params;

    if (!code || !state) {
      return res.status(400).json({ 
        error: 'Missing code or state parameter' 
      });
    }

    // Retrieve code verifier
    const codeVerifier = codeVerifiers.get(state);
    if (!codeVerifier) {
      return res.status(400).json({ 
        error: 'Invalid or expired state parameter' 
      });
    }

    // Exchange authorization code for tokens
    const tokenSet = await client.callback(
      process.env.REDIRECT_URI,
      params,
      { code_verifier: codeVerifier, state }
    );

    // Clean up code verifier
    codeVerifiers.delete(state);

    // Get user info
    const userinfo = await client.userinfo(tokenSet.access_token);

    // Store user session
    req.session.user = {
      sub: userinfo.sub,
      email: userinfo.email,
      username: userinfo['cognito:username'] || userinfo.preferred_username,
      name: userinfo.name,
    };

    req.session.tokens = {
      access_token: tokenSet.access_token,
      id_token: tokenSet.id_token,
      refresh_token: tokenSet.refresh_token,
      expires_at: tokenSet.expires_at,
    };

    console.log('✅ User logged in:', req.session.user.email);

    // Return tokens and user info to frontend
    res.json({
      success: true,
      user: req.session.user,
      tokens: {
        access_token: tokenSet.access_token,
        id_token: tokenSet.id_token,
        expires_in: tokenSet.expires_in,
      },
    });
  } catch (error) {
    console.error('Error in /callback:', error);
    res.status(500).json({ 
      error: 'Authentication failed',
      message: error.message 
    });
  }
});

// Route: Exchange authorization code for tokens (for frontend)
router.post('/token', async (req, res) => {
  try {
    const { code, codeVerifier } = req.body;

    if (!code || !codeVerifier) {
      return res.status(400).json({ 
        error: 'Missing code or codeVerifier' 
      });
    }

    const client = await getCognitoClient();

    // Exchange code for tokens
    const tokenSet = await client.callback(
      process.env.REDIRECT_URI,
      { code },
      { code_verifier: codeVerifier }
    );

    // Get user info
    const userinfo = await client.userinfo(tokenSet.access_token);

    // Store in session
    req.session.user = {
      sub: userinfo.sub,
      email: userinfo.email,
      username: userinfo['cognito:username'] || userinfo.preferred_username,
      name: userinfo.name,
    };

    req.session.tokens = {
      access_token: tokenSet.access_token,
      id_token: tokenSet.id_token,
      refresh_token: tokenSet.refresh_token,
      expires_at: tokenSet.expires_at,
    };

    res.json({
      success: true,
      user: req.session.user,
      tokens: {
        access_token: tokenSet.access_token,
        id_token: tokenSet.id_token,
        expires_in: tokenSet.expires_in,
      },
    });
  } catch (error) {
    console.error('Error in /token:', error);
    res.status(500).json({ 
      error: 'Token exchange failed',
      message: error.message 
    });
  }
});

// Route: Get current user info
router.get('/user', (req, res) => {
  if (req.session && req.session.user) {
    res.json({ 
      authenticated: true,
      user: req.session.user 
    });
  } else {
    res.json({ 
      authenticated: false,
      user: null 
    });
  }
});

// Route: Logout
router.post('/logout', async (req, res) => {
  try {
    const idToken = req.session?.tokens?.id_token;

    // Destroy session
    req.session.destroy((err) => {
      if (err) {
        console.error('Error destroying session:', err);
      }
    });

    // Build Cognito logout URL
    const logoutUrl = `${process.env.COGNITO_DOMAIN}/logout?client_id=${process.env.COGNITO_CLIENT_ID}&logout_uri=${encodeURIComponent(process.env.LOGOUT_URI)}`;

    console.log('👋 User logged out');

    res.json({
      success: true,
      logoutUrl: logoutUrl,
    });
  } catch (error) {
    console.error('Error in /logout:', error);
    res.status(500).json({ 
      error: 'Logout failed',
      message: error.message 
    });
  }
});

// Route: Refresh token
router.post('/refresh', async (req, res) => {
  try {
    const refreshToken = req.session?.tokens?.refresh_token;

    if (!refreshToken) {
      return res.status(401).json({ 
        error: 'No refresh token available' 
      });
    }

    const client = await getCognitoClient();

    // Refresh the token
    const tokenSet = await client.refresh(refreshToken);

    // Update session with new tokens
    req.session.tokens = {
      access_token: tokenSet.access_token,
      id_token: tokenSet.id_token,
      refresh_token: tokenSet.refresh_token || refreshToken,
      expires_at: tokenSet.expires_at,
    };

    res.json({
      success: true,
      tokens: {
        access_token: tokenSet.access_token,
        id_token: tokenSet.id_token,
        expires_in: tokenSet.expires_in,
      },
    });
  } catch (error) {
    console.error('Error in /refresh:', error);
    res.status(500).json({ 
      error: 'Token refresh failed',
      message: error.message 
    });
  }
});

export default router;

