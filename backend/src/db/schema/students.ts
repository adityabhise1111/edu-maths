import { pgTable, uuid, varchar, timestamp, uniqueIndex, pgEnum } from 'drizzle-orm/pg-core';
import { academies } from './academies.js';

export const studentStatusEnum = pgEnum('student_status_enum', [
    'pending',
    'approved',
    'suspended',
    'rejected',
]);

export const students = pgTable('students', {
    id: uuid('id').primaryKey().defaultRandom(),
    academyId: uuid('academy_id').notNull().references(() => academies.id),
    username: varchar('username', { length: 255 }).notNull(),
    clerkUserId: varchar('clerk_user_id', { length: 255 }).notNull(),
    email: varchar('email', { length: 255 }).notNull(),
    profilePicUrl: varchar('profile_pic_url', { length: 500 }),
    status: studentStatusEnum('status').notNull().default('pending'),
    statusNote: varchar('status_note', { length: 500 }),
    statusUpdatedAt: timestamp('status_updated_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => {
    return {
        usernameUniqueIdx: uniqueIndex('students_username_unique_idx').on(table.username),
        clerkUserIdUniqueIdx: uniqueIndex('students_clerk_user_id_unique_idx').on(table.clerkUserId),
        emailUniqueIdx: uniqueIndex('students_email_unique_idx').on(table.email),
    };
});

export type Student = typeof students.$inferSelect;
export type NewStudent = typeof students.$inferInsert;
