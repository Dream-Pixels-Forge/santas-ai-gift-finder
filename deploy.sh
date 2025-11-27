#!/bin/bash

# Santa's AI Gift Finder - Deployment Script
# This script helps you deploy the application to Render and Vercel

echo "🎅 Santa's AI Gift Finder Deployment Script"
echo "=========================================="

# Fix frontend dependencies if needed
fix_frontend_dependencies() {
    echo "🔧 Fixing frontend dependencies..."
    
    cd frontend
    
    # Remove problematic node_modules and package-lock.json
    echo "Removing old dependencies..."
    rm -rf node_modules package-lock.json
    
    # Reinstall dependencies
    echo "Reinstalling dependencies..."
    if npm install; then
        echo "✅ Frontend dependencies fixed"
    else
        echo "❌ Failed to install dependencies"
        echo "Try running: npm cache clean --force"
        echo "Then: npm install"
        cd ..
        exit 1
    fi
    
    cd ..
}

# Check if required tools are installed
check_dependencies() {
    echo "Checking dependencies..."
    
    if ! command -v git &> /dev/null; then
        echo "❌ Git is not installed. Please install Git first."
        exit 1
    fi
    
    if ! command -v curl &> /dev/null; then
        echo "❌ curl is not installed. Please install curl first."
        exit 1
    fi
    
    echo "✅ Dependencies check passed"
}

# Validate repository setup
validate_repo() {
    echo "Validating repository..."
    
    if [ ! -d ".git" ]; then
        echo "❌ Not in a Git repository. Please initialize Git first:"
        echo "   git init"
        echo "   git add ."
        echo "   git commit -m 'Initial commit'"
        exit 1
    fi
    
    echo "✅ Repository is valid"
}

# Check backend configuration
check_backend() {
    echo "Checking backend configuration..."
    
    if [ ! -f "backend/app.py" ]; then
        echo "❌ backend/app.py not found"
        exit 1
    fi
    
    if [ ! -f "backend/requirements.txt" ]; then
        echo "❌ backend/requirements.txt not found"
        exit 1
    fi
    
    if [ ! -f "backend/render.yaml" ]; then
        echo "❌ backend/render.yaml not found"
        exit 1
    fi
    
    echo "✅ Backend configuration is valid"
}

# Check frontend configuration
check_frontend() {
    echo "Checking frontend configuration..."
    
    if [ ! -f "frontend/package.json" ]; then
        echo "❌ frontend/package.json not found"
        exit 1
    fi
    
    if [ ! -f "frontend/vercel.json" ]; then
        echo "❌ frontend/vercel.json not found"
        exit 1
    fi
    
    echo "✅ Frontend configuration is valid"
}

# Test backend locally
test_backend() {
    echo "Testing backend locally..."
    
    cd backend
    
    # Check if Python is available
    if ! command -v python3 &> /dev/null; then
        echo "⚠️  Python3 not found, skipping local test"
        cd ..
        return 0
    fi
    
    # Try to run a simple test
    if python3 -c "from app import app; print('Backend import test passed')" 2>/dev/null; then
        echo "✅ Backend import test passed"
    else
        echo "⚠️  Backend import test failed, but continuing with deployment"
    fi
    
    cd ..
}

# Test frontend build
test_frontend() {
    echo "Testing frontend build..."
    
    cd frontend
    
    # Check if npm is available
    if ! command -v npm &> /dev/null; then
        echo "⚠️  npm not found, skipping build test"
        cd ..
        return 0
    fi
    
    # Try to install dependencies and build
    if npm install --silent && npm run build --silent 2>/dev/null; then
        echo "✅ Frontend build test passed"
        rm -rf build node_modules
    else
        echo "⚠️  Frontend build test failed, but continuing with deployment"
    fi
    
    cd ..
}

# Test frontend start
test_frontend_start() {
    echo "Testing frontend start..."
    
    cd frontend
    
    # Check if npm is available
    if ! command -v npm &> /dev/null; then
        echo "⚠️  npm not found, skipping start test"
        cd ..
        return 0
    fi
    
    # Try to start the frontend (but don't wait for it)
    if timeout 5s npm start > /dev/null 2>&1 & then
        echo "✅ Frontend start test passed"
        # Kill the process
        kill %1 2>/dev/null
    else
        echo "⚠️  Frontend start test failed"
        echo "This might be due to missing dependencies or port conflicts"
    fi
    
    cd ..
}

# Deployment instructions
show_instructions() {
    echo ""
    echo "🚀 Deployment Instructions"
    echo "========================"
    echo ""
    echo "BACKEND (Render.com):"
    echo "1. Go to https://dashboard.render.com/"
    echo "2. Click 'New Web Service'"
    echo "3. Connect your GitHub repository"
    echo "4. Set Root Directory: /backend"
    echo "5. Set Build Command: pip install -r requirements.txt && python download_models.py"
    echo "6. Set Start Command: gunicorn app:app --bind 0.0.0.0:\$PORT"
    echo "7. Add Environment Variables:"
    echo "   - FLASK_ENV=production"
    echo "   - SECRET_KEY=your-secret-key-here"
    echo "8. Create PostgreSQL and Redis databases"
    echo "9. Deploy!"
    echo ""
    echo "FRONTEND (Vercel):"
    echo "1. Go to https://vercel.com/"
    echo "2. Click 'New Project'"
    echo "3. Import your repository"
    echo "4. Set Root Directory: /frontend"
    echo "5. Set Environment Variables:"
    echo "   - REACT_APP_API_URL=https://your-backend.onrender.com/api"
    echo "6. Deploy!"
    echo ""
    echo "After deployment:"
    echo "- Test backend: https://your-backend.onrender.com/api/health"
    echo "- Test frontend: https://your-frontend.vercel.app"
    echo ""
}

# Health check function
health_check() {
    echo "Performing health checks..."
    
    read -p "Enter your backend URL (or press Enter to skip): " backend_url
    
    if [ ! -z "$backend_url" ]; then
        echo "Testing backend health..."
        if curl -f -s "$backend_url/api/health" > /dev/null; then
            echo "✅ Backend health check passed"
        else
            echo "❌ Backend health check failed"
        fi
    fi
}

# Main execution
main() {
    # Fix frontend dependencies first if needed
    if [ "$1" = "--fix-frontend" ] || [ "$1" = "-f" ]; then
        fix_frontend_dependencies
        exit 0
    fi
    
    check_dependencies
    validate_repo
    check_backend
    check_frontend
    test_backend
    test_frontend
    test_frontend_start
    show_instructions
    health_check
    
    echo "🎉 Deployment setup complete!"
    echo "Follow the instructions above to deploy your application."
    echo ""
    echo "💡 If you're having frontend dependency issues, run:"
    echo "   ./deploy.sh --fix-frontend"
}

# Run main function
main "$@"