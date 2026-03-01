import { pgTable, uuid, timestamp, integer, uniqueIndex, boolean } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { exams } from './exams';
import { students } from './students';

export const examAttempts = pgTable('exam_attempts', {
    id: uuid('id').primaryKey().defaultRandom(),
    examId: uuid('exam_id').notNull().references(() => exams.id),
    studentId: uuid('student_id').notNull().references(() => students.id),
    startedAt: timestamp('started_at').notNull(),
    submittedAt: timestamp('submitted_at'),
    score: integer('score'),
    autoSubmitted: boolean('auto_submitted').default(false),
}, (table) => {
    return {
        // Unique constraint: one attempt per student per exam
        studentExamIdx: uniqueIndex('student_exam_idx').on(table.studentId, table.examId),

        // CRITICAL FIX: Prevent duplicate submissions (race condition fix)
        // Only one submission allowed per student per exam
        // This prevents the race condition where multiple concurrent submit requests
        // could both succeed. Discovered during load testing with 40 concurrent VUs.
        uniqueSubmissionIdx: uniqueIndex('unique_submission_idx')
            .on(table.studentId, table.examId)
            .where(sql`${table.submittedAt} IS NOT NULL`),
    };
});

export type ExamAttempt = typeof examAttempts.$inferSelect;
export type NewExamAttempt = typeof examAttempts.$inferInsert;
