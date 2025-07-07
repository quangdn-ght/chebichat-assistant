#!/bin/bash

# Test Script for Authentication System
# This script demonstrates how to test the authentication endpoints

echo "🔐 Authentication System Test Script"
echo "====================================="
echo ""

# Base URL (adjust as needed)
BASE_URL="http://localhost:3000"

# Test token (replace with a real Supabase token for actual testing)
TEST_TOKEN="eyJhbGciOiJIUzI1NiIsImtpZCI6InhXR2xGVUY3KytFRmdqN2siLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL3p6Z2t5bHNiZGd3b29oY2JvbXBpLnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiIyZjg4NzZlMy01NGYxLTQ3ODUtODFlMC0zYzcyMmYyM2E4YTkiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzUyNDkyMTU2LCJpYXQiOjE3NTE4ODczNTYsImVtYWlsIjoicXVhbmdkbkBnaWFodW5ndGVjaC5jb20udm4iLCJwaG9uZSI6IiIsImFwcF9tZXRhZGF0YSI6eyJwcm92aWRlciI6Imdvb2dsZSIsInByb3ZpZGVycyI6WyJnb29nbGUiXX0sInVzZXJfbWV0YWRhdGEiOnsiYXZhdGFyX3VybCI6Imh0dHBzOi8venpna3lsc2JkZ3dvb2hjYm9tcGkuc3VwYWJhc2UuY28vc3RvcmFnZS92MS9vYmplY3QvcHVibGljL2F2YXRhcnMvMmY4ODc2ZTMtNTRmMS00Nzg1LTgxZTAtM2M3MjJmMjNhOGE5L2F2YXRhci5qcGciLCJjdXN0b21fY2xhaW1zIjp7ImhkIjoiZ2lhaHVuZ3RlY2guY29tLnZuIn0sImVtYWlsIjoicXVhbmdkbkBnaWFodW5ndGVjaC5jb20udm4iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwiZnVsbF9uYW1lIjoiTmjhuq10IFF1YW5nIMSQ4buXIiwiaXNzIjoiaHR0cHM6Ly9hY2NvdW50cy5nb29nbGUuY29tIiwibmFtZSI6Ik5o4bqtdCBRdWFuZyDEkOG7lyIsInBob25lX3ZlcmlmaWVkIjpmYWxzZSwicHJvdmlkZXJfaWQiOiIxMDY3ODcyNzQyMTEwMDM2Mjc3ODUiLCJzdWIiOiIxMDY3ODcyNzQyMTEwMDM2Mjc3ODUifSwicm9sZSI6ImF1dGhlbnRpY2F0ZWQiLCJhYWwiOiJhYWwxIiwiYW1yIjpbeyJtZXRob2QiOiJvYXV0aCIsInRpbWVzdGFtcCI6MTc1MTg4NzM1Nn1dLCJzZXNzaW9uX2lkIjoiY2ZlZjBhMzctZDdjYi00OWQwLWExODEtOTA1YjIxNzk5Y2ZhIiwiaXNfYW5vbnltb3VzIjpmYWxzZX0.vKSX_n5HazYDNFpNa-HUjtY9wWrb7bWPsrhDtEzXcDg"
REFRESH_TOKEN="your_supabase_refresh_token_here"

echo "📋 Testing Authentication Endpoints..."
echo ""

# Test 1: Check auth status (should be unauthenticated)
echo "1️⃣  Testing auth check (should be unauthenticated):"
curl -s -X GET "$BASE_URL/api/auth/check" \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  | jq '.' || echo "Response: Not authenticated (expected)"
echo ""

# Test 2: Login via POST (requires real token)
echo "2️⃣  Testing login via POST:"
echo "   (Replace TEST_TOKEN with real Supabase token)"
curl -s -X POST "$BASE_URL/api/auth/callback" \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d "{
    \"access_token\": \"$TEST_TOKEN\",
    \"refresh_token\": \"$REFRESH_TOKEN\"
  }" \
  | jq '.' || echo "Response: Login attempt (requires valid token)"
echo ""

# Test 3: Check auth status after login
echo "3️⃣  Testing auth check after login:"
curl -s -X GET "$BASE_URL/api/auth/check" \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  | jq '.' || echo "Response: Auth check after login"
echo ""

# Test 4: Access protected user endpoint
echo "4️⃣  Testing protected user endpoint:"
curl -s -X GET "$BASE_URL/api/user" \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  | jq '.' || echo "Response: User info (requires authentication)"
echo ""

# Test 5: Test token refresh
echo "5️⃣  Testing token refresh:"
curl -s -X POST "$BASE_URL/api/auth/refresh" \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  | jq '.' || echo "Response: Token refresh attempt"
echo ""

# Test 6: Logout
echo "6️⃣  Testing logout:"
curl -s -X POST "$BASE_URL/api/auth/logout" \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -c cookies.txt \
  | jq '.' || echo "Response: Logout successful"
echo ""

# Test 7: Check auth status after logout
echo "7️⃣  Testing auth check after logout:"
curl -s -X GET "$BASE_URL/api/auth/check" \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  | jq '.' || echo "Response: Should be unauthenticated"
echo ""

echo "✅ Authentication system test completed!"
echo ""
echo "📝 Manual Tests:"
echo "   1. Visit: $BASE_URL/login"
echo "   2. Visit: $BASE_URL/profile (should redirect to login)"
echo "   3. Login with token, then visit: $BASE_URL/profile"
echo "   4. Test callback URL: $BASE_URL/api/auth/callback?token=YOUR_TOKEN"
echo ""
echo "🔧 To test with real tokens:"
echo "   1. Replace TEST_TOKEN and REFRESH_TOKEN variables"
echo "   2. Get tokens from your Supabase authentication flow"
echo "   3. Run this script again"
echo ""

# Cleanup
rm -f cookies.txt
echo "🧹 Cleaned up temporary files"
