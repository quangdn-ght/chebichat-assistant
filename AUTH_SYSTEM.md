# Authentication System Documentation

This authentication system provides a complete solution for handling Supabase authentication tokens via cookies and query strings.

## Features

- **Token-based Authentication**: Accepts authentication tokens via query strings or POST requests
- **Automatic Cookie Management**: Stores tokens securely as HTTP-only cookies
- **Token Refresh**: Automatically refreshes expired tokens using refresh tokens
- **Route Protection**: Middleware to protect routes requiring authentication
- **Client-side Hooks**: React hooks for managing authentication state
- **Session Management**: Proper login/logout functionality

## API Endpoints

### Authentication Callback
Handle authentication tokens from external services or redirects.

#### GET `/api/auth/callback`
```
GET /api/auth/callback?token=ACCESS_TOKEN&refresh_token=REFRESH_TOKEN&redirect_to=/dashboard
```

Parameters:
- `token` or `access_token` (required): The Supabase access token
- `refresh_token` (optional): The refresh token for automatic token renewal
- `redirect_to` (optional): URL to redirect to after successful authentication (default: "/")

#### POST `/api/auth/callback`
```json
POST /api/auth/callback
Content-Type: application/json

{
  "access_token": "ACCESS_TOKEN",
  "refresh_token": "REFRESH_TOKEN",
  "redirect_to": "/dashboard"
}
```

### Authentication Check
Verify current authentication status.

#### GET `/api/auth/check`
```
GET /api/auth/check
```

Returns:
```json
{
  "authenticated": true,
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "user_metadata": {}
  },
  "userInfo": {
    "id": "user_id",
    "email": "user@example.com",
    "user_metadata": {}
  }
}
```

### Token Refresh
Manually refresh an expired access token.

#### POST `/api/auth/refresh`
```
POST /api/auth/refresh
```

Uses the refresh token stored in cookies to get a new access token.

### Logout
Clear authentication cookies and end the session.

#### POST `/api/auth/logout`
```json
POST /api/auth/logout
```

#### GET `/api/auth/logout`
```
GET /api/auth/logout?redirect_to=/login
```

### User Information
Get detailed user information (protected route).

#### GET `/api/user`
```
GET /api/user
```

Returns detailed user information including metadata.

## Client-side Usage

### Using the useAuth Hook

```tsx
import { useAuth } from "../hooks/useAuth";

function MyComponent() {
  const { user, authenticated, loading, login, logout, checkAuth } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!authenticated) {
    return (
      <div>
        <button onClick={() => login("ACCESS_TOKEN", "REFRESH_TOKEN")}>
          Login
        </button>
      </div>
    );
  }

  return (
    <div>
      <p>Welcome, {user?.email}!</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

### Protecting Routes with HOC

```tsx
import { withAuth } from "../hooks/useAuth";

function ProtectedPage({ user }) {
  return (
    <div>
      <h1>Protected Content</h1>
      <p>User ID: {user.id}</p>
    </div>
  );
}

export default withAuth(ProtectedPage);
```

## Server-side Route Protection

The middleware automatically protects routes based on the configuration in `middleware.ts`.

### Protected Routes (require authentication):
- `/chat`
- `/settings`
- `/profile`
- `/api/chat`
- `/api/user`

### Public Routes (no authentication required):
- `/`
- `/login`
- `/signup`
- `/api/auth/*`

## Environment Variables

Ensure these environment variables are set:

```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Authentication Flow Examples

### 1. External Service Redirect
```
https://your-app.com/api/auth/callback?token=supabase_access_token&refresh_token=supabase_refresh_token&redirect_to=/dashboard
```

### 2. Programmatic Login
```javascript
// Client-side login
const { login } = useAuth();
await login("supabase_access_token", "supabase_refresh_token");
```

### 3. Form-based Login
```javascript
// Using the login page
// Navigate to /login and enter token manually
```

## Cookie Configuration

The system uses secure HTTP-only cookies with the following settings:

- **Name**: `sb-access-token`, `sb-refresh-token`, `sb-user-info`
- **HttpOnly**: `true` (except for `sb-user-info`)
- **Secure**: `true` (in production)
- **SameSite**: `lax`
- **MaxAge**: 7 days
- **Path**: `/`

## Error Handling

The system handles various error scenarios:

- **No token provided**: Redirects to login with error parameter
- **Invalid token**: Validates token with Supabase before setting cookies
- **Expired token**: Automatically attempts refresh using refresh token
- **Network errors**: Graceful fallback and error messaging

## Integration with Existing Code

The authentication system is designed to work alongside existing authentication mechanisms. It enhances the current system by providing:

1. **Cookie-based session management**
2. **Automatic token refresh**
3. **Client-side authentication state**
4. **Route protection middleware**

## Testing the Implementation

1. **Start the application**:
   ```bash
   npm run dev
   ```

2. **Test authentication callback**:
   ```
   http://localhost:3000/api/auth/callback?token=YOUR_SUPABASE_TOKEN
   ```

3. **Visit protected routes**:
   ```
   http://localhost:3000/profile
   ```

4. **Test the login page**:
   ```
   http://localhost:3000/login
   ```

5. **Check authentication status**:
   ```
   curl -b cookies.txt http://localhost:3000/api/auth/check
   ```

## Security Considerations

1. **HTTP-only cookies**: Prevents XSS attacks
2. **Secure flag**: Ensures cookies are only sent over HTTPS in production
3. **Token validation**: All tokens are validated with Supabase before use
4. **Automatic expiration**: Cookies expire after 7 days
5. **Path restriction**: Cookies are scoped to the application path

This authentication system provides a robust foundation for managing user sessions while maintaining security best practices.
