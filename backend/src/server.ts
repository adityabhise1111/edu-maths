import 'dotenv/config'; // Must be first!
import AgentAPI from 'apminsight';
AgentAPI.config();

import app from './app.js';
import { testConnection } from './db/index.js';
import { getRedisClient } from './db/redis.js';
import healthJob from './utils/cron.js';
import "./utils/autoSubmitExams.js";
import { initializeSentry, captureSentryException } from './utils/sentry.js';



const PORT = process.env.PORT || 3000;

// Initialize Sentry early in startup so runtime errors can be captured alongside existing observability.
initializeSentry();

app.listen(PORT, async () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);

  // Start the keep-alive cron job
  healthJob.start();
  console.log('⏰ Keep-alive cron job started (runs every 14 mins)');

  // Test database connection
  await testConnection();

  // Initialize Redis (optional - system works without it)
  getRedisClient();
});

// Capture unhandled promise rejections to improve production crash diagnostics without changing app logic.
process.on('unhandledRejection', (reason) => {
  captureSentryException(reason, {
    handler: 'process.unhandledRejection',
  });
});

// Capture uncaught exceptions to improve production crash diagnostics without changing app logic.
process.on('uncaughtException', (error) => {
  captureSentryException(error, {
    handler: 'process.uncaughtException',
  });
});
