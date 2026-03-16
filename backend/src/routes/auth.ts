import { Router, Request, Response } from 'express';
import { authenticateTeacher } from '../middlewares/index.js';
import { captureSentryException } from '../utils/sentry.js';

const router = Router();

// Public health check - no auth required
router.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    message: 'Auth routes are working',
  });
});

// Protected route example - demonstrates middleware usage
router.get('/me', authenticateTeacher, (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Authentication successful',
    userId: req.clerkUserId,
  });
});

// ============================================
// DEVELOPMENT ONLY - Get Clerk JWT with Template
// ============================================
// This endpoint is ONLY for Postman testing
// It requests a JWT from Clerk using a custom template
// 
// WHY THIS EXISTS:
// - Clerk's default session JWT does NOT include custom claims
// - JWT templates are NOT applied automatically
// - Only the BACKEND can request a JWT using a template
// - Postman cannot directly request templated JWTs from Clerk
//
// HOW TO USE:
// 1. Get a session ID from Clerk (login via Clerk dashboard or API)
// 2. POST to this endpoint with: { "sessionId": "sess_xxxxx", "template": "testing" }
// 3. Receive JWT with custom claims (role, academyId, etc.)
// 4. Use this JWT in Authorization header for protected routes
//
// SECURITY WARNING:
// This endpoint should be DISABLED in production!
// It's only for development/testing purposes
// ============================================

router.post('/dev/get-clerk-token', async (req: Request, res: Response) => {
  try {
    // Only allow in development
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'This endpoint is only available in development mode',
      });
    }

    const { sessionId, template } = req.body;

    // Validate input
    if (!sessionId) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'sessionId is required',
        example: {
          sessionId: 'sess_xxxxx',
          template: 'testing', // optional, defaults to 'testing'
        },
      });
    }

    const templateName = template || 'testing';

    // Request JWT from Clerk using the specified template
    // This is the ONLY way to get a JWT with custom claims
    const clerkApiUrl = `https://api.clerk.com/v1/sessions/${sessionId}/tokens/${templateName}`;

    const response = await fetch(clerkApiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.CLERK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      return res.status(response.status).json({
        error: 'Clerk API Error',
        message: errorData.errors?.[0]?.message || 'Failed to get token from Clerk',
        details: errorData,
      });
    }

    const data = await response.json();

    // Decode the JWT to show what's inside (for debugging)
    const payload = JSON.parse(Buffer.from(data.jwt.split('.')[1], 'base64').toString());

    return res.status(200).json({
      success: true,
      message: 'JWT generated successfully using template',
      template: templateName,
      jwt: data.jwt,
      expiresAt: new Date(payload.exp * 1000).toISOString(),
      lifetime: `${payload.exp - payload.iat} seconds`,
      payload, // Show decoded payload for debugging
      usage: {
        description: 'Use this JWT in Authorization header',
        example: `Authorization: Bearer ${data.jwt}`,
      },
    });

  } catch (error) {
    console.error('Error getting Clerk token:', error);
    captureSentryException(error, { route: 'auth - get Clerk token' });
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get token from Clerk',
    });
  }
});

export default router;
