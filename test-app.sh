#!/bin/bash

echo "🧪 Testing Halow Application"
echo "================================="

# Wait for server to start
sleep 3

echo "📡 Testing server availability..."
if curl -s -o /dev/null -w "%{http_code}" http://localhost:3400 | grep -q "200\|302"; then
    echo "✅ Server is responding"
else
    echo "❌ Server is not responding"
    exit 1
fi

echo ""
echo "🚀 Testing Deployment tab..."
STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3400/deployment)
echo "Status: $STATUS"
if [ "$STATUS" = "200" ]; then
    echo "✅ Deployment tab loads successfully"
else
    echo "❌ Deployment tab failed to load"
fi

echo ""
echo "🔐 Testing Secrets tab..."
STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3400/secrets)
echo "Status: $STATUS"
if [ "$STATUS" = "200" ]; then
    echo "✅ Secrets tab loads successfully"
else
    echo "❌ Secrets tab failed to load"
    echo "Getting error details..."
    curl -s http://localhost:3400/secrets | head -10
fi

echo ""
echo "🏥 Testing health endpoints..."
curl -s http://localhost:3400/probe/readiness | jq -r '.status' 2>/dev/null && echo " - Readiness: OK" || echo " - Readiness: Failed"

echo ""
echo "📊 Application is ready!"
echo "🌐 Open http://localhost:3400 in your browser"
echo "📱 Available tabs:"
echo "   - Deployment: http://localhost:3400/deployment"
echo "   - Secrets: http://localhost:3400/secrets"