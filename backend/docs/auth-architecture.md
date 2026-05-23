# Explanify V2 — Authentication Architecture

## Module Structure
```
modules/auth/
├── auth.controller.js
├── auth.service.js
├── auth.repository.js
├── auth.routes.js
├── auth.validation.js
├── auth.middleware.js
└── auth.utils.js
```

## File Responsibilities
- `auth.controller.js`: HTTP handlers, input parsing, response formatting.
- `auth.service.js`: Core auth workflows (signup/login/refresh).
- `auth.repository.js`: Prisma data access for users, memberships, refresh tokens.
- `auth.routes.js`: Express routing for auth endpoints.
- `auth.validation.js`: Zod schemas for request validation.
- `auth.middleware.js`: JWT verification and role checks.
- `auth.utils.js`: Password hashing, JWT creation, refresh token helpers.

## Authentication Request Lifecycle
1. **Request** hits `/api/auth/*` route
2. **Validation** via Zod schemas
3. **Service** handles business logic
4. **Repository** persists/retrieves data via Prisma
5. **Tokens** issued and returned
6. **Errors** bubble to global error handler

## Middleware Execution Order
1. `cors` + JSON parsing
2. `requestId` middleware
3. Auth middleware (`authenticate`) on protected routes
4. Controller handlers
5. Centralized error handler

## Signup Flow
1. Validate payload (email, name, password, optional orgName)
2. Create user with `passwordHash`
3. Optionally create org + owner membership
4. Issue access + refresh tokens
5. Return user + tokens

## Login Flow
1. Validate credentials
2. Verify password hash
3. Update `lastLoginAt`
4. Issue access + refresh tokens
5. Return user + tokens

## Refresh Token Strategy (Future-Ready)
- Refresh tokens are JWTs signed with `JWT_REFRESH_SECRET`
- `jti` is stored in `RefreshToken` and token hash is stored for verification
- Rotation on refresh (revoke old, mint new)
- Enables revocation, reuse detection, and device sessions

## Example API Routes
- `POST /api/auth/signup`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `GET /api/auth/me`

## Thunder Client / Postman Examples
### Signup
```
POST /api/auth/signup
{
	"email": "dev@explanify.ai",
	"name": "Dev User",
	"password": "StrongPassword123",
	"orgName": "Explanify"
}
```

### Login
```
POST /api/auth/login
{
	"email": "dev@explanify.ai",
	"password": "StrongPassword123"
}
```

### Refresh
```
POST /api/auth/refresh
{
	"refreshToken": "<refresh_token>"
}
```

### Me
```
GET /api/auth/me
Authorization: Bearer <access_token>
```

## Middleware Flow
- `authenticate()` validates JWT and injects `req.auth`
- `requireOrgRole([...])` checks membership role for multi-org access

## Security Best Practices
- Hash passwords with bcryptjs (cost 12)
- Short-lived access tokens (`15m` default)
- Rotating refresh tokens with server-side storage
- Avoid leaking auth errors (generic 401)
- Keep JWT secrets in environment variables

## Runtime Verification Checklist
- `npx prisma validate`
- `npx prisma generate`
- `node -e "require('./src/app')"`
- `POST /api/auth/signup` returns 201 + tokens
- `POST /api/auth/login` returns 200 + tokens
- `GET /api/auth/me` with access token returns user
