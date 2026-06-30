import dotenv from 'dotenv';
dotenv.config();

export const env = {
  PORT: parseInt(process.env.PORT || '5000', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/pharmacy-app',

  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || 'default_access_secret',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'default_refresh_secret',
  JWT_ACCESS_EXPIRY: process.env.JWT_ACCESS_EXPIRY || '15m',
  JWT_REFRESH_EXPIRY: process.env.JWT_REFRESH_EXPIRY || '7d',

  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || '',
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY || '',
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET || '',

  FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID || '',
  FIREBASE_PRIVATE_KEY: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
  FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL || '',

  SMTP_HOST: process.env.SMTP_HOST || '',
  SMTP_PORT: parseInt(process.env.SMTP_PORT || '587', 10),
  SMTP_USER: process.env.SMTP_USER || '',
  SMTP_PASS: process.env.SMTP_PASS || '',
  EMAIL_FROM: process.env.EMAIL_FROM || 'noreply@pharmalink.com',

  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || '',
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || '',

  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',

  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',

  GOOGLE_VISION_API_KEY: process.env.GOOGLE_VISION_API_KEY || '',

  // Live delivery tracking — routing/ETA provider. Server-side key (NOT the
  // NEXT_PUBLIC_ browser key) used for Directions API calls. Empty => routing
  // degrades gracefully to "ETA unavailable" instead of crashing.
  ROUTING_PROVIDER: (process.env.ROUTING_PROVIDER || 'google') as 'google' | 'none',
  GOOGLE_MAPS_API_KEY: process.env.GOOGLE_MAPS_API_KEY || '',

  GROQ_API_KEY: process.env.GROQ_API_KEY || '',
  GROQ_MODEL: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',

  // Async prescription pipeline (S3 presigned uploads + SQS). Empty in dev
  // unless configured — the presign/complete endpoints 503 cleanly when unset.
  AWS_REGION: process.env.AWS_REGION || 'eu-west-2',
  PRESCRIPTIONS_BUCKET: process.env.PRESCRIPTIONS_BUCKET || '',
  PRESCRIPTION_QUEUE_URL: process.env.PRESCRIPTION_QUEUE_URL || '',
};
