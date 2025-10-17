# Quick Start: AWS Cognito Authentication

## TL;DR Setup

### 1. Get Your Cognito Client Secret

1. Go to [AWS Console](https://console.aws.amazon.com/cognito/)
2. Navigate to User Pools → `us-east-1_lwFygbjd9`
3. Go to "App integration" → "App clients" → Your app client
4. Click "Show client secret" and **copy it**

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create .env file
cp config.example.env .env

# Edit .env and paste your client secret
# COGNITO_CLIENT_SECRET=paste_your_secret_here
# Also set a strong SESSION_SECRET

# Start server
npm run dev
```

**Backend runs on**: `http://localhost:3001`

### 3. Frontend Setup

```bash
cd frontend

# Dependencies already installed? If not:
npm install

# Create .env file (optional for local dev)
echo "VITE_API_URL=http://localhost:3001" > .env

# Start app
npm run dev
```

**Frontend runs on**: `http://localhost:5173`

### 4. Test It!

1. Open `http://localhost:5173`
2. Click **"Log In"** button
3. Log in with Cognito credentials
4. You should see the Dashboard!

## For Local Development

If testing locally, update your Cognito App Client to allow `localhost`:

**In AWS Cognito Console**:
- Add to Allowed callback URLs: `http://localhost:5173`
- Add to Allowed sign-out URLs: `http://localhost:5173/`

**In backend/.env**:
```env
FRONTEND_URL=http://localhost:5173
REDIRECT_URI=http://localhost:5173
LOGOUT_URI=http://localhost:5173/
```

## Create Test User

**In AWS Console**:
1. Go to Cognito User Pool → Users
2. Click "Create user"
3. Enter email and temporary password
4. User must change password on first login

## How It Works

1. **Login**: User clicks login → redirected to Cognito → logs in → redirected back
2. **Session**: User info stored in React Context and localStorage
3. **Protected Routes**: Dashboard checks auth, redirects to landing if not logged in
4. **API Calls**: Access token automatically added to requests
5. **Logout**: Click logout icon → session destroyed → redirected to landing

## Key Files

| File | Purpose |
|------|---------|
| `backend/routes/auth.js` | Login, logout, callback endpoints |
| `backend/middleware/authMiddleware.js` | JWT verification |
| `frontend/src/context/AuthContext.jsx` | Auth state management |
| `frontend/src/pages/AuthCallback.jsx` | Handles OAuth redirect |
| `frontend/src/pages/LandingPage.jsx` | Login button |
| `frontend/src/pages/Dashboard.jsx` | Protected page with logout |

## Protecting API Routes

Add to any route that needs authentication:

```javascript
import { verifyToken } from './middleware/authMiddleware.js';

router.get('/protected-data', verifyToken, (req, res) => {
  // Access user info: req.user
  res.json({ message: 'Secret data!', userId: req.user.sub });
});
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Invalid client_secret" | Check you copied the correct secret from AWS |
| "Invalid redirect_uri" | Verify callback URL in Cognito matches exactly |
| CORS errors | Check `FRONTEND_URL` in backend `.env` |
| Not redirecting after login | Check browser console for errors |
| Session not persisting | Verify `SESSION_SECRET` is set in `.env` |

## Need More Details?

See `COGNITO_AUTH_SETUP.md` for complete documentation.

## Production Checklist

- [ ] Generate strong `SESSION_SECRET`
- [ ] Set production URLs in `.env` files
- [ ] Update Cognito App Client with production URLs
- [ ] Enable HTTPS (required for secure cookies)
- [ ] Consider Redis for session storage
- [ ] Store secrets in AWS Secrets Manager
- [ ] Enable email verification in Cognito
- [ ] Consider enabling MFA

## Next Steps

1. ✅ Test login/logout flow
2. ✅ Verify user info displays on Dashboard
3. Add `verifyToken` middleware to protected API routes
4. Integrate user ID with DynamoDB queries
5. Create user profile management page
6. Deploy to production!

