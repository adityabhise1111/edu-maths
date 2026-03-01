import express, { Request, Response } from 'express';
import cors from 'cors';
import { clerkMiddleware } from '@clerk/express';
import authRoutes from './routes/auth.js';
import academyRoutes from './routes/academy.js';
import studentRoutes from './routes/students.js';
import examRoutes from './routes/exams.js';
import teacherRoutes from './routes/teacher.js';
import healthRoutes from './routes/health.js';
import resourcesRoutes from './routes/resources.js';
import { requestIdMiddleware } from './middlewares/requestId.js';
import { isRedisAvailable } from './db/redis.js';
import { testConnection } from './db/index.js';

const app = express();

if (!process.env.CLERK_SECRET_KEY) {
  console.error('❌ CLERK_SECRET_KEY is missing from environment variables');
} else {
  console.log('✅ CLERK_SECRET_KEY is loaded');
}

if (!process.env.CLERK_PUBLISHABLE_KEY) {
  console.warn('⚠️ CLERK_PUBLISHABLE_KEY is missing from environment variables (client might fail)');
}


// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request ID middleware for correlation
app.use(requestIdMiddleware);

// Clerk middleware - handles JWT verification
app.use(clerkMiddleware());

// Routes
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/academy', academyRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/teacher', teacherRoutes);
app.use('/api/resources', resourcesRoutes);

export default app;
