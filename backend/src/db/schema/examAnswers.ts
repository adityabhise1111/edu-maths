import { pgTable, uuid, integer, boolean, uniqueIndex } from 'drizzle-orm/pg-core';
import { examAttempts } from './examAttempts.js';

export const examAnswers = pgTable('exam_answers', {
    id: uuid('id').primaryKey().defaultRandom(),
    attemptId: uuid('attempt_id').notNull().references(() => examAttempts.id),
    questionId: uuid('question_id').notNull(),
    selectedOption: integer('selected_option').notNull(),
    isCorrect: boolean('is_correct').notNull(),
}, (table) => {
    return {
        // Unique constraint: each question answered once per attempt
        attemptQuestionIdx: uniqueIndex('attempt_question_idx').on(table.attemptId, table.questionId),
    };
});

export type ExamAnswer = typeof examAnswers.$inferSelect;
export type NewExamAnswer = typeof examAnswers.$inferInsert;
