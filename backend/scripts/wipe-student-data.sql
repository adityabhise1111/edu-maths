-- FK-safe wipe order for student auth migration
DELETE FROM exam_answers;
DELETE FROM exam_attempts;
DELETE FROM students;
