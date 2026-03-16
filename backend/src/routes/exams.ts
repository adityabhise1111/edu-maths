import { Router, Request, Response } from 'express';
import { authenticateTeacher, authenticateStudent } from '../middlewares/index.js';
import { db } from '../db/index.js';
import { exams, academies, examAttempts, examAnswers, questionsEasy, questionsMedium, questionsHard } from '../db/schema/index.js';
import { eq, and, inArray, desc } from 'drizzle-orm';
import { fetchRandomQuestions } from '../services/questions.js';
import { getRedisClient, isRedisAvailable } from '../db/redis.js';
import { getAcademyExamsKey, getExamStartLockKey, getStudentExamStatusKey, getStudentExamQuestionsKey, getStudentExamResultKey, getTeacherAcademyDashboardKey } from '../utils/redisKeys.js';
import { setExamAttemptActive, markExamAttemptInactive, isExamAttemptActive } from '../utils/examAttemptHelpers.js';
import { finalizeExamAttempt } from '../utils/examFinalization.js';
import { cache } from '../utils/cache.js';
import { logger } from '../utils/logger.js';
import { checkRateLimit, getRateLimitErrorMessage } from '../utils/rateLimit.js';
import { checkSubmitIdempotency, storeSubmitIdempotency } from '../utils/idempotency.js';
import { captureSentryException } from '../utils/sentry.js';

const router = Router();

// Create exam
router.post('/create', authenticateTeacher, async (req: Request, res: Response) => {
    try {
        const { academyId, title, difficulty, totalQuestions, durationMinutes, startTime } = req.body;
        const clerkUserId = req.clerkUserId!;

        // 1. Validate Input
        if (!academyId || !title || !difficulty || !totalQuestions || !durationMinutes || !startTime) {
            return res.status(400).json({
                error: 'Validation Error',
                message: 'All fields are required: academyId, title, difficulty, totalQuestions, durationMinutes, startTime',
            });
        }

        // Validate difficulty enum
        if (!['easy', 'medium', 'hard'].includes(difficulty)) {
            return res.status(400).json({
                error: 'Validation Error',
                message: 'Difficulty must be one of: easy, medium, hard',
            });
        }

        // Validate numeric fields
        if (totalQuestions <= 0 || durationMinutes <= 0) {
            return res.status(400).json({
                error: 'Validation Error',
                message: 'totalQuestions and durationMinutes must be positive numbers',
            });
        }

        // 2. Validate Academy Ownership
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
                message: 'You are not authorized to create exams for this academy',
            });
        }

        // 3. Calculate End Time
        const startTimeDate = new Date(startTime);
        const endTimeDate = new Date(startTimeDate.getTime() + durationMinutes * 60 * 1000);

        // 4. Create Exam
        const newExam = await db
            .insert(exams)
            .values({
                academyId,
                title,
                difficulty,
                totalQuestions,
                durationMinutes,
                startTime: startTimeDate,
                endTime: endTimeDate,
            })
            .returning({
                id: exams.id,
                title: exams.title,
                difficulty: exams.difficulty,
                totalQuestions: exams.totalQuestions,
                durationMinutes: exams.durationMinutes,
                startTime: exams.startTime,
                endTime: exams.endTime,
                createdAt: exams.createdAt,
            });

        // 5. Invalidate exam list caches for this academy
        const redis = getRedisClient();
        if (redis && isRedisAvailable()) {
            try {
                // Invalidate public academy exams cache
                const publicKey = getAcademyExamsKey(academy[0].slug);
                await redis.del(publicKey);
                console.log(`🗑️ Cache invalidated: ${publicKey}`);
                
                // Invalidate teacher dashboard exams cache (all pagination combos)
                await cache.delPattern(`teacher:academy:${academyId}:exams:*`);
                // Invalidate dashboard stats cache (exam count changed)
                await cache.del(getTeacherAcademyDashboardKey(academyId));
                logger.info('Cache invalidated for teacher academy exams and dashboard', {
                    academyId,
                    patterns: [`teacher:academy:${academyId}:exams:*`, `teacher:academy:${academyId}:dashboard`],
                });
            } catch (redisError) {
                // Capture swallowed Redis cache errors as non-fatal events for backend observability.
                captureSentryException(redisError, {
                    area: 'exam.create.cacheInvalidation',
                    academyId,
                });
                console.error('Redis error (cache invalidation):', redisError);
                // Don't fail the request if cache invalidation fails
            }
        }

        return res.status(201).json({
            message: 'Exam created successfully',
            exam: newExam[0],
        });

    } catch (error) {
        console.error('Error creating exam:', error);
        return res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to create exam',
        });
    }
});

// Get all exams for an academy (public)
router.get('/academy/:academySlug', async (req: Request, res: Response) => {
    try {
        const { academySlug } = req.params;
        
        // Parse pagination parameters
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const offset = (page - 1) * limit;

        const redisKey = getAcademyExamsKey(academySlug);
        const redis = getRedisClient();

        // Try Redis cache first (if available)
        if (redis && isRedisAvailable()) {
            try {
                const cached = await redis.get(redisKey);
                if (cached) {
                    console.log(`✅ Cache HIT: ${redisKey}`);
                    const cachedData = JSON.parse(cached);
                    
                    // Apply pagination to cached data
                    const startIdx = offset;
                    const endIdx = offset + limit;
                    const paginatedExams = cachedData.exams.slice(startIdx, endIdx);
                    
                    return res.status(200).json({
                        academy: cachedData.academy,
                        exams: paginatedExams,
                        pagination: {
                            currentPage: page,
                            totalPages: Math.ceil(cachedData.exams.length / limit),
                            totalItems: cachedData.exams.length,
                            itemsPerPage: limit,
                        },
                    });
                }
                console.log(`❌ Cache MISS: ${redisKey}`);
            } catch (redisError) {
                console.error('Redis error (cache check):', redisError);
                // Continue to database if Redis fails
            }
        }

        // 1. Find Academy by Slug
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

        // 2. Fetch All Exams (for cache - no pagination yet)
        const allExams = await db
            .select({
                id: exams.id,
                title: exams.title,
                difficulty: exams.difficulty,
                startTime: exams.startTime,
                endTime: exams.endTime,
                createdAt: exams.createdAt,
            })
            .from(exams)
            .where(eq(exams.academyId, targetAcademy.id))
            .orderBy(desc(exams.createdAt));

        // Prepare data for caching (without pagination)
        const cacheData = {
            academy: {
                name: targetAcademy.name,
                slug: targetAcademy.slug,
            },
            exams: allExams,
        };

        // Store in Redis cache (if available) - 1 minute TTL
        if (redis && isRedisAvailable()) {
            try {
                await redis.setex(redisKey, 60, JSON.stringify(cacheData));
                console.log(`✅ Cached: ${redisKey} (TTL: 1 min)`);
            } catch (redisError) {
                console.error('Redis error (cache set):', redisError);
                // Don't fail the request if caching fails
            }
        }

        // 3. Apply pagination to response
        const paginatedExams = allExams.slice(offset, offset + limit);

        return res.status(200).json({
            academy: {
                name: targetAcademy.name,
                slug: targetAcademy.slug,
            },
            exams: paginatedExams,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(allExams.length / limit),
                totalItems: allExams.length,
                itemsPerPage: limit,
            },
        });

    } catch (error) {
        console.error('Error fetching exams:', error);
        return res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to fetch exams',
        });
    }
});

// Check exam status for student
router.get('/:examId/status', authenticateStudent, async (req: Request, res: Response) => {
    try {
        const { examId } = req.params;
        const studentId = req.studentId!;
        const studentAcademyId = req.academyId!;

        // CACHE: Check if status is cached
        const cacheKey = getStudentExamStatusKey(examId, studentId);
        const cachedData = await cache.get<any>(cacheKey);
        
        if (cachedData) {
            logger.info('Cache hit for exam status', {
                requestId: req.requestId,
                examId,
                studentId,
                cacheKey,
            });
            return res.status(200).json(cachedData);
        }

        // 1. Fetch Exam
        const exam = await db
            .select()
            .from(exams)
            .where(eq(exams.id, examId))
            .limit(1);

        if (exam.length === 0) {
            return res.status(404).json({
                error: 'Not Found',
                message: 'Exam not found',
            });
        }

        const targetExam = exam[0];

        // 2. Verify Exam Belongs to Student's Academy
        if (targetExam.academyId !== studentAcademyId) {
            return res.status(403).json({
                error: 'Forbidden',
                message: 'You are not enrolled in this academy',
            });
        }

        // 3. Check if student has already attempted this exam
        const existingAttempt = await db
            .select()
            .from(examAttempts)
            .where(and(
                eq(examAttempts.examId, examId),
                eq(examAttempts.studentId, studentId)
            ))
            .limit(1);

        let attemptStatus: 'not_attempted' | 'in_progress' | 'submitted' = 'not_attempted';
        
        if (existingAttempt.length > 0) {
            const attempt = existingAttempt[0];
            if (attempt.submittedAt !== null) {
                attemptStatus = 'submitted';
            } else {
                attemptStatus = 'in_progress';
            }
        }

        // 4. Determine Exam Status (timing)
        const now = new Date();
        const startTime = new Date(targetExam.startTime);
        const endTime = new Date(targetExam.endTime);

        let status: 'not_started' | 'active' | 'expired';

        if (now < startTime) {
            status = 'not_started';
        } else if (now >= startTime && now <= endTime) {
            status = 'active';
        } else {
            status = 'expired';
        }

        // 5. Prepare Response
        const responseData = {
            examId: targetExam.id,
            title: targetExam.title,
            difficulty: targetExam.difficulty,
            durationMinutes: targetExam.durationMinutes,
            totalQuestions: targetExam.totalQuestions,
            startTime: targetExam.startTime,
            endTime: targetExam.endTime,
            status, // Exam timing status
            attemptStatus, // NEW: Student's attempt status
            // Include score if submitted
            ...(attemptStatus === 'submitted' && existingAttempt[0].score !== null ? {
                score: existingAttempt[0].score,
                submittedAt: existingAttempt[0].submittedAt
            } : {})
        };

        // CACHE: Store the result for 10 seconds
        await cache.set(cacheKey, responseData, 20);
        
        logger.info('Cache miss - exam status fetched from DB and cached', {
            requestId: req.requestId,
            examId,
            studentId,
            cacheKey,
            status,
            attemptStatus,
            ttl: 10,
        });

        return res.status(200).json(responseData);

    } catch (error) {
        console.error('Error checking exam status:', error);
        return res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to check exam status',
        });
    }
});

// Start exam attempt
router.post('/:examId/start', authenticateStudent, async (req: Request, res: Response) => {
    const { examId } = req.params;
    const studentId = req.studentId!;
    const studentAcademyId = req.academyId!;
    
    const lockKey = getExamStartLockKey(examId, studentId);
    const redis = getRedisClient();
    let lockAcquired = false;

    try {
        // 1. Acquire Redis lock (if available) to prevent concurrent attempts
        if (redis && isRedisAvailable()) {
            try {
                // SET NX (set if not exists) with 10 second expiry
                const lockResult = await redis.set(lockKey, '1', 'EX', 10, 'NX');
                
                if (!lockResult) {
                    // Lock already exists - another request is processing
                    console.log(`🔒 Lock conflict: ${lockKey}`);
                    return res.status(409).json({
                        error: 'Conflict',
                        message: 'An exam start request is already being processed. Please wait and try again.',
                    });
                }
                
                lockAcquired = true;
                console.log(`🔓 Lock acquired: ${lockKey}`);
            } catch (redisError) {
                console.error('Redis error (lock acquisition):', redisError);
                // Continue without lock if Redis fails (DB constraint is final guard)
            }
        }

        // 2. Verify Exam Exists
        const exam = await db
            .select()
            .from(exams)
            .where(eq(exams.id, examId))
            .limit(1);

        if (exam.length === 0) {
            return res.status(404).json({
                error: 'Not Found',
                message: 'Exam not found',
            });
        }

        const targetExam = exam[0];

        // 3. Verify Exam Belongs to Student's Academy
        if (targetExam.academyId !== studentAcademyId) {
            return res.status(403).json({
                error: 'Forbidden',
                message: 'You are not enrolled in this academy',
            });
        }

        // 4. Verify Exam is Active (current time within window)
        const now = new Date();
        const startTime = new Date(targetExam.startTime);
        const endTime = new Date(targetExam.endTime);

        if (now < startTime) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'Exam has not started yet',
            });
        }

        if (now > endTime) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'Exam has already ended',
            });
        }

        // 5. Verify Student Has Not Attempted Exam Before (DB is final authority)
        const existingAttempt = await db
            .select()
            .from(examAttempts)
            .where(and(
                eq(examAttempts.examId, examId),
                eq(examAttempts.studentId, studentId)
            ))
            .limit(1);

        if (existingAttempt.length > 0) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'You have already attempted this exam',
            });
        }

        // 6. Fetch Random Questions and Lock Them
        const randomQuestions = await fetchRandomQuestions(
            targetExam.difficulty,
            targetExam.totalQuestions
        );

        // 7. Create Exam Attempt Entry
        const newAttempt = await db
            .insert(examAttempts)
            .values({
                examId,
                studentId,
                startedAt: now,
            })
            .returning({
                id: examAttempts.id,
                startedAt: examAttempts.startedAt,
            });

        const attemptId = newAttempt[0].id;

        // 8. Pre-create exam_answers rows to lock questions
        // This ensures the student always gets the same questions for this attempt
        const examAnswerRows = randomQuestions.map(q => ({
            attemptId,
            questionId: q.id,
            selectedOption: -1, // Placeholder for unanswered (-1 means no selection)
            isCorrect: false,  // Placeholder - will be updated on submission
        }));

        await db.insert(examAnswers).values(examAnswerRows);

        // 9. Set attempt as active in Redis (expires at global exam end time)
        await setExamAttemptActive(attemptId, targetExam.endTime);

        // 10. Invalidate student exam status cache (status changed from not_started to active)
        await cache.del(`student:exam:${examId}:student:${studentId}:status`);
        logger.info('Cache invalidated for student exam status after start', {
            examId,
            studentId,
        });

        // 11. Return Attempt Details
        return res.status(201).json({
            message: 'Exam attempt started successfully',
            attemptId,
            durationMinutes: targetExam.durationMinutes,
            serverStartTime: newAttempt[0].startedAt,
        });

    } catch (error) {
        console.error('Error starting exam attempt:', error);
        return res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to start exam attempt',
        });
    } finally {
        // 12. Release lock (if acquired)
        if (lockAcquired && redis && isRedisAvailable()) {
            try {
                await redis.del(lockKey);
                console.log(`🔓 Lock released: ${lockKey}`);
            } catch (redisError) {
                console.error('Redis error (lock release):', redisError);
                // Lock will auto-expire in 10 seconds anyway
            }
        }
    }
});

// Get exam questions (student)
router.get('/:examId/questions', authenticateStudent, async (req: Request, res: Response) => {
    try {
        const { examId } = req.params;
        const studentId = req.studentId!;
        const studentAcademyId = req.academyId!;

        // CACHE: Check if questions are cached
        const cacheKey = getStudentExamQuestionsKey(examId, studentId);
        const cachedData = await cache.get<any>(cacheKey);
        
        if (cachedData) {
            logger.info('Cache hit for exam questions', {
                requestId: req.requestId,
                examId,
                studentId,
                cacheKey,
            });
            return res.status(200).json(cachedData);
        }

        // 1. Fetch Exam
        const exam = await db
            .select()
            .from(exams)
            .where(eq(exams.id, examId))
            .limit(1);

        if (exam.length === 0) {
            return res.status(404).json({
                error: 'Not Found',
                message: 'Exam not found',
            });
        }

        const targetExam = exam[0];

        // 2. Verify Exam Belongs to Student's Academy
        if (targetExam.academyId !== studentAcademyId) {
            return res.status(403).json({
                error: 'Forbidden',
                message: 'You are not enrolled in this academy',
            });
        }

        // 3. Verify Exam is Active
        const now = new Date();
        const startTime = new Date(targetExam.startTime);
        const endTime = new Date(targetExam.endTime);

        if (now < startTime) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'Exam has not started yet',
            });
        }

        if (now > endTime) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'Exam has already ended',
            });
        }

        // 4. Find Student's Attempt for This Exam
        const attempt = await db
            .select()
            .from(examAttempts)
            .where(and(
                eq(examAttempts.examId, examId),
                eq(examAttempts.studentId, studentId)
            ))
            .limit(1);

        if (attempt.length === 0) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'You must start the exam before accessing questions',
            });
        }

        const attemptId = attempt[0].id;

        // 5. Fetch Locked Question IDs from exam_answers
        const lockedAnswers = await db
            .select({
                questionId: examAnswers.questionId,
            })
            .from(examAnswers)
            .where(eq(examAnswers.attemptId, attemptId));

        if (lockedAnswers.length === 0) {
            return res.status(500).json({
                error: 'Internal Server Error',
                message: 'No questions found for this attempt',
            });
        }

        const questionIds = lockedAnswers.map(a => a.questionId);

        // 6. Fetch Question Details (WITHOUT correct_option)
        // Select the appropriate table based on difficulty
        let table;
        switch (targetExam.difficulty) {
            case 'easy':
                table = questionsEasy;
                break;
            case 'medium':
                table = questionsMedium;
                break;
            case 'hard':
                table = questionsHard;
                break;
            default:
                return res.status(500).json({
                    error: 'Internal Server Error',
                    message: 'Invalid difficulty level',
                });
        }

        const questions = await db
            .select({
                id: table.id,
                question: table.question,
                options: table.options,
            })
            .from(table)
            .where(inArray(table.id, questionIds));

        // 7. Prepare Response
        const responseData = {
            examId: targetExam.id,
            title: targetExam.title,
            difficulty: targetExam.difficulty,
            totalQuestions: targetExam.totalQuestions,
            durationMinutes: targetExam.durationMinutes,
            attemptId,
            startedAt: attempt[0].startedAt,
            questions,
        };

        // CACHE: Calculate dynamic TTL until exam end time
        const ttlSeconds = Math.floor((endTime.getTime() - now.getTime()) / 1000);
        
        // Only cache if there's time remaining (should always be true here due to earlier check)
        if (ttlSeconds > 0) {
            await cache.set(cacheKey, responseData, ttlSeconds);
            
            logger.info('Cache miss - exam questions fetched from DB and cached', {
                requestId: req.requestId,
                examId,
                studentId,
                attemptId,
                cacheKey,
                ttl: ttlSeconds,
                examEndTime: endTime.toISOString(),
            });
        }

        return res.status(200).json(responseData);

    } catch (error) {
        console.error('Error fetching exam questions:', error);
        return res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to fetch exam questions',
        });
    }
});

// Submit answer for a question
router.post('/:examId/answer', authenticateStudent, async (req: Request, res: Response) => {
    try {
        const { examId } = req.params;
        const { questionId, selectedOption } = req.body;
        const studentId = req.studentId!;
        const studentAcademyId = req.academyId!;

        // 0. Rate Limit Check (Per Student Per Exam)
        const rateLimitResult = await checkRateLimit('answer', examId, studentId);
        if (!rateLimitResult.allowed) {
            return res.status(429).json({
                error: 'Too Many Requests',
                message: getRateLimitErrorMessage('answer', rateLimitResult.resetAt),
                limit: rateLimitResult.limit,
                remaining: rateLimitResult.remaining,
            });
        }

        // 1. Validate Input
        if (!questionId || selectedOption === undefined || selectedOption === null) {
            return res.status(400).json({
                error: 'Validation Error',
                message: 'questionId and selectedOption are required',
            });
        }

        // Validate selectedOption is a number between 0-3 (valid option indices)
        if (typeof selectedOption !== 'number' || selectedOption < 0 || selectedOption > 3) {
            return res.status(400).json({
                error: 'Validation Error',
                message: 'selectedOption must be between 0-3 (A, B, C, or D)',
            });
        }

        // 2. Verify Exam Exists and Belongs to Student's Academy
        const exam = await db
            .select()
            .from(exams)
            .where(eq(exams.id, examId))
            .limit(1);

        if (exam.length === 0) {
            return res.status(404).json({
                error: 'Not Found',
                message: 'Exam not found',
            });
        }

        if (exam[0].academyId !== studentAcademyId) {
            return res.status(403).json({
                error: 'Forbidden',
                message: 'You are not enrolled in this academy',
            });
        }

        // 3. Verify Attempt Exists
        const attempt = await db
            .select()
            .from(examAttempts)
            .where(and(
                eq(examAttempts.examId, examId),
                eq(examAttempts.studentId, studentId)
            ))
            .limit(1);

        if (attempt.length === 0) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'You must start the exam before submitting answers',
            });
        }

        const attemptData = attempt[0];
        const targetExam = exam[0];

        // 4. Verify Attempt Not Submitted
        if (attemptData.submittedAt !== null) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'Exam has already been submitted',
            });
        }

        // 5. Centralized Timing Enforcement: Check if attempt is still active
        // Uses Redis for fast check, falls back to DB if Redis unavailable
        const isActive = await isExamAttemptActive(attemptData.id);
        
        if (!isActive) {
            // AUTO-SUBMIT TRIGGER: If time expired and not yet submitted, finalize the exam
            if (attemptData.submittedAt === null) {
                console.log(`🔄 Auto-submit triggered for attempt ${attemptData.id} (answer request after expiry)`);
                await finalizeExamAttempt(attemptData.id, true);
            }

            return res.status(400).json({
                error: 'Bad Request',
                message: 'Exam time has expired. Your exam has been automatically submitted.',
            });
        }

        // 6. Verify Question Belongs to Attempt
        const existingAnswer = await db
            .select()
            .from(examAnswers)
            .where(and(
                eq(examAnswers.attemptId, attemptData.id),
                eq(examAnswers.questionId, questionId)
            ))
            .limit(1);

        if (existingAnswer.length === 0) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'Question does not belong to this exam attempt',
            });
        }

        // 7. Update Selected Option (Allow Overwrite)
        await db
            .update(examAnswers)
            .set({
                selectedOption,
            })
            .where(and(
                eq(examAnswers.attemptId, attemptData.id),
                eq(examAnswers.questionId, questionId)
            ));

        return res.status(200).json({
            message: 'Answer saved successfully',
            questionId,
            selectedOption,
        });

    } catch (error) {
        console.error('Error submitting answer:', error);
        return res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to submit answer',
        });
    }
});

// Submit multiple answers at once (batch)
router.post('/:examId/answers', authenticateStudent, async (req: Request, res: Response) => {
    try {
        const { examId } = req.params;
        const { answers } = req.body;
        const studentId = req.studentId!;
        const studentAcademyId = req.academyId!;

        // 0. Rate Limit Check (Per Student Per Exam)
        const rateLimitResult = await checkRateLimit('answer', examId, studentId);
        if (!rateLimitResult.allowed) {
            return res.status(429).json({
                error: 'Too Many Requests',
                message: getRateLimitErrorMessage('answer', rateLimitResult.resetAt),
                limit: rateLimitResult.limit,
                remaining: rateLimitResult.remaining,
            });
        }

        // 1. Validate Input
        if (!answers || !Array.isArray(answers) || answers.length === 0) {
            return res.status(400).json({
                error: 'Validation Error',
                message: 'answers array is required and must not be empty',
            });
        }

        // Validate each answer
        for (const answer of answers) {
            if (!answer.questionId || answer.selectedOption === undefined || answer.selectedOption === null) {
                return res.status(400).json({
                    error: 'Validation Error',
                    message: 'Each answer must have questionId and selectedOption',
                });
            }

            if (typeof answer.selectedOption !== 'number' || answer.selectedOption < 0 || answer.selectedOption > 3) {
                return res.status(400).json({
                    error: 'Validation Error',
                    message: 'selectedOption must be between 0-3 (A, B, C, or D)',
                });
            }
        }

        // 2. Verify Exam Exists and Belongs to Student's Academy
        const exam = await db
            .select()
            .from(exams)
            .where(eq(exams.id, examId))
            .limit(1);

        if (exam.length === 0) {
            return res.status(404).json({
                error: 'Not Found',
                message: 'Exam not found',
            });
        }

        if (exam[0].academyId !== studentAcademyId) {
            return res.status(403).json({
                error: 'Forbidden',
                message: 'You are not enrolled in this academy',
            });
        }

        // 3. Verify Attempt Exists
        const attempt = await db
            .select()
            .from(examAttempts)
            .where(and(
                eq(examAttempts.examId, examId),
                eq(examAttempts.studentId, studentId)
            ))
            .limit(1);

        if (attempt.length === 0) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'You must start the exam before submitting answers',
            });
        }

        const attemptData = attempt[0];
        const targetExam = exam[0];

        // 4. Verify Attempt Not Submitted
        if (attemptData.submittedAt !== null) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'Exam has already been submitted',
            });
        }

        // 5. Centralized Timing Enforcement: Check if attempt is still active
        // Uses Redis for fast check, falls back to DB if Redis unavailable
        const isActive = await isExamAttemptActive(attemptData.id);
        
        if (!isActive) {
            // AUTO-SUBMIT TRIGGER: If time expired and not yet submitted, finalize the exam
            if (attemptData.submittedAt === null) {
                console.log(`🔄 Auto-submit triggered for attempt ${attemptData.id} (batch answers request after expiry)`);
                await finalizeExamAttempt(attemptData.id, true);
            }

            return res.status(400).json({
                error: 'Bad Request',
                message: 'Exam time has expired. Your exam has been automatically submitted.',
            });
        }

        // 6. Fetch all locked questions for this attempt
        const lockedAnswers = await db
            .select({
                questionId: examAnswers.questionId,
            })
            .from(examAnswers)
            .where(eq(examAnswers.attemptId, attemptData.id));

        const lockedQuestionIds = new Set(lockedAnswers.map(a => a.questionId));

        // 7. Verify all submitted questions belong to this attempt
        for (const answer of answers) {
            if (!lockedQuestionIds.has(answer.questionId)) {
                return res.status(400).json({
                    error: 'Bad Request',
                    message: `Question ${answer.questionId} does not belong to this exam attempt`,
                });
            }
        }

        // 8. Update all answers
        let updatedCount = 0;
        for (const answer of answers) {
            await db
                .update(examAnswers)
                .set({
                    selectedOption: answer.selectedOption,
                })
                .where(and(
                    eq(examAnswers.attemptId, attemptData.id),
                    eq(examAnswers.questionId, answer.questionId)
                ));
            updatedCount++;
        }

        return res.status(200).json({
            message: 'Answers saved successfully',
            savedCount: updatedCount,
            totalQuestions: lockedAnswers.length,
        });

    } catch (error) {
        console.error('Error submitting batch answers:', error);
        return res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to submit answers',
        });
    }
});

// Submit exam (final submission with evaluation)
router.post('/:examId/submit', authenticateStudent, async (req: Request, res: Response) => {
    try {
        const { examId } = req.params;
        const studentId = req.studentId!;
        const studentAcademyId = req.academyId!;

        // 0. Idempotency Check - Return cached result if this submission was already processed
        const cachedResult = await checkSubmitIdempotency(examId, studentId);
        if (cachedResult) {
            return res.status(200).json(cachedResult);
        }

        // 1. Rate Limit Check (Per Student Per Exam)
        const rateLimitResult = await checkRateLimit('submit', examId, studentId);
        if (!rateLimitResult.allowed) {
            return res.status(429).json({
                error: 'Too Many Requests',
                message: getRateLimitErrorMessage('submit', rateLimitResult.resetAt),
                limit: rateLimitResult.limit,
                remaining: rateLimitResult.remaining,
            });
        }

        // 2. Verify Exam Exists and Belongs to Student's Academy
        const exam = await db
            .select()
            .from(exams)
            .where(eq(exams.id, examId))
            .limit(1);

        if (exam.length === 0) {
            return res.status(404).json({
                error: 'Not Found',
                message: 'Exam not found',
            });
        }

        const targetExam = exam[0];

        if (targetExam.academyId !== studentAcademyId) {
            return res.status(403).json({
                error: 'Forbidden',
                message: 'You are not enrolled in this academy',
            });
        }

        // 3. Verify Attempt Exists
        const attempt = await db
            .select()
            .from(examAttempts)
            .where(and(
                eq(examAttempts.examId, examId),
                eq(examAttempts.studentId, studentId)
            ))
            .limit(1);

        if (attempt.length === 0) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'You must start the exam before submitting',
            });
        }

        const attemptData = attempt[0];

        // 4. Verify Not Already Submitted
        if (attemptData.submittedAt !== null) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'Exam has already been submitted',
            });
        }

        // 5. Centralized Timing Enforcement: Check if attempt is still active
        // Uses Redis for fast check, falls back to DB if Redis unavailable
        // This determines if submission is auto-submit (expired) or manual
        const isActive = await isExamAttemptActive(attemptData.id);
        const isExpired = !isActive;

        // 6. Finalize Exam Attempt (Shared Logic for Manual and Auto-Submit)
        const result = await finalizeExamAttempt(attemptData.id, isExpired);

        if (!result.success) {
            return res.status(500).json({
                error: 'Internal Server Error',
                message: result.error || 'Failed to submit exam',
            });
        }

        // If attempt was already submitted by concurrent request, return existing result
        if (result.alreadySubmitted) {
            const response = {
                message: 'Exam already submitted',
                score: result.score!,
                totalQuestions: result.totalQuestions!,
                percentage: result.percentage!,
                submittedAt: result.submittedAt!,
                autoSubmitted: result.autoSubmitted!,
            };
            
            // Store in Redis for future duplicate requests
            await storeSubmitIdempotency(examId, studentId, response);
            
            return res.status(200).json(response);
        }

        // 7. Prepare response
        const response = {
            message: isExpired ? 'Exam auto-submitted (time expired)' : 'Exam submitted successfully',
            score: result.score!,
            totalQuestions: result.totalQuestions!,
            percentage: result.percentage!,
            submittedAt: result.submittedAt!,
            autoSubmitted: result.autoSubmitted!,
        };

        // 8. Store result in Redis for idempotency (10-minute window)
        await storeSubmitIdempotency(examId, studentId, response);

        // 9. Invalidate related caches after successful submission
        await cache.delPattern(`teacher:exam:${examId}:summary*`);
        await cache.delPattern(`teacher:exam:${examId}:attempts:*`);
        await cache.del(`student:exam:${examId}:student:${studentId}:status`);
        await cache.del(`student:exam:${examId}:student:${studentId}:questions`);
        // Invalidate dashboard stats cache (totalResults changed)
        await cache.del(getTeacherAcademyDashboardKey(targetExam.academyId));
        logger.info('Cache invalidated after exam submission', {
            examId,
            studentId,
            academyId: targetExam.academyId,
            patterns: ['exam summary', 'exam attempts', 'student status', 'student questions', 'academy dashboard'],
        });

        // 10. Return Results
        return res.status(200).json(response);

    } catch (error) {
        console.error('Error submitting exam:', error);
        return res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to submit exam',
        });
    }
});

// Get exam result
router.get('/:examId/result', authenticateStudent, async (req: Request, res: Response) => {
    try {
        const { examId } = req.params;
        const studentId = req.studentId!;
        const studentAcademyId = req.academyId!;

        // CACHE: Check if result is cached
        const cacheKey = getStudentExamResultKey(examId, studentId);
        const cachedData = await cache.get<any>(cacheKey);
        
        if (cachedData) {
            logger.info('Cache hit for exam result', {
                requestId: req.requestId,
                examId,
                studentId,
                cacheKey,
            });
            return res.status(200).json(cachedData);
        }

        // 1. Verify Exam Exists and Belongs to Student's Academy
        const exam = await db
            .select()
            .from(exams)
            .where(eq(exams.id, examId))
            .limit(1);

        if (exam.length === 0) {
            return res.status(404).json({
                error: 'Not Found',
                message: 'Exam not found',
            });
        }

        if (exam[0].academyId !== studentAcademyId) {
            return res.status(403).json({
                error: 'Forbidden',
                message: 'You are not enrolled in this academy',
            });
        }

        // 2. Verify Attempt Exists
        const attempt = await db
            .select()
            .from(examAttempts)
            .where(and(
                eq(examAttempts.examId, examId),
                eq(examAttempts.studentId, studentId)
            ))
            .limit(1);

        if (attempt.length === 0) {
            return res.status(404).json({
                error: 'Not Found',
                message: 'You have not attempted this exam',
            });
        }

        const attemptData = attempt[0];

        // 3. Verify Attempt is Submitted
        if (attemptData.submittedAt === null) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'Exam has not been submitted yet',
            });
        }

        // 4. Get total questions count
        const totalQuestions = await db
            .select()
            .from(examAnswers)
            .where(eq(examAnswers.attemptId, attemptData.id));

        // 5. Prepare Response
        const responseData = {
            score: attemptData.score,
            totalQuestions: totalQuestions.length,
            percentage: Math.round((attemptData.score! / totalQuestions.length) * 100),
            submittedAt: attemptData.submittedAt,
            attemptId: attemptData.id,
            startedAt: attemptData.startedAt,
            durationMinutes: exam[0].durationMinutes,
        };

        // CACHE: Store the result for 5 minutes (results are immutable after submission)
        await cache.set(cacheKey, responseData, 300);
        
        logger.info('Cache miss - exam result fetched from DB and cached', {
            requestId: req.requestId,
            examId,
            studentId,
            attemptId: attemptData.id,
            cacheKey,
            ttl: 300,
        });

        // 6. Return Result
        return res.status(200).json(responseData);

    } catch (error) {
        console.error('Error fetching exam result:', error);
        return res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to fetch exam result',
        });
    }
});

export default router;
