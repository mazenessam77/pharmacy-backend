import { Request, Response } from 'express';
import { Order } from '../models/Order';
import { Prescription } from '../models/Prescription';
import { Pharmacy } from '../models/Pharmacy';
import { asyncHandler } from '../utils/asyncHandler';
import { AppError } from '../utils/AppError';
import { findPharmaciesByGovernorate } from '../services/geolocation.service';
import { createNotification, createBulkNotifications } from '../services/notification.service';
import { getIO } from '../socket';
import { getPagination } from '../utils/helpers';
import { logger } from '../utils/logger';
import { ERROR_CODES, CANCELLABLE_STATUSES, PHARMACY_UPDATABLE_STATUSES, DEFAULT_PAGE, DEFAULT_LIMIT, MAX_LIMIT } from '../utils/constants';
import { sendOrderConfirmationEmail } from '../services/email.service';

export const createOrder = asyncHandler(async (req: Request, res: Response) => {
  const { medicines, prescriptionId, governorate, deliveryType, paymentMethod, notes, patientLocation } = req.body;
  const patientId = req.user!._id;

  if (!governorate) {
    throw new AppError('Governorate is required.', 400, ERROR_CODES.VALIDATION_ERROR);
  }

  // Verify prescription if provided
  if (prescriptionId) {
    const prescription = await Prescription.findOne({ _id: prescriptionId, patientId });
    if (!prescription) {
      throw new AppError('Prescription not found.', 404, ERROR_CODES.PRESCRIPTION_NOT_FOUND);
    }
  }

  const order = await Order.create({
    patientId,
    medicines,
    prescriptionId,
    governorate,
    deliveryType,
    paymentMethod,
    notes,
    ...(patientLocation && {
      patientLocation: {
        type: 'Point',
        coordinates: [patientLocation.lng, patientLocation.lat], // GeoJSON: [lng, lat]
      },
    }),
  });

  // Find all pharmacies in the same governorate
  const governoratePharmacies = await findPharmaciesByGovernorate(governorate);

  const io = getIO();

  const medicineCount = medicines?.length ?? 0;
  const notificationBody =
    medicineCount > 0
      ? `A patient in ${governorate} is requesting ${medicineCount} medicine(s)`
      : `A patient in ${governorate} sent a prescription for review`;

  // Socket emits are synchronous and cheap — do them inline.
  if (io) {
    for (const pharmacy of governoratePharmacies) {
      io.to(`pharmacy:${pharmacy._id}`).emit('pharmacy:new-order', { order });
    }
  }

  // Persist + push the notifications off the request path: each one costs a
  // Mongo insert and an FCM round-trip, and the patient must not wait
  // N-pharmacies × that before getting their confirmation.
  createBulkNotifications(
    governoratePharmacies.map((pharmacy) => ({
      userId: pharmacy.userId,
      type: 'new_order',
      title: 'New Order in Your Area',
      body: notificationBody,
      data: { orderId: order._id.toString() },
    }))
  ).catch((err) => logger.error('Order notification fan-out failed:', err));

  res.status(201).json({
    success: true,
    data: { order, pharmaciesNotified: governoratePharmacies.length },
  });
});

export const getOrders = asyncHandler(async (req: Request, res: Response) => {
  const page = Math.max(parseInt(req.query.page as string) || DEFAULT_PAGE, 1);
  const limit = Math.min(parseInt(req.query.limit as string) || DEFAULT_LIMIT, MAX_LIMIT);
  const status = req.query.status as string;
  const skip = (page - 1) * limit;

  const filter: any = {};

  if (req.user!.role === 'patient') {
    filter.patientId = req.user!._id;
  } else if (req.user!.role === 'pharmacy') {
    // Pharmacy sees nearby pending/offered orders or their confirmed ones
    const pharmacy = await Pharmacy.findOne({ userId: req.user!._id });
    if (!pharmacy) {
      throw new AppError('Pharmacy profile not found.', 404, ERROR_CODES.PHARMACY_NOT_FOUND);
    }

    if (status === 'pending' || status === 'offered' || !status) {
      // Return orders in the same governorate that are pending or offered
      const [governorateOrders, total] = await Promise.all([
        Order.find({
          governorate: pharmacy.governorate,
          status: { $in: ['pending', 'offered'] },
        })
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        Order.countDocuments({
          governorate: pharmacy.governorate,
          status: { $in: ['pending', 'offered'] },
        }),
      ]);

      return res.json({
        success: true,
        data: governorateOrders,
        pagination: getPagination(page, limit, total),
      });
    } else {
      // Pharmacy views their accepted orders
      filter.acceptedPharmacy = pharmacy._id;
    }
  }

  if (status) {
    filter.status = status;
  }

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .populate('acceptedPharmacy', 'pharmacyName rating userId')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Order.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: orders,
    pagination: getPagination(page, limit, total),
  });
});

export const getOrderById = asyncHandler(async (req: Request, res: Response) => {
  const order = await Order.findById(req.params.id)
    .populate('patientId', 'name phone avatar')
    .populate('acceptedPharmacy', 'pharmacyName rating location workingHours userId')
    // Only display metadata — the image itself is fetched through
    // GET /prescriptions/:id which re-checks authorization per viewer.
    .populate('prescriptionId', 'status createdAt')
    .populate('acceptedResponse');

  if (!order) {
    throw new AppError('Order not found.', 404, ERROR_CODES.ORDER_NOT_FOUND);
  }

  // Check access: patient owns it, pharmacy received it, or admin
  if (
    req.user!.role === 'patient' &&
    order.patientId._id.toString() !== req.user!._id.toString()
  ) {
    throw new AppError('Not authorized.', 403, ERROR_CODES.FORBIDDEN);
  }

  if (req.user!.role === 'pharmacy') {
    const pharmacy = await Pharmacy.findOne({ userId: req.user!._id }, { _id: 1, governorate: 1 }).lean();
    if (!pharmacy) {
      throw new AppError('Pharmacy profile not found.', 404, ERROR_CODES.PHARMACY_NOT_FOUND);
    }

    const isAcceptedPharmacy =
      order.acceptedPharmacy && order.acceptedPharmacy._id.toString() === pharmacy._id.toString();
    const isOpenInGovernorate =
      ['pending', 'offered'].includes(order.status) && order.governorate === pharmacy.governorate;

    if (!isAcceptedPharmacy && !isOpenInGovernorate) {
      logger.warn('Unauthorized order access attempt', {
        orderId: String(req.params.id),
        userId: String(req.user!._id),
        pharmacyId: pharmacy._id.toString(),
        ip: req.ip,
      });
      throw new AppError('Not authorized.', 403, ERROR_CODES.FORBIDDEN);
    }
  }

  res.json({
    success: true,
    data: order,
  });
});

export const cancelOrder = asyncHandler(async (req: Request, res: Response) => {
  const order = await Order.findOne({ _id: req.params.id, patientId: req.user!._id });

  if (!order) {
    throw new AppError('Order not found.', 404, ERROR_CODES.ORDER_NOT_FOUND);
  }

  if (!CANCELLABLE_STATUSES.includes(order.status)) {
    throw new AppError(`Cannot cancel order with status: ${order.status}`, 400, ERROR_CODES.ORDER_INVALID_STATUS);
  }

  order.status = 'cancelled';
  order.cancelReason = req.body.cancelReason || 'Cancelled by patient';
  await order.save();

  // Notify pharmacy if order was confirmed
  if (order.acceptedPharmacy) {
    const pharmacy = await Pharmacy.findById(order.acceptedPharmacy);
    if (pharmacy) {
      const io = getIO();
      if (io) {
        io.to(`order:${order._id}`).emit('order:status-updated', {
          orderId: order._id,
          status: 'cancelled',
          updatedBy: 'patient',
        });
      }

      await createNotification({
        userId: pharmacy.userId,
        type: 'order_status',
        title: 'Order Cancelled',
        body: `Order #${order._id} has been cancelled by the patient.`,
        data: { orderId: order._id.toString() },
      });
    }
  }

  res.json({
    success: true,
    data: order,
  });
});

export const updateOrderStatus = asyncHandler(async (req: Request, res: Response) => {
  const { status } = req.body;

  const pharmacy = await Pharmacy.findOne({ userId: req.user!._id });
  if (!pharmacy) {
    throw new AppError('Pharmacy profile not found.', 404, ERROR_CODES.PHARMACY_NOT_FOUND);
  }

  const order = await Order.findOne({
    _id: req.params.id,
    acceptedPharmacy: pharmacy._id,
  });

  if (!order) {
    throw new AppError('Order not found.', 404, ERROR_CODES.ORDER_NOT_FOUND);
  }

  const allowedNext = PHARMACY_UPDATABLE_STATUSES[order.status];
  if (!allowedNext || !allowedNext.includes(status)) {
    throw new AppError(
      `Cannot change status from "${order.status}" to "${status}".`,
      400,
      ERROR_CODES.ORDER_INVALID_STATUS
    );
  }

  order.status = status;
  if (status === 'delivered') {
    order.deliveredAt = new Date();
  }
  await order.save();

  // Notify patient
  const io = getIO();
  if (io) {
    io.to(`order:${order._id}`).emit('order:status-updated', {
      orderId: order._id,
      status,
      updatedBy: 'pharmacy',
    });
  }

  await createNotification({
    userId: order.patientId,
    type: 'order_status',
    title: 'Order Status Updated',
    body: `Your order status is now: ${status.replace(/_/g, ' ')}`,
    data: { orderId: order._id.toString(), status },
  });

  res.json({
    success: true,
    data: order,
  });
});

export const reorder = asyncHandler(async (req: Request, res: Response) => {
  const originalOrder = await Order.findOne({ _id: req.params.id, patientId: req.user!._id });

  if (!originalOrder) {
    throw new AppError('Order not found.', 404, ERROR_CODES.ORDER_NOT_FOUND);
  }

  // A prescription-only order has no medicine lines to copy, and silently
  // re-sending an old prescription is not something we do on the patient's
  // behalf — they attach it to a fresh order explicitly.
  if (originalOrder.medicines.length === 0) {
    throw new AppError(
      'This order only contained a prescription — place a new order and attach it again.',
      400,
      ERROR_CODES.VALIDATION_ERROR
    );
  }

  const governorate = originalOrder.governorate || 'Giza';

  const newOrder = await Order.create({
    patientId: req.user!._id,
    medicines: originalOrder.medicines,
    governorate,
    deliveryType: originalOrder.deliveryType,
    notes: originalOrder.notes,
  });

  // Notify all pharmacies in the same governorate
  const governoratePharmacies = await findPharmaciesByGovernorate(governorate);

  const io = getIO();
  for (const pharmacy of governoratePharmacies) {
    if (io) {
      io.to(`pharmacy:${pharmacy._id}`).emit('pharmacy:new-order', { order: newOrder });
    }

    await createNotification({
      userId: pharmacy.userId,
      type: 'new_order',
      title: 'New Order in Your Area',
      body: `A patient in ${governorate} is requesting ${newOrder.medicines.length} medicine(s)`,
      data: { orderId: newOrder._id.toString() },
    });
  }

  res.status(201).json({
    success: true,
    data: { order: newOrder },
  });
});

/**
 * GET /api/orders/:id/reorder-context
 * Read-only prefill for the "Reorder" review flow. NO writes — the patient
 * reviews/edits, then submits through the normal POST /api/orders (which owns
 * all broadcast/marketplace logic). Object-level: the order must belong to the
 * requester, and only DELIVERED orders can be reordered.
 *
 * Medicines are prefilled from what was actually delivered (the accepted
 * offer's in-stock lines), falling back to the originally requested list.
 */
export const getReorderContext = asyncHandler(async (req: Request, res: Response) => {
  const order = await Order.findOne({ _id: req.params.id, patientId: req.user!._id })
    .populate('acceptedResponse', 'availableMeds')
    .populate('acceptedPharmacy', 'pharmacyName')
    .lean();

  if (!order) {
    throw new AppError('Order not found.', 404, ERROR_CODES.ORDER_NOT_FOUND);
  }
  if (order.status !== 'delivered') {
    throw new AppError('Only delivered orders can be reordered.', 400, ERROR_CODES.ORDER_INVALID_STATUS);
  }

  const accepted: any = order.acceptedResponse;
  const fromOffer: { name: string; quantity: number }[] = Array.isArray(accepted?.availableMeds)
    ? accepted.availableMeds
        .filter((m: any) => m.inStock !== false)
        .map((m: any) => ({ name: m.name, quantity: m.quantity || 1 }))
    : [];
  const medicines = fromOffer.length > 0
    ? fromOffer
    : (order.medicines || []).map((m: any) => ({ name: m.name, quantity: m.quantity || 1 }));

  res.json({
    success: true,
    data: {
      governorate: order.governorate,
      deliveryType: order.deliveryType,
      medicines,
      // The original prescription is the patient's own — offered only so they
      // can EXPLICITLY choose to reuse it; never auto-applied.
      hadPrescription: !!order.prescriptionId,
      prescriptionId: order.prescriptionId ? String(order.prescriptionId) : undefined,
      pharmacyName: (order.acceptedPharmacy as any)?.pharmacyName,
    },
  });
});
