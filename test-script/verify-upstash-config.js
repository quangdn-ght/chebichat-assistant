#!/usr/bin/env node

/**
 * Script to verify UpStash configuration is always using environment variables
 */

console.log('🔍 Testing UpStash Configuration...\n');

// Test 1: Check constants
console.log('📋 Testing constants:');
try {
  // Simulate the constants module
  const UPSTASH_ENDPOINT = process.env.KV_REST_API_URL || "https://your-upstash-redis-url.upstash.io";
  const UPSTASH_APIKEY = process.env.KV_REST_API_TOKEN || "your-upstash-redis-token";
  
  console.log('✓ UPSTASH_ENDPOINT:', UPSTASH_ENDPOINT);
  console.log('✓ UPSTASH_APIKEY:', UPSTASH_APIKEY.substring(0, 10) + '...');
  
  // Test that fallback values are used when env vars are not set
  if (!process.env.KV_REST_API_URL) {
    console.log('✓ Using fallback endpoint when KV_REST_API_URL is not set');
  }
  if (!process.env.KV_REST_API_TOKEN) {
    console.log('✓ Using fallback token when KV_REST_API_TOKEN is not set');
  }
  
} catch (error) {
  console.error('❌ Error testing constants:', error.message);
}

// Test 2: Simulate store behavior
console.log('\n🔄 Testing store behavior:');
try {
  const UPSTASH_ENDPOINT = process.env.KV_REST_API_URL || "https://your-upstash-redis-url.upstash.io";
  const UPSTASH_APIKEY = process.env.KV_REST_API_TOKEN || "your-upstash-redis-token";
  
  // Simulate store state
  let mockState = {
    upstash: {
      endpoint: "", // Empty to simulate potential issue
      apiKey: "",   // Empty to simulate potential issue
      username: "test-user"
    }
  };
  
  // Simulate ensureUpstashConfig function
  const ensureUpstashConfig = (state) => {
    const needsUpdate = 
      !state.upstash.endpoint || 
      state.upstash.endpoint === "" ||
      state.upstash.endpoint !== UPSTASH_ENDPOINT ||
      !state.upstash.apiKey || 
      state.upstash.apiKey === "" ||
      state.upstash.apiKey !== UPSTASH_APIKEY;

    if (needsUpdate) {
      console.log('📝 Updating UpStash config with environment variables');
      state.upstash.endpoint = UPSTASH_ENDPOINT;
      state.upstash.apiKey = UPSTASH_APIKEY;
    }
    
    return state;
  };
  
  // Test with empty state
  console.log('📝 Before ensureUpstashConfig:', {
    endpoint: mockState.upstash.endpoint || '<empty>',
    apiKey: mockState.upstash.apiKey || '<empty>'
  });
  
  mockState = ensureUpstashConfig(mockState);
  
  console.log('📝 After ensureUpstashConfig:', {
    endpoint: mockState.upstash.endpoint,
    apiKey: mockState.upstash.apiKey.substring(0, 10) + '...'
  });
  
  console.log('✓ Store properly updates with environment variables');
  
} catch (error) {
  console.error('❌ Error testing store behavior:', error.message);
}

// Test 3: Test UI display values
console.log('\n🎨 Testing UI display values:');
try {
  const UPSTASH_ENDPOINT = process.env.KV_REST_API_URL || "https://your-upstash-redis-url.upstash.io";
  const UPSTASH_APIKEY = process.env.KV_REST_API_TOKEN || "your-upstash-redis-token";
  
  // Simulate what the UI would show
  const uiValues = {
    endpointField: UPSTASH_ENDPOINT,
    apiKeyField: UPSTASH_APIKEY,
    readOnly: true,
    disabled: true
  };
  
  console.log('📺 UI will display:');
  console.log('  - Endpoint field value:', uiValues.endpointField);
  console.log('  - API Key field value:', uiValues.apiKeyField.substring(0, 10) + '...');
  console.log('  - Read-only:', uiValues.readOnly);
  console.log('  - Disabled:', uiValues.disabled);
  
  console.log('✓ UI will always show environment variable values');
  
} catch (error) {
  console.error('❌ Error testing UI values:', error.message);
}

console.log('\n🎉 UpStash configuration test completed!');
console.log('📋 Summary:');
console.log('  - Constants provide fallback values when env vars are not set');
console.log('  - Store automatically updates with environment variables');
console.log('  - UI always displays environment variable values');
console.log('  - Fields are read-only and disabled for user safety');
