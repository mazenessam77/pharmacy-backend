import { Request, Response } from 'express';
import { Order } from '../models/Order';
import { Prescription } from '../models/Prescription';
import { Pharmacy } from '../models/Pharmacy';
import { asyncHandler } from '../utils/asyncHandler';
import { AppError } from '../utils/AppError';
import { findPharmaciesByGovernorate } from '../services/geolocation.service';
import { createNotification } from '../services/notification.service';
import { getIO } from '../socket';
import { getPagination } from '../utils/helpers';
import { ERROR_CODES, CANCELLABLE_STATUSES, PHARMACY_UPDATABLE_STATUSES, DEFAULT_PAGE, DEFAULT_LIMIT } from '../utils/constants';
import { sendOrderConfirmationEmail } from '../services/email.service';

export const createOrder = asyncHandler(async (req: Request, res: Response) => {
  const { medicines, prescriptionId, governorate, deliveryType, notes, patientLocation } = req.body;
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

  // Notify each pharmacy in the governorate
  for (const pharmacy of governoratePharmacies) {
    if (io) {
      io.to(`pharmacy:${pharmacy._id}`).emit('pharmacy:new-order', { order });
    }

    await createNotification({
      userId: pharmacy.userId,
      type: 'new_order',
      title: 'New Order in Your Area',
      body: `A patient in ${governorate} is requesting ${medicines.length} medicine(s)`,
      data: { orderId: order._id.toString() },
    });
  }

  res.status(201).json({
    success: true,
    data: { order, pharmaciesNotified: governoratePharmacies.length },
  });
});

export const getOrders = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || DEFAULT_PAGE;
  const limit = parseInt(req.query.limit as string) || DEFAULT_LIMIT;
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
    .populate('prescriptionId')
    .populate('acceptedResponse');

  if (!order) {
    throw new AppError('Order not found.', 404, ERROR_CODES.ORDER_NOT_FOUND);
  }

  // Check access: patient owns it, or pharmacy is involved, or admin
  if (
    req.user!.role === 'patient' &&
    order.patientId._id.toString() !== req.user!._id.toString()
  ) {
    throw new AppError('Not authorized.', 403, ERROR_CODES.FORBIDDEN);
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
