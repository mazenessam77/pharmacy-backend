import { Request, Response } from 'express';
import { Medicine } from '../models/Medicine';
import { asyncHandler } from '../utils/asyncHandler';
import { AppError } from '../utils/AppError';
import { getPagination } from '../utils/helpers';
import { ERROR_CODES, DEFAULT_PAGE, DEFAULT_LIMIT } from '../utils/constants';

export const getMedicines = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || DEFAULT_PAGE;
  const limit = parseInt(req.query.limit as string) || DEFAULT_LIMIT;
  const search = req.query.search as string;
  const category = req.query.category as string;
  const skip = (page - 1) * limit;

  const filter: any = { isActive: true };

  if (search) {
    filter.$text = { $search: search };
  }
  if (category) {
    filter.category = category;
  }

  const [medicines, total] = await Promise.all([
    search
      ? Medicine.find(filter, { score: { $meta: 'textScore' } })
          .sort({ score: { $meta: 'textScore' } })
          .skip(skip)
          .limit(limit)
      : Medicine.find(filter).sort({ name: 1 }).skip(skip).limit(limit),
    Medicine.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: medicines,
    pagination: getPagination(page, limit, total),
  });
});

export const getMedicineById = asyncHandler(async (req: Request, res: Response) => {
  const medicine = await Medicine.findById(req.params.id).populate('alternatives', 'name genericName category');

  if (!medicine) {
    throw new AppError('Medicine not found.', 404, ERROR_CODES.MEDICINE_NOT_FOUND);
  }

  res.json({
    success: true,
    data: medicine,
  });
});

export const autocomplete = asyncHandler(async (req: Request, res: Response) => {
  const q = req.query.q as string;

  if (!q || q.length < 2) {
    return res.json({ success: true, data: [] });
  }

  const medicines = await Medicine.find({
    name: { $regex: new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') },
    isActive: true,
  })
    .select('name genericName category')
    .limit(10)
    .lean();

  res.json({
    success: true,
    data: medicines,
  });
});
