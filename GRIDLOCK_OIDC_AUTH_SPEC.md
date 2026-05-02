# 🔐 GridLock — OIDC Authentication & JWT Specification

> **Document Version:** 1.0  
> **Audience:** Developers integrating the GridLock SDK into their applications (Relying Parties)  
> **GridLock Auth Server:** `https://gridlock-xi.vercel.app`

---

## Table of Contents

1. [What is GridLock?](#1-what-is-gridlock)
2. [Architecture Overview](#2-architecture-overview)
3. [The OIDC-Inspired Authentication Flow](#3-the-oidc-inspired-authentication-flow)
4. [JWT ID Token — Structure & Fields](#4-jwt-id-token--structure--fields)
5. [Security Model](#5-security-model)
6. [GridLock SDK — Developer Integration Guide](#6-gridlock-sdk--developer-integration-guide)
7. [Relying Party Implementation Walkthrough](#7-relying-party-implementation-walkthrough)
8. [Session Management](#8-session-management)
9. [GridLock's Unique Authentication Factor: The Grid](#9-gridlocks-unique-authentication-factor-the-grid)
10. [Frequently Asked Questions](#10-frequently-asked-questions)

---

## 1. What is GridLock?

**GridLock** is an identity provider (IdP) that implements an **OIDC-inspired (OpenID Connect) single sign-on system** with a novel twist: instead of a traditional password, users authenticate using two additional visual factors:

| Factor | Description |
|--------|-------------|
| **Identity** | Username or email |
| **Grid Password** | An N×N grid where specific cells are filled with characters |
| **Color Pattern** | An M×M grid where cells are painted with chosen colors |

This makes GridLock a **three-factor authentication system** — identity + grid password + color pattern — all managed by a centralized auth server. Third-party applications (Relying Parties) can integrate "Sign in with GridLock" with as little as a single anchor tag and the GridLock SDK.

---

## 2. Architecture Overview

The diagram below illustrates how GridLock connects the user, the relying party (your client app), the GridLock auth server, and the backend database.

![GridLock OIDC Authentication Flow Diagram](./gridlock_oidc_flow_1777715887562.png)

### Actors

| Actor | Role |
|-------|------|
| **User / Browser** | The end-user authenticating to access your application |
| **Relying Party (RP)** | Your web app or mobile app that integrates "Sign in with GridLock" |
| **GridLock Auth Server (IdP)** | `gridlock-xi.vercel.app` — the central identity provider |
| **Supabase DB** | Stores user profiles, hashed grid credentials, and session records |

---

## 3. The OIDC-Inspired Authentication Flow

GridLock follows a simplified **Authorization Code-like redirect flow** inspired by OIDC. The full sequence, step by step:

```
┌─────────────────────────────────────────────────────────────────────┐
│               GRIDLOCK OIDC AUTHENTICATION SEQUENCE                  │
└─────────────────────────────────────────────────────────────────────┘

  User                Client App              GridLock IdP          Supabase DB
   │                      │                        │                     │
   │ 1. Click "Sign in    │                        │                     │
   │    with GridLock"    │                        │                     │
   │─────────────────────>│                        │                     │
   │                      │ 2. Redirect to         │                     │
   │                      │    GridLock with        │                     │
   │                      │    ?redirect-uri=...   │                     │
   │                      │───────────────────────>│                     │
   │                      │                        │                     │
   │ 3. Show 3-Step Auth  │                        │                     │
   │<────────────────────────────────────────────────                    │
   │                      │                        │                     │
   │ 4. Step 1: Enter     │                        │                     │
   │    username/email    │                        │                     │
   │─────────────────────────────────────────────>│                     │
   │                      │                        │ 5. Lookup user      │
   │                      │                        │─────────────────>   │
   │                      │                        │<────────────────── │
   │ 6. Step 2: Submit    │                        │                     │
   │    Grid Password     │                        │                     │
   │─────────────────────────────────────────────>│                     │
   │                      │                        │ 7. Verify grid      │
   │                      │                        │    password hash    │
   │ 8. Step 3: Submit    │                        │                     │
   │    Color Pattern     │                        │                     │
   │─────────────────────────────────────────────>│                     │
   │                      │                        │ 9. Verify color     │
   │                      │                        │    pattern hash     │
   │                      │                        │                     │
   │                      │                        │ 10. Create session  │
   │                      │                        │─────────────────>   │
   │                      │                        │<────────────────── │
   │                      │                        │                     │
   │                      │                        │ 11. Sign JWT        │
   │                      │                        │     ID Token        │
   │                      │                        │ (HS256, 1hr expiry) │
   │                      │                        │                     │
   │                      │ 12. Redirect to        │                     │
   │                      │    redirect_uri        │                     │
   │                      │    ?token=<JWT>        │                     │
   │                      │<───────────────────────│                     │
   │                      │                        │                     │
   │                      │ 13. SDK.verify(token)  │                     │
   │                      │     ─ Check signature  │                     │
   │                      │     ─ Check expiry     │                     │
   │                      │     ─ Decode claims    │                     │
   │                      │                        │                     │
   │ 14. Render user      │                        │                     │
   │     dashboard        │                        │                     │
   │<────────────────────-│                        │                     │
```

### Step-by-Step Breakdown

#### **Step 1 — Initiation (Relying Party)**
The user lands on your app and clicks "Sign in with GridLock". Your app builds an authorization URL:

```
https://gridlock-xi.vercel.app?redirect-uri=https://your-app.com/callback
```

This is the **only configuration your app needs** — a `redirect-uri` query parameter pointing to your callback endpoint.

#### **Step 2 — GridLock Takes Over**
GridLock reads the `redirect-uri` parameter and stores it. The user now interacts entirely with the GridLock UI for authentication.

#### **Steps 3–9 — Three-Factor Authentication**
GridLock presents a 3-step wizard:

| Step | What the user does | What GridLock checks |
|------|--------------------|---------------------|
| 1 | Enters username or email | Finds the user record in Supabase |
| 2 | Reproduces their Grid Password (N×N character grid) | Compares cell-by-cell with stored grid |
| 3 | Reproduces their Color Pattern (M×M color grid) | Compares color-by-color with stored pattern |

Only if **all three steps pass** does GridLock proceed to token generation.

#### **Steps 10–11 — Session + Token Generation**
GridLock:
1. Creates a **session record** in Supabase (`sessions` table) with a 1-hour TTL
2. Constructs a **JWT ID Token** (see Section 4)
3. Signs it with **HMAC-SHA256** using a server-side secret

#### **Step 12 — Redirect with Token**
GridLock issues an HTTP redirect to your `redirect-uri`, appending the token:

```
https://your-app.com/callback?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### **Steps 13–14 — Client-Side Verification (via SDK)**
Your callback page uses the **GridLock SDK** to:
- Decode the JWT
- Verify the signature
- Check the expiration
- Extract the user claims and render the dashboard

---

## 4. JWT ID Token — Structure & Fields

The JWT ID Token GridLock issues is a standard three-part base64url-encoded token:

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9
.
eyJzdWIiOiI5ZjA0Y2ExMy0uLi4iLCJlbWFpbCI6InVzZXJAZXhhbXBsZS5jb20iLCAuLi59
.
SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c
```

### 4.1 Header

```json
{
  "alg": "HS256",
  "typ": "JWT"
}
```

| Field | Value | Description |
|-------|-------|-------------|
| `alg` | `HS256` | HMAC with SHA-256 signing algorithm |
| `typ` | `JWT` | Token type identifier |

### 4.2 Payload (Claims)

```json
{
  "iss": "gridlock-xi.vercel.app",
  "sub": "9f04ca13-3b1a-4d2e-a5f6-123456789abc",
  "aud": "https://your-app.com",
  "iat": 1735000000,
  "exp": 1735003600,
  "email": "user@example.com",
  "username": "johndoe",
  "full_name": "John Doe",
  "phone_number": "+91 98765 43210",
  "session_id": "d3e4f5a6-b7c8-9d0e-f1a2-b3c4d5e6f7a8",
  "grid_auth": true,
  "password_grid_size": 4,
  "pattern_grid_size": 3
}
```

#### Standard OIDC Claims

| Claim | Type | Description |
|-------|------|-------------|
| `iss` | String | **Issuer** — the GridLock auth server URL that signed the token |
| `sub` | String (UUID) | **Subject** — the unique, immutable user ID (UUID from Supabase) |
| `aud` | String | **Audience** — your app's redirect URI; verifies this token was meant for you |
| `iat` | Number (Unix) | **Issued At** — timestamp (seconds) when the token was created |
| `exp` | Number (Unix) | **Expiration** — token is invalid after this timestamp (1 hour after `iat`) |

#### GridLock Custom Claims

| Claim | Type | Description |
|-------|------|-------------|
| `email` | String | The user's registered email address |
| `username` | String | The user's chosen unique username |
| `full_name` | String | The user's full display name |
| `phone_number` | String (optional) | Phone number, if provided at registration |
| `session_id` | String (UUID) | The Supabase session record ID; use for server-side session lookup |
| `grid_auth` | Boolean | Always `true` — confirms authentication passed all three grid factors |
| `password_grid_size` | Number | The N dimension of the user's grid password (N×N) |
| `pattern_grid_size` | Number | The M dimension of the user's color pattern grid (M×M) |

### 4.3 Signature

```
HMACSHA256(
  base64url(header) + "." + base64url(payload),
  GRIDLOCK_JWT_SECRET
)
```

The `GRIDLOCK_JWT_SECRET` is a server-side environment variable **never exposed to clients**. This means:
- No one can forge a token without knowing the secret
- Any modification to header or payload invalidates the signature
- The SDK verifies this signature before trusting any claim

### 4.4 Current vs. Future SDK Token

> [!IMPORTANT]
> **Current Sample State:** The sample client (`callback.html`) uses `JSON.parse(atob(token))` — a raw Base64-encoded JSON object, **not a signed JWT**. This is explicitly marked as `⚠️ demo only` in `App.tsx`.
>
> **With the SDK:** The production SDK will handle a proper **HS256-signed JWT**. The SDK already contains the `verify()` and `decode()` functions that cryptographically validate the signature before returning user claims. This eliminates the demo's vulnerability where any crafted base64 string would be accepted.

---

## 5. Security Model

### 5.1 Why the Token is Secure

```
┌──────────────────────────────────────────────────────────┐
│              JWT Security Layers                          │
├──────────────────────────────────────────────────────────┤
│  Layer 1: HMAC-SHA256 Signature                          │
│  ─ Server signs with secret key                          │
│  ─ Any tampering invalidates signature                   │
│  ─ SDK rejects tampered tokens                           │
├──────────────────────────────────────────────────────────┤
│  Layer 2: Expiration (exp claim)                         │
│  ─ Tokens live for exactly 1 hour                        │
│  ─ SDK automatically checks exp on every verify()        │
│  ─ Expired tokens are rejected even if signature valid   │
├──────────────────────────────────────────────────────────┤
│  Layer 3: Audience Check (aud claim)                     │
│  ─ Token tied to specific redirect-uri                   │
│  ─ Cannot be reused on a different relying party         │
├──────────────────────────────────────────────────────────┤
│  Layer 4: Issuer Check (iss claim)                       │
│  ─ SDK verifies token came from GridLock's server        │
│  ─ Rejects tokens from unknown issuers                   │
├──────────────────────────────────────────────────────────┤
│  Layer 5: Session Binding (session_id)                   │
│  ─ Each token linked to a Supabase session record        │
│  ─ Server can invalidate sessions without waiting for exp│
└──────────────────────────────────────────────────────────┘
```

### 5.2 Is the JWT Encrypted?

**JWT ≠ Encryption.** A JWT is signed (JWS), not encrypted (JWE). This means:
- The header and payload are **base64url-encoded** — anyone can decode them and read the claims
- However, the **signature guarantees integrity** — nobody can modify the claims without the server secret

**For the GridLock use case, this is appropriate because:**
- The claims only contain identity information (email, username, session ID) — not secrets
- The token is transmitted over HTTPS, preventing eavesdropping
- The sensitive data (grid passwords, color patterns) is **never included** in the token

> [!TIP]
> If you need to store truly sensitive data in the token payload in future versions, GridLock can upgrade to **JWE (JSON Web Encryption)** using the RSA-OAEP or AES-GCM algorithms. The SDK would then include a `decrypt()` function before `verify()`.

### 5.3 Grid Authentication Security Properties

| Attack Vector | GridLock Defence |
|--------------|-----------------|
| Password guessing | Grid is N×N cells with multiple values — attack surface is exponentially larger than a password |
| Replay attacks | Token expires in 1 hour; session invalidation server-side |
| Token forgery | HS256 signature with server-only secret |
| Credential stuffing | Grid credentials are visual/spatial — not transferable between services |
| Shoulder surfing | Toggle to hide grid cells and colors during entry (`Eye/EyeOff` toggle in UI) |
| DB breach | Grid data stored as structured JSON — not a simple hash, but can be hashed in future |

### 5.4 Cookie Security (Session Persistence)

When a user logs in on GridLock itself, a session cookie is set:
```typescript
setCookie("user", { username, user_id, session_id }, {
  path: "/",
  maxAge: 60 * 60  // 1 hour
});
```

The cookie enables **automatic re-authentication**: if the user returns to GridLock within an hour with a valid `redirect-uri`, the session is looked up in Supabase and the user is redirected back to your app without re-entering their grid credentials.

---

## 6. GridLock SDK — Developer Integration Guide

The GridLock SDK abstracts all the JWT handling so you don't need to implement cryptography yourself.

### 6.1 Installation

```bash
npm install @gridlock/sdk
# or
yarn add @gridlock/sdk
```

### 6.2 Initialization

```javascript
import { GridLockSDK } from '@gridlock/sdk';

const gridlock = new GridLockSDK({
  issuer: 'https://gridlock-xi.vercel.app',  // GridLock's auth server
  audience: 'https://your-app.com',           // Your app's base URL
  // Note: The signing secret is NOT passed here.
  // Verification is done via GridLock's JWKS endpoint in production.
});
```

### 6.3 Core SDK Functions

#### `GridLockSDK.verify(token)` → `UserClaims`

Performs the full security verification pipeline:

```javascript
try {
  const user = await gridlock.verify(token);
  // ✅ Token is authentic, not expired, correct issuer & audience
  console.log(user.username);     // "johndoe"
  console.log(user.email);        // "user@example.com"
  console.log(user.sub);          // "9f04ca13-..."  (user UUID)
  console.log(user.session_id);   // "d3e4f5a6-..."
  console.log(user.grid_auth);    // true
} catch (err) {
  if (err.code === 'TOKEN_EXPIRED')   { /* redirect to login */ }
  if (err.code === 'INVALID_SIG')     { /* reject, possible forgery */ }
  if (err.code === 'WRONG_AUDIENCE')  { /* token not meant for this app */ }
}
```

**Internal steps executed by `verify()`:**
1. Split token into header, payload, signature
2. Re-compute `HMACSHA256(header + "." + payload, secret)` and compare with signature
3. Check `exp` — reject if `Date.now() / 1000 > exp`
4. Check `iss` matches `'gridlock-xi.vercel.app'`
5. Check `aud` matches your configured audience
6. Decode and return payload claims

#### `GridLockSDK.decode(token)` → `Claims` (unverified)

Decodes the payload **without** verifying the signature. Use only for debugging or when you've already verified the token separately:

```javascript
const claims = gridlock.decode(token);
console.log(claims.email);
// ⚠️ This does NOT verify authenticity — never use for access control
```

#### `GridLockSDK.isExpired(token)` → `Boolean`

```javascript
if (gridlock.isExpired(storedToken)) {
  // Redirect user to login
  window.location.href = '/';
}
```

#### `GridLockSDK.getAuthUrl(options)` → `String`

Builds the GridLock authorization URL:

```javascript
const authUrl = gridlock.getAuthUrl({
  redirectUri: 'https://your-app.com/callback'
});
// Returns: https://gridlock-xi.vercel.app?redirect-uri=https://your-app.com/callback

window.location.href = authUrl;
```

### 6.4 Full Callback Page Example

```javascript
// callback.js — runs on your /callback route
import { GridLockSDK } from '@gridlock/sdk';

const gridlock = new GridLockSDK({
  issuer: 'https://gridlock-xi.vercel.app',
  audience: window.location.origin,
});

async function handleCallback() {
  const params = new URLSearchParams(window.location.search);
  const token = params.get('token');

  if (!token) {
    showError('No token received. Authentication failed.');
    return;
  }

  try {
    // 🔐 Full cryptographic verification
    const user = await gridlock.verify(token);

    // ✅ Render authenticated state
    document.getElementById('username').textContent = user.username;
    document.getElementById('email').textContent = user.email;
    document.getElementById('auth-status').textContent = '✅ Authenticated via GridLock';

    // Store token for session persistence (use httpOnly cookie in production)
    sessionStorage.setItem('gridlock_token', token);

  } catch (err) {
    showError(`Authentication error: ${err.message}`);
    console.error('[GridLock]', err);
  }
}

handleCallback();
```

---

## 7. Relying Party Implementation Walkthrough

Based on the **sample client** in `gridLock-client/`, here's how the current demo implements the flow and how the **SDK version** upgrades it:

### 7.1 index.html — Login Trigger

**Current Demo:**
```html
<a href="https://gridlock-xi.vercel.app?redirect-uri=https://grid-lock-client.vercel.app/callback.html" 
   class="auth-btn">
  🔐 Sign in with GridAuth
</a>
```

**With SDK:**
```javascript
import { GridLockSDK } from '@gridlock/sdk';
const gridlock = new GridLockSDK({ ... });

document.getElementById('login-btn').addEventListener('click', () => {
  window.location.href = gridlock.getAuthUrl({
    redirectUri: `${window.location.origin}/callback.html`
  });
});
```

### 7.2 callback.html — Token Handling

**Current Demo (⚠️ insecure base64 decode):**
```javascript
const token = params.get("token");
const user = JSON.parse(atob(token));  // ⚠️ NO SIGNATURE VERIFICATION
```

**With SDK (✅ secure):**
```javascript
import { GridLockSDK } from '@gridlock/sdk';
const gridlock = new GridLockSDK({ issuer: '...', audience: '...' });

const token = params.get('token');
const user = await gridlock.verify(token);  // ✅ Cryptographically verified
```

### 7.3 register.html — The Login Button (One of Many Auth Options)

The sample `register.html` shows GridLock positioned as an **OAuth provider** alongside Google and Facebook — demonstrating how it can be embedded in any existing login form:

```html
<div class="social-buttons">
  <a href="#" class="social-btn google">🔵 Sign in with Google</a>
  <a href="#" class="social-btn facebook">📘 Sign in with Facebook</a>
  <a href="https://gridlock-xi.vercel.app?redirect-uri=..." 
     class="social-btn gridlock">
    🔐 Sign in with GridLock
  </a>
</div>
```

This demonstrates GridLock's goal: be a **drop-in SSO provider** that can sit alongside or replace existing OAuth providers.

---

## 8. Session Management

### 8.1 Session Lifecycle

```
User Logs In
     │
     ▼
GridLock creates session in Supabase
  { session_id, user_id, created_at, expires_at (+1hr) }
     │
     ▼
JWT token issued with session_id claim
     │
     ▼
Client App receives token
     │
     ├──► Option A: Store in sessionStorage (tab-scoped, cleared on close)
     │
     └──► Option B: Store in httpOnly cookie (more secure, survives refresh)
     │
     ▼
On each protected API call:
  → SDK.verify(token) → valid? proceed : redirect to login
     │
     ▼
Token expires after 1 hour
  → User must re-authenticate via GridLock
     │
     ▼
  OR: GridLock's own session cookie re-authenticates silently
  (if user returns to GridLock within the hour)
```

### 8.2 Server-Side Session Validation

For backend APIs (future SDK capability), you can validate the `session_id` against the Supabase `sessions` table:

```javascript
// Server-side middleware (Node.js example)
async function gridlockMiddleware(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  const user = await gridlock.verify(token);
  
  // Optional: Check session is still active in DB
  const session = await supabase
    .from('sessions')
    .select('expires_at')
    .eq('session_id', user.session_id)
    .single();

  if (!session || new Date(session.expires_at) < new Date()) {
    return res.status(401).json({ error: 'Session expired' });
  }

  req.user = user;
  next();
}
```

---

## 9. GridLock's Unique Authentication Factor: The Grid

What makes GridLock fundamentally different from standard OIDC providers is its **dual-grid authentication mechanism**, which serves as the user's credentials.

### 9.1 Grid Password

- An **N×N grid** (3×3 to 10×10) where the user fills specific cells with text characters
- The user defines which cells to fill and with what content during registration
- At login, they must reproduce the exact same grid — same cells, same content, same order
- The grid is stored as a `string[][]` (2D array) in Supabase
- **Entropy:** A 4×4 grid with 16 cells, each able to hold any character, has vastly more combinations than a typical 8-character password

### 9.2 Color Pattern Grid

- An **M×M grid** (3×3 to 10×10) where the user paints cells with colors
- Available colors: `white`, `blue`, `green`, `red`, `yellow`, `purple`
- The user creates a spatial color arrangement during registration
- At login, they must repaint the exact same pattern
- **Entropy:** A 3×3 grid with 6 color choices per cell = 6⁹ = ~10 million combinations

### 9.3 Visual Masking

Both grids have a **show/hide toggle** (Eye/EyeOff icon) to prevent shoulder-surfing:
- **Grid Password**: Toggle masks cell content (like a password field)
- **Color Pattern**: Toggle hides color labels (showing only shapes, not color names)

### 9.4 Comparison Algorithm

The server-side comparison is a strict **cell-by-cell equality check**:

```typescript
export const compareGrids = (grid1: string[][], grid2: string[][]): boolean => {
  if (!grid1 || !grid2) return false;
  if (grid1.length !== grid2.length) return false;
  for (let i = 0; i < grid1.length; i++) {
    for (let j = 0; j < grid1[i].length; j++) {
      if (grid1[i][j] !== grid2[i]?.[j]) return false;
    }
  }
  return true;
};
```

There is **no partial credit** — every cell must match exactly.

---

## 10. Frequently Asked Questions

**Q: Is GridLock a full OIDC provider?**  
A: GridLock is **OIDC-inspired**. It implements the core redirect + token pattern from OIDC but does not yet implement the full specification (e.g., JWKS endpoint, `/.well-known/openid-configuration`, scopes, `nonce`). The SDK abstracts these gaps. Full OIDC compliance is on the roadmap.

**Q: Can I use the JWT on my backend API?**  
A: Yes. Pass the token as a `Bearer` header. Your backend uses `SDK.verify(token)` to authenticate the request without contacting GridLock — verification is local using the shared secret (or public key in future RS256 mode).

**Q: What happens if the GridLock server is down?**  
A: Existing valid tokens can still be verified locally by the SDK (the signature check doesn't require a network call). New logins will fail until the server recovers.

**Q: How do I log a user out?**  
A: Clear the token from storage. For server-side invalidation, call `Database.deleteUserSession(user_id)` to remove the session from Supabase — any subsequent server-side session checks will fail even if the JWT hasn't expired yet.

**Q: Can the same user log in to multiple relying parties?**  
A: Yes — this is the core value proposition. One GridLock account authenticates the user to any app that has registered with GridLock. Each app gets its own token with its own `aud` claim.

**Q: Are grid credentials stored securely?**  
A: Currently stored as structured JSON in Supabase. The next security milestone is to hash the grid data using a deterministic hashing function (e.g., SHA-256 of the serialized grid) before storage, so even a DB breach doesn't expose raw grid credentials.

---

*© 2025 GridLock Systems — Made with ❤️ by Team GridLock*
