# AWS Cognito Authentication Setup Guide

## Overview

This guide documents the AWS Cognito authentication system implementation for Savr.ai. The system uses OAuth 2.0 Authorization Code Grant flow with PKCE for secure user authentication.

## Architecture

### Backend (Node.js/Express)
- **Location**: `backend/`
- **Port**: 3001
- **Auth Routes**: `/auth/*`
- **Technology**: `openid-client` for OIDC integration

### Frontend (React + Vite)
- **Location**: `frontend/`
- **Auth Context**: `src/context/AuthContext.jsx`
- **Callback Page**: `src/pages/AuthCallback.jsx`
- **Technology**: React Context API for state management

### AWS Cognito Configuration
- **User Pool ID**: `us-east-1_lwFygbjd9`
- **App Client ID**: `68r61tb357f3dgk0lpsors0bsk`
- **Region**: `us-east-1`
- **Domain**: `https://us-east-1lwfygbjd9.auth.us-east-1.amazoncognito.com`
- **Callback URL**: `https://savr-ai-one.vercel.app/auth/callback`
- **Logout URL**: `https://savr-ai-one.vercel.app/`
- **Scopes**: `openid`, `email`, `phone`, `profile`
- **Grant Type**: Authorization Code Grant
- **UI**: Managed Login (Cognito Hosted UI)

## Setup Instructions

### 1. Backend Configuration

#### Install Dependencies
```bash
cd backend
npm install
```

#### Configure Environment Variables

**IMPORTANT**: You need to get the `COGNITO_CLIENT_SECRET` from AWS Cognito Console:
1. Go to AWS Console → Cognito → User Pools
2. Select your User Pool (`us-east-1_lwFygbjd9`)
3. Go to "App integration" → "App clients"
4. Click on your app client
5. Click "Show client secret" and copy it

Create a `.env` file in the `backend/` directory (copy from `config.example.env`):

```bash
cp config.example.env .env
```

Then edit `.env` and add your values:

```env
# AWS Cognito Configuration
COGNITO_REGION=us-east-1
COGNITO_USER_POOL_ID=us-east-1_lwFygbjd9
COGNITO_CLIENT_ID=68r61tb357f3dgk0lpsors0bsk
COGNITO_CLIENT_SECRET=your_actual_client_secret_from_aws_console
COGNITO_DOMAIN=https://us-east-1lwfygbjd9.auth.us-east-1.amazoncognito.com

# Application URLs
BACKEND_URL=http://localhost:3001
FRONTEND_URL=https://savr-ai-one.vercel.app
REDIRECT_URI=https://savr-ai-one.vercel.app/auth/callback
LOGOUT_URI=https://savr-ai-one.vercel.app/

# Session Configuration - CHANGE THIS IN PRODUCTION!
SESSION_SECRET=your_random_secret_key_change_this_in_production

# Environment
NODE_ENV=development
```

**For Local Development**, update these values in `.env`:
```env
FRONTEND_URL=http://localhost:5173
REDIRECT_URI=http://localhost:5173
LOGOUT_URI=http://localhost:5173/
```

**Note**: If using local development URLs, you'll also need to update the Cognito App Client settings in AWS Console to include `http://localhost:5173` in the callback and logout URLs.

#### Start Backend Server
```bash
npm run dev
```

The server should start on `http://localhost:3001`.

### 2. Frontend Configuration

#### Install Dependencies
```bash
cd frontend
npm install
```

#### Configure Environment Variables

Create a `.env` file in the `frontend/` directory:

```env
# Backend API URL
VITE_API_URL=http://localhost:3001
```

**For Production (Vercel)**:
```env
VITE_API_URL=https://your-backend-url.com
```

#### Start Frontend Development Server
```bash
npm run dev
```

The app should start on `http://localhost:5173`.

### 3. AWS Cognito Console Verification

Make sure your Cognito App Client has the following settings:

1. **App client settings**:
   - ✅ Authorization code grant
   - ✅ Allowed callback URLs include your redirect URI
   - ✅ Allowed sign-out URLs include your logout URI
   - ✅ OAuth scopes: openid, email, phone, profile

2. **App client secret**: Generated and configured in your backend `.env`

3. **Domain**: Hosted UI domain is active

## Authentication Flow

### 1. Login Flow

```
User clicks "Log In" 
  → Frontend calls useAuth().login()
  → Backend GET /auth/login
  → Generates PKCE code_verifier and code_challenge
  → Redirects to Cognito Hosted UI
  → User logs in with Cognito
  → Cognito redirects to /auth/callback?code=XXX&state=YYY
  → Frontend AuthCallback component extracts code
  → Calls backend GET /auth/callback
  → Backend exchanges code for tokens
  → Returns user info and tokens
  → Frontend stores in localStorage and React Context
  → Redirects to Dashboard
```

### 2. Protected Routes

The Dashboard checks authentication status on mount:
- If not authenticated → redirect to Landing Page
- If authenticated → display user data

### 3. API Requests

All authenticated API requests automatically include the access token:
- Frontend: Axios interceptor adds `Authorization: Bearer <token>`
- Backend: JWT middleware verifies token using Cognito's public keys

### 4. Token Refresh

When a token expires (401 response):
- Frontend automatically calls `/auth/refresh`
- Backend uses refresh token to get new access token
- Retries original request with new token
- If refresh fails → logout user

### 5. Logout Flow

```
User clicks logout icon
  → Frontend calls useAuth().logout()
  → Backend POST /auth/logout
  → Destroys session
  → Returns Cognito logout URL
  → Redirects to Cognito logout
  → Cognito redirects back to app
  → User is logged out
```

## File Structure

### Backend Files

```
backend/
├── server.js                    # Main server with CORS, session, routes
├── config.example.env           # Environment variables template
├── routes/
│   ├── auth.js                  # Auth routes (login, callback, logout, etc.)
│   └── documents.js             # Protected API routes
└── middleware/
    └── authMiddleware.js        # JWT verification middleware
```

### Frontend Files

```
frontend/
├── src/
│   ├── context/
│   │   └── AuthContext.jsx      # Auth state management
│   ├── pages/
│   │   ├── AuthCallback.jsx     # OAuth callback handler
│   │   ├── AuthCallback.css     # Callback page styles
│   │   ├── LandingPage.jsx      # Updated with login button
│   │   ├── LandingPage.css      # Updated with auth styles
│   │   ├── Dashboard.jsx        # Protected page with logout
│   │   └── Dashboard.css        # Updated with auth styles
│   └── App.jsx                  # Wrapped with AuthProvider
└── .env.example                 # Environment variables template
```

## API Endpoints

### Auth Routes (`/auth/*`)

#### `GET /auth/login`
Initiates the OAuth login flow.

**Response**:
```json
{
  "authUrl": "https://cognito-domain.../authorize?..."
}
```

#### `GET /auth/callback?code=XXX&state=YYY`
Handles OAuth callback and exchanges authorization code for tokens.

**Response**:
```json
{
  "success": true,
  "user": {
    "sub": "user-id",
    "email": "user@example.com",
    "username": "username",
    "name": "User Name"
  },
  "tokens": {
    "access_token": "...",
    "id_token": "...",
    "expires_in": 3600
  }
}
```

#### `GET /auth/user`
Gets current authenticated user info.

**Response**:
```json
{
  "authenticated": true,
  "user": {
    "sub": "user-id",
    "email": "user@example.com",
    "username": "username"
  }
}
```

#### `POST /auth/logout`
Logs out the user and destroys session.

**Response**:
```json
{
  "success": true,
  "logoutUrl": "https://cognito-domain.../logout?..."
}
```

#### `POST /auth/refresh`
Refreshes the access token using refresh token.

**Response**:
```json
{
  "success": true,
  "tokens": {
    "access_token": "...",
    "id_token": "...",
    "expires_in": 3600
  }
}
```

## Testing the Integration

### 1. Test Local Setup

1. Start backend: `cd backend && npm run dev`
2. Start frontend: `cd frontend && npm run dev`
3. Open `http://localhost:5173`
4. Click "Log In" button
5. You should be redirected to Cognito Hosted UI
6. Log in with test credentials
7. Should redirect back and show Dashboard

### 2. Create Test User

In AWS Cognito Console:
1. Go to your User Pool
2. Click "Users" → "Create user"
3. Enter email and temporary password
4. User will need to change password on first login

### 3. Test End-to-End Flow

1. **Landing Page**:
   - Should show "Log In" button when not authenticated
   - Should show "Welcome, [User]!" when authenticated

2. **Login**:
   - Click login → redirects to Cognito
   - Enter credentials → redirects back to app
   - Should show success animation
   - Should redirect to Dashboard

3. **Dashboard**:
   - Should show user name in header
   - Should have logout icon (right-from-bracket)
   - Should display user's personalized data

4. **Logout**:
   - Click logout icon → logs out
   - Redirects to Landing Page
   - Should show "Log In" button again

5. **Protected Routes**:
   - Try accessing Dashboard without login
   - Should redirect to Landing Page

## Security Considerations

### Backend Security

1. **Session Secret**: Use a strong, random secret in production
   ```bash
   # Generate a secure secret:
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

2. **CORS**: Configured to only allow requests from your frontend domain

3. **HTTPS**: Use HTTPS in production (secure cookies require it)

4. **JWT Verification**: Tokens are verified using Cognito's public keys (JWKS)

5. **Token Storage**: 
   - Refresh tokens stored in session (server-side)
   - Access tokens sent to client but verified on each request

### Frontend Security

1. **Token Storage**: Tokens stored in localStorage (consider httpOnly cookies for production)

2. **XSS Protection**: React automatically escapes content

3. **PKCE**: Uses PKCE for additional security in OAuth flow

## Troubleshooting

### "Invalid redirect_uri" Error
- Check that your callback URL is registered in Cognito App Client settings
- Verify the URL matches exactly (including protocol and trailing slash)

### "Invalid client_secret" Error
- Make sure you copied the correct client secret from AWS Console
- Check for extra whitespace in `.env` file

### CORS Errors
- Verify `FRONTEND_URL` in backend `.env` matches your frontend URL
- Check that credentials are enabled in axios (`withCredentials: true`)

### Session Not Persisting
- Check that `SESSION_SECRET` is set in `.env`
- Verify cookies are being sent (check browser DevTools → Network → Cookies)
- For cross-domain, ensure `sameSite: 'none'` and `secure: true` in production

### Token Expired Errors
- Refresh token flow should handle this automatically
- If not working, check `/auth/refresh` endpoint
- Verify refresh_token is stored in session

## Production Deployment

### Backend (Node.js)

1. **Environment Variables**: Set all production values in your hosting platform
2. **HTTPS**: Ensure backend is served over HTTPS
3. **Session Store**: Consider using Redis for session storage (not in-memory)
4. **Secrets**: Use AWS Secrets Manager or similar for `COGNITO_CLIENT_SECRET`

### Frontend (Vercel)

1. **Environment Variables**: Add `VITE_API_URL` in Vercel project settings
2. **Build Command**: `npm run build`
3. **Redirects**: Vercel should automatically handle SPA routing

### AWS Cognito

1. Update callback URLs to production URLs
2. Update logout URLs to production URLs
3. Configure custom domain (optional)
4. Set up user pool triggers for custom auth flows (optional)

## Next Steps

1. **Protect API Routes**: Add `verifyToken` middleware to API routes that need authentication
   ```javascript
   import { verifyToken } from './middleware/authMiddleware.js';
   
   router.get('/protected-route', verifyToken, (req, res) => {
     // req.user contains authenticated user info
     res.json({ message: 'Protected data', user: req.user });
   });
   ```

2. **User Profile Management**: Create profile page to display/edit user info

3. **AWS Integration**: Use user's `sub` (Cognito user ID) to scope data in DynamoDB

4. **Email Verification**: Enable email verification in Cognito settings

5. **MFA**: Enable multi-factor authentication for additional security

## Resources

- [AWS Cognito Documentation](https://docs.aws.amazon.com/cognito/)
- [openid-client Documentation](https://github.com/panva/node-openid-client)
- [OAuth 2.0 Authorization Code Flow](https://oauth.net/2/grant-types/authorization-code/)
- [PKCE Explained](https://oauth.net/2/pkce/)

## Support

For issues or questions:
1. Check AWS Cognito Console logs
2. Check backend server logs (`console.log` output)
3. Check browser DevTools Console and Network tabs
4. Review AWS Cognito User Pool settings

