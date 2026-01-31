#!/bin/bash

echo "🚀 LPL Heritage Hub - Starting Demo..."
echo ""

# Check if servers are running
FRONTEND_RUNNING=$(lsof -i :5173 | grep LISTEN)
BACKEND_RUNNING=$(lsof -i :5001 | grep LISTEN)

if [ -z "$FRONTEND_RUNNING" ]; then
    echo "Starting frontend server..."
    cd "$(dirname "$0")"
    npm run dev > /tmp/vite-demo.log 2>&1 &
    sleep 3
    echo "✓ Frontend starting on http://localhost:5173"
else
    echo "✓ Frontend already running on http://localhost:5173"
fi

if [ -z "$BACKEND_RUNNING" ]; then
    echo "⚠️  Backend not running. Start it with: python3 app.py"
else
    echo "✓ Backend already running on http://localhost:5001"
fi

echo ""
echo "=== DEMO ACCESS ==="
echo "📍 Frontend: http://localhost:5173"
echo "📍 Backend API: http://localhost:5001"
echo ""
echo "Opening browser..."
open http://localhost:5173

echo ""
echo "✅ Ready for demo!"
echo ""
echo "Demo Flow:"
echo "1. Dashboard (Quiz) - Personalization"
echo "2. Echo - NIGO Detection (Main Feature)"
echo "3. Portfolio - Goals & Summary"
echo ""
