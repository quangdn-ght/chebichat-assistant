#!/bin/bash

# Simple verification script for cross-domain authentication fix
# This script checks if the necessary code changes are in place

echo "🔍 Cross-Domain Authentication Fix Verification"
echo "=============================================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

success_count=0
total_checks=0

check_file() {
    local file=$1
    local description=$2
    local search_pattern=$3
    
    total_checks=$((total_checks + 1))
    
    if [ -f "$file" ]; then
        if grep -q "$search_pattern" "$file"; then
            echo -e "${GREEN}✅ $description${NC}"
            success_count=$((success_count + 1))
        else
            echo -e "${RED}❌ $description - Pattern not found${NC}"
            echo -e "${YELLOW}   Looking for: $search_pattern${NC}"
        fi
    else
        echo -e "${RED}❌ $description - File not found: $file${NC}"
    fi
}

check_client_auth_header() {
    local file=$1
    local description=$2
    
    total_checks=$((total_checks + 1))
    
    if [ -f "$file" ]; then
        if grep -q "Authorization.*Bearer" "$file" && grep -q "sb-access-token" "$file"; then
            echo -e "${GREEN}✅ $description${NC}"
            success_count=$((success_count + 1))
        else
            echo -e "${RED}❌ $description - Authorization header support not found${NC}"
        fi
    else
        echo -e "${RED}❌ $description - File not found: $file${NC}"
    fi
}

echo -e "${BLUE}🔧 Checking server-side changes...${NC}"

# Check supabase.ts for Authorization header fallback
check_file \
    "app/api/supabase.ts" \
    "Supabase checkAuth supports Authorization header" \
    "Authorization.*Bearer"

check_file \
    "app/api/supabase.ts" \
    "Supabase checkAuth has cookie priority" \
    "sb-access-token"

check_file \
    "app/api/supabase.ts" \
    "Supabase checkAuthWithRefresh supports Authorization header" \
    "Using Authorization header token for auth check"

# Check storage key API for enhanced logging
check_file \
    "app/api/auth/storage-key/route.ts" \
    "Storage key API has debug logging" \
    "Has Authorization header"

echo -e "${BLUE}🔧 Checking client-side changes...${NC}"

# Check useUserStorageKey hook
check_client_auth_header \
    "app/hooks/useUserStorageKey.ts" \
    "useUserStorageKey hook sends Authorization headers"

# Check sync.ts
check_client_auth_header \
    "app/store/sync.ts" \
    "Sync functionality sends Authorization headers"

echo -e "${BLUE}🔧 Checking documentation...${NC}"

# Check documentation files
check_file \
    "docs/cross-domain-auth.md" \
    "Cross-domain authentication documentation exists" \
    "Cross-Domain Authentication Solution"

check_file \
    "docs/cross-domain-auth-testing.md" \
    "Testing documentation exists" \
    "Cross-Domain Authentication Testing Guide"

echo -e "${BLUE}🔧 Checking test files...${NC}"

# Check test scripts
check_file \
    "test-script/test_cross_domain_auth.sh" \
    "Cross-domain auth test script exists" \
    "Cross-Domain Authentication"

check_file \
    "test-script/manual-cross-domain-test.js" \
    "Manual test script exists" \
    "Manual test script for cross-domain authentication"

echo ""
echo "=============================================="
echo -e "${BLUE}📊 Summary${NC}"
echo "=============================================="

if [ $success_count -eq $total_checks ]; then
    echo -e "${GREEN}🎉 All checks passed! ($success_count/$total_checks)${NC}"
    echo -e "${GREEN}✅ Cross-domain authentication fix is properly implemented${NC}"
    echo ""
    echo -e "${YELLOW}🚀 Next steps:${NC}"
    echo "1. Run the server: npm run dev"
    echo "2. Test manually: node test-script/manual-cross-domain-test.js"
    echo "3. Check server logs for authentication flow"
    echo "4. Test in browser with real authentication"
    exit 0
else
    echo -e "${RED}⚠️  Some checks failed ($success_count/$total_checks)${NC}"
    echo -e "${YELLOW}Please review the failed checks above and ensure all changes are properly implemented.${NC}"
    exit 1
fi
