-- Add soft delete columns to students and exams tables
-- Migration: add-soft-delete-columns

-- Add deletedAt column to students table
ALTER TABLE students
ADD COLUMN deleted_at TIMESTAMP;

-- Add deletedAt column to exams table  
ALTER TABLE exams
ADD COLUMN deleted_at TIMESTAMP;

-- Create index on students.deleted_at for efficient filtering
CREATE INDEX idx_students_deleted_at ON students(deleted_at) WHERE deleted_at IS NULL;

-- Create index on exams.deleted_at for efficient filtering
CREATE INDEX idx_exams_deleted_at ON exams(deleted_at) WHERE deleted_at IS NULL;

-- Add comments for documentation
COMMENT ON COLUMN students.deleted_at IS 'Soft delete timestamp: NULL = active student, set = deactivated (preserves history)';
COMMENT ON COLUMN exams.deleted_at IS 'Soft delete timestamp: NULL = active/visible exam, set = archived (preserves attempts)';
