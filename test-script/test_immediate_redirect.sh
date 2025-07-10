#!/bin/bash

# Test script for immediate redirect functionality in login page
# This script tests the login page's immediate redirect behavior

echo "🧪 Testing Immediate Redirect Functionality"
echo "========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
test_count=0
pass_count=0

# Function to run a test
run_test() {
    local test_name="$1"
    local test_command="$2"
    local expected_pattern="$3"
    
    echo -e "\n${YELLOW}Test $((++test_count)): $test_name${NC}"
    echo "Command: $test_command"
    
    # Run the test command
    result=$(eval "$test_command" 2>&1)
    
    # Check if the result matches the expected pattern
    if echo "$result" | grep -q "$expected_pattern"; then
        echo -e "${GREEN}✅ PASS${NC}"
        ((pass_count++))
    else
        echo -e "${RED}❌ FAIL${NC}"
        echo "Expected pattern: $expected_pattern"
        echo "Actual result: $result"
    fi
}

# Check if the project is set up correctly
echo -e "\n${YELLOW}Checking project setup...${NC}"
if [ ! -f "app/login/page.tsx" ]; then
    echo -e "${RED}❌ Login page not found${NC}"
    exit 1
fi

if [ ! -f "app/hooks/useAuth.ts" ]; then
    echo -e "${RED}❌ useAuth hook not found${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Project files found${NC}"

# Test 1: Check if login page has immediate redirect logic
echo -e "\n${YELLOW}Testing login page implementation...${NC}"
run_test "Login page has immediate redirect logic" \
    "grep -q 'User not authenticated, redirecting immediately' app/login/page.tsx" \
    "."

# Test 2: Check if manual auth parameter is supported
run_test "Manual auth parameter support" \
    "grep -q 'manualAuth' app/login/page.tsx" \
    "."

# Test 3: Check if authLoading is used from useAuth
run_test "Uses authLoading from useAuth" \
    "grep -q 'authLoading' app/login/page.tsx" \
    "."

# Test 4: Check if fetchAuthConfigAndRedirect is called in useEffect
run_test "fetchAuthConfigAndRedirect called in useEffect" \
    "grep -A 10 'useEffect' app/login/page.tsx | grep -q 'fetchAuthConfigAndRedirect'" \
    "."

# Test 5: Check if loading states are properly handled
run_test "Loading states properly handled" \
    "grep -q 'Redirecting to authentication' app/login/page.tsx" \
    "."

# Test 6: Check if manual token entry link is provided
run_test "Manual token entry link provided" \
    "grep -q 'manual=true' app/login/page.tsx" \
    "."

# Test 7: Check if error parameter prevents redirect
run_test "Error parameter prevents redirect" \
    "grep -q 'errorParam.*manualAuth' app/login/page.tsx" \
    "."

# Test 8: Check useAuth hook has proper loading state
run_test "useAuth hook has loading state" \
    "grep -q 'loading:.*true' app/hooks/useAuth.ts" \
    "."

# Test 9: Check if config endpoint is available
if [ -f "app/api/config/route.ts" ]; then
    run_test "Config endpoint available" \
        "grep -q 'authLogin' app/api/config/route.ts" \
        "."
else
    echo -e "${YELLOW}ℹ️  Config endpoint not found, skipping test${NC}"
fi

# Test 10: Check TypeScript types
run_test "TypeScript types for authentication state" \
    "grep -q 'authenticated.*boolean' app/hooks/useAuth.ts" \
    "."

# Test Summary
echo -e "\n${YELLOW}Test Summary${NC}"
echo "============"
echo "Total tests: $test_count"
echo -e "Passed: ${GREEN}$pass_count${NC}"
echo -e "Failed: ${RED}$((test_count - pass_count))${NC}"

if [ $pass_count -eq $test_count ]; then
    echo -e "\n${GREEN}🎉 All tests passed! Immediate redirect functionality is properly implemented.${NC}"
    exit 0
else
    echo -e "\n${RED}❌ Some tests failed. Please check the implementation.${NC}"
    exit 1
fi

# Additional manual testing instructions
echo -e "\n${YELLOW}Manual Testing Instructions:${NC}"
echo "=============================="
echo "1. Start the development server: npm run dev"
echo "2. Navigate to /login (when not authenticated)"
echo "3. Should automatically redirect to auth URL"
echo "4. Navigate to /login?manual=true"
echo "5. Should show the manual token entry form"
echo "6. Navigate to /login?error=auth_failed"
echo "7. Should show the manual form with error message"
echo "8. Test with authenticated user - should redirect to main page"
echo ""
echo "Test URLs:"
echo "- /login (automatic redirect)"
echo "- /login?manual=true (manual form)"
echo "- /login?error=auth_failed (error handling)"
echo "- /login?redirect_to=/profile (custom redirect)"
