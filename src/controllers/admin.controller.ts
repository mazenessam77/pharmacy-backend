import { Request, Response } from 'express';
import { User } from '../models/User';
import { Pharmacy } from '../models/Pharmacy';
import { Order } from '../models/Order';
import { Medicine } from '../models/Medicine';
import { Message } from '../models/Message';
import { Notification } from '../models/Notification';
import { asyncHandler } from '../utils/asyncHandler';
import { AppError } from '../utils/AppError';
import { createNotification } from '../services/notification.service';
import { sendPharmacyVerificationEmail } from '../services/email.service';
import { getPagination } from '../utils/helpers';
import { ERROR_CODES, DEFAULT_PAGE, DEFAULT_LIMIT } from '../utils/constants';

export const getStats = asyncHandler(async (_req: Request, res: Response) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [totalPatients, totalPharmacies, totalOrders, ordersToday, deliveredOrders] = await Promise.all([
    User.countDocuments({ role: 'patient' }),
    Pharmacy.countDocuments(),
    Order.countDocuments(),
    Order.countDocuments({ createdAt: { $gte: today } }),
    Order.countDocuments({ status: 'delivered' }),
  ]);

  res.json({
    success: true,
    data: {
      totalPatients,
      totalPharmacies,
      totalOrders,
      ordersToday,
      deliveredOrders,
    },
  });
});

export const getPendingPharmacies = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || DEFAULT_PAGE;
  const limit = parseInt(req.query.limit as string) || DEFAULT_LIMIT;
  const skip = (page - 1) * limit;

  const [pharmacies, total] = await Promise.all([
    Pharmacy.find({ isVerified: false, rejectionReason: { $exists: false } })
      .populate('userId', 'name email phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Pharmacy.countDocuments({ isVerified: false, rejectionReason: { $exists: false } }),
  ]);

  res.json({
    success: true,
    data: pharmacies,
    pagination: getPagination(page, limit, total),
  });
});

export const verifyPharmacy = asyncHandler(async (req: Request, res: Response) => {
  const { action, reason } = req.body;

  if (!['approve', 'reject'].includes(action)) {
    throw new AppError('Action must be "approve" or "reject".', 400, ERROR_CODES.VALIDATION_ERROR);
  }

  const pharmacy = await Pharmacy.findById(req.params.id).populate('userId', 'name email');
  if (!pharmacy) {
    throw new AppError('Pharmacy not found.', 404, ERROR_CODES.PHARMACY_NOT_FOUND);
  }

  if (action === 'approve') {
    pharmacy.isVerified = true;
    pharmacy.verifiedAt = new Date();
    pharmacy.rejectionReason = undefined;
  } else {
    pharmacy.isVerified = false;
    pharmacy.rejectionReason = reason || 'Verification rejected';
  }

  await pharmacy.save();

  // Notify pharmacy user
  const user = pharmacy.userId as any;
  await createNotification({
    userId: user._id,
    type: 'pharmacy_verified',
    title: action === 'approve' ? 'Pharmacy Verified!' : 'Verification Update',
    body:
      action === 'approve'
        ? 'Your pharmacy has been verified. You can now receive orders.'
        : `Verification rejected: ${reason || 'N/A'}`,
    data: { pharmacyId: pharmacy._id.toString(), action },
  });

  // Send email
  await sendPharmacyVerificationEmail(user.email, pharmacy.pharmacyName, action === 'approve', reason);

  res.json({
    success: true,
    data: pharmacy,
  });
});

export const getUsers = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || DEFAULT_PAGE;
  const limit = parseInt(req.query.limit as string) || DEFAULT_LIMIT;
  const search = req.query.search as string;
  const role = req.query.role as string;
  const skip = (page - 1) * limit;

  const filter: any = {};
  if (role) filter.role = role;
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }

  const [users, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: users,
    pagination: getPagination(page, limit, total),
  });
});

export const banUser = asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    throw new AppError('User not found.', 404, ERROR_CODES.USER_NOT_FOUND);
  }

  if (user.role === 'admin') {
    throw new AppError('Cannot ban an admin user.', 400, ERROR_CODES.FORBIDDEN);
  }

  user.isBanned = !user.isBanned;
  await user.save({ validateBeforeSave: false });

  res.json({
    success: true,
    data: { userId: user._id, isBanned: user.isBanned },
  });
});

export const getAllOrders = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || DEFAULT_PAGE;
  const limit = parseInt(req.query.limit as string) || DEFAULT_LIMIT;
  const status = req.query.status as string;
  const skip = (page - 1) * limit;

  const filter: any = {};
  if (status) filter.status = status;

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .populate('patientId', 'name email phone')
      .populate('acceptedPharmacy', 'pharmacyName')
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

export const getOrderDetails = asyncHandler(async (req: Request, res: Response) => {
  const order = await Order.findById(req.params.id)
    .populate('patientId', 'name email phone avatar')
    .populate('acceptedPharmacy', 'pharmacyName rating location')
    .populate('prescriptionId')
    .populate('acceptedResponse');

  if (!order) {
    throw new AppError('Order not found.', 404, ERROR_CODES.ORDER_NOT_FOUND);
  }

  const messages = await Message.find({ orderId: order._id }).sort({ createdAt: 1 });

  res.json({
    success: true,
    data: { order, messages },
  });
});

// Admin medicine CRUD
export const createMedicine = asyncHandler(async (req: Request, res: Response) => {
  const medicine = await Medicine.create(req.body);
  res.status(201).json({ success: true, data: medicine });
});

export const updateMedicine = asyncHandler(async (req: Request, res: Response) => {
  const medicine = await Medicine.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!medicine) {
    throw new AppError('Medicine not found.', 404, ERROR_CODES.MEDICINE_NOT_FOUND);
  }
  res.json({ success: true, data: medicine });
});

export const deleteMedicine = asyncHandler(async (req: Request, res: Response) => {
  const medicine = await Medicine.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
  if (!medicine) {
    throw new AppError('Medicine not found.', 404, ERROR_CODES.MEDICINE_NOT_FOUND);
  }
  res.json({ success: true, data: { message: 'Medicine deactivated.' } });
});

export const deleteUser = asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new AppError('User not found.', 404, ERROR_CODES.USER_NOT_FOUND);
  if (user.role === 'admin') throw new AppError('Cannot delete an admin account.', 400, ERROR_CODES.FORBIDDEN);

  // Delete all related data
  await Promise.all([
    Pharmacy.deleteMany({ userId: user._id }),
    Order.deleteMany({ patientId: user._id }),
    Message.deleteMany({ senderId: user._id }),
    Notification.deleteMany({ userId: user._id }),
    User.findByIdAndDelete(user._id),
  ]);

  res.json({ success: true, data: { message: 'User and all related data deleted.' } });
});

export const deleteOrder = asyncHandler(async (req: Request, res: Response) => {
  const order = await Order.findById(req.params.id);
  if (!order) throw new AppError('Order not found.', 404, ERROR_CODES.ORDER_NOT_FOUND);

  await Promise.all([
    Message.deleteMany({ orderId: order._id }),
    Order.findByIdAndDelete(order._id),
  ]);

  res.json({ success: true, data: { message: 'Order deleted.' } });
});

export const deletePharmacy = asyncHandler(async (req: Request, res: Response) => {
  const pharmacy = await Pharmacy.findById(req.params.id);
  if (!pharmacy) throw new AppError('Pharmacy not found.', 404, ERROR_CODES.PHARMACY_NOT_FOUND);

  await Pharmacy.findByIdAndDelete(pharmacy._id);

  res.json({ success: true, data: { message: 'Pharmacy deleted.' } });
});

export const getAllPharmacies = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || DEFAULT_PAGE;
  const limit = parseInt(req.query.limit as string) || DEFAULT_LIMIT;
  const skip = (page - 1) * limit;

  const [pharmacies, total] = await Promise.all([
    Pharmacy.find()
      .populate('userId', 'name email phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Pharmacy.countDocuments(),
  ]);

  res.json({
    success: true,
    data: pharmacies,
    pagination: getPagination(page, limit, total),
  });
});
