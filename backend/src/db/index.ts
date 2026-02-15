import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

const getConnectionString = () => {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_URL is not defined in environment variables');
  }
  return url;
};

// Connection configuration for Supabase/Postgres
const postgresConfig: postgres.Options<{}> = {
  max: 10, // Maximum 10 connections per instance
  idle_timeout: 20, // Close idle connections after 20 seconds
  connect_timeout: 30, // 30 seconds timeout to handle cold starts/pooler delays
  max_lifetime: 60 * 30, // 30 minutes max connection lifetime
};

// Lazy initialization
let clientInstance: ReturnType<typeof postgres> | null = null;
let dbInstance: ReturnType<typeof drizzle> | null = null;

export const getDb = () => {
  if (!dbInstance) {
    const connectionString = getConnectionString();
    // Configure connection pool with proper limits
    clientInstance = postgres(connectionString, postgresConfig);
    dbInstance = drizzle(clientInstance);
  }
  return dbInstance;
};

// Test database connection with retry logic
export const testConnection = async (retries = 3) => {
  const connectionString = getConnectionString();

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`🔌 Database connection attempt ${attempt}/${retries}...`);

      if (!clientInstance) {
        clientInstance = postgres(connectionString, postgresConfig);
      }

      // Perform a simple query to verify the connection
      await clientInstance`SELECT 1`;

      console.log('✅ Database connected successfully');
      return true;
    } catch (error: any) {
      console.error(`❌ Connection attempt ${attempt} failed:`, error.message || error);

      if (attempt < retries) {
        const delay = 2000; // 2 seconds
        console.log(`Retrying in ${delay / 1000}s...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        console.error('Final database connection attempt failed.');
        return false;
      }
    }
  }
  return false;
};

// Export db instance (lazy loaded)
export const db = new Proxy({} as ReturnType<typeof drizzle>, {
  get: (target, prop) => {
    const instance = getDb();
    return (instance as any)[prop];
  }
});
