# 🚀 Deployment Guide

This guide explains how to deploy the AI Website Agent while keeping your environment variables secure.

## 🔒 Environment Variables Security

### ✅ What's Protected
- `.env` files are now in `.gitignore` and won't be uploaded to Git
- Sensitive API keys and configuration are kept secure
- Environment variables are managed through deployment platforms

### ❌ What's NOT Uploaded
- Your local `.env` file with API keys
- Database credentials
- Private configuration files
- Log files and build artifacts

## 🌐 Frontend Deployment (Vercel)

### Step 1: Prepare Frontend
```bash
cd frontend
npm run build
```

### Step 2: Deploy to Vercel
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy from frontend directory
cd frontend
vercel --prod
```

### Step 3: Configure Environment Variables in Vercel
1. Go to your Vercel dashboard
2. Select your project
3. Go to Settings → Environment Variables
4. Add the following variables:

| Variable Name | Value | Environment |
|---------------|-------|-------------|
| `VITE_API_URL` | `https://your-backend-url.com` | Production |
| `VITE_API_URL` | `http://localhost:3001` | Preview |

## 🔧 Backend Deployment Options

### Option 1: Railway (Recommended)
```bash
# Install Railway CLI
npm install -g @railway/cli

# Deploy from project root
railway login
railway init
railway up
```

### Option 2: Render
1. Connect your GitHub repository to Render
2. Set build command: `npm run build`
3. Set start command: `npm run start:prod`
4. Add environment variables in Render dashboard

### Option 3: Fly.io
```bash
# Install Fly CLI
curl -L https://fly.io/install.sh | sh

# Deploy
fly launch
fly deploy
```

## 🔑 Environment Variables Setup

### Backend Environment Variables
Add these to your deployment platform (Railway/Render/Fly.io):

```env
# Server Configuration
PORT=3001
NODE_ENV=production

# OpenAI (Optional)
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-3.5-turbo
OPENAI_MAX_TOKENS=1000
OPENAI_TEMPERATURE=0.3

# Web Scraping
REQUEST_TIMEOUT=30000
MAX_RETRIES=3
USER_AGENT_ROTATION=false
RATE_LIMIT=60
DELAY_BETWEEN_REQUESTS=1000

# Browser Configuration
HEADLESS_MODE=true
BROWSER_WINDOW_SIZE=1920,1080
DEFAULT_USER_AGENT=Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36

# Analysis Configuration
ENABLE_AI_ANALYSIS=true
SAVE_RAW_DATA=false
DEFAULT_OUTPUT_FORMAT=json

# Logging
LOG_LEVEL=info
LOG_FILE=logs/agent.log
LOG_MAX_SIZE=20m
LOG_MAX_FILES=14d

# CORS (Important for frontend communication)
CORS_ORIGIN=https://your-frontend-domain.vercel.app
```

### Frontend Environment Variables
Add these to Vercel:

```env
# API Configuration
VITE_API_URL=https://your-backend-url.com
```

## 🔄 Connecting Frontend to Backend

### 1. Get Backend URL
After deploying your backend, get the URL:
- **Railway**: `https://your-app-name.railway.app`
- **Render**: `https://your-app-name.onrender.com`
- **Fly.io**: `https://your-app-name.fly.dev`

### 2. Update Frontend Configuration
In Vercel dashboard, set:
```
VITE_API_URL=https://your-backend-url.com
```

### 3. Redeploy Frontend
```bash
cd frontend
vercel --prod
```

## 🛡️ Security Best Practices

### ✅ Do's
- Use environment variables for all sensitive data
- Keep `.env` files out of Git
- Use HTTPS in production
- Set up proper CORS configuration
- Use strong, unique API keys

### ❌ Don'ts
- Never commit `.env` files to Git
- Don't hardcode API keys in source code
- Don't expose sensitive data in client-side code
- Don't use development URLs in production

## 🔍 Verification Steps

### 1. Check Environment Variables
```bash
# Backend
curl https://your-backend-url.com/analysis/status

# Should return status without errors
```

### 2. Test Frontend-Backend Connection
1. Open your frontend URL
2. Try analyzing a website
3. Check browser network tab for API calls
4. Verify data is being fetched from backend

### 3. Monitor Logs
- Check deployment platform logs for errors
- Monitor API response times
- Watch for CORS or authentication issues

## 🚨 Troubleshooting

### Common Issues

#### Frontend Can't Connect to Backend
- Check `VITE_API_URL` environment variable
- Verify backend is running and accessible
- Check CORS configuration in backend

#### Environment Variables Not Working
- Ensure variables are set in deployment platform
- Check variable names match exactly
- Redeploy after adding new variables

#### Build Failures
- Check for missing dependencies
- Verify TypeScript compilation
- Check for syntax errors

### Getting Help
1. Check deployment platform logs
2. Verify environment variables are set correctly
3. Test locally with same configuration
4. Check browser console for frontend errors

## 📝 Deployment Checklist

- [ ] `.env` file is in `.gitignore`
- [ ] Backend deployed and accessible
- [ ] Environment variables configured in backend
- [ ] Frontend deployed to Vercel
- [ ] `VITE_API_URL` set in Vercel
- [ ] CORS configured for frontend domain
- [ ] Test analysis functionality
- [ ] Monitor logs for errors
- [ ] Verify HTTPS is working

## 🎯 Quick Deploy Commands

```bash
# Backend (Railway)
railway up

# Frontend (Vercel)
cd frontend && vercel --prod

# Check status
curl https://your-backend-url.com/analysis/status
```

Your application is now ready for secure deployment! 🚀
