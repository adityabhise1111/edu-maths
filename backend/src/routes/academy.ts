import { Router, Request, Response } from 'express';
import { authenticateTeacher } from '../middlewares/index.js';
import { db } from '../db/index.js';
import { academies } from '../db/schema/index.js';
import { eq } from 'drizzle-orm';
import { getRedisClient, isRedisAvailable } from '../db/redis.js';
import { getAcademyPublicKey } from '../utils/redisKeys.js';
import { captureSentryException } from '../utils/sentry.js';

const router = Router();

// Create academy
router.post('/create', authenticateTeacher, async (req: Request, res: Response) => {
  try {
    const { name, slug, logo_url, description } = req.body;
    const clerkUserId = req.clerkUserId!;

    // Validate required fields
    if (!name || !slug) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Name and slug are required',
      });
    }

    // Check if user already has an academy (one academy per user rule)
    const existingAcademy = await db
      .select()
      .from(academies)
      .where(eq(academies.clerkUserId, clerkUserId))
      .limit(1);

    if (existingAcademy.length > 0) {
      return res.status(409).json({
        error: 'Conflict',
        message: 'You already have an academy. Only one academy per user is allowed.',
        existingAcademy: existingAcademy[0],
      });
    }

    // Check if slug is already taken
    const existingSlug = await db
      .select()
      .from(academies)
      .where(eq(academies.slug, slug))
      .limit(1);

    if (existingSlug.length > 0) {
      return res.status(409).json({
        error: 'Conflict',
        message: 'This slug is already taken. Please choose a different one.',
      });
    }

    // Create academy
    const newAcademy = await db
      .insert(academies)
      .values({
        name,
        slug,
        logoUrl: logo_url || null,
        description: description || null,
        clerkUserId,
      })
      .returning();

    // Invalidate cache for this slug (if it exists from a previous academy)
    const redis = getRedisClient();
    if (redis && isRedisAvailable()) {
      try {
        const redisKey = getAcademyPublicKey(slug);
        await redis.del(redisKey);
        console.log(`🗑️ Cache invalidated: ${redisKey}`);
      } catch (redisError) {
        console.error('Redis error (cache invalidation):', redisError);
        captureSentryException(redisError, { route: 'academy - create (redis invalidation)' });
        // Don't fail the request if cache invalidation fails
      }
    }

    return res.status(201).json({
      message: 'Academy created successfully',
      academy: newAcademy[0],
    });
  } catch (error) {
    console.error('Error creating academy:', error);
    captureSentryException(error, { route: 'academy - create academy' });
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to create academy',
    });
  }
});

// Get academy by slug (public endpoint)
router.get('/:slug', async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const redisKey = getAcademyPublicKey(slug);
    const redis = getRedisClient();

    // Try Redis cache first (if available)
    if (redis && isRedisAvailable()) {
      try {
        const cached = await redis.get(redisKey);
        if (cached) {
          console.log(`✅ Cache HIT: ${redisKey}`);
          return res.status(200).json({
            academy: JSON.parse(cached),
          });
        }
        console.log(`❌ Cache MISS: ${redisKey}`);
      } catch (redisError) {
        console.error('Redis error (cache check):', redisError);
        captureSentryException(redisError, { route: 'academy - get by slug (redis check)' });
        // Continue to database if Redis fails
      }
    }

    // Fetch academy by slug from PostgreSQL
    const academy = await db
      .select({
        name: academies.name,
        logoUrl: academies.logoUrl,
        description: academies.description,
      })
      .from(academies)
      .where(eq(academies.slug, slug))
      .limit(1);

    if (academy.length === 0) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Academy not found',
      });
    }

    const academyData = academy[0];

    // Store in Redis cache (if available) - 5 minutes TTL
    if (redis && isRedisAvailable()) {
      try {
        await redis.setex(redisKey, 300, JSON.stringify(academyData));
        console.log(`✅ Cached: ${redisKey} (TTL: 5 mins)`);
      } catch (redisError) {
        console.error('Redis error (cache set):', redisError);
        captureSentryException(redisError, { route: 'academy - get by slug (redis set)' });
        // Don't fail the request if caching fails
      }
    }

    return res.status(200).json({
      academy: academyData,
    });
  } catch (error) {
    console.error('Error fetching academy:', error);
    captureSentryException(error, { route: 'academy - get by slug' });
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch academy',
    });
  }
});

export default router;
