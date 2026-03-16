import * as Sentry from '@sentry/node';
import { Request, Response, NextFunction } from 'express';

// Tracks whether Sentry SDK was initialized, so capture helpers can safely no-op when disabled.
let sentryInitialized = false;

// Uses explicit opt-in to keep local/dev behavior stable unless Sentry is intentionally enabled.
function isSentryEnabled(): boolean {
  return process.env.SENTRY_ENABLED === 'true' && Boolean(process.env.SENTRY_DSN);
}

// Parses trace sample rate defensively and falls back to 0 for production-safe defaults.
function getTracesSampleRate(): number {
  const raw = process.env.SENTRY_TRACES_SAMPLE_RATE;

  if (!raw) {
    return 0;
  }

  const parsed = Number(raw);

  if (Number.isNaN(parsed)) {
    return 0;
  }

  if (parsed < 0) {
    return 0;
  }

  if (parsed > 1) {
    return 1;
  }

  return parsed;
}

// Initializes Sentry once during server boot, without changing existing app startup behavior.
export function initializeSentry(): void {
  if (sentryInitialized) {
    return;
  }

  if (!isSentryEnabled()) {
    console.log('ℹ️ Sentry is disabled (set SENTRY_ENABLED=true with valid SENTRY_DSN to enable).');
    return;
  }

  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    enabled: true,
    environment: process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV || 'development',
    release: process.env.SENTRY_RELEASE,
    tracesSampleRate: getTracesSampleRate(),
    // Registers HTTP and Express instrumentation so request spans and traces flow into Sentry.
    integrations: [
      Sentry.httpIntegration(),
      Sentry.expressIntegration(),
    ],
    // Drops expected 4xx-style operational errors to reduce monitoring noise.
    beforeSend(event, hint) {
      const original = hint.originalException as { status?: number; statusCode?: number } | undefined;
      const statusCode = original?.status ?? original?.statusCode;

      if (typeof statusCode === 'number' && statusCode >= 400 && statusCode < 500) {
        return null;
      }

      return event;
    },
  });

  sentryInitialized = true;
  console.log('✅ Sentry initialized successfully.');
}

// Builds request metadata once per request so error captures include stable request correlation context.
function buildRequestContext(req: Request): Record<string, unknown> {
  return {
    method: req.method,
    path: req.path,
    originalUrl: req.originalUrl,
    requestId: req.requestId,
    clerkUserId: req.clerkUserId,
    studentId: req.studentId,
    academyId: req.academyId,
  };
}

// Attaches request context into res.locals so later error middleware can capture with full context.
export function sentryRequestContextMiddleware(req: Request, res: Response, next: NextFunction): void {
  (res.locals as Record<string, unknown>).sentryContext = buildRequestContext(req);
  next();
}

// Captures exceptions with optional contextual metadata while preserving existing control flow.
export function captureSentryException(error: unknown, context?: Record<string, unknown>): void {
  if (!sentryInitialized) {
    return;
  }

  Sentry.withScope((scope) => {
    if (context) {
      scope.setContext('custom', context);
    }

    Sentry.captureException(error);
  });
}

// Captures non-exception messages for lightweight diagnostics where needed.
export function captureSentryMessage(message: string, context?: Record<string, unknown>): void {
  if (!sentryInitialized) {
    return;
  }

  Sentry.withScope((scope) => {
    if (context) {
      scope.setContext('custom', context);
    }

    Sentry.captureMessage(message);
  });
}

// Final fallback Express error middleware to capture truly unhandled route errors and return JSON safely.
export function sentryErrorHandler(err: unknown, req: Request, res: Response, next: NextFunction): void {
  if (res.headersSent) {
    next(err);
    return;
  }

  // Reads previously attached request context safely, then augments with latest request metadata.
  const storedContext = (res.locals as { sentryContext?: Record<string, unknown> }).sentryContext || {};

  const context: Record<string, unknown> = {
    ...storedContext,
    method: req.method,
    path: req.path,
    originalUrl: req.originalUrl,
    requestId: req.requestId,
  };

  captureSentryException(err, context);

  res.status(500).json({
    error: 'Internal Server Error',
    message: 'Internal server error',
  });
}
