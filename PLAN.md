# Clerk Migration Plan — edu-maths (FINAL — LOCKED)

---

# Phase 0: Blockers and Preconditions

### Step 0.1 — Confirm Clerk session claim paths

Files changed: none
Exact change:

* Confirm exact path for:

  * role
  * academySlug
    (e.g. `sessionClaims.metadata.role` or `sessionClaims.publicMetadata.role`)

How to verify:

* Decode real Clerk token and confirm structure.

---

### Step 0.2 — Enable proxy support (if applicable)

Files changed: `backend/src/app.ts`
Exact change:

```ts
app.set('trust proxy', true)
```

How to verify:

* `x-forwarded-for` returns correct client IP

---

### Step 0.3 — Install Clerk backend SDK

Files changed: `backend/package.json`
Exact change:

* install `@clerk/backend`

How to verify:

* import works without errors

---

### Step 0.4 — Create shared Clerk client

Files changed: `backend/src/utils/clerkClient.ts`
Exact change:

```ts
import { createClerkClient } from '@clerk/backend'

export const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY
})
```

How to verify:

* `clerkClient.users.getUser()` works

---

# Phase 1: Database Migration

### Step 1.1 — Wipe student data (FK-safe)

Files changed: new script
Exact change:

1. DELETE exam_answers
2. DELETE exam_attempts
3. DELETE students

How to verify:

* all tables = 0 rows

---

### Step 1.2 — Update students schema

Files changed: `backend/src/db/schema/students.ts`
Exact change:
Add columns:

* clerkUserId (UNIQUE, NOT NULL)
* email (UNIQUE, NOT NULL)
* username (UNIQUE, NOT NULL)
* profilePicUrl (nullable)
* status (enum: pending, approved, suspended, rejected)
* statusNote (nullable)
* statusUpdatedAt (nullable)

How to verify:

* schema compiles

---

### Step 1.3 — Migration SQL

Files changed: new migration
Exact change:

* create enum
* add columns
* add:

  * UNIQUE(clerk_user_id)
  * UNIQUE(email)
  * UNIQUE(username)

How to verify:

* migration runs successfully

---

# Phase 2: Redis + Rate Limiting

### Step 2.1 — Status cache key

Files changed: `redisKeys.ts`
Exact change:

```ts
export const getStudentStatusKey = (id) => `student:status:${id}`
```

---

### Step 2.2 — Registration rate limiter

Files changed: `rateLimit.ts`
Exact change:

```ts
const key = `ratelimit:student_register:${ip}`
const count = await redis.incr(key)
if (count === 1) await redis.expire(key, 900)
```

Rules:

* limit: 10
* window: 15 minutes
* fail-open on Redis error

How to verify:

* 11th request → 429
* TTL does NOT reset

---

### Step 2.3 — Safe IP extraction

Files changed: `rateLimit.ts`
Exact change:

```ts
const ip =
  req.headers['x-forwarded-for']?.split(',')[0]?.trim()
  || req.socket.remoteAddress
```

---

# Phase 3: Middleware (NOT ATTACHED YET)

### Step 3.1 — authenticateStudent

Files changed: `auth.ts`
Exact change:

* get `userId` from Clerk
* extract role from sessionClaims
* REQUIRE role === 'student'
* set:

```ts
req.studentClerkId = userId
```

How to verify:

* teacher token → 403
* student token → pass

---

### Step 3.2 — checkStudentStatus

Files changed: `auth.ts`
Exact change:

1. Redis GET
2. Safe JSON.parse
3. If fail → delete key
4. DB fallback (STRICT QUERY):

```sql
SELECT id, academyId, status, statusNote
FROM students
WHERE clerkUserId = ?
```

5. Cache SET:

```ts
await redis.set(key, JSON.stringify(data), 'EX', TTL)
```

6. Attach:

```ts
req.studentId = student.id
req.academyId = student.academyId
```

7. Enforce:

| status    | result |
| --------- | ------ |
| approved  | next   |
| pending   | 403    |
| suspended | 403    |
| rejected  | 403    |

---

### Step 3.3 — Redis safety

Exact change:

* try/catch JSON.parse
* delete corrupted key
* fail-open on Redis error

---

# Phase 4: /students/register

### Step 4.1 — Require Clerk auth

Files changed: `students.ts`
Exact change:

* use ONLY:

```ts
const clerkUserId = req.auth().userId
```

---

### Step 4.2 — Fetch & normalize email

Exact change:

```ts
email = email.trim().toLowerCase()
```

* use PRIMARY Clerk email ONLY

---

### Step 4.3 — Username validation (GLOBAL UNIQUE)

Exact change:

* regex:

```ts
/^[a-zA-Z0-9._+-]{3,30}$/
```

* DB check:

```sql
WHERE username = ?
```

---

### Step 4.4 — Username conflict handling

Exact change:

* on duplicate → return:

```json
{ "code": "USERNAME_TAKEN" }
```

How to verify:

* frontend can retry without re-signup

---

### Step 4.5 — Validate academySlug

Exact change:

* find academy by slug

---

### Step 4.6 — Apply rate limit

Exact change:

* call limiter at start

---

### Step 4.7 — Idempotent register

Exact change:

```sql
WHERE clerkUserId = ?
```

* if exists → return success

---

### Step 4.8 — Handle race condition

Exact change:

* try insert
* catch UNIQUE(clerkUserId OR username)
* fetch existing row

---

### Step 4.9 — Transaction order (STRICT)

1. validate
2. insert DB
3. update Clerk metadata

---

### Step 4.10 — Metadata merge (CRITICAL)

```ts
{
  ...existingMetadata,
  role: "student",
  academySlug
}
```

NEVER overwrite entire object

---

### Step 4.11 — Metadata failure handling

Exact change:

* if Clerk update fails:

  * log error
  * DO NOT fail request

---

# Phase 5: /students/me

### Step 5.1 — Fetch by clerkUserId

---

### Step 5.2 — Self-healing fallback

IF NOT FOUND:

* read academySlug from Clerk metadata
* IF missing → ERROR
* create student (pending)

---

### Step 5.3 — Race-safe fallback

* same pattern:

  * catch UNIQUE
  * fetch existing

---

### Step 5.4 — Status enforcement

* approved → allow
* else → 403

---

# Phase 6: Teacher Actions

### Step 6.1 — Status endpoints

* approve
* reject
* suspend
* reinstate

---

### Step 6.2 — Cache invalidation

```ts
del(student:status:{clerkUserId})
```

---

### Step 6.3 — Redis fail-safe

* wrap delete in try/catch

---

# Phase 7: Frontend

### Step 7.1 — Use Clerk token

* all API calls use `getToken()`

---

### Step 7.2 — Register call

* send Clerk token
* DO NOT send identity

---

### Step 7.3 — Navigation blocking

* block until `/students/me` resolves

---

### Step 7.4 — Remove JWT system

* remove:

  * student_token
  * studentToken
  * all legacy logic

---

# Phase 8: Mobile

### Step 8.1 — Install Clerk Expo

### Step 8.2 — Use Clerk token

### Step 8.3 — Navigation blocking

### Step 8.4 — Remove JWT storage

---

# Phase 9: Rollout

### Step 9.1 — Apply to /students/me

### Step 9.2 — Apply to low-risk routes

### Step 9.3 — Apply to exam routes

### Step 9.4 — Remove old JWT system

---

# Phase 10: Verification

### Step 10.1 — Registration tests

* idempotent
* duplicate safe
* username conflict works

---

### Step 10.2 — Rate limit tests

* 11th request blocked
* TTL correct

---

### Step 10.3 — Fallback tests

* missing DB row → recreated
* missing metadata → error

---

### Step 10.4 — Cache tests

* corrupted JSON safe
* Redis down safe

---

### Step 10.5 — Auth tests

* teacher unaffected
* exam flow works

---

# FINAL RULES

### Identity

* ONLY Clerk

### Authorization

* ONLY DB

### Trust Boundary

* NEVER trust request body

---

# END
