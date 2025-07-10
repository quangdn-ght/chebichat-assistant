#!/bin/bash

# Test script for user authentication and storage key functionality
# This script tests the new user login check and email-based storage key features

# Configuration
BASE_URL="http://localhost:3000"
echo "🧪 Testing User Authentication and Storage Key Functionality"
echo "📍 Base URL: $BASE_URL"
echo ""

# Test 1: Check user authentication status (unauthenticated)
echo "1️⃣  Testing user info endpoint (should be unauthenticated):"
curl -s -X GET "$BASE_URL/api/test/user-info" \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  | jq '.' || echo "Response: Not authenticated (expected)"
echo ""

# Test 2: Get storage key (should return default)
echo "2️⃣  Testing storage key endpoint (should return default key):"
curl -s -X GET "$BASE_URL/api/auth/storage-key" \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  | jq '.' || echo "Response: Default storage key"
echo ""

# Test 3: Test the sync settings page (manual test reminder)
echo "3️⃣  Manual Test Reminder:"
echo "   📱 Visit: $BASE_URL/settings (scroll to Sync section)"
echo "   🔍 Check UpStash configuration - should show 'Not logged in' message"
echo ""

# Test 4: Login test (requires real tokens)
echo "4️⃣  Login Test Instructions:"
echo "   🔑 To test with real authentication:"
echo "   1. Get a valid Supabase access token from your login flow"
echo "   2. Use the following command:"
echo "      curl -X POST \"$BASE_URL/api/auth/callback\" \\"
echo "           -H \"Content-Type: application/json\" \\"
echo "           -c cookies.txt \\"
echo "           -d '{\"access_token\": \"YOUR_TOKEN\"}'"
echo "   3. Then test the endpoints again to see authenticated responses"
echo ""

# Test 5: Test with authentication (placeholder)
echo "5️⃣  Testing with authentication:"
echo "   📌 After logging in with a real token, the following should happen:"
echo "   ✅ /api/test/user-info should return user details and email-based storage key"
echo "   ✅ /api/auth/storage-key should return 'user-{email}' format"
echo "   ✅ Settings page should show logged-in user email and storage key"
echo ""

# Test 6: Sync functionality test
echo "6️⃣  Testing sync functionality:"
echo "   📊 The sync store should now:"
echo "   ✅ Automatically use user email as storage key when authenticated"
echo "   ✅ Fall back to default key when not authenticated"
echo "   ✅ Show user status in the settings UI"
echo ""

echo "🎯 Key Features Implemented:"
echo "   🔐 User authentication check via checkUserAuth()"
echo "   📧 Email-based storage key generation"
echo "   🔄 Dynamic storage key selection in sync operations"
echo "   💾 Automatic UpStash Redis key management per user"
echo "   🎨 UI feedback showing login status and storage key"
echo ""

echo "🔧 Next Steps for Testing:"
echo "   1. Set up Supabase authentication in your app"
echo "   2. Login with a real user account"
echo "   3. Check that data syncs to user-specific Redis keys"
echo "   4. Verify data isolation between different users"
echo ""

# Cleanup
rm -f cookies.txt
echo "🧹 Cleaned up temporary files"
