import { Notification } from '../models/Notification';
import { User } from '../models/User';
import { getFirebaseAdmin } from '../config/firebase';
import { logger } from '../utils/logger';
import { getIO } from '../socket';
import { Types } from 'mongoose';

interface NotificationData {
  userId: string | Types.ObjectId;
  type: string;
  title: string;
  body: string;
  data?: Record<string, any>;
}

export const createNotification = async (notifData: NotificationData): Promise<void> => {
  try {
    // Save in-app notification
    const notification = await Notification.create(notifData);

    // Emit via socket
    const io = getIO();
    if (io) {
      io.to(`user:${notifData.userId}`).emit('notification:new', { notification });
    }

    // Send push notification via FCM
    const user = await User.findById(notifData.userId).select('fcmToken');
    if (user?.fcmToken) {
      const admin = getFirebaseAdmin();
      if (admin) {
        try {
          await admin.messaging().send({
            token: user.fcmToken,
            notification: {
              title: notifData.title,
              body: notifData.body,
            },
            data: notifData.data
              ? Object.fromEntries(Object.entries(notifData.data).map(([k, v]) => [k, String(v)]))
              : undefined,
          });
        } catch (fcmError: any) {
          if (fcmError.code === 'messaging/registration-token-not-registered') {
            await User.findByIdAndUpdate(notifData.userId, { $unset: { fcmToken: 1 } });
          }
          logger.warn('FCM send error:', fcmError.message);
        }
      }
    }
  } catch (error) {
    logger.error('Create notification error:', error);
  }
};

export const createBulkNotifications = async (notifications: NotificationData[]): Promise<void> => {
  await Promise.allSettled(notifications.map((n) => createNotification(n)));
};
