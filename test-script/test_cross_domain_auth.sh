#!/bin/bash

# Test script for cross-domain authentication
# This script tests both cookie-based and header-based authentication

echo "🔍 Testing Cross-Domain Authentication"
echo "======================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

BASE_URL="http://localhost:3000"
STORAGE_KEY_ENDPOINT="/api/auth/storage-key"

echo -e "${YELLOW}📝 Note: You need to replace 'your_actual_token' with a real Supabase access token${NC}"
echo ""

# Test 1: Cookie-based authentication (same-domain)
echo -e "${YELLOW}🍪 Test 1: Cookie-based authentication (same-domain)${NC}"
echo "curl -b \"sb-access-token=your_actual_token\" ${BASE_URL}${STORAGE_KEY_ENDPOINT}"
echo ""

# Test 2: Header-based authentication (cross-domain)
echo -e "${YELLOW}🔗 Test 2: Header-based authentication (cross-domain)${NC}"
echo "curl -H \"Authorization: Bearer your_actual_token\" ${BASE_URL}${STORAGE_KEY_ENDPOINT}"
echo ""

# Test 3: No authentication (should return default)
echo -e "${YELLOW}❌ Test 3: No authentication (should return default storage key)${NC}"
echo "curl ${BASE_URL}${STORAGE_KEY_ENDPOINT}"
echo ""

# Test 4: Invalid token (should return default)
echo -e "${YELLOW}🚫 Test 4: Invalid token (should return default storage key)${NC}"
echo "curl -H \"Authorization: Bearer invalid_token\" ${BASE_URL}${STORAGE_KEY_ENDPOINT}"
echo ""

echo -e "${GREEN}✅ To run these tests, copy and paste the curl commands above${NC}"
echo -e "${GREEN}✅ Replace 'your_actual_token' with a real Supabase access token${NC}"
echo ""

echo -e "${YELLOW}💡 How to get a real token:${NC}"
echo "1. Log in to your application"
echo "2. Open browser dev tools (F12)"
echo "3. Go to Application/Storage tab"
echo "4. Find 'sb-access-token' cookie"
echo "5. Copy its value"
echo ""

echo -e "${YELLOW}📊 Expected responses:${NC}"
echo "✅ Authenticated: {\"success\": true, \"storageKey\": \"user-email@example.com\", \"authenticated\": true}"
echo "❌ Not authenticated: {\"success\": true, \"storageKey\": \"chebichat-backup\", \"authenticated\": false}"
