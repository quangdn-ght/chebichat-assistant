# Cross-Domain Authentication Solution

## Problem

When users authenticate on one domain (e.g., `chebichat.ai`) but the application is deployed on a different domain (e.g., `chebichat.com.vn`), authentication cookies are not shared between domains due to browser security policies. This causes the storage key API to fail authentication checks even though the user profile can be retrieved via token.

## Root Cause

The `checkAuth` function in `app/api/supabase.ts` was only checking for authentication tokens in cookies (`sb-access-token`), which are domain-specific. When deploying on different domains, these cookies are not accessible.

## Solution

The solution implements a fallback mechanism that checks for authentication tokens in both cookies (for same-domain) and Authorization headers (for cross-domain scenarios).

### Backend Changes

1. **Modified `checkAuth` function** in `app/api/supabase.ts`:
   - First tries to get token from cookies (same-domain authentication)
   - If no cookie token, tries to get from Authorization header (cross-domain authentication)

2. **Updated `checkAuthWithRefresh` function** in `app/api/supabase.ts`:
   - Same fallback mechanism for token refresh scenarios

3. **Enhanced `getUserInfoFromCookie` function** in `app/api/supabase.ts`:
   - Added better error handling for cross-domain scenarios

4. **Improved logging** in `app/api/auth/storage-key/route.ts`:
   - Added debug logging to help diagnose cross-domain issues

### Frontend Changes

1. **Modified `useUserStorageKey` hook** in `app/hooks/useUserStorageKey.ts`:
   - Added `getAccessTokenFromCookies()` function to read tokens from cookies
   - Added `createAuthHeaders()` function to create Authorization headers
   - Updated all fetch calls to include Authorization headers when available

2. **Updated sync functionality** in `app/store/sync.ts`:
   - Added token extraction from cookies
   - Included Authorization headers in storage key API calls

## How It Works

### Same-Domain Authentication
- User logs in on `chebichat.ai`
- Authentication cookies are set and accessible
- API calls work normally with cookie-based authentication

### Cross-Domain Authentication
- User logs in on `chebichat.ai` and navigates to `chebichat.com.vn`
- Authentication cookies are not accessible due to domain restrictions
- Client-side code reads the access token from cookies and sends it in Authorization header
- Server-side code falls back to Authorization header when cookies are not available
- API calls work with header-based authentication

## Testing

To test the cross-domain authentication:

1. **Same-domain test**:
   ```bash
   curl -b "sb-access-token=your_token" http://localhost:3000/api/auth/storage-key
   ```

2. **Cross-domain test**:
   ```bash
   curl -H "Authorization: Bearer your_token" http://localhost:3000/api/auth/storage-key
   ```

## API Endpoints

### GET /api/auth/storage-key

**Authentication Methods** (in order of precedence):
1. Cookie: `sb-access-token` (same-domain)
2. Header: `Authorization: Bearer <token>` (cross-domain)

**Response**:
```json
{
  "success": true,
  "storageKey": "user-user@example.com",
  "authenticated": true,
  "userEmail": "user@example.com"
}
```

## Deployment Considerations

1. **Environment Variables**: Ensure `SUPABASE_URL` and `SUPABASE_ANON_KEY` are set correctly for each domain
2. **CORS Configuration**: Configure CORS to allow cross-origin requests if needed
3. **Security**: The Authorization header approach maintains security while enabling cross-domain functionality

## Benefits

- **Backward Compatible**: Existing same-domain authentication continues to work
- **Cross-Domain Support**: Enables authentication across different domains
- **Fallback Mechanism**: Gracefully handles scenarios where cookies are not available
- **Security**: Maintains security standards while improving functionality
