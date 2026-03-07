import { Request, Response } from 'express';
import { Review } from '../models/Review';
import { Order } from '../models/Order';
import { Pharmacy } from '../models/Pharmacy';
import { asyncHandler } from '../utils/asyncHandler';
import { AppError } from '../utils/AppError';
import { getPagination } from '../utils/helpers';
import { ERROR_CODES, DEFAULT_PAGE, DEFAULT_LIMIT } from '../utils/constants';

export const createReview = asyncHandler(async (req: Request, res: Response) => {
  const { pharmacyId, orderId, rating, comment } = req.body;

  // Verify order exists, is delivered, and belongs to patient
  const order = await Order.findOne({
    _id: orderId,
    patientId: req.user!._id,
    status: 'delivered',
  });

  if (!order) {
    throw new AppError('Order not found or not delivered.', 404, ERROR_CODES.ORDER_NOT_FOUND);
  }

  // Check for existing review
  const existingReview = await Review.findOne({ orderId });
  if (existingReview) {
    throw new AppError('You have already reviewed this order.', 409, ERROR_CODES.REVIEW_ALREADY_EXISTS);
  }

  const review = await Review.create({
    patientId: req.user!._id,
    pharmacyId,
    orderId,
    rating,
    comment,
  });

  // Recalculate pharmacy rating
  const stats = await Review.aggregate([
    { $match: { pharmacyId: review.pharmacyId } },
    {
      $group: {
        _id: '$pharmacyId',
        avgRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 },
      },
    },
  ]);

  if (stats.length > 0) {
    await Pharmacy.findByIdAndUpdate(pharmacyId, {
      rating: Math.round(stats[0].avgRating * 10) / 10,
      totalReviews: stats[0].totalReviews,
    });
  }

  res.status(201).json({
    success: true,
    data: review,
  });
});

export const getPharmacyReviews = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const page = parseInt(req.query.page as string) || DEFAULT_PAGE;
  const limit = parseInt(req.query.limit as string) || DEFAULT_LIMIT;
  const skip = (page - 1) * limit;

  const [reviews, total] = await Promise.all([
    Review.find({ pharmacyId: id })
      .populate('patientId', 'name avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Review.countDocuments({ pharmacyId: id }),
  ]);

  res.json({
    success: true,
    data: reviews,
    pagination: getPagination(page, limit, total),
  });
});
