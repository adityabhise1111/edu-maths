import 'dotenv/config';
import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL);

try {
  await sql.unsafe('DELETE FROM exam_answers');
  await sql.unsafe('DELETE FROM exam_attempts');
  await sql.unsafe('DELETE FROM students');

  const examAnswers = await sql.unsafe('SELECT COUNT(*)::int AS count FROM exam_answers');
  const examAttempts = await sql.unsafe('SELECT COUNT(*)::int AS count FROM exam_attempts');
  const students = await sql.unsafe('SELECT COUNT(*)::int AS count FROM students');

  console.log(
    JSON.stringify(
      {
        exam_answers: examAnswers[0].count,
        exam_attempts: examAttempts[0].count,
        students: students[0].count,
      },
      null,
      2,
    ),
  );
} finally {
  await sql.end();
}
