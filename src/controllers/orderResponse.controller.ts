import { Request, Response } from 'express';
import { Order } from '../models/Order';
import { OrderResponse } from '../models/OrderResponse';
import { Pharmacy } from '../models/Pharmacy';
import { asyncHandler } from '../utils/asyncHandler';
import { AppError } from '../utils/AppError';
import { calculateDistanceBetween } from '../services/geolocation.service';
import { createNotification } from '../services/notification.service';
import { sendOrderConfirmationEmail } from '../services/email.service';
import { getIO } from '../socket';
import { getPagination } from '../utils/helpers';
import { ERROR_CODES, DEFAULT_PAGE, DEFAULT_LIMIT } from '../utils/constants';
import { User } from '../models/User';

export const submitResponse = asyncHandler(async (req: Request, res: Response) => {
  const { orderId } = req.params;
  const { availableMeds, alternatives, totalPrice, deliveryFee, estimatedTime } = req.body;

  const pharmacy = await Pharmacy.findOne({ userId: req.user!._id });
  if (!pharmacy) {
    throw new AppError('Pharmacy profile not found.', 404, ERROR_CODES.PHARMACY_NOT_FOUND);
  }

  if (!pharmacy.isVerified) {
    throw new AppError('Pharmacy is not verified.', 403, ERROR_CODES.PHARMACY_NOT_VERIFIED);
  }

  const order = await Order.findById(orderId);
  if (!order) {
    throw new AppError('Order not found.', 404, ERROR_CODES.ORDER_NOT_FOUND);
  }

  if (!['pending', 'offered'].includes(order.status)) {
    throw new AppError('Cannot respond to this order.', 400, ERROR_CODES.ORDER_INVALID_STATUS);
  }

  // Check if pharmacy already responded
  const existingResponse = await OrderResponse.findOne({
    orderId,
    pharmacyId: pharmacy._id,
  });
  if (existingResponse) {
    throw new AppError('You have already responded to this order.', 409, ERROR_CODES.ORDER_ALREADY_RESPONDED);
  }

  // Calculate distance
  const distanceKm = calculateDistanceBetween(
    pharmacy.location.coordinates[0],
    pharmacy.location.coordinates[1],
    order.patientLocation.coordinates[0],
    order.patientLocation.coordinates[1]
  );

  const orderResponse = await OrderResponse.create({
    orderId,
    pharmacyId: pharmacy._id,
    availableMeds,
    alternatives: alternatives || [],
    totalPrice,
    deliveryFee: deliveryFee || 0,
    distanceKm,
    estimatedTime,
  });

  // Update order status to offered
  if (order.status === 'pending') {
    order.status = 'offered';
    await order.save();
  }

  // Notify patient
  const io = getIO();
  if (io) {
    io.to(`user:${order.patientId}`).emit('order:new-response', {
      response: orderResponse,
      pharmacy: {
        _id: pharmacy._id,
        pharmacyName: pharmacy.pharmacyName,
        rating: pharmacy.rating,
        distanceKm,
      },
    });
  }

  await createNotification({
    userId: order.patientId,
    type: 'new_offer',
    title: 'New Offer Received',
    body: `${pharmacy.pharmacyName} offered your medicines for ${totalPrice} EGP`,
    data: { orderId: order._id.toString(), responseId: orderResponse._id.toString() },
  });

  res.status(201).json({
    success: true,
    data: orderResponse,
  });
});

export const getResponses = asyncHandler(async (req: Request, res: Response) => {
  const { orderId } = req.params;
  const page = parseInt(req.query.page as string) || DEFAULT_PAGE;
  const limit = parseInt(req.query.limit as string) || DEFAULT_LIMIT;
  const skip = (page - 1) * limit;

  const order = await Order.findById(orderId);
  if (!order) {
    throw new AppError('Order not found.', 404, ERROR_CODES.ORDER_NOT_FOUND);
  }

  // Only patient who owns the order can see responses
  if (req.user!.role === 'patient' && order.patientId.toString() !== req.user!._id.toString()) {
    throw new AppError('Not authorized.', 403, ERROR_CODES.FORBIDDEN);
  }

  const [responses, total] = await Promise.all([
    OrderResponse.find({ orderId })
      .populate('pharmacyId', 'pharmacyName rating location workingHours totalReviews')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    OrderResponse.countDocuments({ orderId }),
  ]);

  res.json({
    success: true,
    data: responses,
    pagination: getPagination(page, limit, total),
  });
});

export const acceptResponse = asyncHandler(async (req: Request, res: Response) => {
  const { orderId, responseId } = req.params;

  const order = await Order.findOne({ _id: orderId, patientId: req.user!._id });
  if (!order) {
    throw new AppError('Order not found.', 404, ERROR_CODES.ORDER_NOT_FOUND);
  }

  if (!['pending', 'offered'].includes(order.status)) {
    throw new AppError('Cannot accept responses for this order.', 400, ERROR_CODES.ORDER_INVALID_STATUS);
  }

  const response = await OrderResponse.findById(responseId).populate('pharmacyId');
  if (!response) {
    throw new AppError('Response not found.', 404, ERROR_CODES.RESPONSE_NOT_FOUND);
  }

  // Accept this response
  response.status = 'accepted';
  await response.save();

  // Reject all other responses
  await OrderResponse.updateMany(
    { orderId, _id: { $ne: responseId } },
    { status: 'rejected' }
  );

  // Update order
  order.status = 'confirmed';
  order.acceptedPharmacy = response.pharmacyId._id;
  order.acceptedResponse = response._id;
  await order.save();

  // Notify pharmacy
  const pharmacy = response.pharmacyId as any;
  const io = getIO();
  if (io) {
    io.to(`pharmacy:${pharmacy._id}`).emit('order:confirmed', {
      orderId: order._id,
      order,
    });

    io.to(`order:${order._id}`).emit('order:status-updated', {
      orderId: order._id,
      status: 'confirmed',
      updatedBy: 'patient',
    });
  }

  await createNotification({
    userId: pharmacy.userId,
    type: 'order_confirmed',
    title: 'Order Confirmed!',
    body: `Your offer for order #${order._id} has been accepted.`,
    data: { orderId: order._id.toString() },
  });

  // Send confirmation email to patient
  const patient = await User.findById(order.patientId);
  if (patient) {
    await sendOrderConfirmationEmail(patient.email, order._id.toString(), pharmacy.pharmacyName);
  }

  res.json({
    success: true,
    data: { order, acceptedResponse: response },
  });
});
