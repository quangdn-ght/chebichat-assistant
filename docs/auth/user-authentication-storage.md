# User Authentication and Email-Based Storage Key Implementation

## Overview

This implementation adds user authentication checking and uses the user's email as a storage key for syncing data to UpStash Redis. This ensures that each authenticated user has their own isolated storage space in Redis.

## Features Implemented

### 1. User Authentication Check (`/app/api/auth.ts`)

**New Functions:**
- `checkUserAuth(req: NextRequest)` - Checks if user is logged in via Supabase
- `getUserStorageKey(req: NextRequest)` - Returns user-specific storage key

**Returns:**
```typescript
{
  authenticated: boolean,
  user: User | null,
  storageKey: string | null  // Format: "user-{email}" or null
}
```

### 2. Storage Key API Endpoint (`/app/api/auth/storage-key/route.ts`)

**Endpoint:** `GET /api/auth/storage-key`

**Response:**
```json
{
  "success": true,
  "storageKey": "user-john@example.com",  // or "chebichat-backup" if not authenticated
  "authenticated": true,
  "userEmail": "john@example.com"
}
```

### 3. Dynamic Sync Store (`/app/store/sync.ts`)

**Enhanced Features:**
- Automatically fetches user-specific storage key before sync operations
- Falls back to default key if user is not authenticated
- Updates UpStash configuration dynamically

**Key Changes:**
```typescript
// Before sync operation
const userStorageKey = await getUserStorageKey();
// Uses user-specific key: "user-john@example.com"
```

### 4. Updated UpStash Client (`/app/utils/cloud/upstash.ts`)

**Improvements:**
- Accepts dynamic storage keys for get/set operations
- Properly handles chunked data with user-specific keys
- Maintains backward compatibility

### 5. UI Feedback (`/app/components/settings.tsx`)

**Enhanced Settings UI:**
- Shows authentication status in UpStash configuration
- Displays user email when logged in
- Shows the storage key that will be used
- Provides visual feedback for login state

## User Experience

### For Authenticated Users
1. **Login State Detection:** System automatically detects when user is logged in
2. **Email-Based Storage:** Data is stored with key format `user-{email}`
3. **Data Isolation:** Each user's data is completely isolated in Redis
4. **Visual Feedback:** Settings page shows login status and storage key

### For Unauthenticated Users
1. **Default Behavior:** Falls back to default storage key `chebichat-backup`
2. **Seamless Experience:** No disruption to existing functionality
3. **Clear Indication:** UI shows "Not logged in" status

## Storage Key Format

### Authenticated Users
- **Format:** `user-{email}`
- **Example:** `user-john@example.com`
- **Redis Keys:** 
  - Main: `user-john@example.com`
  - Chunks: `user-john@example.com-chunk-count`, `user-john@example.com-chunk-0`, etc.

### Unauthenticated Users
- **Format:** `chebichat-backup` (default)
- **Redis Keys:** 
  - Main: `chebichat-backup`
  - Chunks: `chebichat-backup-chunk-count`, `chebichat-backup-chunk-0`, etc.

## API Reference

### Authentication Check
```bash
GET /api/test/user-info
# Returns user info and storage key for testing
```

### Storage Key
```bash
GET /api/auth/storage-key
# Returns the storage key that will be used for the current user
```

## Testing

### Manual Testing
1. **Unauthenticated State:**
   - Visit settings page
   - Check UpStash section shows "Not logged in"
   - Storage key should be default

2. **Authenticated State:**
   - Login with Supabase authentication
   - Visit settings page
   - Should show user email and email-based storage key

### Automated Testing
Run the test script:
```bash
./test_user_storage.sh
```

## Implementation Benefits

1. **Data Isolation:** Each user's chat data is completely separate
2. **Security:** No data leakage between users
3. **Scalability:** Can handle multiple users efficiently
4. **Backward Compatibility:** Existing users continue to work normally
5. **Transparency:** Users can see exactly where their data is stored

## Technical Notes

### Authentication Flow
1. User logs in via Supabase authentication
2. Access token is stored in HTTP-only cookies
3. Server validates token with Supabase on each request
4. Email is extracted and used as storage key

### Redis Key Management
- Uses user email as the primary identifier
- Handles chunked data properly for large syncs
- Maintains chunk indexing per user
- Automatic cleanup when user data is overwritten

### Error Handling
- Graceful fallback to default storage key on auth errors
- Proper error logging for debugging
- Non-disruptive experience for users

## Migration Notes

### Existing Users
- Users with existing data under the default key will continue to access it
- When they authenticate, they'll get a new user-specific storage space
- They may need to manually sync their data to the new authenticated space

### Data Migration (Optional)
To migrate existing data to user-specific keys:
1. User logs in
2. System detects existing data under default key
3. Optionally prompt user to migrate data to their authenticated space
4. Copy data from default key to user-specific key

This implementation provides a robust foundation for user-specific data storage while maintaining compatibility with existing functionality.
