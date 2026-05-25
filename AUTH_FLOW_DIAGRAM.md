# Auth Flow Diagram - AFTER FIXES

## State Transitions

```
┌─────────────────────────────────────────────────────────────┐
│ App Start / AuthProvider Mounts                             │
│ isLoading = true, isAuthenticated = false                   │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ initializeAuth()
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ Reading localStorage for tokens...                          │
│ [AUTH-STORE] Initializing from storage...                   │
└──────────────────────┬──────────────────────────────────────┘
                       │
         ┌─────────────┴─────────────┐
         │                           │
         ▼                           ▼
  ┌─────────────┐           ┌──────────────┐
  │ Tokens      │           │ No tokens    │
  │ Found       │           │ Found        │
  └────┬────────┘           └──────┬───────┘
       │                           │
       │ set({                     │ set({
       │  isAuth: true,            │  isAuth: false,
       │  isLoading: false         │  isLoading: false
       │ })                        │ })
       │                           │
       ▼                           ▼
  ┌─────────────────┐      ┌──────────────────┐
  │ AuthProvider    │      │ AuthProvider     │
  │ Renders children│      │ Renders children │
  └────┬────────────┘      └──────┬───────────┘
       │                          │
       │                          │
       ▼                          ▼
  ┌────────────────────┐  ┌──────────────────────┐
  │ ProtectedRoute     │  │ ProtectedRoute       │
  │ isAuth: true       │  │ isAuth: false        │
  │ → Render children  │  │ → Check redirect     │
  │ → Dashboard loads  │  │ → Set hasRedirected  │
  └────────────────────┘  │ → router.replace()   │
         ✓ DONE           │ → Show redirect      │
                          │   loader             │
                          └──────┬───────────────┘
                                 │
                                 ▼
                          ┌──────────────────┐
                          │ Navigate to      │
                          │ /login           │
                          │ ✓ ONE redirect   │
                          └──────────────────┘
```

## ProtectedRoute Component Logic

```
┌─ useEffect (initialization)
│  └─ set mounted = true
│
├─ useEffect (auth change handler)
│  ├─ if (!mounted) return
│  ├─ if (isLoading) return
│  ├─ if (!isAuth && !hasRedirected)
│  │  ├─ hasRedirected = true    ◄── KEY: Prevent re-redirect
│  │  └─ router.replace("/login")
│  └─ else if (isAuth)
│     └─ render children
│
└─ Render logic (pure, no side effects)
   ├─ if (!mounted) → Loader "Initializing..."
   ├─ if (isLoading) → Loader "Verifying session..."
   ├─ if (!isAuth) → Loader "Redirecting to login..."
   └─ else → Render children
```

## Critical Code Paths

### Path 1: NORMAL AUTHENTICATED FLOW
```
1. initializeAuth() called
   ↓
2. Tokens found in storage
   ↓
3. set({ isAuthenticated: true, isLoading: false })
   ↓
4. ProtectedRoute sees isAuth: true
   ↓
5. Render <>{children}</> (Dashboard)
   ✓ SUCCESS
```

### Path 2: UNAUTHENTICATED FLOW
```
1. initializeAuth() called
   ↓
2. No tokens in storage
   ↓
3. set({ isAuthenticated: false, isLoading: false })
   ↓
4. ProtectedRoute sees isAuth: false
   ↓
5. Check hasRedirectedRef (false)
   ↓
6. Set hasRedirectedRef = true
   ↓
7. router.replace("/login")
   ↓
8. Show loader during redirect
   ✓ ONE REDIRECT (never again this session)
```

### Path 3: ERROR DURING INIT
```
1. initializeAuth() called
   ↓
2. Error occurs in try block
   ↓
3. Catch block: set({ isLoading: false })
   ↓
4. isLoading = false (prevents infinite wait)
   ↓
5. Proceed to authentication check
   ✓ Loader clears, proper state shown
```

### Path 4: INITIALIZATION TIMEOUT
```
1. initializeAuth() called but hangs
   ↓
2. Timeout timer set (5 seconds)
   ↓
3. AuthProvider shows Loader
   ↓
4. If init doesn't complete in 5s
   ↓
5. Timeout fires: setLoading(false)
   ↓
6. AuthProvider proceeds with content
   ✓ Max 5 second wait
```

## Redirect Prevention Mechanism

```
BEFORE (Multiple Redirects):
┌────────────────┐
│ Auth Changed   │
│ isAuth: false  │
└────────┬───────┘
         │
         ├─► router.replace("/login")  ◄─ CALL 1
         │
         │ re-render
         ├─► router.replace("/login")  ◄─ CALL 2 (WRONG!)
         │
         │ re-render
         └─► router.replace("/login")  ◄─ CALL 3 (WRONG!)

AFTER (Single Redirect):
┌────────────────┐
│ Auth Changed   │
│ isAuth: false  │
└────────┬───────┘
         │
         ├─ Check: hasRedirected? NO
         │
         ├─ Set: hasRedirected = true  ◄─ GATE LOCK
         │
         ├─► router.replace("/login")  ◄─ CALL 1 ONLY
         │
         │ re-render
         ├─ Check: hasRedirected? YES
         │
         └─ Skip redirect  ✓ PREVENTED
```

## Loading State Guarantees

```
isLoading Timeline:
─────────────────────────────────────────

START:  true  ─┐
               │ (waiting for init)
               │
               ├─ On success: set false  ✓
               │
               ├─ On error: set false    ✓
               │
               └─ On timeout: set false  ✓
END:    false  ─ (ALWAYS reaches false)

Maximum wait: 5 seconds (timeout guard)
```

## API Retry Logic

```
Original Request
       │
       ▼ 401 Unauthorized
┌─────────────────┐
│ Check: retry?   │
│ _retry = false  │
└────────┬────────┘
         │ YES
         ▼
┌─────────────────────┐
│ _retry = true       │
│ _retryCount++       │
│ (now: 1)            │
└────────┬────────────┘
         │
         ▼
┌──────────────────────┐
│ Check: retryCount?   │
│ 1 > MAX (1)?         │
│ NO, proceed          │
└────────┬─────────────┘
         │
         ▼
┌──────────────────────┐
│ Refresh token logic  │
│ Get new token        │
└────────┬─────────────┘
         │
    ┌────┴────┐
    │          │
    ▼          ▼
 SUCCESS    FAILURE
    │          │
    ▼          ▼
  RETRY     CLEAR SESSION
  REQUEST   & REDIRECT
    ✓        ✓

Key: If same req gets another 401, retryCount is now 2
     2 > MAX, so we stop retrying (break loop)
```

## Console Logs to Expect

### Successful Login
```
[AUTH-PROVIDER] Starting auth initialization...
[AUTH-STORE] Initializing from storage...
[AUTH-STORE] Tokens restored from storage, setting authenticated
[AUTH-PROVIDER] ✓ Verified authenticated
[ROUTE] Auth verification complete: AUTHENTICATED, rendering protected content
```

### Page Refresh (Stays Logged In)
```
[AUTH-PROVIDER] Starting auth initialization...
[AUTH-STORE] Initializing from storage...
[AUTH-STORE] Tokens restored from storage, setting authenticated
[AUTH-PROVIDER] ✓ Verified authenticated
[ROUTE] Auth verification complete: AUTHENTICATED, rendering protected content
DASHBOARD RENDER
```

### Unauthenticated Access
```
[AUTH-PROVIDER] Starting auth initialization...
[AUTH-STORE] Initializing from storage...
[AUTH-STORE] No tokens in storage, user is unauthenticated
[AUTH-PROVIDER] ✓ Verified unauthenticated
[ROUTE] Auth verification complete: NOT authenticated, redirecting to /login
```

### Slow Network / Timeout
```
[AUTH-PROVIDER] Starting auth initialization...
[AUTH-STORE] Initializing from storage...
(5 second wait)
[AUTH-PROVIDER] WARNING: Initialization timeout, forcing isLoading = false
[AUTH-PROVIDER] ✓ Verified unauthenticated
[ROUTE] Auth verification complete: NOT authenticated, redirecting to /login
```

## Checklist for Verification

- [ ] Login page load → no console errors
- [ ] Login with valid credentials → dashboard loads (1 render cycle)
- [ ] F5 refresh on dashboard → stays on dashboard (shows briefly in loading state, then content)
- [ ] Logout → redirects to login (exactly once)
- [ ] DevTools Network → no repeated 307 redirects
- [ ] DevTools Console (Dev mode) → logs show clear progression
- [ ] Throttle to Slow 3G → loader shows up to 5 seconds, then proceeds
- [ ] Multiple tab switches → no infinite loops or race conditions
