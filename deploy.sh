#!/bin/bash

# 🚀 AI Website Agent Deployment Script
# This script helps deploy the application while keeping environment variables secure

set -e

echo "🚀 Starting AI Website Agent Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if .env file exists and is protected
if [ -f ".env" ]; then
    print_success ".env file found and protected by .gitignore"
else
    print_warning ".env file not found. Make sure to create one from env.example"
fi

# Check if .gitignore contains .env
if grep -q "\.env" .gitignore; then
    print_success ".env is properly excluded from Git"
else
    print_error ".env is not in .gitignore! Please add it."
    exit 1
fi

# Build backend
print_status "Building backend..."
npm run build
print_success "Backend built successfully"

# Build frontend
print_status "Building frontend..."
cd frontend
npm run build
cd ..
print_success "Frontend built successfully"

echo ""
echo "🎯 Deployment Options:"
echo "1. Deploy to Railway (Backend) + Vercel (Frontend) - Recommended"
echo "2. Deploy to Render (Backend) + Vercel (Frontend)"
echo "3. Deploy to Fly.io (Backend) + Vercel (Frontend)"
echo "4. Manual deployment instructions"
echo ""

read -p "Choose deployment option (1-4): " choice

case $choice in
    1)
        print_status "Deploying to Railway + Vercel..."
        
        # Check if Railway CLI is installed
        if ! command -v railway &> /dev/null; then
            print_status "Installing Railway CLI..."
            npm install -g @railway/cli
        fi
        
        print_status "Deploying backend to Railway..."
        railway up
        
        print_status "Getting Railway URL..."
        RAILWAY_URL=$(railway status --json | grep -o '"url":"[^"]*"' | cut -d'"' -f4)
        
        if [ -n "$RAILWAY_URL" ]; then
            print_success "Backend deployed to: $RAILWAY_URL"
            echo ""
            print_status "Next steps:"
            echo "1. Deploy frontend to Vercel:"
            echo "   cd frontend && vercel --prod"
            echo ""
            echo "2. Set environment variable in Vercel:"
            echo "   VITE_API_URL=$RAILWAY_URL"
            echo ""
            echo "3. Set CORS_ORIGIN in Railway to your Vercel domain"
        else
            print_error "Could not get Railway URL. Please check Railway dashboard."
        fi
        ;;
        
    2)
        print_status "Deploying to Render + Vercel..."
        print_warning "Please deploy manually to Render:"
        echo "1. Connect your GitHub repo to Render"
        echo "2. Set build command: npm run build"
        echo "3. Set start command: npm run start:prod"
        echo "4. Add environment variables in Render dashboard"
        echo ""
        print_status "Then deploy frontend:"
        echo "cd frontend && vercel --prod"
        ;;
        
    3)
        print_status "Deploying to Fly.io + Vercel..."
        
        # Check if Fly CLI is installed
        if ! command -v fly &> /dev/null; then
            print_status "Installing Fly CLI..."
            curl -L https://fly.io/install.sh | sh
        fi
        
        print_status "Deploying backend to Fly.io..."
        fly launch
        fly deploy
        
        print_status "Deploying frontend to Vercel..."
        cd frontend
        vercel --prod
        cd ..
        ;;
        
    4)
        echo ""
        print_status "Manual Deployment Instructions:"
        echo ""
        echo "🔧 Backend Deployment:"
        echo "1. Choose a platform: Railway, Render, or Fly.io"
        echo "2. Connect your GitHub repository"
        echo "3. Set build command: npm run build"
        echo "4. Set start command: npm run start:prod"
        echo "5. Add environment variables (see DEPLOYMENT.md)"
        echo ""
        echo "🌐 Frontend Deployment:"
        echo "1. Install Vercel CLI: npm install -g vercel"
        echo "2. Deploy: cd frontend && vercel --prod"
        echo "3. Set VITE_API_URL environment variable"
        echo ""
        echo "📖 See DEPLOYMENT.md for detailed instructions"
        ;;
        
    *)
        print_error "Invalid choice. Please run the script again."
        exit 1
        ;;
esac

echo ""
print_success "Deployment script completed!"
echo ""
print_status "Remember to:"
echo "✅ Set environment variables in your deployment platform"
echo "✅ Configure CORS_ORIGIN to match your frontend domain"
echo "✅ Test the application after deployment"
echo "✅ Monitor logs for any issues"
echo ""
print_status "For detailed instructions, see DEPLOYMENT.md"

