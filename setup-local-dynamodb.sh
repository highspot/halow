#!/bin/bash

# Script to set up and test Halow app with DynamoDB Local
# Make sure DynamoDB Local is running on port 8000

echo "🔧 Setting up Halow app for DynamoDB Local testing..."

# Check if DynamoDB Local is running
if ! curl -s http://localhost:8000 > /dev/null; then
    echo "❌ DynamoDB Local is not running on port 8000"
    echo "💡 Start it with: dynamodb-local (if installed via Homebrew)"
    echo "💡 Or: java -Djava.library.path=./DynamoDBLocal_lib -jar DynamoDBLocal.jar -sharedDb -port 8000"
    exit 1
fi

echo "✅ DynamoDB Local is running on port 8000"

# Set environment variables for DynamoDB Local
export AWS_ENDPOINT_URL=http://localhost:8000
export AWS_ACCESS_KEY_ID=dummy
export AWS_SECRET_ACCESS_KEY=dummy
export AWS_REGION=us-east-1
export DYNAMODB_TABLE_NAME=halow-data-local
export NODE_ENV=development
export PORT=3400

echo "📊 Creating DynamoDB table..."

# Create the table if it doesn't exist
aws dynamodb create-table \
  --table-name halow-data-local \
  --attribute-definitions AttributeName=id,AttributeType=S \
  --key-schema AttributeName=id,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --endpoint-url http://localhost:8000 \
  --region us-east-1 \
  --no-cli-pager 2>/dev/null || echo "📋 Table may already exist"

echo "✅ Table setup complete"

# Verify table exists
echo "🔍 Verifying table..."
aws dynamodb describe-table \
  --table-name halow-data-local \
  --endpoint-url http://localhost:8000 \
  --region us-east-1 \
  --no-cli-pager | grep "TableStatus" || echo "❌ Table verification failed"

echo ""
echo "🚀 Starting Halow development server..."
echo "📱 Open http://localhost:3400 in your browser"
echo "📊 Dashboard will connect to local DynamoDB"
echo ""

# Start the application
npm run dev