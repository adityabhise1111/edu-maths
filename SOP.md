# 🚀 EDU-MATHS BACKEND SOP (STANDARD OPERATING PROCESS)

---

## 🎯 PURPOSE

This document defines a **strict development workflow** for building APIs, integrating Redis, testing, and maintaining clean Git history.

**Goal:**
➡️ ZERO confusion
➡️ ZERO broken flows
➡️ CLEAN & SCALABLE SYSTEM

---

# 🔁 1. API DEVELOPMENT FLOW (MANDATORY)

---

## 🧩 STEP 1 — DEFINE API

Before writing code, define:

```
METHOD: POST /api/students/register

INPUT:
{
  "academySlug": "string",
  "username": "string"
}

AUTH:
- Clerk JWT required
- role must be "student"

OUTPUT:
{
  success: true,
  student: {...}
}
```

---

## ⚙️ STEP 2 — IMPLEMENT API

Checklist:

```
✔ Clerk authentication
✔ Role validation
✔ Input validation
✔ DB queries
✔ Error handling
✔ Idempotency
```

---

## 🧪 STEP 3 — TEST API (MANUAL FIRST)

```
✔ No token → 401
✔ Wrong role → 403
✔ Invalid input → 400
✔ Duplicate → 409
✔ Success → 200/201
✔ Edge cases covered
```

---

# 🔁 2. REDIS INTEGRATION FLOW (SECOND PASS)

---

## ⚡ RULE

```
READ → CACHE
WRITE → INVALIDATE
```

---

## 🟢 READ API (CACHE)

```
1. Check cache
2. If hit → return
3. Else → DB
4. Save to cache
5. Return
```

---

## 🔴 WRITE API (INVALIDATE)

```
After DB update:

DELETE CACHE KEY
```

Example:

```
student:status:{clerkUserId}
```

---

## 🧪 REDIS TESTING

```
✔ First call → DB hit
✔ Second call → cache hit
✔ After update → cache cleared
✔ Redis down → API still works (fail-open)
```

---

# 🔀 3. GIT WORKFLOW (STRICT RULES)

---

## 🔴 RULE 1 — ALWAYS PULL FIRST

```
git pull origin dev --rebase
```

---

## 🔴 RULE 2 — CREATE FEATURE BRANCH

```
git checkout -b feature/student-register
```

---

## 🔴 RULE 3 — BEFORE COMMIT

```
✔ Code compiles
✔ API tested
✔ No conflicts
✔ Nothing broken
```

---

## 🔴 RULE 4 — HANDLE CONFLICTS

```
git pull --rebase
# fix conflicts
git add .
git rebase --continue
```

---

## 🔴 RULE 5 — PUSH

```
git push origin feature/your-feature
```

---

## 🔥 GOLDEN RULE

```
PULL → CODE → TEST → COMMIT → PUSH
```

---

# 🧾 4. COMMIT MESSAGE SYSTEM (MANDATORY)

---

## 🔥 FORMAT (STRICT)

```
TYPE: MESSAGE
```

---

## 🧩 TYPES

```
FEAT     → NEW FEATURE
FIX      → BUG FIX
REFACTOR → CODE IMPROVEMENT
PERF     → PERFORMANCE (REDIS, DB)
DOCS     → DOCUMENTATION
CHORE    → CLEANUP
```

---

## 🚀 ADVANCED FORMAT

```
TYPE(SCOPE): MESSAGE
```

---

## ✅ EXAMPLES

```
FEAT(STUDENT): ADD REGISTER ROUTE WITH CLERK AUTH 🔐

FIX(AUTH): PREVENT TEACHER ACCESS TO STUDENT ROUTES 🚫

PERF(REDIS): CACHE STUDENT STATUS LOOKUP ⚡

REFACTOR(API): CLEAN VALIDATION FLOW ♻️

DOCS(API): UPDATE STUDENT ENDPOINTS 📘
```

---

## ❌ BAD COMMITS

```
fix
done
changes
final
working
```

---

## 🔥 RULE

```
1 FEATURE = 1 COMMIT
```

---

# 🧠 5. DEVELOPMENT CYCLE (FINAL FLOW)

---

```
1. DEFINE API
2. BUILD API
3. TEST API
4. ADD REDIS
5. TEST REDIS
6. UPDATE DOCS
7. CLEAN COMMIT
8. PUSH
```

---

# 🛡️ 6. CORE ARCHITECTURE RULES

---

## 🔐 AUTH

```
IDENTITY → Clerk
AUTHORIZATION → DB
```

---

## 🚫 TRUST BOUNDARY

```
NEVER TRUST REQUEST BODY FOR IDENTITY
```

---

## ✅ ALWAYS TRUST

```
✔ Clerk token
✔ Database checks
```

---

# ⚠️ 7. COMMON MISTAKES (AVOID THESE)

---

```
❌ Allowing teacher to access student APIs
❌ Setting role inside register route
❌ Skipping validation
❌ Not handling race conditions
❌ Not invalidating Redis
❌ Messy commit messages
```

---

# 💣 FINAL RULE

```
NO SYSTEM = CHAOS
SYSTEM = SCALING
```

---

# 🏁 END

---