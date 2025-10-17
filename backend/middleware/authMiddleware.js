import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';

// Configure JWKS client to fetch Cognito's public keys
const client = jwksClient({
  jwksUri: `https://cognito-idp.${process.env.COGNITO_REGION}.amazonaws.com/${process.env.COGNITO_USER_POOL_ID}/.well-known/jwks.json`,
  cache: true,
  rateLimit: true,
});

// Function to get signing key from JWKS
function getKey(header, callback) {
  client.getSigningKey(header.kid, (err, key) => {
    if (err) {
      callback(err);
      return;
    }
    const signingKey = key.getPublicKey();
    callback(null, signingKey);
  });
}

// Middleware to verify JWT token from Cognito
export const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ 
      error: 'Unauthorized', 
      message: 'No token provided' 
    });
  }

  const token = authHeader.substring(7); // Remove 'Bearer ' prefix

  // Verify the token using Cognito's public keys
  jwt.verify(
    token,
    getKey,
    {
      issuer: `https://cognito-idp.${process.env.COGNITO_REGION}.amazonaws.com/${process.env.COGNITO_USER_POOL_ID}`,
      algorithms: ['RS256'],
    },
    (err, decoded) => {
      if (err) {
        console.error('Token verification error:', err);
        return res.status(401).json({ 
          error: 'Unauthorized', 
          message: 'Invalid or expired token' 
        });
      }

      // Attach user information to request
      req.user = {
        sub: decoded.sub, // Cognito user ID
        email: decoded.email,
        username: decoded['cognito:username'],
        token_use: decoded.token_use,
      };

      next();
    }
  );
};

// Optional middleware to check if user is authenticated (for session-based auth)
export const requireAuth = (req, res, next) => {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ 
      error: 'Unauthorized', 
      message: 'Please log in' 
    });
  }
  next();
};

// Middleware to attach user from session (if exists)
export const attachUser = (req, res, next) => {
  if (req.session && req.session.user) {
    req.user = req.session.user;
  }
  next();
};

