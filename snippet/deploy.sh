#!/bin/bash

echo "🚀 Deploying Viriato Chatbot Snippet to Vercel..."

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Installing..."
    npm install -g vercel
fi

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ package.json not found. Please run this script from the snippet directory."
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build the project
echo "🔨 Building project..."
npm run build

# Deploy to Vercel
echo "🚀 Deploying to Vercel..."
vercel --prod

echo "✅ Deployment complete!"
echo ""
echo "📋 Next steps:"
echo "1. Set environment variables in Vercel dashboard"
echo "2. Update your snippet configuration with the new URL"
echo "3. Test the chatbot on your website"
echo ""
echo "🔗 Your snippet URL will be: https://your-app-name.vercel.app/chatbot-snippet.js"
echo "🔗 Your API URL will be: https://your-app-name.vercel.app/api/chat" 