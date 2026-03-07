import admin from 'firebase-admin';
import { env } from './env';
import { logger } from '../utils/logger';

let firebaseInitialized = false;

export const initFirebase = (): void => {
  if (firebaseInitialized) return;

  if (!env.FIREBASE_PROJECT_ID || !env.FIREBASE_CLIENT_EMAIL || !env.FIREBASE_PRIVATE_KEY) {
    logger.warn('Firebase credentials not configured. Push notifications will be disabled.');
    return;
  }

  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: env.FIREBASE_PROJECT_ID,
        privateKey: env.FIREBASE_PRIVATE_KEY,
        clientEmail: env.FIREBASE_CLIENT_EMAIL,
      }),
    });
    firebaseInitialized = true;
    logger.info('Firebase Admin SDK initialized');
  } catch (error) {
    logger.error('Firebase initialization error:', error);
  }
};

export const getFirebaseAdmin = () => {
  if (!firebaseInitialized) {
    return null;
  }
  return admin;
};
