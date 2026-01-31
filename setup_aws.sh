#!/bin/bash
# Quick setup script for AWS credentials

echo "🔧 Setting up AWS credentials for LPL Heritage Hub"
echo ""
echo "Please enter your AWS credentials:"
echo ""

read -p "AWS Access Key ID: " AWS_KEY
read -sp "AWS Secret Access Key: " AWS_SECRET
echo ""
read -p "AWS Region (default: us-east-1): " AWS_REGION
AWS_REGION=${AWS_REGION:-us-east-1}

cat > .env << EOF
# Demo Mode (set to False when you have AWS credentials)
DEMO_MODE=False

# AWS Credentials
AWS_ACCESS_KEY_ID=${AWS_KEY}
AWS_SECRET_ACCESS_KEY=${AWS_SECRET}
AWS_REGION=${AWS_REGION}

# Flask Configuration
FLASK_DEBUG=True
PORT=5000
EOF

echo ""
echo "✓ .env file updated with your AWS credentials"
echo "✓ DEMO_MODE set to False - using real AWS services"
echo ""
echo "You can now run: python app.py"
