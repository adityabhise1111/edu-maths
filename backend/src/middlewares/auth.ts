import { Request, Response, NextFunction } from 'express';


import { db } from '../db/index.js';
import { students } from '../db/schema/index.js';
import { eq } from 'drizzle-orm';
import { getRedisClient, isRedisAvailable } from '../db/redis.js';
import { getStudentStatusKey, STUDENT_STATUS_CACHE_TTL } from '../utils/redisKeys.js';

// Extend Express Request type to include auth from Clerk and Student JWT
declare global {
  namespace Express {
    interface Request {
      clerkUserId?: string;
      studentClerkId?: string;
      studentId?: string;
      academyId?: string;
    }
  }
}

// Custom middleware wrapper that extracts userId from Clerk auth
export const authenticateTeacher = (req: Request, res: Response, next: NextFunction) => {
  // clerkMiddleware() in app.ts must run before this
  const auth = (req as any).auth();

  // Check if auth exists and has a userId
  if (!auth || !auth.userId) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication failed',
    });
  }

  req.clerkUserId = auth.userId;
  next();
};

export const authenticateStudent = (req: Request, res: Response, next: NextFunction) => {
  const auth = (req as any).auth?.();

  if (!auth || !auth.userId) {
    return res.status(401).json({
      error: 'Unauthorized',
    });
  }

  const role = auth?.sessionClaims?.metadata?.role
    || auth?.sessionClaims?.publicMetadata?.role;

  if (!role || role !== 'student') {
    return res.status(403).json({
      error: 'Forbidden',
      message: "User must have role 'student'",
    });
  }

  req.studentClerkId = auth.userId;
  return next();
};

/**
 * New student status middleware (not attached yet).
 * Reads status from Redis cache first, falls back to DB when needed.
 */
export const checkStudentStatus = async (req: Request, res: Response, next: NextFunction) => {
  const clerkUserId = req.studentClerkId;

  if (!clerkUserId) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Student identity missing',
    });
  }

  const redis = getRedisClient();
  const cacheKey = getStudentStatusKey(clerkUserId);

  let status: string | null = null;
  let studentId: string | null = null;
  let academyId: string | null = null;
  let statusNote: string | null = null;

  if (redis && isRedisAvailable()) {
    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          status = parsed.status ?? null;
          studentId = parsed.studentId ?? null;
          academyId = parsed.academyId ?? null;
          statusNote = parsed.statusNote ?? null;
        } catch {
          try {
            await redis.del(cacheKey);
          } catch {
            // fail-open on Redis delete errors
          }
        }
      }
    } catch {
      // fail-open on Redis read errors
    }
  }

  if (!status || !studentId || !academyId) {
    const row = await db
      .select({
        id: students.id,
        academyId: students.academyId,
        status: students.status,
        statusNote: students.statusNote,
      })
      .from(students)
      .where(eq(students.clerkUserId, clerkUserId))
      .limit(1);

    if (row.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Student record not found',
      });
    }

    studentId = row[0].id;
    academyId = row[0].academyId;
    status = row[0].status;
    statusNote = row[0].statusNote ?? null;

    if (redis && isRedisAvailable()) {
      try {
        await redis.set(
          cacheKey,
          JSON.stringify({
            studentId,
            academyId,
            status,
            statusNote,
          }),
          'EX',
          STUDENT_STATUS_CACHE_TTL,
        );
      } catch {
        // fail-open on Redis write errors
      }
    }
  }

  req.studentId = studentId;
  req.academyId = academyId;

  if (status === 'approved') {
    return next();
  }

  return res.status(403).json({
    error: 'Forbidden',
    status,
    message: statusNote || 'Your account is not approved yet.',
  });
};

/**
 * Middleware compatibility wrapper to enforce academy isolation.
 * Checks if the JWT's academyId matches the requested resource's academyId.
 * @param source Where to find the academyId comparison value ('body', 'params', 'query')
 * @param key The key name (default: 'academyId')
 */
export const requireAcademyAccess = (source: 'body' | 'params' | 'query' = 'body', key: string = 'academyId') => {
  return (req: Request, res: Response, next: NextFunction) => {
    // 1. Ensure user is authenticated first
    if (!req.academyId) {
      return res.status(401).json({ error: 'Unauthorized', message: 'Student not authenticated' });
    }

    // 2. Extract target academy ID
    const targetAcademyId = req[source][key];

    // 3. Skip check if not present (route specific - maybe 400? letting it pass for now if optional)
    if (!targetAcademyId) {
      return next();
    }

    // 4. Compare
    if (req.academyId !== targetAcademyId) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Access denied: You are not enrolled in this academy',
      });
    }

    next();
  };
};
