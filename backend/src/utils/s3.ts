import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Initialize S3 Client
const s3Client = new S3Client({
    region: process.env.AWS_REGION || 'ap-south-1',
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME!;

/**
 * Upload a file to S3
 */
export async function uploadToS3(
    file: Buffer,
    fileName: string,
    contentType: string,
    academyId: string
): Promise<string> {
    // Create a unique key with academy folder structure
    const key = `resources/${academyId}/${Date.now()}-${fileName}`;

    const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        Body: file,
        ContentType: contentType,
    });

    await s3Client.send(command);

    // Return the public URL
    return `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION || 'ap-south-1'}.amazonaws.com/${key}`;
}

/**
 * Delete a file from S3
 */
export async function deleteFromS3(fileUrl: string): Promise<void> {
    // Extract the key from the URL
    const url = new URL(fileUrl);
    const key = url.pathname.substring(1); // Remove leading slash

    const command = new DeleteObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
    });

    await s3Client.send(command);
}

/**
 * Generate a pre-signed URL for temporary access (useful for private files)
 */
export async function getPresignedUrl(fileUrl: string, expiresIn = 3600): Promise<string> {
    const url = new URL(fileUrl);
    const key = url.pathname.substring(1);

    const command = new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
    });

    return await getSignedUrl(s3Client, command, { expiresIn });
}

/**
 * Get file type from mimetype
 */
export function getFileType(mimeType: string): 'pdf' | 'image' | 'document' {
    if (mimeType === 'application/pdf') {
        return 'pdf';
    }
    if (mimeType.startsWith('image/')) {
        return 'image';
    }
    return 'document';
}

export { s3Client, BUCKET_NAME };
