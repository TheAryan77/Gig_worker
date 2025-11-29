#!/bin/bash

echo "🔥 TrustHire Docker Setup Script"
echo "================================="
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ .env file not found!"
    echo "📝 Creating .env file..."
    cat > .env << 'EOF'
# Firebase Configuration - Replace with your actual values
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
EOF
    echo "✅ .env file created!"
    echo "⚠️  Please edit .env file and add your Firebase credentials"
    echo ""
    echo "After updating .env, run this script again or run:"
    echo "  docker-compose up --build"
    exit 1
fi

# Check if environment variables are set
source .env

if [ -z "$NEXT_PUBLIC_FIREBASE_API_KEY" ]; then
    echo "⚠️  Warning: Firebase credentials are not set in .env file"
    echo "📝 Please edit .env file and add your Firebase credentials"
    echo ""
    read -p "Do you want to continue anyway? (y/N): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo "🐳 Starting Docker build..."
echo ""

# Build and run with docker-compose
docker-compose up --build

echo ""
echo "✅ Done! Your application should be running on http://localhost:3000"
