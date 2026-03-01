import { pgTable, uuid, varchar, integer, timestamp, pgEnum } from 'drizzle-orm/pg-core';
import { academies } from './academies';

// Define difficulty enum
export const difficultyEnum = pgEnum('difficulty', ['easy', 'medium', 'hard']);

export const exams = pgTable('exams', {
    id: uuid('id').primaryKey().defaultRandom(),
    academyId: uuid('academy_id').notNull().references(() => academies.id),
    title: varchar('title', { length: 255 }).notNull(),
    difficulty: difficultyEnum('difficulty').notNull(),
    totalQuestions: integer('total_questions').notNull(),
    durationMinutes: integer('duration_minutes').notNull(),
    startTime: timestamp('start_time').notNull(),
    endTime: timestamp('end_time').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

export type Exam = typeof exams.$inferSelect;
export type NewExam = typeof exams.$inferInsert;
