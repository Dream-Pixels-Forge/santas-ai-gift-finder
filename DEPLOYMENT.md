# Santa's AI Gift Finder - Deployment Guide

This guide will help you deploy the Santa's AI Gift Finder application to Vercel (frontend) and Render (backend).

## Architecture

- **Frontend**: React app deployed on Vercel
- **Backend**: Flask API deployed on Render
- **Database**: PostgreSQL on Render
- **Cache**: Redis on Render

## Prerequisites

1. Accounts on [Vercel](https://vercel.com/) and [Render](https://render.com/)
2. Git repository (GitHub, GitLab, or Bitbucket)
3. Docker (optional, for local testing)

## Backend Deployment on Render

### 1. Connect Repository
1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click "New Web Service"
3. Connect your GitHub/GitLab repository
4. Select the `santas-ai-gift-finder/backend` directory

### 2. Configuration
- **Name**: `santas-ai-gift-finder-backend`
- **Runtime**: Python
- **Build Command**: `pip install -r requirements.txt && python download_models.py`
- **Start Command**: `gunicorn app:app --bind 0.0.0.0:$PORT`

### 3. Environment Variables
Add these environment variables in Render dashboard:

```
FLASK_ENV=production
SECRET_KEY=your-secret-key-here
DATABASE_URL=postgresql://... (auto-generated)
REDIS_URL=redis://... (auto-generated)
```

### 4. Databases
Render will automatically create:
- PostgreSQL database named `santas-gift-finder-db`
- Redis instance named `santas-gift-finder-redis`

### 5. Deploy
Click "Create Web Service" and wait for the deployment to complete.

## Frontend Deployment on Vercel

### 1. Connect Repository
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import your Git repository
4. Select the `santas-ai-gift-finder/frontend` directory

### 2. Configuration
- **Framework Preset**: React
- **Build Command**: `npm run build`
- **Output Directory**: `build`
- **Install Command**: `npm install`

### 3. Environment Variables
Add these environment variables:

```
REACT_APP_API_URL=https://santas-ai-gift-finder-backend.onrender.com/api
```

### 4. Deploy
Click "Deploy" and wait for the deployment to complete.

## Manual Deployment Commands

### Backend (Render)
```bash
# In the backend directory
pip install -r requirements.txt
python download_models.py
gunicorn app:app --bind 0.0.0.0:$PORT
```

### Frontend (Vercel)
```bash
# In the frontend directory
npm install
npm run build
# Serve the build directory
```

## Environment Variables Reference

### Backend (.env)
```env
FLASK_APP=app.py
FLASK_ENV=production
SECRET_KEY=your-secret-key-here
DATABASE_URL=postgresql://user:password@host:port/database
CACHE_TYPE=redis
REDIS_URL=redis://host:port
```

### Frontend (.env)
```env
REACT_APP_API_URL=https://your-backend-url.com/api
```

## Troubleshooting

### Common Issues

1. **Backend not starting**: Check logs in Render dashboard for Python errors
2. **Frontend API calls failing**: Verify `REACT_APP_API_URL` is correct
3. **Database connection errors**: Ensure DATABASE_URL is properly set
4. **Model download failures**: Check if spaCy models download correctly during build

### Debug Commands

```bash
# Check backend logs
curl https://your-backend.onrender.com/api/health

# Check frontend build
npm run build --verbose

# Test API locally
curl http://localhost:5000/api/health
```

## Custom Domain Setup

### Backend (Render)
1. Go to your service settings
2. Add custom domain under "Custom Domains"
3. Update DNS settings as instructed

### Frontend (Vercel)
1. Go to Project Settings > Domains
2. Add your custom domain
3. Configure DNS settings

## Monitoring

- **Render**: Built-in logs and metrics
- **Vercel**: Analytics and logs in dashboard
- **Health Check**: `GET /api/health`

## Scaling

### Backend
- Upgrade Render plan for more resources
- Enable horizontal scaling if needed
- Monitor database connections

### Frontend
- Vercel automatically scales static sites
- Consider edge network for global performance

## Security

1. Change default SECRET_KEY
2. Use HTTPS (automatic on Render/Vercel)
3. Validate API inputs
4. Rate limiting (consider adding)