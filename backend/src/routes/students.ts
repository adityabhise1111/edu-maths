import { Router, Request, Response } from 'express';
import { authenticateTeacher, authenticateStudent } from '../middlewares/index.js';
import { db } from '../db/index.js';
import { students, academies, exams, examAttempts, resources } from '../db/schema/index.js';
import { hashPassword, verifyPassword } from '../utils/password.js';
import { signStudentToken } from '../utils/jwt.js';
import { eq, and, desc } from 'drizzle-orm';
import { cache } from '../utils/cache.js';
import { logger } from '../utils/logger.js';
import { getTeacherAcademyDashboardKey } from '../utils/redisKeys.js';
import { captureSentryException } from '../utils/sentry.js';

const router = Router();

// Create new student
router.post('/create', authenticateTeacher, async (req: Request, res: Response) => {
    try {
        const { academyId, username, password } = req.body;
        const clerkUserId = req.clerkUserId!;

        // 1. Validate Input
        if (!academyId || !username || !password) {
            return res.status(400).json({
                error: 'Validation Error',
                message: 'academyId, username, and password are required',
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                error: 'Validation Error',
                message: 'Password must be at least 6 characters long',
            });
        }

        // 2. Validate Academy Ownership
        // Check if the academy exists AND belongs to the authenticated teacher
        const academy = await db
            .select()
            .from(academies)
            .where(and(
                eq(academies.id, academyId),
                eq(academies.clerkUserId, clerkUserId)
            ))
            .limit(1);

        if (academy.length === 0) {
            return res.status(403).json({
                error: 'Forbidden',
                message: 'You are not authorized to add students to this academy (or it does not exist)',
            });
        }

        // 3. Hash Password
        const passwordHash = await hashPassword(password);

        // 4. Create Student
        // (Drizzle will throw error if username is not unique per academy constraint)
        try {
            const newStudent = await db
                .insert(students)
                .values({
                    academyId,
                    username,
                    passwordHash,
                })
                .returning({
                    id: students.id,
                    username: students.username,
                    academyId: students.academyId,
                    createdAt: students.createdAt,
                });

            // Invalidate teacher academy students cache (all pagination combos)
            await cache.delPattern(`teacher:academy:${academyId}:students:*`);
            // Invalidate dashboard cache (student count changed)
            await cache.del(getTeacherAcademyDashboardKey(academyId));
            logger.info('Cache invalidated for teacher academy students and dashboard', {
                academyId,
                patterns: [`teacher:academy:${academyId}:students:*`, `teacher:academy:${academyId}:dashboard`],
            });

            return res.status(201).json({
                message: 'Student created successfully',
                student: newStudent[0],
            });

        } catch (dbError: any) {
            // Handle unique constraint violation specifically
            if (dbError.code === '23505') { // Postgres generic duplicate key error code
                return res.status(409).json({
                    error: 'Conflict',
                    message: `Username '${username}' is already taken in this academy`,
                });
            }
            throw dbError; // Re-throw other errors
        }

    } catch (error) {
        console.error('Error creating student:', error);
        captureSentryException(error, { route: 'students - create student' });
        return res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to create student',
        });
    }
});

// Student Login
router.post('/login', async (req: Request, res: Response) => {
    try {
        const { academySlug, username, password } = req.body;

        // 1. Validate Input
        if (!academySlug || !username || !password) {
            return res.status(400).json({
                error: 'Validation Error',
                message: 'academySlug, username, and password are required',
            });
        }

        // 2. Find Academy by Slug
        const academy = await db
            .select()
            .from(academies)
            .where(eq(academies.slug, academySlug))
            .limit(1);

        if (academy.length === 0) {
            return res.status(404).json({
                error: 'Not Found',
                message: 'Academy not found',
            });
        }

        const targetAcademy = academy[0];

        // 3. Find Student in that Academy
        const student = await db
            .select()
            .from(students)
            .where(and(
                eq(students.academyId, targetAcademy.id),
                eq(students.username, username)
            ))
            .limit(1);

        if (student.length === 0) {
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'Invalid username or password',
            });
        }

        const targetStudent = student[0];

        // 4. Verify Password
        const isValid = await verifyPassword(password, targetStudent.passwordHash);

        if (!isValid) {
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'Invalid username or password',
            });
        }

        // 5. Generate Token
        const token = signStudentToken({
            studentId: targetStudent.id,
            academyId: targetAcademy.id,
        });

        // 6. Return Response
        return res.status(200).json({
            message: 'Login successful',
            token,
            student: {
                id: targetStudent.id,
                username: targetStudent.username,
                academyId: targetStudent.academyId,
                academyName: targetAcademy.name,
            },
        });

    } catch (error) {
        console.error('Error logging in student:', error);
        captureSentryException(error, { route: 'students - login' });
        return res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to login',
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
