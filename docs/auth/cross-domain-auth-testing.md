# Cross-Domain Authentication Testing Guide

This guide provides comprehensive testing instructions to verify that the cross-domain authentication issue has been successfully resolved.

## Issue Summary

**Problem**: When users authenticate on `chebichat.ai` but the application is deployed on `chebichat.com.vn`, the storage key API fails to authenticate users because authentication cookies are domain-specific.

**Solution**: Implemented fallback mechanism that checks both cookies (same-domain) and Authorization headers (cross-domain).

## Pre-requisites

1. **Server Running**: Ensure your Next.js development server is running
   ```bash
   npm run dev
   # or
   yarn dev
   ```

2. **Environment Variables**: Ensure these are set in your `.env.local`:
   ```
   SUPABASE_URL=your_supabase_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

3. **Dependencies**: Install node-fetch for manual testing:
   ```bash
   npm install node-fetch
   ```

## Testing Methods

### Method 1: Automated Manual Test Script

Run the provided test script:

```bash
node test-script/manual-cross-domain-test.js
```

This script will:
- ✅ Test the API endpoint without authentication
- ✅ Test with invalid Authorization header
- ✅ Test with valid token (if provided)
- ✅ Provide detailed output and debugging info

### Method 2: Manual API Testing

#### Test 1: No Authentication (Baseline)
```bash
curl -v http://localhost:3000/api/auth/storage-key
```

**Expected Response**:
```json
{
  "success": true,
  "storageKey": "chebichat-backup",
  "authenticated": false,
  "userEmail": null
}
```

#### Test 2: Invalid Authorization Header
```bash
curl -v -H "Authorization: Bearer invalid-token" http://localhost:3000/api/auth/storage-key
```

**Expected Response**:
```json
{
  "success": true,
  "storageKey": "chebichat-backup",
  "authenticated": false,
  "userEmail": null
}
```

#### Test 3: Valid Authorization Header (Cross-Domain Scenario)
First, get a valid token:
1. Open your application in browser
2. Log in through the web interface
3. Open browser dev tools (F12)
4. Go to Application/Storage tab
5. Find `sb-access-token` cookie and copy its value

Then test:
```bash
curl -v -H "Authorization: Bearer YOUR_ACTUAL_TOKEN" http://localhost:3000/api/auth/storage-key
```

**Expected Response** (when authenticated):
```json
{
  "success": true,
  "storageKey": "user-your-email@domain.com",
  "authenticated": true,
  "userEmail": "your-email@domain.com"
}
```

### Method 3: Browser-Based Testing

#### Same-Domain Testing
1. Visit `http://localhost:3000/login`
2. Log in with your credentials
3. Visit `http://localhost:3000/api/auth/storage-key`
4. Should see authenticated response with your user-specific storage key

#### Cross-Domain Simulation
1. Log in on one domain/port
2. Extract the access token from cookies
3. Use a different browser tab/incognito mode
4. Send API request with Authorization header instead of cookies

### Method 4: Integration Testing

#### Test with Auth Demo Page
1. Visit `http://localhost:3000/auth-demo`
2. Check authentication status
3. Verify storage key API is working
4. Test logout functionality

#### Test with Client-Side Hooks
1. Use browser dev tools to inspect network requests
2. Check that `useUserStorageKey` hook includes Authorization headers
3. Verify sync functionality works correctly

## Verification Checklist

### ✅ Server-Side Verification
- [ ] `checkAuth` function checks cookies first, then Authorization header
- [ ] `checkAuthWithRefresh` function supports both authentication methods
- [ ] Storage key API logs show both cookie and header attempts
- [ ] Error handling provides fallback to default storage key

### ✅ Client-Side Verification
- [ ] `useUserStorageKey` hook sends Authorization headers when available
- [ ] Sync functionality includes Authorization headers in requests
- [ ] Client-side token extraction from cookies works correctly
- [ ] Graceful fallback when tokens are not available

### ✅ Cross-Domain Verification
- [ ] API works with cookies (same-domain)
- [ ] API works with Authorization headers (cross-domain)
- [ ] API prioritizes cookies over headers when both are available
- [ ] API falls back to default storage key when authentication fails

### ✅ Real-World Scenario Testing
- [ ] User logs in on `chebichat.ai`
- [ ] User visits `chebichat.com.vn`
- [ ] Storage key API returns user-specific key (not default)
- [ ] Sync functionality works across domains
- [ ] User data is accessible on both domains

## Debugging Tips

### Server Logs
Look for these log messages in your server console:
```
[Storage Key API] Processing request from: http://...
[Storage Key API] Has Authorization header: true/false
[Storage Key API] Has auth cookie: true/false
[Supabase] Using Authorization header token
[Supabase] Using Authorization header token for auth check
```

### Network Tab Analysis
In browser dev tools, check:
1. **Request Headers**: Look for `Authorization: Bearer ...`
2. **Response Data**: Verify `authenticated: true` and correct `storageKey`
3. **Cookie Header**: Check if `sb-access-token` is being sent

### Common Issues and Solutions

#### Issue: API returns default storage key despite valid token
**Solution**: Check if token is being sent in Authorization header
```javascript
// In browser console
fetch('/api/auth/storage-key', {
  headers: {
    'Authorization': 'Bearer ' + document.cookie
      .split('; ')
      .find(row => row.startsWith('sb-access-token='))
      ?.split('=')[1]
  }
})
```

#### Issue: CORS errors in cross-domain scenario
**Solution**: Configure CORS in `next.config.js`
```javascript
module.exports = {
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,DELETE,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type,Authorization' },
        ],
      },
    ];
  },
};
```

#### Issue: Environment variables not loaded
**Solution**: Check `.env.local` file exists and contains:
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
```

## Success Criteria

The cross-domain authentication fix is successful if:

1. **✅ Same-domain authentication works**: Users can authenticate normally when accessing the app on the same domain
2. **✅ Cross-domain authentication works**: Users authenticated on one domain can access their data on another domain
3. **✅ Fallback mechanism works**: When authentication fails, the system gracefully falls back to default storage key
4. **✅ No breaking changes**: Existing functionality continues to work as expected
5. **✅ Proper error handling**: Clear error messages and logging for debugging

## Next Steps

After successful testing:
1. Deploy to staging environment
2. Test with actual domain setup (chebichat.ai → chebichat.com.vn)
3. Monitor server logs for any issues
4. Update production documentation
5. Consider implementing automated tests for CI/CD pipeline

## Additional Resources

- [Cross-Domain Authentication Documentation](./cross-domain-auth.md)
- [Supabase Authentication Guide](https://supabase.com/docs/guides/auth)
- [Next.js API Routes Documentation](https://nextjs.org/docs/api-routes/introduction)
