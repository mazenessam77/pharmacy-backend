import { Request, Response } from 'express';
import { Inventory } from '../models/Inventory';
import { Pharmacy } from '../models/Pharmacy';
import { asyncHandler } from '../utils/asyncHandler';
import { AppError } from '../utils/AppError';
import { getPagination } from '../utils/helpers';
import { ERROR_CODES, DEFAULT_PAGE, DEFAULT_LIMIT } from '../utils/constants';

const getPharmacyForUser = async (userId: string) => {
  const pharmacy = await Pharmacy.findOne({ userId });
  if (!pharmacy) {
    throw new AppError('Pharmacy profile not found.', 404, ERROR_CODES.PHARMACY_NOT_FOUND);
  }
  return pharmacy;
};

export const getInventory = asyncHandler(async (req: Request, res: Response) => {
  const pharmacy = await getPharmacyForUser(req.user!._id.toString());
  const page = parseInt(req.query.page as string) || DEFAULT_PAGE;
  const limit = parseInt(req.query.limit as string) || DEFAULT_LIMIT;
  const search = req.query.search as string;
  const skip = (page - 1) * limit;

  const filter: any = { pharmacyId: pharmacy._id };
  if (search) {
    filter.$text = { $search: search };
  }

  const [items, total] = await Promise.all([
    Inventory.find(filter)
      .populate('medicineId', 'name genericName category')
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit),
    Inventory.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: items,
    pagination: getPagination(page, limit, total),
  });
});

export const addInventoryItem = asyncHandler(async (req: Request, res: Response) => {
  const pharmacy = await getPharmacyForUser(req.user!._id.toString());
  const { medicineName, genericName, price, quantity, medicineId } = req.body;

  const item = await Inventory.create({
    pharmacyId: pharmacy._id,
    medicineName,
    genericName,
    price,
    quantity,
    medicineId,
    isAvailable: quantity > 0,
  });

  res.status(201).json({
    success: true,
    data: item,
  });
});

export const updateInventoryItem = asyncHandler(async (req: Request, res: Response) => {
  const pharmacy = await getPharmacyForUser(req.user!._id.toString());

  const item = await Inventory.findOneAndUpdate(
    { _id: req.params.id, pharmacyId: pharmacy._id },
    { ...req.body, updatedAt: new Date() },
    { new: true, runValidators: true }
  );

  if (!item) {
    throw new AppError('Inventory item not found.', 404, ERROR_CODES.INVENTORY_NOT_FOUND);
  }

  res.json({
    success: true,
    data: item,
  });
});

export const deleteInventoryItem = asyncHandler(async (req: Request, res: Response) => {
  const pharmacy = await getPharmacyForUser(req.user!._id.toString());

  const item = await Inventory.findOneAndDelete({
    _id: req.params.id,
    pharmacyId: pharmacy._id,
  });

  if (!item) {
    throw new AppError('Inventory item not found.', 404, ERROR_CODES.INVENTORY_NOT_FOUND);
  }

  res.json({
    success: true,
    data: { message: 'Item removed from inventory.' },
  });
});

export const bulkImport = asyncHandler(async (req: Request, res: Response) => {
  const pharmacy = await getPharmacyForUser(req.user!._id.toString());

  if (!req.file) {
    throw new AppError('CSV file is required.', 400, ERROR_CODES.VALIDATION_ERROR);
  }

  const csvContent = req.file.buffer.toString('utf-8');
  const lines = csvContent.split('\n').filter((line) => line.trim());

  if (lines.length < 2) {
    throw new AppError('CSV file is empty or has no data rows.', 400, ERROR_CODES.VALIDATION_ERROR);
  }

  const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
  const nameIdx = headers.indexOf('name') !== -1 ? headers.indexOf('name') : headers.indexOf('medicinename');
  const priceIdx = headers.indexOf('price');
  const quantityIdx = headers.indexOf('quantity');
  const genericIdx = headers.indexOf('genericname');

  if (nameIdx === -1 || priceIdx === -1) {
    throw new AppError('CSV must have "name" and "price" columns.', 400, ERROR_CODES.VALIDATION_ERROR);
  }

  const results = { imported: 0, errors: 0 };

  for (let i = 1; i < lines.length; i++) {
    try {
      const cols = lines[i].split(',').map((c) => c.trim());
      const medicineName = cols[nameIdx];
      const price = parseFloat(cols[priceIdx]);
      const quantity = quantityIdx !== -1 ? parseInt(cols[quantityIdx]) || 0 : 0;
      const genericName = genericIdx !== -1 ? cols[genericIdx] : undefined;

      if (!medicineName || isNaN(price)) {
        results.errors++;
        continue;
      }

      await Inventory.findOneAndUpdate(
        { pharmacyId: pharmacy._id, medicineName },
        {
          pharmacyId: pharmacy._id,
          medicineName,
          genericName,
          price,
          quantity,
          isAvailable: quantity > 0,
          updatedAt: new Date(),
        },
        { upsert: true, new: true }
      );

      results.imported++;
    } catch {
      results.errors++;
    }
  }

  res.json({
    success: true,
    data: results,
  });
});
