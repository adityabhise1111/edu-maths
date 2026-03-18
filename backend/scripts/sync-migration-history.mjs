import 'dotenv/config';
import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL);

try {
  await sql.unsafe(`
    INSERT INTO drizzle.__drizzle_migrations (hash, created_at)
    SELECT '0002_shocking_shadowcat', EXTRACT(EPOCH FROM NOW())::bigint * 1000
    WHERE NOT EXISTS (
      SELECT 1 FROM drizzle.__drizzle_migrations
      WHERE hash = '0002_shocking_shadowcat'
    )
  `);

  const rows = await sql.unsafe(
    'SELECT id, hash, created_at FROM drizzle.__drizzle_migrations ORDER BY id',
  );

  console.log(JSON.stringify(rows, null, 2));
} finally {
  await sql.end();
}
