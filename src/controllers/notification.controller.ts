import { Request, Response } from 'express';
import { Notification } from '../models/Notification';
import { asyncHandler } from '../utils/asyncHandler';
import { AppError } from '../utils/AppError';
import { getPagination } from '../utils/helpers';
import { ERROR_CODES, DEFAULT_PAGE, DEFAULT_LIMIT } from '../utils/constants';

export const getNotifications = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || DEFAULT_PAGE;
  const limit = parseInt(req.query.limit as string) || DEFAULT_LIMIT;
  const skip = (page - 1) * limit;

  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find({ userId: req.user!._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Notification.countDocuments({ userId: req.user!._id }),
    Notification.countDocuments({ userId: req.user!._id, isRead: false }),
  ]);

  res.json({
    success: true,
    data: { notifications, unreadCount },
    pagination: getPagination(page, limit, total),
  });
});

export const markAsRead = asyncHandler(async (req: Request, res: Response) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, userId: req.user!._id },
    { isRead: true },
    { new: true }
  );

  if (!notification) {
    throw new AppError('Notification not found.', 404, ERROR_CODES.NOTIFICATION_NOT_FOUND);
  }

  res.json({
    success: true,
    data: notification,
  });
});

export const markAllAsRead = asyncHandler(async (req: Request, res: Response) => {
  await Notification.updateMany(
    { userId: req.user!._id, isRead: false },
    { isRead: true }
  );

  res.json({
    success: true,
    data: { message: 'All notifications marked as read.' },
  });
});

export const deleteNotification = asyncHandler(async (req: Request, res: Response) => {
  const notification = await Notification.findOneAndDelete({
    _id: req.params.id,
    userId: req.user!._id,
  });

  if (!notification) {
    throw new AppError('Notification not found.', 404, ERROR_CODES.NOTIFICATION_NOT_FOUND);
  }

  res.json({
    success: true,
    data: { message: 'Notification deleted.' },
  });
});
