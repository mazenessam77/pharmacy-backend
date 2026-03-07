import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import cloudinary from '../config/cloudinary';
import { env } from '../config/env';
import { logger } from '../utils/logger';

interface UploadResult {
  url: string;
  publicId: string;
}

const saveLocally = async (buffer: Buffer, folder: string): Promise<UploadResult> => {
  const uploadDir = path.join('/app/uploads', folder);
  fs.mkdirSync(uploadDir, { recursive: true });
  const filename = `${crypto.randomUUID()}.png`;
  const filePath = path.join(uploadDir, filename);
  fs.writeFileSync(filePath, buffer);
  const publicId = `${folder}/${filename}`;
  const url = `http://localhost:${env.PORT}/uploads/${folder}/${filename}`;
  return { url, publicId };
};

export const uploadToCloudinary = async (
  buffer: Buffer,
  folder: string = 'pharmacy-app'
): Promise<UploadResult> => {
  // Fall back to local storage if Cloudinary is not configured
  if (!env.CLOUDINARY_API_KEY || env.CLOUDINARY_API_KEY === 'your_key') {
    logger.warn('Cloudinary not configured — saving locally');
    return saveLocally(buffer, folder);
  }

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'image',
        transformation: [{ quality: 'auto' }, { fetch_format: 'auto' }],
      },
      (error, result) => {
        if (error) {
          logger.error('Cloudinary upload error:', error);
          return reject(error);
        }
        resolve({
          url: result!.secure_url,
          publicId: result!.public_id,
        });
      }
    );
    uploadStream.end(buffer);
  });
};

export const deleteFromCloudinary = async (publicId: string): Promise<void> => {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    logger.error('Cloudinary delete error:', error);
  }
};
