import { Request, Response } from 'express';
import { Pharmacy } from '../models/Pharmacy';
import { asyncHandler } from '../utils/asyncHandler';
import { AppError } from '../utils/AppError';
import { findNearbyPharmacies } from '../services/geolocation.service';
import { ERROR_CODES } from '../utils/constants';

export const getNearbyPharmacies = asyncHandler(async (req: Request, res: Response) => {
  const lat = parseFloat(req.query.lat as string);
  const lng = parseFloat(req.query.lng as string);
  const radius = parseFloat(req.query.radius as string) || 5;

  if (isNaN(lat) || isNaN(lng)) {
    throw new AppError('lat and lng query params are required.', 400, ERROR_CODES.VALIDATION_ERROR);
  }

  const pharmacies = await findNearbyPharmacies(lng, lat, radius);

  res.json({
    success: true,
    data: pharmacies,
  });
});

export const togglePharmacyStatus = asyncHandler(async (req: Request, res: Response) => {
  const pharmacy = await Pharmacy.findOne({ userId: req.user!._id });

  if (!pharmacy) {
    throw new AppError('Pharmacy profile not found.', 404, ERROR_CODES.PHARMACY_NOT_FOUND);
  }

  pharmacy.isOpen = !pharmacy.isOpen;
  await pharmacy.save();

  res.json({
    success: true,
    data: { isOpen: pharmacy.isOpen },
  });
});

export const getPharmacyById = asyncHandler(async (req: Request, res: Response) => {
  const pharmacy = await Pharmacy.findById(req.params.id)
    .populate('userId', 'name avatar phone');

  if (!pharmacy) {
    throw new AppError('Pharmacy not found.', 404, ERROR_CODES.PHARMACY_NOT_FOUND);
  }

  res.json({
    success: true,
    data: pharmacy,
  });
});
