import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const s3Client = new S3Client({
  region: import.meta.env.VITE_AWS_REGION,
  credentials: {
    accessKeyId: import.meta.env.VITE_AWS_ACCESS_KEY_ID,
    secretAccessKey: import.meta.env.VITE_AWS_SECRET_ACCESS_KEY,
  },
});

export const uploadToS3 = async (file: File, storagePath: string): Promise<string> => {
  try {
    if (!file) {
      throw new Error('No file provided');
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      throw new Error('File size must be less than 5MB');
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      throw new Error('Only image files are allowed');
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

    // Extract bucket and key from storage path
    const s3Path = storagePath.replace('s3://', '').split('/');
    const bucket = s3Path[0];
    const key = `${s3Path.slice(1).join('/')}${fileName}`;

    // Convert file to Buffer for upload
    const fileBuffer = await file.arrayBuffer();

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: fileBuffer,
      ContentType: file.type,
    });

    await s3Client.send(command);

    // Return the S3 URL
    return `https://${bucket}.s3.us-east-1.amazonaws.com/${key}`;
  } catch (error: any) {
    console.error('S3 Upload Error:', {
      message: error.message,
      code: error.code,
      requestId: error.$metadata?.requestId,
      statusCode: error.$metadata?.httpStatusCode,
      stack: error.stack,
    });

    throw new Error(
      error.code === 'NetworkingError'
        ? 'Network error: Please check your internet connection'
        : `Failed to upload to S3: ${error.message}`
    );
  }
};