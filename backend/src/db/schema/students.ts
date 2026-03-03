import { pgTable, uuid, varchar, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';
import { academies } from './academies.js';

export const students = pgTable('students', {
    id: uuid('id').primaryKey().defaultRandom(),
    academyId: uuid('academy_id').notNull().references(() => academies.id),
    username: varchar('username', { length: 255 }).notNull(),
    passwordHash: text('password_hash').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => {
    return {
        // Unique username per academy constraint
        academyUsernameIdx: uniqueIndex('academy_username_idx').on(table.academyId, table.username),
    };
});

export type Student = typeof students.$inferSelect;
export type NewStudent = typeof students.$inferInsert;
