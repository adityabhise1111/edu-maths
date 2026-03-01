import { pgTable, uuid, text, integer, timestamp, pgEnum } from 'drizzle-orm/pg-core';
import { academies } from './academies';

// Define file type enum
export const fileTypeEnum = pgEnum('file_type', ['pdf', 'image', 'document']);

export const resources = pgTable('resources', {
    id: uuid('id').primaryKey().defaultRandom(),
    academyId: uuid('academy_id').notNull().references(() => academies.id),
    title: text('title').notNull(),
    description: text('description'),
    fileUrl: text('file_url').notNull(),       // S3 URL
    fileName: text('file_name').notNull(),      // Original filename
    fileType: fileTypeEnum('file_type').notNull(),
    fileSize: integer('file_size').notNull(),   // Size in bytes
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

export type Resource = typeof resources.$inferSelect;
export type NewResource = typeof resources.$inferInsert;
