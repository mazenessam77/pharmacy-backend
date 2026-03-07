import { Request, Response } from 'express';
import { Message } from '../models/Message';
import { Order } from '../models/Order';
import { asyncHandler } from '../utils/asyncHandler';
import { AppError } from '../utils/AppError';
import { createNotification } from '../services/notification.service';
import { getIO } from '../socket';
import { getPagination } from '../utils/helpers';
import { ERROR_CODES, DEFAULT_PAGE, DEFAULT_LIMIT } from '../utils/constants';

export const getChatHistory = asyncHandler(async (req: Request, res: Response) => {
  const { orderId, recipientId } = req.params;
  const page = parseInt(req.query.page as string) || DEFAULT_PAGE;
  const limit = parseInt(req.query.limit as string) || DEFAULT_LIMIT;
  const skip = (page - 1) * limit;

  // Verify user is part of this conversation
  const order = await Order.findById(orderId);
  if (!order) {
    throw new AppError('Order not found.', 404, ERROR_CODES.ORDER_NOT_FOUND);
  }

  const [messages, total] = await Promise.all([
    Message.find({ orderId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Message.countDocuments({ orderId }),
  ]);

  res.json({
    success: true,
    data: messages.reverse(),
    pagination: getPagination(page, limit, total),
  });
});

export const sendMessage = asyncHandler(async (req: Request, res: Response) => {
  const { orderId, receiverId, content, messageType, imageUrl, alternativeData } = req.body;

  const order = await Order.findById(orderId);
  if (!order) {
    throw new AppError('Order not found.', 404, ERROR_CODES.ORDER_NOT_FOUND);
  }

  const message = await Message.create({
    orderId,
    senderId: req.user!._id,
    receiverId,
    senderRole: req.user!.role,
    content,
    messageType: messageType || 'text',
    imageUrl,
    alternativeData,
  });

  // Emit via socket
  const io = getIO();
  if (io) {
    io.to(`order:${orderId}`).emit('chat:new-message', { message });
  }

  // Create notification for receiver
  await createNotification({
    userId: receiverId,
    type: 'new_message',
    title: 'New Message',
    body: messageType === 'alternative'
      ? `${req.user!.name} suggested an alternative medicine`
      : content?.substring(0, 100) || 'New message',
    data: { orderId, messageId: message._id.toString() },
  });

  res.status(201).json({
    success: true,
    data: message,
  });
});

export const markAsRead = asyncHandler(async (req: Request, res: Response) => {
  const message = await Message.findOneAndUpdate(
    { _id: req.params.id, receiverId: req.user!._id },
    { isRead: true },
    { new: true }
  );

  if (!message) {
    throw new AppError('Message not found.', 404, 'MESSAGE_NOT_FOUND');
  }

  res.json({
    success: true,
    data: message,
  });
});

export const markAllAsRead = asyncHandler(async (req: Request, res: Response) => {
  const { orderId } = req.params;

  await Message.updateMany(
    { orderId, receiverId: req.user!._id, isRead: false },
    { isRead: true }
  );

  res.json({
    success: true,
    data: { message: 'All messages marked as read.' },
  });
});
