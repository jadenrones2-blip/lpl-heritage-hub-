#!/bin/bash

echo "🔍 LPL Heritage Hub - Server Status Check"
echo "=========================================="
echo ""

# Check Frontend
echo "📱 Frontend (Vite):"
if lsof -i :5173 | grep -q LISTEN; then
    echo "  ✓ Running on http://localhost:5173"
    curl -s http://localhost:5173 > /dev/null 2>&1 && echo "  ✓ Responding to requests" || echo "  ✗ Not responding"
else
    echo "  ✗ NOT RUNNING"
    echo "  → Start with: npm run dev"
fi
echo ""

# Check Backend
echo "🔧 Backend (Flask):"
if lsof -i :5001 | grep -q LISTEN; then
    echo "  ✓ Running on http://localhost:5001"
    HEALTH=$(curl -s http://localhost:5001/health 2>/dev/null)
    if echo "$HEALTH" | grep -q "healthy"; then
        echo "  ✓ Health check passed"
        echo "$HEALTH" | python3 -m json.tool 2>/dev/null | head -5
    else
        echo "  ✗ Health check failed"
    fi
else
    echo "  ✗ NOT RUNNING"
    echo "  → Start with: python3 app.py"
fi
echo ""

# Check API Proxy
echo "🔗 API Proxy:"
PROXY_TEST=$(curl -s http://localhost:5173/api/quiz/start 2>/dev/null)
if echo "$PROXY_TEST" | grep -q "questions"; then
    echo "  ✓ Proxy working - API calls routed correctly"
else
    echo "  ✗ Proxy not working"
    echo "  → Check vite.config.js proxy settings"
fi
echo ""

# Check Ports
echo "📊 Port Status:"
echo "  Port 5173 (Frontend): $(lsof -i :5173 | grep LISTEN | wc -l | xargs) process(es)"
echo "  Port 5001 (Backend): $(lsof -i :5001 | grep LISTEN | wc -l | xargs) process(es)"
echo ""

# Summary
if lsof -i :5173 | grep -q LISTEN && lsof -i :5001 | grep -q LISTEN; then
    echo "✅ ALL SYSTEMS OPERATIONAL"
    echo ""
    echo "🌐 Access your application:"
    echo "   http://localhost:5173"
    echo ""
    echo "💡 If browser doesn't open automatically:"
    echo "   open http://localhost:5173"
else
    echo "⚠️  SOME SERVERS NOT RUNNING"
    echo ""
    echo "🔧 To restart everything:"
    echo "   ./RESTART_SERVERS.sh"
fi
