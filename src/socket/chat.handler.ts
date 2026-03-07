import { Server, Socket } from 'socket.io';
import { Message } from '../models/Message';
import { Order } from '../models/Order';
import { createNotification } from '../services/notification.service';
import { logger } from '../utils/logger';

export const registerChatHandlers = (io: Server, socket: Socket): void => {
  // Send message
  socket.on('chat:send-message', async (data: {
    orderId: string;
    receiverId: string;
    content?: string;
    messageType?: string;
    imageUrl?: string;
    alternativeData?: any;
  }) => {
    try {
      const { orderId, receiverId, content, messageType, imageUrl, alternativeData } = data;

      const order = await Order.findById(orderId);
      if (!order) return;

      const message = await Message.create({
        orderId,
        senderId: socket.user!._id,
        receiverId,
        senderRole: socket.user!.role,
        content,
        messageType: messageType || 'text',
        imageUrl,
        alternativeData,
      });

      // Emit to order room
      io.to(`order:${orderId}`).emit('chat:new-message', { message });

      // Notify receiver
      await createNotification({
        userId: receiverId,
        type: 'new_message',
        title: 'New Message',
        body: messageType === 'alternative'
          ? `${socket.user!.name} suggested an alternative medicine`
          : content?.substring(0, 100) || 'New message',
        data: { orderId, messageId: message._id.toString() },
      });
    } catch (error) {
      logger.error('Socket chat:send-message error:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  // Typing indicators
  socket.on('chat:start-typing', (data: { orderId: string; userId: string }) => {
    socket.to(`order:${data.orderId}`).emit('chat:typing', {
      orderId: data.orderId,
      userId: socket.user!._id,
      isTyping: true,
    });
  });

  socket.on('chat:stop-typing', (data: { orderId: string; userId: string }) => {
    socket.to(`order:${data.orderId}`).emit('chat:typing', {
      orderId: data.orderId,
      userId: socket.user!._id,
      isTyping: false,
    });
  });

  // Send alternative suggestion (pharmacy only)
  socket.on('chat:send-alternative', async (data: {
    orderId: string;
    receiverId: string;
    originalMedicine: string;
    suggestedMedicine: string;
    suggestedPrice: number;
  }) => {
    try {
      if (socket.user!.role !== 'pharmacy') return;

      const message = await Message.create({
        orderId: data.orderId,
        senderId: socket.user!._id,
        receiverId: data.receiverId,
        senderRole: 'pharmacy',
        messageType: 'alternative',
        alternativeData: {
          originalMedicine: data.originalMedicine,
          suggestedMedicine: data.suggestedMedicine,
          suggestedPrice: data.suggestedPrice,
          status: 'pending',
        },
      });

      io.to(`order:${data.orderId}`).emit('chat:new-message', { message });

      await createNotification({
        userId: data.receiverId,
        type: 'new_message',
        title: 'Alternative Suggestion',
        body: `${socket.user!.name} suggested ${data.suggestedMedicine} as alternative for ${data.originalMedicine}`,
        data: { orderId: data.orderId, messageId: message._id.toString() },
      });
    } catch (error) {
      logger.error('Socket chat:send-alternative error:', error);
    }
  });

  // Respond to alternative (patient only)
  socket.on('chat:respond-alternative', async (data: {
    messageId: string;
    status: 'accepted' | 'rejected';
  }) => {
    try {
      if (socket.user!.role !== 'patient') return;

      const message = await Message.findById(data.messageId);
      if (!message || !message.alternativeData) return;

      message.alternativeData.status = data.status;
      await message.save();

      io.to(`order:${message.orderId}`).emit('chat:alternative-response', {
        messageId: data.messageId,
        status: data.status,
      });
    } catch (error) {
      logger.error('Socket chat:respond-alternative error:', error);
    }
  });
};
