import { Router, Request, Response } from 'express';
import { authenticateStudent } from '../middlewares/index.js';
import { db } from '../db/index.js';
import { students, academies, exams, examAttempts, resources } from '../db/schema/index.js';
import { eq, and, desc } from 'drizzle-orm';
import { cache } from '../utils/cache.js';
import { logger } from '../utils/logger.js';
import { clerkClient } from '../utils/clerkClient.js';
import { checkRegistrationRateLimit } from '../utils/rateLimit.js';
import { captureSentryException } from '../utils/sentry.js';

const router = Router();

const USERNAME_REGEX = /^[a-zA-Z0-9._+-]{3,30}$/;

router.post('/register', async (req: Request, res: Response) => {
    try {
        const auth = (req as any).auth?.();

        if (!auth || !auth.userId) {
            return res.status(401).json({
                error: 'Unauthorized',
            });
        }

        const { userId } = auth as { userId: string };

        const clerkUser = await clerkClient.users.getUser(userId);

        const role = (clerkUser.publicMetadata as Record<string, unknown> | undefined)?.role;
        if (role !== 'student') {
            return res.status(403).json({
                error: 'Forbidden',
                message: "User must have role 'student'",
            });
        }

        const metaSlug = (clerkUser.publicMetadata as Record<string, unknown> | undefined)?.academySlug;
        const { academySlug, username } = req.body ?? {};
        if (metaSlug && metaSlug !== academySlug) {
            return res.status(403).json({
                error: 'Forbidden',
                message: 'Academy mismatch: cannot register to a different academy',
            });
        }

        const trimmedUsername = typeof username === 'string' ? username.trim() : '';

        if (
            typeof academySlug !== 'string'
            || !academySlug
            || typeof username !== 'string'
            || !trimmedUsername
            || !USERNAME_REGEX.test(trimmedUsername)
        ) {
            return res.status(400).json({
                error: 'Validation Error',
                message: 'Invalid input',
            });
        }

        const ip =
            req.headers['x-forwarded-for']?.toString().split(',')[0]?.trim()
            || req.socket.remoteAddress
            || 'unknown';

        const rateLimit = await checkRegistrationRateLimit(ip);
        if (!rateLimit.allowed) {
            return res.status(429).json({
                error: 'Too Many Requests',
                message: 'Too many registration attempts. Please try again later.',
            });
        }

        const academy = await db
            .select({ id: academies.id })
            .from(academies)
            .where(eq(academies.slug, academySlug))
            .limit(1);

        if (academy.length === 0) {
            return res.status(400).json({
                error: 'Validation Error',
                message: 'Invalid input',
            });
        }

        const academyId = academy[0].id;

        const primaryEmail = clerkUser.emailAddresses.find((e) => e.id === clerkUser.primaryEmailAddressId)?.emailAddress;
        const email = primaryEmail?.trim().toLowerCase();
        const profilePicUrl = clerkUser.imageUrl || null;

        if (!email) {
            return res.status(400).json({
                error: 'Validation Error',
                message: 'Invalid input',
            });
        }

        const existingByClerkId = await db
            .select({
                id: students.id,
                username: students.username,
                academyId: students.academyId,
                status: students.status,
            })
            .from(students)
            .where(eq(students.clerkUserId, userId))
            .limit(1);

        if (existingByClerkId.length > 0) {
            return res.status(201).json({
                success: true,
                student: {
                    id: existingByClerkId[0].id,
                    username: existingByClerkId[0].username,
                    academyId: existingByClerkId[0].academyId,
                    status: existingByClerkId[0].status,
                },
            });
        }

        const existingByUsername = await db
            .select({ id: students.id })
            .from(students)
            .where(eq(students.username, trimmedUsername))
            .limit(1);

        if (existingByUsername.length > 0) {
            return res.status(409).json({
                error: 'Conflict',
                code: 'USERNAME_TAKEN',
                message: 'Username already taken',
            });
        }

        let createdStudent: {
            id: string;
            username: string;
            academyId: string;
            status: 'pending' | 'approved' | 'suspended' | 'rejected';
        };

        try {
            const inserted = await db
                .insert(students)
                .values({
                    clerkUserId: userId,
                    email,
                    username: trimmedUsername,
                    academyId,
                    profilePicUrl,
                    status: 'pending',
                })
                .returning({
                    id: students.id,
                    username: students.username,
                    academyId: students.academyId,
                    status: students.status,
                });

            createdStudent = inserted[0];
        } catch (dbError: any) {
            if (dbError?.code === '23505') {
                const existingAfterConflict = await db
                    .select({
                        id: students.id,
                        username: students.username,
                        academyId: students.academyId,
                        status: students.status,
                    })
                    .from(students)
                    .where(eq(students.clerkUserId, userId))
                    .limit(1);

                if (existingAfterConflict.length > 0) {
                    return res.status(201).json({
                        success: true,
                        student: {
                            id: existingAfterConflict[0].id,
                            username: existingAfterConflict[0].username,
                            academyId: existingAfterConflict[0].academyId,
                            status: existingAfterConflict[0].status,
                        },
                    });
                }

                const usernameTakenAfterConflict = await db
                    .select({ id: students.id })
                    .from(students)
                    .where(eq(students.username, trimmedUsername))
                    .limit(1);

                if (usernameTakenAfterConflict.length > 0) {
                    return res.status(409).json({
                        error: 'Conflict',
                        code: 'USERNAME_TAKEN',
                        message: 'Username already taken',
                    });
                }
            }
            throw dbError;
        }

        const existing = clerkUser.publicMetadata || {};
        await clerkClient.users.updateUserMetadata(userId, {
            publicMetadata: {
                ...existing,
                academySlug,
                username: trimmedUsername,
            },
        });

        return res.status(201).json({
            success: true,
            student: {
                id: createdStudent.id,
                username: createdStudent.username,
                academyId: createdStudent.academyId,
                status: createdStudent.status,
            },
        });

    } catch (error) {
        console.error('Error registering student:', error);
        captureSentryException(error, { route: 'students - register' });
        return res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to register',
        });
    }
});

router.get('/me', async (req: Request, res: Response) => {
    try {
        const auth = (req as any).auth?.();
        if (!auth || !auth.userId) {
            return res.status(401).json({
                error: 'Unauthorized',
            });
        }

        const clerkUserId: string = auth.userId;

        const role = (auth.sessionClaims as any)?.publicMetadata?.role;
        if (role !== 'student') {
            return res.status(403).json({
                error: 'Forbidden',
                message: "User must have role 'student'",
            });
        }

        const findStudent = async () =>
            db.select({
                id: students.id,
                academyId: students.academyId,
                username: students.username,
                status: students.status,
            })
                .from(students)
                .where(eq(students.clerkUserId, clerkUserId))
                .limit(1);

        const studentRows = await findStudent();

        if (studentRows.length === 0) {
            return res.status(404).json({
                error: 'Not Found',
                code: 'ACCOUNT_NOT_FOUND',
            });
        }

        const student = studentRows[0];

        if (student.status !== 'approved') {
            return res.status(403).json({
                error: 'Forbidden',
                code: student.status.toUpperCase(),
            });
        }

        return res.status(200).json({
            success: true,
            student: {
                id: student.id,
                username: student.username,
                academyId: student.academyId,
                status: student.status,
            },
        });
    } catch (error) {
        console.error('Error fetching current student:', error);
        captureSentryException(error, { route: 'students - me' });
        return res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to fetch student profile',
        });
    }
});

// Protected Route: Get Student Exam Attempts (Personal Statuses)
router.get('/exam-attempts', authenticateStudent, async (req: Request, res: Response) => {
    try {
        const studentId = req.studentId!;

        // Fetch all attempts for this student with exam details (for duration)
        const attempts = await db
            .select({
                attemptId: examAttempts.id,
                examId: examAttempts.examId,
                startedAt: examAttempts.startedAt,
                submittedAt: examAttempts.submittedAt,
                durationMinutes: exams.durationMinutes
            })
            .from(examAttempts)
            .innerJoin(exams, eq(examAttempts.examId, exams.id))
            .where(eq(examAttempts.studentId, studentId));

        const now = new Date();

        // Process and derive UI status
        const processedAttempts = attempts.map(attempt => {
            let status: 'active' | 'submitted' | 'expired';

            if (attempt.submittedAt) {
                status = 'submitted';
            } else {
                const startTime = new Date(attempt.startedAt).getTime();
                const durationMs = attempt.durationMinutes * 60 * 1000;
                const endTime = startTime + durationMs;

                if (now.getTime() < endTime) {
                    status = 'active';
                } else {
                    status = 'expired';
                }
            }

            return {
                examId: attempt.examId,
                status,
                attemptId: attempt.attemptId,
                submittedAt: attempt.submittedAt
            };
        });

        return res.status(200).json(processedAttempts);

    } catch (error) {
        console.error('Error fetching exam attempts:', error);
        captureSentryException(error, { route: 'students - get exam attempts' });
        return res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to fetch exam attempts',
        });
    }
});

// Protected Route: Get Student Performance (Overall Stats + History)
router.get('/performance', authenticateStudent, async (req: Request, res: Response) => {
    try {
        const studentId = req.studentId!;

        // 1. Fetch Overall Statistics (Attempts + Scores)
        const allPerformances = await db
            .select({
                examId: examAttempts.examId,
                examTitle: exams.title,
                difficulty: exams.difficulty,
                totalQuestions: exams.totalQuestions,
                score: examAttempts.score,
                submittedAt: examAttempts.submittedAt,
            })
            .from(examAttempts)
            .innerJoin(exams, eq(examAttempts.examId, exams.id))
            .where(eq(examAttempts.studentId, studentId))
            .orderBy(desc(examAttempts.submittedAt));

        // 2. Filter submitted performances
        const submittedPerformances = allPerformances.filter(p => p.submittedAt !== null);

        // 3. Calculate Stats
        const totalExamsAttempted = allPerformances.length;
        const totalExamsSubmitted = submittedPerformances.length;
        let averageScore = 0;
        let lastExamScore = null;

        if (submittedPerformances.length > 0) {
            const totalScore = submittedPerformances.reduce((sum, p) => sum + (p.score || 0), 0);
            averageScore = Math.round((totalScore / submittedPerformances.length) * 100) / 100;
            lastExamScore = submittedPerformances[0].score; // Since desc by submittedAt
        }

        return res.status(200).json({
            overallStats: {
                totalExamsAttempted,
                totalExamsSubmitted,
                averageScore,
                lastExamScore,
            },
            performances: allPerformances,
        });

    } catch (error) {
        console.error('Error fetching student performance:', error);
        captureSentryException(error, { route: 'students - get performance' });
        return res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to fetch performance data',
        });
    }
});

// ============================================
// GET RESOURCES FOR STUDENT'S ACADEMY (Student Only)
// ============================================
router.get('/resources', authenticateStudent, async (req: Request, res: Response) => {
    try {
        const academyId = req.academyId!;
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const offset = (page - 1) * limit;

        // 1. Verify academy exists
        const academy = await db
            .select()
            .from(academies)
            .where(eq(academies.id, academyId))
            .limit(1);

        if (academy.length === 0) {
            return res.status(404).json({
                error: 'Not Found',
                message: 'Academy not found',
            });
        }

        // 2. Get total count
        const allResources = await db
            .select()
            .from(resources)
            .where(eq(resources.academyId, academyId));

        // 3. Get paginated resources
        const paginatedResources = await db
            .select()
            .from(resources)
            .where(eq(resources.academyId, academyId))
            .orderBy(desc(resources.createdAt))
            .limit(limit)
            .offset(offset);

        logger.info('Student fetched resources', {
            academyId,
            page,
            totalResources: allResources.length,
        });

        return res.status(200).json({
            academyId,
            academyName: academy[0].name,
            totalResources: allResources.length,
            resources: paginatedResources,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(allResources.length / limit),
                totalItems: allResources.length,
                itemsPerPage: limit,
            },
        });

    } catch (error: any) {
        logger.error('Error fetching student resources', { error: error.message });
        return res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to fetch resources',
        });
    }
});

export default router;
