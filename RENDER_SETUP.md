# Render.com Dashboard Setup Instructions

## Backend Setup

1. **Create Web Service**
   - Go to https://dashboard.render.com/
   - Click "New Web Service"
   - Connect your GitHub repository

2. **Service Configuration**
   - Name: `santas-ai-gift-finder-backend`
   - Region: `oregon` (or closest to your users)
   - Branch: `main`

3. **Build Settings**
   - Root Directory: `/backend`
   - Runtime: `Python 3.9+`
   - Build Command: `pip install -r requirements.txt && python download_models.py`
   - Start Command: `gunicorn app:app --bind 0.0.0.0:$PORT`

4. **Environment Variables**
   Add these variables in the "Environment" tab:
   ```
   FLASK_ENV=production
   SECRET_KEY=your-super-secret-key-here
   ```

5. **Databases Setup**
   - Create PostgreSQL database: `santas-gift-finder-db`
   - Create Redis instance: `santas-gift-finder-redis`

6. **Auto-Generated Variables**
   Render will auto-generate:
   - `DATABASE_URL` (from PostgreSQL)
   - `REDIS_URL` (from Redis)

7. **Deploy**
   - Click "Create Web Service"
   - Wait for deployment to complete
   - Note the service URL (e.g., `https://santas-ai-gift-finder-backend.onrender.com`)

## Frontend Setup (Vercel)

1. **Create Project**
   - Go to https://vercel.com/
   - Click "New Project"
   - Import your repository

2. **Project Configuration**
   - Name: `santas-ai-gift-finder-frontend`
   - Framework: `Create React App`
   - Root Directory: `/frontend`

3. **Build Settings**
   - Build Command: `npm run build`
   - Output Directory: `build`
   - Install Command: `npm install`

4. **Environment Variables**
   Add in "Settings" > "Environment Variables":
   ```
   REACT_APP_API_URL=https://santas-ai-gift-finder-backend.onrender.com/api
   ```

5. **Deploy**
   - Click "Deploy"
   - Wait for deployment
   - Note the production URL

## Post-Deployment

1. **Test Backend**
   Visit: `https://santas-ai-gift-finder-backend.onrender.com/api/health`

2. **Test Frontend**
   Visit your Vercel deployment URL

3. **Integration Test**
   Try searching for a gift in the frontend to ensure API integration works

## Custom Domains

### Backend (Render)
1. Go to service settings
2. Add custom domain
3. Update DNS: `CNAME` to `cname.onrender.com`

### Frontend (Vercel)
1. Go to Project Settings > Domains
2. Add custom domain
3. Follow DNS setup instructions

## Monitoring

- **Render Logs**: Service dashboard > Logs
- **Vercel Analytics**: Project dashboard
- **Health Check**: `GET /api/health`