import 'dotenv/config';
import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL);

try {
  const migrations = await sql.unsafe(
    'SELECT id, hash FROM drizzle.__drizzle_migrations ORDER BY id',
  );

  const studentColumns = await sql.unsafe(`
    SELECT column_name, is_nullable, data_type, udt_name
    FROM information_schema.columns
    WHERE table_schema='public' AND table_name='students'
    ORDER BY ordinal_position
  `);

  const studentIndexes = await sql.unsafe(`
    SELECT indexname
    FROM pg_indexes
    WHERE schemaname='public' AND tablename='students'
    ORDER BY indexname
  `);

  console.log(
    JSON.stringify(
      {
        migrations,
        studentColumns,
        studentIndexes,
      },
      null,
      2,
    ),
  );
} finally {
  await sql.end();
}
