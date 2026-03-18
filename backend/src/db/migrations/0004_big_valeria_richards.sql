CREATE TYPE "public"."student_status_enum" AS ENUM('pending', 'approved', 'suspended', 'rejected');--> statement-breakpoint
DROP INDEX "academy_username_idx";--> statement-breakpoint
ALTER TABLE "students" ADD COLUMN "clerk_user_id" varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE "students" ADD COLUMN "email" varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE "students" ADD COLUMN "profile_pic_url" varchar(500);--> statement-breakpoint
ALTER TABLE "students" ADD COLUMN "status" "student_status_enum" DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE "students" ADD COLUMN "status_note" varchar(500);--> statement-breakpoint
ALTER TABLE "students" ADD COLUMN "status_updated_at" timestamp;--> statement-breakpoint
CREATE UNIQUE INDEX "students_username_unique_idx" ON "students" USING btree ("username");--> statement-breakpoint
CREATE UNIQUE INDEX "students_clerk_user_id_unique_idx" ON "students" USING btree ("clerk_user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "students_email_unique_idx" ON "students" USING btree ("email");--> statement-breakpoint
ALTER TABLE "students" DROP COLUMN "password_hash";