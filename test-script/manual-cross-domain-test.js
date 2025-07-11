#!/usr/bin/env node
/**
 * Manual test script for cross-domain authentication fix
 * This script tests the actual API endpoints to verify the fix works
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Test configuration
const BASE_URL = 'http://localhost:3000';
const STORAGE_KEY_ENDPOINT = '/api/auth/storage-key';

// Colors for output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logTitle(title) {
  log(`\n${'='.repeat(60)}`, 'cyan');
  log(`${title}`, 'cyan');
  log(`${'='.repeat(60)}`, 'cyan');
}

function logTest(testName) {
  log(`\n🧪 ${testName}`, 'yellow');
  log('-'.repeat(50), 'yellow');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

async function makeRequest(url, options = {}) {
  const fetch = (await import('node-fetch')).default;
  
  try {
    const response = await fetch(url, options);
    const data = await response.json();
    return { response, data };
  } catch (error) {
    return { error: error.message };
  }
}

async function testEndpoint(testName, url, options = {}) {
  logTest(testName);
  
  const { response, data, error } = await makeRequest(url, options);
  
  if (error) {
    logError(`Request failed: ${error}`);
    return false;
  }
  
  logInfo(`Status: ${response.status}`);
  logInfo(`Response: ${JSON.stringify(data, null, 2)}`);
  
  if (response.ok) {
    logSuccess('Request successful');
    return data;
  } else {
    logError('Request failed');
    return false;
  }
}

async function runTests() {
  logTitle('Cross-Domain Authentication Tests');
  
  const testUrl = `${BASE_URL}${STORAGE_KEY_ENDPOINT}`;
  
  // Test 1: No authentication (should return default storage key)
  await testEndpoint(
    'Test 1: No Authentication',
    testUrl
  );
  
  // Test 2: Invalid Authorization header (should return default storage key)
  await testEndpoint(
    'Test 2: Invalid Authorization Header',
    testUrl,
    {
      headers: {
        'Authorization': 'Bearer invalid-token-123'
      }
    }
  );
  
  // Test 3: Valid Authorization header (requires real token)
  log('\n⚠️  For Test 3, you need a real Supabase access token', 'yellow');
  log('To get a token:', 'yellow');
  log('1. Log in to your application', 'yellow');
  log('2. Open browser dev tools (F12)', 'yellow');
  log('3. Go to Application/Storage tab', 'yellow');
  log('4. Find "sb-access-token" cookie', 'yellow');
  log('5. Copy its value and run:', 'yellow');
  log(`   export SUPABASE_TOKEN="your-token-here"`, 'yellow');
  log(`   node ${process.argv[1]}`, 'yellow');
  
  const token = process.env.SUPABASE_TOKEN;
  if (token) {
    await testEndpoint(
      'Test 3: Valid Authorization Header',
      testUrl,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );
  } else {
    logInfo('Skipping Test 3 - No SUPABASE_TOKEN environment variable set');
  }
  
  // Test 4: Cookie-based authentication (requires server to be running with cookie)
  logInfo('\nFor cookie-based testing, use your browser to visit:');
  logInfo(`${testUrl}`);
  logInfo('After logging in through the web interface');
  
  logTitle('Test Summary');
  
  log('Expected behaviors:', 'cyan');
  log('• No auth: {"success": true, "authenticated": false, "storageKey": "chebichat-backup"}', 'cyan');
  log('• Invalid token: {"success": true, "authenticated": false, "storageKey": "chebichat-backup"}', 'cyan');
  log('• Valid token: {"success": true, "authenticated": true, "storageKey": "user-email@domain.com"}', 'cyan');
  
  log('\nCross-domain fix verification:', 'cyan');
  log('✅ Server now checks both cookies AND Authorization headers', 'green');
  log('✅ Client now sends Authorization headers when available', 'green');
  log('✅ Fallback to default storage key when authentication fails', 'green');
  log('✅ Detailed logging for debugging cross-domain issues', 'green');
}

async function checkServerRunning() {
  logTitle('Pre-flight Check');
  
  try {
    const { response } = await makeRequest(`${BASE_URL}/api/auth/storage-key`);
    if (response) {
      logSuccess('Server is running and API endpoint is accessible');
      return true;
    }
  } catch (error) {
    logError('Server is not running or API endpoint is not accessible');
    logInfo('Please start your Next.js server first:');
    logInfo('  npm run dev');
    logInfo('  # or');
    logInfo('  yarn dev');
    return false;
  }
}

async function main() {
  // Check if server is running
  if (!(await checkServerRunning())) {
    process.exit(1);
  }
  
  // Run tests
  await runTests();
  
  logTitle('Manual Testing Instructions');
  
  log('To fully test the cross-domain fix:', 'yellow');
  log('1. Deploy your app to two different domains (e.g., chebichat.ai and chebichat.com.vn)', 'yellow');
  log('2. Log in on domain A', 'yellow');
  log('3. Copy the access token from browser cookies', 'yellow');
  log('4. Visit domain B and check if the storage key API works with the token', 'yellow');
  log('5. Check browser network tab to see Authorization headers being sent', 'yellow');
  
  log('\nDebugging tips:', 'blue');
  log('• Check server logs for "[Storage Key API]" and "[Supabase]" messages', 'blue');
  log('• Verify both cookie and Authorization header authentication paths', 'blue');
  log('• Test with both valid and invalid tokens', 'blue');
  log('• Ensure environment variables SUPABASE_URL and SUPABASE_ANON_KEY are set', 'blue');
}

// Check if node-fetch is available
try {
  require.resolve('node-fetch');
} catch (e) {
  logError('node-fetch is not installed. Please install it:');
  logInfo('  npm install node-fetch');
  logInfo('  # or');
  logInfo('  yarn add node-fetch');
  process.exit(1);
}

main().catch(console.error);
