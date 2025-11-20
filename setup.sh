#!/bin/bash

echo "🎬 EasyReels Setup Script"
echo "=========================="
echo ""

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "❌ .env.local not found!"
    exit 1
fi

# Check Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker not found. Please install Docker first."
    exit 1
fi

# Start Redis
echo "🔄 Starting Redis..."
if docker ps | grep -q redis-easy-reels; then
    echo "✅ Redis already running"
else
    docker run -d --name redis-easy-reels -p 6379:6379 redis:alpine
    echo "✅ Redis started"
fi

# Check environment
echo ""
echo "🔍 Checking environment variables..."
npx tsx scripts/check-env.ts

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Setup complete!"
    echo ""
    echo "📝 Next steps:"
    echo "1. Run database migration in Supabase Dashboard (copy supabase_schema.sql)"
    echo "2. Terminal 1: npm run dev"
    echo "3. Terminal 2: npm run worker"
    echo ""
else
    echo ""
    echo "❌ Setup incomplete. Please fix the errors above."
    exit 1
fi
