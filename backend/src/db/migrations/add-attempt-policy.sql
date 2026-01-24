-- Add attempt policy to exams table
-- Migration: add-attempt-policy

-- Create attempt_policy enum
CREATE TYPE attempt_policy AS ENUM ('SINGLE_ATTEMPT', 'MULTIPLE_ATTEMPTS');

-- Add attemptPolicy column to exams table
ALTER TABLE exams
ADD COLUMN attempt_policy attempt_policy NOT NULL DEFAULT 'SINGLE_ATTEMPT';

-- Add comment for documentation
COMMENT ON COLUMN exams.attempt_policy IS 'Controls whether students can retake exam: SINGLE_ATTEMPT = one try only, MULTIPLE_ATTEMPTS = unlimited retakes';
