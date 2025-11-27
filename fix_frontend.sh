#!/bin/bash

# Quick fix for frontend react-scripts issue
echo "🔧 Fixing frontend dependencies..."

cd frontend

# Remove problematic dependencies
echo "Removing old node_modules and package-lock.json..."
rm -rf node_modules package-lock.json

# Clean npm cache
echo "Cleaning npm cache..."
npm cache clean --force

# Reinstall dependencies
echo "Reinstalling dependencies..."
npm install

# Test if react-scripts is now available
if npx react-scripts --version > /dev/null 2>&1; then
    echo "✅ Frontend dependencies fixed successfully!"
    echo "You can now run: npm start"
else
    echo "❌ Still having issues. Try:"
    echo "   npm install react-scripts@5.0.1 --save-dev"
    echo "   npm install"
fi

cd ..