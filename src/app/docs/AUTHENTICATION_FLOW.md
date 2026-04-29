# CoHive Authentication Flow

## Overview

CoHive uses a streamlined email-based authentication system that integrates with Databricks OAuth. This document describes the complete authentication flow, error handling, and user experience.

---

## Authentication Architecture

### Two-Tier Authentication System

1. **Email Domain Validation** - Validates user's email against authorized workspace domains
2. **Databricks OAuth** - Authenticates user with their organization's Databricks workspace

### No Password Required

As of the latest update, CoHive no longer requires a password at the landing page. The email domain serves as the primary authorization gate, and Databricks OAuth provides the authentication.

---

## Authentication Flow

### Successful Login Path

```
1. User enters work email
   ↓
2. System validates email format
   ↓
3. System looks up workspace by email domain
   ↓
4. Databricks OAuth modal appears
   ↓
5. User redirected to Databricks login
   ↓
6. User authenticates with Databricks
   ↓
7. OAuth callback returns to CoHive
   ↓
8. User enters CoHive application
```

### Successful Login Path (CoHiveSolutions.com Users)

```
1. User enters cohivesolutions.com email
   ↓
2. System validates email format
   ↓
3. System fetches all available workspaces
   ↓
4. Workspace selector modal appears
   ↓
5. User selects client workspace (e.g., "BostonBeer")
   ↓
6. Databricks OAuth modal appears
   ↓
7. User redirected to selected workspace Databricks
   ↓
8. User authenticates with Databricks
   ↓
9. OAuth callback returns to CoHive
   ↓
10. User enters CoHive application
```

### Failed Authentication Paths

#### Email Domain Not Authorized
```
1. User enters email
   ↓
2. Domain lookup fails
   ↓
3. Error: "Email domain not authorized"
   ↓
4. User remains on landing page
```

#### Databricks OAuth Fails
```
1. User enters email
   ↓
2. Domain validated successfully
   ↓
3. OAuth modal appears
   ↓
4. Databricks authentication fails
   ↓
5. User returned to /oauth/callback
   ↓
6. Error alert appears
   ↓
7. User redirected to landing page
   ↓
8. All auth state cleared
```

---

## Special Email Accounts

### Help Account (Bypass Mode)

**Email:** `help@cohive.com`

- Bypasses Databricks OAuth entirely
- Provides direct access to application
- Used for demos and support scenarios

### Mock Mode (Figma Make)

When running in Figma Make environment:
- All Databricks API calls are mocked
- OAuth is bypassed automatically
- Any email format is accepted

---

## Error Handling & Recovery

### DatabricksOAuthLogin Modal

The Databricks OAuth modal is **non-dismissible** to ensure users complete authentication. However, when errors occur, users have clear recovery options:

**Error State UI:**
- Red error alert with descriptive message
- **"Try Again"** button - Retries OAuth flow with same email
- **"Back to Login"** button - Returns to landing page

### State Cleanup on Error

When "Back to Login" is clicked or OAuth callback fails:

```javascript
// All auth state is cleared:
- cohive_pending_email
- cohive_logged_in
- oauth_state
- oauth_workspace_host
- oauth_return_step
- oauth_return_path

// Logged out flag is set:
- cohive_logged_out = 'true'
```

---

## File Structure

### Components

- **`/components/Login.tsx`** - Landing page with email input
- **`/components/WorkspaceSelector.tsx`** - Workspace selection modal for CoHive Solutions users
- **`/components/DatabricksOAuthLogin.tsx`** - OAuth modal with error handling
- **`/components/OAuthCallback.tsx`** - Handles OAuth redirect callback

### Utilities

- **`/utils/databricksAuth.ts`** - Core authentication logic
  - `initiateLogin()` - Starts OAuth flow
  - `handleOAuthCallback()` - Processes OAuth response
  - `clearSession()` - Cleans up auth state
  - `isAuthenticated()` - Checks current auth status

- **`/utils/mockMode.ts`** - Detects Figma Make environment
  - `isFigmaMake()` - Returns true if in mock mode

### Routes

- **`/`** - Landing page (Login component)
- **`/oauth/callback`** - OAuth callback handler

---

## User Experience Flow

### Example: bostonbeer.com User

#### Scenario 1: Successful Login
```
1. User enters: john.doe@bostonbeer.com
2. System finds: Boston Beer Databricks workspace
3. Modal shows: "Connecting to Boston Beer workspace..."
4. User redirected to: Boston Beer Databricks login
5. User logs in with Databricks credentials
6. Returns to CoHive with authenticated session
```

#### Scenario 2: Wrong Databricks Password
```
1. User enters: john.doe@bostonbeer.com
2. Modal appears: "Connecting to Boston Beer workspace..."
3. User redirected to Databricks
4. User enters wrong password
5. Databricks authentication fails
6. Alert: "Databricks authentication failed: Invalid credentials"
7. User returned to landing page
8. User can try again or contact admin
```

#### Scenario 3: Databricks Account Doesn't Exist
```
1. User enters: jane.smith@bostonbeer.com
2. Modal appears: "Connecting to Boston Beer workspace..."
3. User redirected to Databricks
4. Databricks returns: User not found
5. Alert: "Databricks authentication failed: User not found"
6. User returned to landing page
7. User contacts IT to request Databricks access
```

### Example: cohivesolutions.com User

#### Scenario 1: CoHive Solutions User Selecting Client Workspace
```
1. User enters: sarah.jones@cohivesolutions.com
2. System fetches all available workspaces
3. Workspace selector modal appears showing:
   - CoHiveSolutions (cohivesolutions.cloud.databricks.com)
   - BostonBeer (bostonbeer.cloud.databricks.com)
4. User clicks "BostonBeer"
5. OAuth modal appears: "Connecting to Boston Beer workspace..."
6. User redirected to Boston Beer Databricks
7. User logs in with their Databricks credentials
8. Returns to CoHive with authenticated session to BostonBeer workspace
```

#### Scenario 2: Canceling Workspace Selection
```
1. User enters: sarah.jones@cohivesolutions.com
2. Workspace selector modal appears
3. User clicks "Cancel"
4. Modal closes, returns to landing page
5. User can re-enter email to try again
```

---

## Error Messages

### Common Errors

| Error | Cause | User Action |
|-------|-------|-------------|
| "Please enter a valid email address" | Invalid email format | Enter valid email |
| "Email domain not authorized" | Domain not in workspace mapping | Contact administrator |
| "Could not find your workspace" | API lookup failed | Check connection, try again |
| "Failed to connect" | Network error | Check internet, try again |
| "Invalid credentials" | Wrong Databricks password | Re-enter correct password |
| "User not found" | No Databricks account | Request workspace access |
| "OAuth state mismatch" | Security validation failed | Try again |

---

## API Integration

### Workspace Lookup Endpoint

**Endpoint:** `/api/databricks/workspace-lookup`

**Method:** `POST`

**Request:**
```json
{
  "email": "user@company.com"
}
```

**Success Response:**
```json
{
  "workspaceHost": "bostonbeer.cloud.databricks.com",
  "clientName": "Boston Beer"
}
```

**Error Response:**
```json
{
  "error": "Email domain not authorized"
}
```

### Multi-Client Workspace Mapping

CoHive supports multiple Databricks workspaces mapped by email domain:

- `bostonbeer.com` → Boston Beer workspace
- `cohivesolutions.com` → CoHive Solutions workspace
- Additional workspaces configured server-side

### Workspace Selection for CoHive Solutions Users

**Special Behavior for cohivesolutions.com emails:**

Users with `@cohivesolutions.com` email addresses have access to **all client workspaces** and can choose which one to access during login.

**Workspace List Endpoint:**

**Endpoint:** `/api/databricks/workspaces/list`

**Method:** `GET`

**Success Response:**
```json
{
  "workspaces": [
    {
      "workspaceHost": "cohivesolutions.cloud.databricks.com",
      "clientName": "CoHive Solutions"
    },
    {
      "workspaceHost": "bostonbeer.cloud.databricks.com",
      "clientName": "Boston Beer"
    }
  ]
}
```

**Display Name Formatting:**
- Workspace names shown to users have spaces removed
- `"CoHive Solutions"` → displayed as `"CoHiveSolutions"`
- `"Boston Beer"` → displayed as `"BostonBeer"`
- This creates cleaner, more readable workspace labels

**User Experience:**
1. CoHive Solutions user enters email
2. System fetches all available workspaces
3. Modal displays list of client workspaces with:
   - Large initial letter badge (first letter of workspace name)
   - Workspace display name (e.g., "BostonBeer")
   - Full Databricks host URL
4. User clicks desired workspace
5. OAuth flow proceeds with selected workspace

---

## Security Considerations

### OAuth State Validation

- Random state token generated for each OAuth flow
- State validated on callback to prevent CSRF attacks
- State stored in localStorage during OAuth redirect

### Session Storage

- Access tokens stored securely in localStorage
- Session includes: `accessToken`, `refreshToken`, `expiresAt`
- Tokens are workspace-specific
- Expired sessions automatically cleared

### Non-Dismissible Modal

The OAuth modal cannot be dismissed by:
- Clicking outside the modal
- Pressing ESC key
- Any other standard dismiss action

Users must either:
- Complete authentication successfully
- Click "Back to Login" to cancel

This prevents users from being stuck in an unauthenticated state.

---

## Development Testing

### Testing Different Scenarios

1. **Test successful login:**
   - Use authorized email domain
   - Complete Databricks OAuth

2. **Test unauthorized domain:**
   - Use random email domain
   - Should see "Email domain not authorized"

3. **Test help account:**
   - Use `help@cohive.com`
   - Should bypass OAuth entirely

4. **Test Mock Mode (Figma Make):**
   - Run in Figma Make environment
   - Any email should work
   - No OAuth required

5. **Test OAuth failure:**
   - Start OAuth flow
   - Manually navigate away before completing
   - Return to /oauth/callback with error
   - Should see error message and return to landing page

---

## Troubleshooting

### User Can't Log In

**Check:**
1. Is email domain authorized? (Check workspace mapping)
2. Does user have Databricks account?
3. Are Databricks credentials correct?
4. Is network connection stable?
5. Are OAuth environment variables configured?

### Stuck in OAuth Loop

**This should no longer happen** - the "Back to Login" button provides an escape path.

If it does occur:
1. Clear browser localStorage
2. Clear browser cookies
3. Refresh page
4. Try login again

### OAuth Callback Error

**Common causes:**
- Invalid OAuth client ID
- Redirect URI mismatch
- Expired authorization code
- Network timeout

**Solution:**
- Click "Back to Login"
- Verify email
- Try again
- Contact administrator if persists

---

## Environment Variables

### Required Variables

```bash
VITE_DATABRICKS_CLIENT_ID=<your-databricks-oauth-client-id>
VITE_DATABRICKS_REDIRECT_URI=<your-app-url>/oauth/callback
```

### Optional Variables

```bash
# (Removed) VITE_COHIVE_PASSWORD - No longer used
```

---

## Version History

- **v1.0** - Initial password-based authentication
- **v2.0** - Added Databricks OAuth integration
- **v3.0** - Added multi-workspace support
- **v4.0** - Removed password requirement, added "Back to Login" escape mechanism
- **v4.1** - Added workspace selection for CoHive Solutions users (@cohivesolutions.com)

---

## Related Documentation

- `/docs/KNOWLEDGE_BASE_ACCESS_POLICY.md` - Role-based file access
- `/docs/PROJECT_TYPE_PROMPTS.md` - Data scientist permissions
- `/Guidelines.md` - Overall development guidelines

---

**Last Updated:** April 2026