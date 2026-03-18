DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_type t
        JOIN pg_namespace n ON n.oid = t.typnamespace
        WHERE t.typname = 'student_status_enum'
          AND n.nspname = 'public'
    ) THEN
        CREATE TYPE "public"."student_status_enum" AS ENUM('pending', 'approved', 'suspended', 'rejected');
    END IF;
END $$;--> statement-breakpoint
ALTER TABLE "students"
	ADD COLUMN IF NOT EXISTS "clerk_user_id" varchar(255),
	ADD COLUMN IF NOT EXISTS "email" varchar(255),
	ADD COLUMN IF NOT EXISTS "profile_pic_url" varchar(500),
	ADD COLUMN IF NOT EXISTS "status" "student_status_enum" DEFAULT 'pending' NOT NULL,
	ADD COLUMN IF NOT EXISTS "status_note" varchar(500),
	ADD COLUMN IF NOT EXISTS "status_updated_at" timestamp;--> statement-breakpoint
ALTER TABLE "students"
	ALTER COLUMN "clerk_user_id" SET NOT NULL,
	ALTER COLUMN "email" SET NOT NULL;--> statement-breakpoint
DROP INDEX IF EXISTS "academy_username_idx";--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "students_clerk_user_id_unique_idx" ON "students" USING btree ("clerk_user_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "students_email_unique_idx" ON "students" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "students_username_unique_idx" ON "students" USING btree ("username");