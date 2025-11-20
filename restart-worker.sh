#!/bin/bash

echo "🔍 Checking database and restarting worker..."

# Check if columns exist
echo ""
echo "Run this SQL in Supabase Dashboard to add missing columns:"
echo "----------------------------------------"
cat add_language_format.sql
echo "----------------------------------------"
echo ""
echo "After running the SQL, press any key to restart the worker..."
read -n 1 -s

echo ""
echo "🔄 Restarting worker..."
pkill -f "tsx src/workers/run.ts"
sleep 2
npm run worker
