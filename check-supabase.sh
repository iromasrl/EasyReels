#!/bin/bash

echo "🔍 Supabase URL Checker"
echo "======================="
echo ""

echo "Current URL in .env.local:"
grep NEXT_PUBLIC_SUPABASE_URL .env.local | cut -d'=' -f2
echo ""

echo "Testing DNS resolution..."
URL=$(grep NEXT_PUBLIC_SUPABASE_URL .env.local | cut -d'=' -f2)
HOST=$(echo $URL | sed 's|https://||' | sed 's|http://||')

if ping -c 1 $HOST &> /dev/null; then
    echo "✅ DNS resolves correctly"
else
    echo "❌ DNS does not resolve"
    echo ""
    echo "📝 Please verify your Supabase URL:"
    echo "1. Go to https://supabase.com/dashboard"
    echo "2. Select your project"
    echo "3. Go to Settings → API"
    echo "4. Copy the 'Project URL' (should look like: https://xxxxx.supabase.co)"
    echo "5. Update NEXT_PUBLIC_SUPABASE_URL in .env.local"
    echo ""
    echo "Common issues:"
    echo "- Project might be paused (free tier)"
    echo "- URL might have a typo"
    echo "- Project might have been deleted"
fi
