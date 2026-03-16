import { Router, Request, Response } from 'express';
import { authenticateTeacher } from '../middlewares/index.js';
import { db } from '../db/index.js';
import { exams, academies, examAttempts, students, examAnswers, questionsEasy, questionsMedium, questionsHard } from '../db/schema/index.js';
import { eq, and, desc, asc, inArray, sql, count } from 'drizzle-orm';
import { cache } from '../utils/cache.js';
import { getTeacherAcademyExamsKey, getTeacherAcademyStudentsKey, getTeacherAcademyInfoKey, getTeacherExamSummaryKey, getTeacherExamAttemptsKey, getTeacherAcademyDashboardKey } from '../utils/redisKeys.js';
import { logger } from '../utils/logger.js';
import { captureSentryException } from '../utils/sentry.js';

const router = Router();

// Get all attempts for a given exam
router.get('/exams/:examId/attempts', authenticateTeacher, async (req: Request, res: Response) => {
    try {
        const { examId } = req.params;
        const clerkUserId = req.clerkUserId!;

        // 3. Parse Query Parameters
        const sortBy = (req.query.sortBy as string) || 'submittedAt';
        const order = (req.query.order as string) || 'desc';
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 50;

        // Validate sortBy
        const validSortFields = ['score', 'submittedAt'];
        const sortField = validSortFields.includes(sortBy) ? sortBy : 'submittedAt';

        // Validate order
        const sortOrder = order === 'asc' ? asc : desc;

        // Calculate offset
        const offset = (page - 1) * limit;

        // CACHE: Check if attempts are cached (with pagination/sorting in key)
        const cacheKey = `${getTeacherExamAttemptsKey(examId)}:sort:${sortField}:order:${order}:page:${page}:limit:${limit}`;
        const cachedData = await cache.get<any>(cacheKey);
        
        if (cachedData) {
            logger.info('Cache hit for exam attempts', {
                requestId: req.requestId,
                examId,
                sortBy: sortField,
                order,
                page,
                limit,
                cacheKey,
            });
            return res.status(200).json(cachedData);
        }

        // 1. Verify Exam Exists
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

        // 2. Verify Exam Belongs to Teacher's Academy
        const academy = await db
            .select()
            .from(academies)
            .where(and(
                eq(academies.id, targetExam.academyId),
                eq(academies.clerkUserId, clerkUserId)
            ))
            .limit(1);

        if (academy.length === 0) {
            return res.status(403).json({
                error: 'Forbidden',
                message: 'You are not authorized to view this exam',
            });
        }

        // 4. Fetch Total Count
        const totalAttempts = await db
            .select()
            .from(examAttempts)
            .where(eq(examAttempts.examId, examId));

        // 5. Fetch Exam Attempts with Student Details (with sorting and pagination)
        const sortColumn = sortField === 'score' ? examAttempts.score : examAttempts.submittedAt;

        const attempts = await db
            .select({
                studentId: examAttempts.studentId,
                username: students.username,
                score: examAttempts.score,
                submittedAt: examAttempts.submittedAt,
            })
            .from(examAttempts)
            .innerJoin(students, eq(examAttempts.studentId, students.id))
            .where(eq(examAttempts.examId, examId))
            .orderBy(sortOrder(sortColumn))
            .limit(limit)
            .offset(offset);

        // 6. Prepare Response
        const responseData = {
            examId,
            examTitle: targetExam.title,
            totalAttempts: totalAttempts.length,
            page,
            limit,
            totalPages: Math.ceil(totalAttempts.length / limit),
            attempts,
        };

        // CACHE: Store the result for 30 seconds
        await cache.set(cacheKey, responseData, 30);
        
        logger.info('Cache miss - exam attempts fetched from DB and cached', {
            requestId: req.requestId,
            examId,
            sortBy: sortField,
            order,
            page,
            limit,
            cacheKey,
            ttl: 30,
        });

        // 7. Return Results
        return res.status(200).json(responseData);

    } catch (error) {
        console.error('Error fetching exam attempts:', error);
        captureSentryException(error, { route: 'teacher - get exam attempts' });
        return res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to fetch exam attempts',
        });
    }
});

// Get summary of an exam
router.get('/exams/:examId/summary', authenticateTeacher, async (req: Request, res: Response) => {
    try {
        const { examId } = req.params;
        const clerkUserId = req.clerkUserId!;

        // CACHE: Check if summary is cached
        const cacheKey = getTeacherExamSummaryKey(examId);
        const cachedData = await cache.get<any>(cacheKey);
        
        if (cachedData) {
            logger.info('Cache hit for exam summary', {
                requestId: req.requestId,
                examId,
                cacheKey,
            });
            return res.status(200).json(cachedData);
        }

        // 1. Verify Exam Exists
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

        // 2. Verify Exam Belongs to Teacher's Academy
        const academy = await db
            .select()
            .from(academies)
            .where(and(
                eq(academies.id, targetExam.academyId),
                eq(academies.clerkUserId, clerkUserId)
            ))
            .limit(1);

        if (academy.length === 0) {
            return res.status(403).json({
                error: 'Forbidden',
                message: 'You are not authorized to view this exam',
            });
        }

        // 3. Fetch All Submitted Exam Attempts (only submitted ones have scores)
        const attempts = await db
            .select({
                score: examAttempts.score,
            })
            .from(examAttempts)
            .where(eq(examAttempts.examId, examId));

        // Filter only submitted attempts (those with non-null scores)
        const submittedAttempts = attempts.filter(a => a.score !== null);

        // 4. Calculate Summary Statistics
        let averageScore = 0;
        let highestScore = 0;
        let lowestScore = 0;

        if (submittedAttempts.length > 0) {
            const scores = submittedAttempts.map(a => a.score!);

            // Calculate average
            const totalScore = scores.reduce((sum, score) => sum + score, 0);
            averageScore = Math.round((totalScore / scores.length) * 100) / 100; // Round to 2 decimal places

            // Find highest and lowest
            highestScore = Math.max(...scores);
            lowestScore = Math.min(...scores);
        }

        // 5. Prepare Response
        const responseData = {
            examId,
            examTitle: targetExam.title,
            totalQuestions: targetExam.totalQuestions,
            difficulty: targetExam.difficulty,
            summary: {
                totalStudentsAttempted: attempts.length,
                totalStudentsSubmitted: submittedAttempts.length,
                averageScore,
                highestScore,
                lowestScore,
            },
        };

        // CACHE: Store the result for 30 seconds
        await cache.set(cacheKey, responseData, 30);
        
        logger.info('Cache miss - exam summary fetched from DB and cached', {
            requestId: req.requestId,
            examId,
            cacheKey,
            ttl: 30,
        });

        // 6. Return Summary
        return res.status(200).json(responseData);

    } catch (error) {
        console.error('Error fetching exam summary:', error);
        captureSentryException(error, { route: 'teacher - get exam summary' });
        return res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to fetch exam summary',
        });
    }
});

// Get all exam performances of a student
router.get('/students/:studentId/performance', authenticateTeacher, async (req: Request, res: Response) => {
    try {
        const { studentId } = req.params;
        const clerkUserId = req.clerkUserId!;

        // 1. Verify Student Exists
        const student = await db
            .select()
            .from(students)
            .where(eq(students.id, studentId))
            .limit(1);

        if (student.length === 0) {
            return res.status(404).json({
                error: 'Not Found',
                message: 'Student not found',
            });
        }

        const targetStudent = student[0];

        // 2. Verify Student Belongs to Teacher's Academy
        const academy = await db
            .select()
            .from(academies)
            .where(and(
                eq(academies.id, targetStudent.academyId),
                eq(academies.clerkUserId, clerkUserId)
            ))
            .limit(1);

        if (academy.length === 0) {
            return res.status(403).json({
                error: 'Forbidden',
                message: 'You are not authorized to view this student',
            });
        }

        // 3. Parse Query Parameters
        const sortBy = (req.query.sortBy as string) || 'submittedAt';
        const order = (req.query.order as string) || 'desc';
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 50;

        // Validate sortBy
        const validSortFields = ['score', 'submittedAt'];
        const sortField = validSortFields.includes(sortBy) ? sortBy : 'submittedAt';

        // Validate order
        const sortOrder = order === 'asc' ? asc : desc;

        // Calculate offset
        const offset = (page - 1) * limit;

        // 4. Fetch Total Count
        const totalPerformances = await db
            .select()
            .from(examAttempts)
            .where(eq(examAttempts.studentId, studentId));

        // 5. Fetch Exam Attempts by Student with Exam Details (with sorting and pagination)
        const sortColumn = sortField === 'score' ? examAttempts.score : examAttempts.submittedAt;

        const performances = await db
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
            .orderBy(sortOrder(sortColumn))
            .limit(limit)
            .offset(offset);

        // 6. Calculate Overall Statistics (from all performances, not just paginated)
        const allPerformances = await db
            .select({
                score: examAttempts.score,
            })
            .from(examAttempts)
            .where(eq(examAttempts.studentId, studentId));

        const submittedPerformances = allPerformances.filter(p => p.score !== null);

        let totalExamsAttempted = allPerformances.length;
        let totalExamsSubmitted = submittedPerformances.length;
        let averageScore = 0;

        if (submittedPerformances.length > 0) {
            const totalScore = submittedPerformances.reduce((sum, p) => sum + p.score!, 0);
            averageScore = Math.round((totalScore / submittedPerformances.length) * 100) / 100;
        }

        // 7. Return Results
        return res.status(200).json({
            studentId,
            studentUsername: targetStudent.username,
            overallStats: {
                totalExamsAttempted,
                totalExamsSubmitted,
                averageScore,
            },
            page,
            limit,
            totalPages: Math.ceil(totalPerformances.length / limit),
            performances,
        });

    } catch (error) {
        console.error('Error fetching student performance:', error);
        captureSentryException(error, { route: 'teacher - get student performance' });
        return res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to fetch student performance',
        });
    }
});

// Get all exams and their results for an academy (dashboard overview)
router.get('/academy/exams', authenticateTeacher, async (req: Request, res: Response) => {
    try {
        const clerkUserId = req.clerkUserId!;
        
        // Parse pagination parameters
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const offset = (page - 1) * limit;

        // 1. Get Teacher's Academy (with caching)
        const academyInfoKey = getTeacherAcademyInfoKey(clerkUserId);
        let teacherAcademy = await cache.get<any>(academyInfoKey);
        
        if (!teacherAcademy) {
            const academy = await db
                .select()
                .from(academies)
                .where(eq(academies.clerkUserId, clerkUserId))
                .limit(1);

            if (academy.length === 0) {
                return res.status(404).json({
                    error: 'Not Found',
                    message: 'Academy not found',
                });
            }

            teacherAcademy = academy[0];
            // Cache academy info for 5 minutes
            await cache.set(academyInfoKey, teacherAcademy, 300);
            logger.info('Academy info cached', {
                requestId: req.requestId,
                clerkUserId,
                academyId: teacherAcademy.id,
            });
        }

        // CACHE: Check if data is cached (with pagination in key)
        const cacheKey = `${getTeacherAcademyExamsKey(teacherAcademy.id)}:page:${page}:limit:${limit}`;
        const cachedData = await cache.get<any>(cacheKey);
        
        if (cachedData) {
            logger.info('Cache hit for teacher academy exams', {
                requestId: req.requestId,
                academyId: teacherAcademy.id,
                page,
                limit,
                cacheKey,
            });
            return res.status(200).json(cachedData);
        }

        // 2. Execute count query and paginated exams with stats in parallel
        const [countResult, paginatedExamsWithStats] = await Promise.all([
            // Total count using COUNT(*) - efficient single value query
            db
                .select({ count: count() })
                .from(exams)
                .where(eq(exams.academyId, teacherAcademy.id)),
            
            // Paginated exams with aggregated statistics using LEFT JOIN
            db
                .select({
                    examId: exams.id,
                    title: exams.title,
                    difficulty: exams.difficulty,
                    totalQuestions: exams.totalQuestions,
                    durationMinutes: exams.durationMinutes,
                    startTime: exams.startTime,
                    endTime: exams.endTime,
                    createdAt: exams.createdAt,
                    // Aggregate statistics computed in SQL
                    totalAttempts: sql<number>`count(${examAttempts.id})`.as('totalAttempts'),
                    totalSubmitted: sql<number>`count(${examAttempts.id}) filter (where ${examAttempts.score} is not null)`.as('totalSubmitted'),
                    averageScore: sql<number>`coalesce(round(avg(${examAttempts.score}) filter (where ${examAttempts.score} is not null), 2), 0)`.as('averageScore'),
                })
                .from(exams)
                .leftJoin(examAttempts, eq(exams.id, examAttempts.examId))
                .where(eq(exams.academyId, teacherAcademy.id))
                .groupBy(exams.id)
                .orderBy(desc(exams.createdAt))
                .limit(limit)
                .offset(offset),
        ]);

        const totalExams = countResult[0]?.count ?? 0;

        // 3. Map results to expected response format
        const examResults = paginatedExamsWithStats.map((exam) => ({
            examId: exam.examId,
            title: exam.title,
            difficulty: exam.difficulty,
            totalQuestions: exam.totalQuestions,
            durationMinutes: exam.durationMinutes,
            startTime: exam.startTime,
            endTime: exam.endTime,
            createdAt: exam.createdAt,
            totalAttempts: Number(exam.totalAttempts) || 0,
            totalSubmitted: Number(exam.totalSubmitted) || 0,
            averageScore: Number(exam.averageScore) || 0,
        }));

        // 4. Prepare Response
        const responseData = {
            academyId: teacherAcademy.id,
            academyName: teacherAcademy.name,
            totalExams,
            exams: examResults,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(totalExams / limit),
                totalItems: totalExams,
                itemsPerPage: limit,
            },
        };

        // CACHE: Store the result for 60 seconds
        await cache.set(cacheKey, responseData, 60);
        
        logger.info('Cache miss - data fetched from DB and cached', {
            requestId: req.requestId,
            academyId: teacherAcademy.id,
            page,
            limit,
            cacheKey,
            ttl: 60,
        });

        // 7. Return Results with Pagination
        return res.status(200).json(responseData);

    } catch (error) {
        console.error('Error fetching academy exams:', error);
        captureSentryException(error, { route: 'teacher - get academy exams' });
        return res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to fetch academy exams',
        });
    }
});

// Get all students for teacher's academy
router.get('/academy/students', authenticateTeacher, async (req: Request, res: Response) => {
    try {
        const clerkUserId = req.clerkUserId!;
        
        // Parse pagination parameters
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const offset = (page - 1) * limit;

        // 1. Get Teacher's Academy (with caching)
        const academyInfoKey = getTeacherAcademyInfoKey(clerkUserId);
        let teacherAcademy = await cache.get<any>(academyInfoKey);
        
        if (!teacherAcademy) {
            logger.debug('Academy info not found in cache, querying DB', {
                requestId: req.requestId,
                clerkUserId,
            });
            const academy = await db
                .select()
                .from(academies)
                .where(eq(academies.clerkUserId, clerkUserId))
                .limit(1);

            if (academy.length === 0) {
                return res.status(404).json({
                    error: 'Not Found',
                    message: 'No academy found for this teacher',
                });
            }

            teacherAcademy = academy[0];
            // Cache academy info for 5 minutes
            await cache.set(academyInfoKey, teacherAcademy, 300);
            logger.info('Academy info cached', {
                requestId: req.requestId,
                clerkUserId,
                academyId: teacherAcademy.id,
            });
        }

        logger.debug('Fetching students for teacher academy', {
            requestId: req.requestId,
            academyId: teacherAcademy.id,
            page,
            limit,
        });

        // CACHE: Check if data is cached (with pagination in key)
        const cacheKey = `${getTeacherAcademyStudentsKey(teacherAcademy.id)}:page:${page}:limit:${limit}`;
        const cachedData = await cache.get<any>(cacheKey);
        
        if (cachedData) {
            logger.info('Cache hit for teacher academy students', {
                requestId: req.requestId,
                academyId: teacherAcademy.id,
                page,
                limit,
                cacheKey,
            });
            return res.status(200).json(cachedData);
        }

        // 2. Fetch Total Count of Students
        const totalStudents = await db
            .select()
            .from(students)
            .where(eq(students.academyId, teacherAcademy.id));

        // 3. Fetch Paginated Students for Academy (sorted by createdAt DESC - newest first)
        const paginatedStudents = await db
            .select({
                id: students.id,
                username: students.username,
                createdAt: students.createdAt,
            })
            .from(students)
            .where(eq(students.academyId, teacherAcademy.id))
            .orderBy(desc(students.createdAt))
            .limit(limit)
            .offset(offset);

        // 4. Prepare Response
        const responseData = {
            academyId: teacherAcademy.id,
            academyName: teacherAcademy.name,
            totalStudents: totalStudents.length,
            students: paginatedStudents,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(totalStudents.length / limit),
                totalItems: totalStudents.length,
                itemsPerPage: limit,
            },
        };

        // CACHE: Store the result for 60 seconds
        await cache.set(cacheKey, responseData, 60);
        
        logger.info('Cache miss - data fetched from DB and cached', {
            requestId: req.requestId,
            academyId: teacherAcademy.id,
            page,
            limit,
            cacheKey,
            ttl: 60,
        });

        // 5. Return Results with Pagination
        return res.status(200).json(responseData);

    } catch (error) {
        console.error('Error fetching academy students:', error);
        captureSentryException(error, { route: 'teacher - get academy students' });
        return res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to fetch academy students',
        });
    }
});

// Get detailed exam results for a specific student (question-by-question)
router.get('/exams/:examId/student/:studentId', authenticateTeacher, async (req: Request, res: Response) => {
    try {
        const { examId, studentId } = req.params;
        const clerkUserId = req.clerkUserId!;

        // 1. Verify Exam Exists and Belongs to Teacher's Academy
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

        const academy = await db
            .select()
            .from(academies)
            .where(and(
                eq(academies.id, targetExam.academyId),
                eq(academies.clerkUserId, clerkUserId)
            ))
            .limit(1);

        if (academy.length === 0) {
            return res.status(403).json({
                error: 'Forbidden',
                message: 'You are not authorized to view this exam',
            });
        }

        // 2. Verify Student Belongs to Academy
        const student = await db
            .select()
            .from(students)
            .where(and(
                eq(students.id, studentId),
                eq(students.academyId, targetExam.academyId)
            ))
            .limit(1);

        if (student.length === 0) {
            return res.status(404).json({
                error: 'Not Found',
                message: 'Student not found in this academy',
            });
        }

        const targetStudent = student[0];

        // 3. Get Student's Attempt
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
                message: 'Student has not attempted this exam',
            });
        }

        const studentAttempt = attempt[0];

        // 4. Get All Answers for This Attempt
        const answers = await db
            .select()
            .from(examAnswers)
            .where(eq(examAnswers.attemptId, studentAttempt.id));

        if (answers.length === 0) {
            return res.status(404).json({
                error: 'Not Found',
                message: 'No answers found for this attempt',
            });
        }

        // 5. Get Question Details Based on Difficulty
        let questionsTable;
        if (targetExam.difficulty === 'easy') {
            questionsTable = questionsEasy;
        } else if (targetExam.difficulty === 'medium') {
            questionsTable = questionsMedium;
        } else {
            questionsTable = questionsHard;
        }

        // Extract question IDs
        const questionIds = answers.map(a => a.questionId);

        // Fetch question details
        const questionDetails = await db
            .select()
            .from(questionsTable)
            .where(inArray(questionsTable.id, questionIds));

        // 6. Combine Answers with Question Details
        const questionsWithAnswers = answers.map(answer => {
            const question = questionDetails.find(q => q.id === answer.questionId);
            return {
                questionId: answer.questionId,
                question: question?.question || 'Question not found',
                options: question?.options || [],
                correctAnswer: question?.correctOption || 0,
                selectedOption: answer.selectedOption,
                isCorrect: answer.isCorrect,
            };
        });

        // 7. Return Results
        return res.status(200).json({
            student: {
                id: targetStudent.id,
                username: targetStudent.username,
            },
            exam: {
                id: targetExam.id,
                title: targetExam.title,
                difficulty: targetExam.difficulty,
                totalQuestions: targetExam.totalQuestions,
            },
            attempt: {
                id: studentAttempt.id,
                startedAt: studentAttempt.startedAt,
                submittedAt: studentAttempt.submittedAt,
                score: studentAttempt.score,
            },
            questions: questionsWithAnswers,
        });

    } catch (error) {
        console.error('Error fetching student exam details:', error);
        captureSentryException(error, { route: 'teacher - get student exam details' });
        return res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to fetch student exam details',
        });
    }
});

// Get all students performance summary for teacher's academy
router.get('/academy/:academyId/students-performance', authenticateTeacher, async (req: Request, res: Response) => {
    try {
        const { academyId } = req.params;
        const clerkUserId = req.clerkUserId!;
        
        // Parse pagination parameters
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const offset = (page - 1) * limit;

        // 1. Verify academy ownership
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
                message: 'You do not own this academy',
            });
        }

        // 2. Get total count of students in this academy
        const allStudents = await db
            .select({
                studentId: students.id,
                username: students.username,
                createdAt: students.createdAt,
            })
            .from(students)
            .where(eq(students.academyId, academyId));

        // 3. Get paginated students (sorted by username)
        const paginatedStudents = await db
            .select({
                studentId: students.id,
                username: students.username,
                createdAt: students.createdAt,
            })
            .from(students)
            .where(eq(students.academyId, academyId))
            .orderBy(asc(students.username))
            .limit(limit)
            .offset(offset);

        // 4. Fetch All Performances in ONE Query (batched)
        const studentIds = paginatedStudents.map(s => s.studentId);

        const allPerformances = await db
            .select({
                studentId: examAttempts.studentId,
                score: examAttempts.score,
                submittedAt: examAttempts.submittedAt,
            })
            .from(examAttempts)
            .where(inArray(examAttempts.studentId, studentIds));

        // Group performances by studentId
        const performancesByStudent = allPerformances.reduce((acc, perf) => {
            if (!acc[perf.studentId]) {
                acc[perf.studentId] = [];
            }
            acc[perf.studentId].push(perf);
            return acc;
        }, {} as Record<string, typeof allPerformances>);

        // 5. Calculate Statistics for Each Student
        const studentsWithStats = paginatedStudents.map((student) => {
            const performances = performancesByStudent[student.studentId] || [];
            const submitted = performances.filter(p => p.submittedAt !== null);
            const totalAttempted = performances.length;
            const totalSubmitted = submitted.length;
            let avgScore = 0;

            if (submitted.length > 0) {
                const total = submitted.reduce((sum, p) => sum + (p.score || 0), 0);
                avgScore = Math.round((total / submitted.length) * 100) / 100;
            }

            return {
                studentId: student.studentId,
                username: student.username,
                joinedAt: student.createdAt,
                totalExamsAttempted: totalAttempted,
                totalExamsSubmitted: totalSubmitted,
                averageScore: avgScore,
            };
        });

        return res.status(200).json({
            academy: {
                id: academy[0].id,
                name: academy[0].name,
            },
            students: studentsWithStats,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(allStudents.length / limit),
                totalItems: allStudents.length,
                itemsPerPage: limit,
            },
        });

    } catch (error) {
        console.error('Error fetching students performance:', error);
        captureSentryException(error, { route: 'teacher - get students performance' });
        return res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to fetch students performance',
        });
    }
});

// Delete a student
router.delete('/students/:studentId', authenticateTeacher, async (req: Request, res: Response) => {
    try {
        const { studentId } = req.params;
        const clerkUserId = req.clerkUserId!;

        // 1. Verify Student Exists
        const student = await db
            .select()
            .from(students)
            .where(eq(students.id, studentId))
            .limit(1);

        if (student.length === 0) {
            return res.status(404).json({
                error: 'Not Found',
                message: 'Student not found',
            });
        }

        const targetStudent = student[0];

        // 2. Verify Student Belongs to Teacher's Academy
        const academy = await db
            .select()
            .from(academies)
            .where(and(
                eq(academies.id, targetStudent.academyId),
                eq(academies.clerkUserId, clerkUserId)
            ))
            .limit(1);

        if (academy.length === 0) {
            return res.status(403).json({
                error: 'Forbidden',
                message: 'You are not authorized to delete this student',
            });
        }

        // 3. Check if student has any exam attempts
        const attempts = await db
            .select()
            .from(examAttempts)
            .where(eq(examAttempts.studentId, studentId))
            .limit(1);

        if (attempts.length > 0) {
            // Student has exam history - don't allow deletion for data integrity
            return res.status(409).json({
                error: 'Conflict',
                message: 'Cannot delete student with exam history. Student has taken exams.',
                details: 'This student has attempted exams. Deleting would break exam records.',
            });
        }

        // 4. Delete the student (no exam history)
        await db
            .delete(students)
            .where(eq(students.id, studentId));

        // 5. Invalidate teacher academy students cache (all pagination combos)
        await cache.delPattern(`teacher:academy:${targetStudent.academyId}:students:*`);
        // Invalidate dashboard cache (student count changed)
        await cache.del(getTeacherAcademyDashboardKey(targetStudent.academyId));
        logger.info('Cache invalidated for teacher academy students and dashboard after deletion', {
            academyId: targetStudent.academyId,
            studentId,
            patterns: [`teacher:academy:${targetStudent.academyId}:students:*`, `teacher:academy:${targetStudent.academyId}:dashboard`],
        });

        return res.status(200).json({
            success: true,
            message: 'Student deleted successfully',
            deletedStudent: {
                id: targetStudent.id,
                username: targetStudent.username,
            },
        });

    } catch (error) {
        console.error('Error deleting student:', error);
        captureSentryException(error, { route: 'teacher - delete student' });
        return res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to delete student',
        });
    }
});

// ============================================
// DASHBOARD STATISTICS ENDPOINT (OPTIMIZED)
// ============================================
// Returns ONLY total counts - NO paginated lists
// Uses COUNT(*) queries for performance
// Cached to avoid repeated DB hits
router.get('/academy/dashboard', authenticateTeacher, async (req: Request, res: Response) => {
    try {
        const clerkUserId = req.clerkUserId!;

        // 1. Get Teacher's Academy (with caching - reusing existing pattern)
        const academyInfoKey = getTeacherAcademyInfoKey(clerkUserId);
        let teacherAcademy = await cache.get<any>(academyInfoKey);
        
        if (!teacherAcademy) {
            logger.debug('Academy info not found in cache, querying DB', {
                requestId: req.requestId,
                clerkUserId,
            });
            const academy = await db
                .select()
                .from(academies)
                .where(eq(academies.clerkUserId, clerkUserId))
                .limit(1);

            if (academy.length === 0) {
                return res.status(404).json({
                    error: 'Not Found',
                    message: 'No academy found for this teacher',
                });
            }

            teacherAcademy = academy[0];
            // Cache academy info for 5 minutes
            await cache.set(academyInfoKey, teacherAcademy, 300);
            logger.info('Academy info cached', {
                requestId: req.requestId,
                clerkUserId,
                academyId: teacherAcademy.id,
            });
        }

        // 2. Check dashboard cache first
        const dashboardCacheKey = getTeacherAcademyDashboardKey(teacherAcademy.id);
        const cachedDashboard = await cache.get<any>(dashboardCacheKey);
        
        if (cachedDashboard) {
            logger.info('Cache hit for teacher academy dashboard', {
                requestId: req.requestId,
                academyId: teacherAcademy.id,
                cacheKey: dashboardCacheKey,
            });
            return res.status(200).json(cachedDashboard);
        }

        // 3. Fetch counts using optimized COUNT(*) queries (sequential, not parallel)
        
        // Count total students for the academy
        const studentsCountResult = await db
            .select({ count: count() })
            .from(students)
            .where(eq(students.academyId, teacherAcademy.id));
        const totalStudents = studentsCountResult[0]?.count ?? 0;

        // Count total exams for the academy
        const examsCountResult = await db
            .select({ count: count() })
            .from(exams)
            .where(eq(exams.academyId, teacherAcademy.id));
        const totalExams = examsCountResult[0]?.count ?? 0;

        // Count total results/responses (exam attempts with submittedAt not null)
        // This counts submitted exam attempts for all exams in this academy
        const resultsCountResult = await db
            .select({ count: count() })
            .from(examAttempts)
            .innerJoin(exams, eq(examAttempts.examId, exams.id))
            .where(
                and(
                    eq(exams.academyId, teacherAcademy.id),
                    sql`${examAttempts.submittedAt} IS NOT NULL`
                )
            );
        const totalResults = resultsCountResult[0]?.count ?? 0;

        // 4. Prepare response data
        const dashboardData = {
            academyId: teacherAcademy.id,
            academyName: teacherAcademy.name,
            totalStudents: Number(totalStudents),
            totalExams: Number(totalExams),
            totalResults: Number(totalResults),
        };

        // 5. Cache the dashboard data for 60 seconds
        await cache.set(dashboardCacheKey, dashboardData, 60);
        
        logger.info('Cache miss - dashboard data fetched from DB and cached', {
            requestId: req.requestId,
            academyId: teacherAcademy.id,
            cacheKey: dashboardCacheKey,
            ttl: 60,
            stats: {
                totalStudents: dashboardData.totalStudents,
                totalExams: dashboardData.totalExams,
                totalResults: dashboardData.totalResults,
            },
        });

        // 6. Return dashboard statistics
        return res.status(200).json(dashboardData);

    } catch (error) {
        console.error('Error fetching academy dashboard:', error);
        captureSentryException(error, { route: 'teacher - get academy dashboard' });
        return res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to fetch academy dashboard',
        });
    }
});

export default router;
