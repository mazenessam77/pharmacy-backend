import { Request, Response } from 'express';
import { User } from '../models/User';
import { Pharmacy } from '../models/Pharmacy';
import { asyncHandler } from '../utils/asyncHandler';
import { AppError } from '../utils/AppError';
import { uploadToCloudinary } from '../services/upload.service';
import { ERROR_CODES } from '../utils/constants';

export const getProfile = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user!;

  let pharmacyProfile = null;
  if (user.role === 'pharmacy') {
    pharmacyProfile = await Pharmacy.findOne({ userId: user._id });
  }

  res.json({
    success: true,
    data: { user, pharmacyProfile },
  });
});

export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  const { name, phone, address } = req.body;
  const updateData: any = {};

  if (name) updateData.name = name;
  if (phone) updateData.phone = phone;
  if (address) updateData.address = address;

  // Handle avatar upload
  if (req.file) {
    const result = await uploadToCloudinary(req.file.buffer, 'pharmacy-app/avatars');
    updateData.avatar = result.url;
  }

  const user = await User.findByIdAndUpdate(req.user!._id, updateData, {
    new: true,
    runValidators: true,
  });

  res.json({
    success: true,
    data: { user },
  });
});

export const updateLocation = asyncHandler(async (req: Request, res: Response) => {
  const { lat, lng } = req.body;

  if (lat === undefined || lng === undefined) {
    throw new AppError('lat and lng are required.', 400, ERROR_CODES.VALIDATION_ERROR);
  }

  const user = await User.findByIdAndUpdate(
    req.user!._id,
    {
      location: {
        type: 'Point',
        coordinates: [lng, lat],
      },
    },
    { new: true }
  );

  // Also update pharmacy location if pharmacy role
  if (req.user!.role === 'pharmacy') {
    await Pharmacy.findOneAndUpdate(
      { userId: req.user!._id },
      {
        location: {
          type: 'Point',
          coordinates: [lng, lat],
        },
      }
    );
  }

  res.json({
    success: true,
    data: { user },
  });
});

export const updateSearchRadius = asyncHandler(async (req: Request, res: Response) => {
  const { radius } = req.body;

  if (!radius || radius < 1 || radius > 10) {
    throw new AppError('Radius must be between 1 and 10 km.', 400, ERROR_CODES.VALIDATION_ERROR);
  }

  const user = await User.findByIdAndUpdate(
    req.user!._id,
    { searchRadius: radius },
    { new: true }
  );

  res.json({
    success: true,
    data: { user },
  });
});

export const updateFcmToken = asyncHandler(async (req: Request, res: Response) => {
  const { fcmToken } = req.body;

  if (!fcmToken) {
    throw new AppError('FCM token is required.', 400, ERROR_CODES.VALIDATION_ERROR);
  }

  await User.findByIdAndUpdate(req.user!._id, { fcmToken });

  res.json({
    success: true,
    data: { message: 'FCM token updated.' },
  });
});
