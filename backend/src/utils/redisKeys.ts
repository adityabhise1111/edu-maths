/**
 * Redis Key Patterns
 * 
 * Centralized documentation of all Redis keys used in the application.
 * Follow these patterns consistently to avoid key conflicts.
 */

/**
 * Academy cache keys
 * 
 * Pattern: academy:public:{slug}
 * TTL: 300 seconds (5 minutes)
 * Usage: Cache public academy information
 * Invalidation: On academy create/update
 * 
 * @param slug - Academy slug identifier
 * @returns Redis key string
 */
export const getAcademyPublicKey = (slug: string): string => {
  return `academy:public:${slug}`;
};

/**
 * Academy exams list cache keys
 * 
 * Pattern: academy:exams:{academySlug}
 * TTL: 60 seconds (1 minute)
 * Usage: Cache public exam listings for an academy
 * Invalidation: On exam create/update/delete for that academy
 * 
 * @param academySlug - Academy slug identifier
 * @returns Redis key string
 */
export const getAcademyExamsKey = (academySlug: string): string => {
  return `academy:exams:${academySlug}`;
};

/**
 * Exam start lock keys
 * 
 * Pattern: exam:start:{examId}:{studentId}
 * TTL: 10 seconds
 * Usage: Prevent concurrent exam start attempts
 * Purpose: Concurrency control during exam attempt creation
 * 
 * @param examId - Exam UUID
 * @param studentId - Student UUID
 * @returns Redis key string
 */
export const getExamStartLockKey = (examId: string, studentId: string): string => {
  return `exam:start:${examId}:${studentId}`;
};

/**
 * Exam attempt active state keys
 * 
 * Pattern: exam:attempt:active:{attemptId}
 * TTL: Dynamic - expires exactly at global exam end time
 * Usage: Fast server-side check if exam attempt is still active
 * Purpose: Avoid repeated DB queries and time calculations
 * 
 * Key existence = attempt is active
 * Key absence = attempt is over (time expired or submitted)
 * 
 * @param attemptId - Exam attempt UUID
 * @returns Redis key string
 */
export const getExamAttemptActiveKey = (attemptId: string): string => {
  return `exam:attempt:active:${attemptId}`;
};

/**
 * Rate limit keys for answer submissions
 * 
 * Pattern: ratelimit:answer:{examId}:{studentId}
 * TTL: 1 second
 * Usage: Track answer submission rate per student per exam
 * Purpose: Prevent answer spamming and retry storms
 * 
 * @param examId - Exam UUID
 * @param studentId - Student UUID
 * @returns Redis key string
 */
export const getRateLimitAnswerKey = (examId: string, studentId: string): string => {
  return `ratelimit:answer:${examId}:${studentId}`;
};

/**
 * Rate limit keys for exam submission
 * 
 * Pattern: ratelimit:submit:{examId}:{studentId}
 * TTL: 60 seconds
 * Usage: Track exam submit attempts per student per exam
 * Purpose: Prevent submit retry storms and malicious rapid-fire requests
 * 
 * @param examId - Exam UUID
 * @param studentId - Student UUID
 * @returns Redis key string
 */
export const getRateLimitSubmitKey = (examId: string, studentId: string): string => {
  return `ratelimit:submit:${examId}:${studentId}`;
};

/**
 * Submit idempotency keys
 * 
 * Pattern: idempotency:submit:{examId}:{studentId}
 * TTL: 600 seconds (10 minutes)
 * Usage: Ensure exam submission is idempotent - duplicate requests return cached result
 * Purpose: Prevent duplicate score calculation, handle retries, auto-submit races
 * 
 * @param examId - Exam UUID
 * @param studentId - Student UUID
 * @returns Redis key string
 */
export const getSubmitIdempotencyKey = (examId: string, studentId: string): string => {
  return `idempotency:submit:${examId}:${studentId}`;
};

/**
 * Teacher academy info cache keys
 * 
 * Pattern: teacher:academy:clerk:{clerkUserId}
 * TTL: 300 seconds (5 minutes)
 * Usage: Cache teacher's academy info lookup to avoid repeated DB queries
 * Invalidation: On academy update
 * 
 * @param clerkUserId - Clerk User ID
 * @returns Redis key string
 */
export const getTeacherAcademyInfoKey = (clerkUserId: string): string => {
  return `teacher:academy:clerk:${clerkUserId}`;
};

/**
 * Teacher academy exams cache keys
 * 
 * Pattern: teacher:academy:{academyId}:exams
 * TTL: 60 seconds
 * Usage: Cache teacher's view of all exams in their academy
 * Invalidation: On exam create/update/delete for that academy
 * 
 * @param academyId - Academy UUID
 * @returns Redis key string
 */
export const getTeacherAcademyExamsKey = (academyId: string): string => {
  return `teacher:academy:${academyId}:exams`;
};

/**
 * Teacher academy students cache keys
 * 
 * Pattern: teacher:academy:{academyId}:students
 * TTL: 60 seconds
 * Usage: Cache teacher's view of all students in their academy
 * Invalidation: On student create/update/delete for that academy
 * 
 * @param academyId - Academy UUID
 * @returns Redis key string
 */
export const getTeacherAcademyStudentsKey = (academyId: string): string => {
  return `teacher:academy:${academyId}:students`;
};

/**
 * Teacher exam summary cache keys
 * 
 * Pattern: teacher:exam:{examId}:summary
 * TTL: 30 seconds
 * Usage: Cache teacher's view of exam summary (avg score, completion rate, etc.)
 * Invalidation: On exam submit for that exam
 * 
 * @param examId - Exam UUID
 * @returns Redis key string
 */
export const getTeacherExamSummaryKey = (examId: string): string => {
  return `teacher:exam:${examId}:summary`;
};

/**
 * Teacher exam attempts cache keys
 * 
 * Pattern: teacher:exam:{examId}:attempts
 * TTL: 30 seconds
 * Usage: Cache teacher's view of all student attempts for an exam
 * Invalidation: On exam submit for that exam
 * 
 * @param examId - Exam UUID
 * @returns Redis key string
 */
export const getTeacherExamAttemptsKey = (examId: string): string => {
  return `teacher:exam:${examId}:attempts`;
};

/**
 * Student exam status cache keys
 * 
 * Pattern: student:exam:{examId}:student:{studentId}:status
 * TTL: 10 seconds
 * Usage: Cache student's exam status (active/completed/not started)
 * Invalidation: On exam start or submit for that student/exam
 * 
 * @param examId - Exam UUID
 * @param studentId - Student UUID
 * @returns Redis key string
 */
export const getStudentExamStatusKey = (examId: string, studentId: string): string => {
  return `student:exam:${examId}:student:${studentId}:status`;
};

/**
 * Student exam questions cache keys
 * 
 * Pattern: student:exam:{examId}:student:{studentId}:questions
 * TTL: Dynamic - expires at exam end time
 * Usage: Cache student's exam questions (not answers)
 * Invalidation: On exam submit for that student/exam
 * 
 * @param examId - Exam UUID
 * @param studentId - Student UUID
 * @returns Redis key string
 */
export const getStudentExamQuestionsKey = (examId: string, studentId: string): string => {
  return `student:exam:${examId}:student:${studentId}:questions`;
};

/**
 * Student exam result cache keys
 * 
 * Pattern: student:exam:{examId}:student:{studentId}:result
 * TTL: 300 seconds (5 minutes)
 * Usage: Cache student's exam result (score, answers, correct/incorrect)
 * Invalidation: Rarely needed (results are immutable once submitted)
 * 
 * @param examId - Exam UUID
 * @param studentId - Student UUID
 * @returns Redis key string
 */
export const getStudentExamResultKey = (examId: string, studentId: string): string => {
  return `student:exam:${examId}:student:${studentId}:result`;
};

/**
 * Teacher academy dashboard cache keys
 * 
 * Pattern: teacher:academy:{academyId}:dashboard
 * TTL: 60 seconds (1 minute)
 * Usage: Cache dashboard statistics (total counts for students, exams, results)
 * Invalidation: On student/exam create/delete or exam submission
 * 
 * @param academyId - Academy UUID
 * @returns Redis key string
 */
export const getTeacherAcademyDashboardKey = (academyId: string): string => {
  return `teacher:academy:${academyId}:dashboard`;
};

/**
 * Student status cache TTL (seconds)
 */
export const STUDENT_STATUS_CACHE_TTL = 300;

/**
 * Student auth status cache key
 *
 * Pattern: student:status:{clerkUserId}
 */
export const getStudentStatusKey = (clerkUserId: string): string => {
  return `student:status:${clerkUserId}`;
};
