import 'dotenv/config'; // Must be first!

// Sentry must be initialized before all other imports so it can instrument modules via Node.js patching.
import { initializeSentry, captureSentryException } from './utils/sentry.js';
initializeSentry();

import AgentAPI from 'apminsight';
AgentAPI.config();

import app from './app.js';
import { testConnection } from './db/index.js';
import { getRedisClient } from './db/redis.js';
import healthJob from './utils/cron.js';
import "./utils/autoSubmitExams.js";

const PORT = process.env.PORT || 3000;

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
