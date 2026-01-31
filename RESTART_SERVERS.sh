#!/bin/bash

echo "🔄 Restarting LPL Heritage Hub Servers..."
echo ""

# Kill existing processes
echo "Stopping existing servers..."
pkill -f "vite.*lpl-heritage-hub" 2>/dev/null
pkill -f "python.*app.py.*lpl-heritage-hub" 2>/dev/null
sleep 2

# Start backend
echo "Starting Flask backend (port 5001)..."
cd "$(dirname "$0")"
python3 app.py > /tmp/flask-server.log 2>&1 &
BACKEND_PID=$!
sleep 3

# Start frontend
echo "Starting Vite frontend (port 5173)..."
npm run dev > /tmp/vite-server.log 2>&1 &
FRONTEND_PID=$!
sleep 5

# Check status
echo ""
echo "Checking server status..."
if lsof -i :5001 | grep -q LISTEN; then
    echo "✓ Backend running on http://localhost:5001"
else
    echo "✗ Backend failed to start. Check /tmp/flask-server.log"
fi

if lsof -i :5173 | grep -q LISTEN; then
    echo "✓ Frontend running on http://localhost:5173"
    echo ""
    echo "Opening browser..."
    open http://localhost:5173
else
    echo "✗ Frontend failed to start. Check /tmp/vite-server.log"
fi

echo ""
echo "Server logs:"
echo "  Backend:  tail -f /tmp/flask-server.log"
echo "  Frontend: tail -f /tmp/vite-server.log"
echo ""
echo "✅ Done!"
