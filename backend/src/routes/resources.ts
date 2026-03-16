import { Router, Request, Response } from 'express';
import multer from 'multer';
import { authenticateTeacher } from '../middlewares/index.js';
import { db } from '../db/index.js';
import { resources, academies } from '../db/schema/index.js';
import { eq, and, desc } from 'drizzle-orm';
import { uploadToS3, deleteFromS3, getFileType } from '../utils/s3.js';
import { logger } from '../utils/logger.js';

const router = Router();

// Configure multer for memory storage (files stored in buffer)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB max file size
    },
    fileFilter: (req, file, cb) => {
        // Allow only PDF and images
        const allowedMimeTypes = [
            'application/pdf',
            'image/jpeg',
            'image/png',
            'image/gif',
            'image/webp',
        ];

        if (allowedMimeTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only PDF and images are allowed.'));
        }
    },
});

// ============================================
// UPLOAD RESOURCE (Teacher Only)
// ============================================
router.post('/upload', authenticateTeacher, upload.single('file'), async (req: Request, res: Response) => {
    try {
        const clerkUserId = req.clerkUserId!;
        const { title, description } = req.body;
        const file = req.file;

        // 1. Validate file
        if (!file) {
            return res.status(400).json({
                error: 'Validation Error',
                message: 'No file uploaded',
            });
        }

        // 2. Validate title
        if (!title || title.trim().length === 0) {
            return res.status(400).json({
                error: 'Validation Error',
                message: 'Title is required',
            });
        }

        // 3. Get teacher's academy
        const academy = await db
            .select()
            .from(academies)
            .where(eq(academies.clerkUserId, clerkUserId))
            .limit(1);

        if (academy.length === 0) {
            return res.status(404).json({
                error: 'Not Found',
                message: 'Academy not found',
            });
        }

        const teacherAcademy = academy[0];

        // 4. Upload file to S3
        const fileUrl = await uploadToS3(
            file.buffer,
            file.originalname,
            file.mimetype,
            teacherAcademy.id
        );

        // 5. Save resource metadata to database
        const newResource = await db
            .insert(resources)
            .values({
                academyId: teacherAcademy.id,
                title: title.trim(),
                description: description?.trim() || null,
                fileUrl,
                fileName: file.originalname,
                fileType: getFileType(file.mimetype),
                fileSize: file.size,
            })
            .returning();

        logger.info('Resource uploaded successfully', {
            resourceId: newResource[0].id,
            academyId: teacherAcademy.id,
            fileName: file.originalname,
            fileSize: file.size,
        });

        return res.status(201).json({
            message: 'Resource uploaded successfully',
            resource: newResource[0],
        });

    } catch (error: any) {
        logger.error('Error uploading resource', { error: error.message });
        
        if (error.message?.includes('Invalid file type')) {
            return res.status(400).json({
                error: 'Validation Error',
                message: error.message,
            });
        }

        return res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to upload resource',
        });
    }
});

// ============================================
// GET ALL RESOURCES FOR ACADEMY (Public - Students can view)
// ============================================
router.get('/academy/:academyId', async (req: Request, res: Response) => {
    try {
        const { academyId } = req.params;
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const offset = (page - 1) * limit;

        // 1. Verify academy exists
        const academy = await db
            .select()
            .from(academies)
            .where(eq(academies.id, academyId))
            .limit(1);

        if (academy.length === 0) {
            return res.status(404).json({
                error: 'Not Found',
                message: 'Academy not found',
            });
        }

        // 2. Get total count
        const allResources = await db
            .select()
            .from(resources)
            .where(eq(resources.academyId, academyId));

        // 3. Get paginated resources
        const paginatedResources = await db
            .select()
            .from(resources)
            .where(eq(resources.academyId, academyId))
            .orderBy(desc(resources.createdAt))
            .limit(limit)
            .offset(offset);

        return res.status(200).json({
            academyId,
            academyName: academy[0].name,
            totalResources: allResources.length,
            resources: paginatedResources,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(allResources.length / limit),
                totalItems: allResources.length,
                itemsPerPage: limit,
            },
        });

    } catch (error: any) {
        logger.error('Error fetching resources', { error: error.message });
        return res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to fetch resources',
        });
    }
});

// ============================================
// GET SINGLE RESOURCE
// ============================================
router.get('/:resourceId', async (req: Request, res: Response) => {
    try {
        const { resourceId } = req.params;

        const resource = await db
            .select()
            .from(resources)
            .where(eq(resources.id, resourceId))
            .limit(1);

        if (resource.length === 0) {
            return res.status(404).json({
                error: 'Not Found',
                message: 'Resource not found',
            });
        }

        return res.status(200).json({
            resource: resource[0],
        });

    } catch (error: any) {
        logger.error('Error fetching resource', { error: error.message });
        return res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to fetch resource',
        });
    }
});

// ============================================
// DELETE RESOURCE (Teacher Only)
// ============================================
router.delete('/:resourceId', authenticateTeacher, async (req: Request, res: Response) => {
    try {
        const { resourceId } = req.params;
        const clerkUserId = req.clerkUserId!;

        // 1. Get the resource
        const resource = await db
            .select()
            .from(resources)
            .where(eq(resources.id, resourceId))
            .limit(1);

        if (resource.length === 0) {
            return res.status(404).json({
                error: 'Not Found',
                message: 'Resource not found',
            });
        }

        const targetResource = resource[0];

        // 2. Verify teacher owns the academy
        const academy = await db
            .select()
            .from(academies)
            .where(and(
                eq(academies.id, targetResource.academyId),
                eq(academies.clerkUserId, clerkUserId)
            ))
            .limit(1);

        if (academy.length === 0) {
            return res.status(403).json({
                error: 'Forbidden',
                message: 'You are not authorized to delete this resource',
            });
        }

        // 3. Delete from S3
        await deleteFromS3(targetResource.fileUrl);

        // 4. Delete from database
        await db
            .delete(resources)
            .where(eq(resources.id, resourceId));

        logger.info('Resource deleted successfully', {
            resourceId,
            academyId: targetResource.academyId,
        });

        return res.status(200).json({
            message: 'Resource deleted successfully',
            deletedResource: {
                id: targetResource.id,
                title: targetResource.title,
            },
        });

    } catch (error: any) {
        logger.error('Error deleting resource', { error: error.message });
        return res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to delete resource',
        });
    }
});

export default router;
