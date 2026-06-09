import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { SavedBasket } from '../models/SavedBasket';
import { Medicine } from '../models/Medicine';
import { asyncHandler } from '../utils/asyncHandler';
import { AppError } from '../utils/AppError';
import { ERROR_CODES } from '../utils/constants';

/**
 * Validate + sanitise an incoming items array. Every medicineId is coerced to a
 * string primitive (so it can never smuggle a NoSQL operator) and checked
 * against the catalog; quantities are coerced to a positive integer. Phantom
 * ids are dropped. Returns clean `{ medicineId, quantity }` entries ready to
 * persist, or throws 404 if nothing valid remains.
 */
const resolveItems = async (
  rawItems: Array<{ medicineId: unknown; quantity?: unknown }>
): Promise<Array<{ medicineId: string; quantity: number }>> => {
  const ids = rawItems
    .map((it) => String(it.medicineId))
    .filter((id) => mongoose.Types.ObjectId.isValid(id));

  const found = await Medicine.find({ _id: { $in: ids }, isActive: true }).select('_id').lean();
  const valid = new Set(found.map((m) => String(m._id)));

  const items = rawItems
    .filter((it) => valid.has(String(it.medicineId)))
    .map((it) => ({
      medicineId: String(it.medicineId),
      quantity: Math.min(Math.max(parseInt(String(it.quantity), 10) || 1, 1), 99),
    }));

  if (items.length === 0) {
    throw new AppError('None of those medicines are in our catalog.', 404, ERROR_CODES.MEDICINE_NOT_FOUND);
  }
  return items;
};

// Medicine fields surfaced inside a basket item (no price/image — those are
// pharmacy-specific and resolved at order time).
const MEDICINE_PROJECT = {
  _id: '$$m._id',
  name: '$$m.name',
  genericName: '$$m.genericName',
  category: '$$m.category',
  requiresPrescription: '$$m.requiresPrescription',
  description: '$$m.description',
  isActive: '$$m.isActive',
};

/**
 * Read baskets matching `match` (always scoped to the owner by the caller),
 * joining full medicine details onto each item via $lookup so the client gets
 * everything in a single round-trip. Items come back as { quantity, medicine }.
 */
const aggregateBaskets = (match: Record<string, unknown>) =>
  SavedBasket.aggregate([
    { $match: match },
    { $sort: { createdAt: -1 } },
    {
      $lookup: {
        from: 'medicines',
        localField: 'items.medicineId',
        foreignField: '_id',
        as: 'medicineDetails',
      },
    },
    {
      $addFields: {
        items: {
          $map: {
            input: '$items',
            as: 'it',
            in: {
              quantity: '$$it.quantity',
              medicine: {
                $let: {
                  vars: {
                    m: {
                      $arrayElemAt: [
                        {
                          $filter: {
                            input: '$medicineDetails',
                            as: 'm',
                            cond: { $eq: ['$$m._id', '$$it.medicineId'] },
                          },
                        },
                        0,
                      ],
                    },
                  },
                  in: MEDICINE_PROJECT,
                },
              },
            },
          },
        },
      },
    },
    { $project: { medicineDetails: 0 } },
  ]);

/**
 * POST /api/baskets
 * Create a named basket of catalog medicines for the logged-in patient.
 */
export const createBasket = asyncHandler(async (req: Request, res: Response) => {
  const items = await resolveItems(req.body.items || []);

  const basket = await SavedBasket.create({
    patientId: req.user!._id,
    name: String(req.body.name).trim(),
    items,
  });

  const [data] = await aggregateBaskets({ _id: basket._id });
  res.status(201).json({ success: true, data });
});

/**
 * GET /api/baskets
 * List the logged-in patient's baskets, newest first, with medicine details
 * joined in via $lookup (covered by the {patientId, createdAt} index).
 */
export const getBaskets = asyncHandler(async (req: Request, res: Response) => {
  const patientId = new mongoose.Types.ObjectId(String(req.user!._id));
  const data = await aggregateBaskets({ patientId });
  res.json({ success: true, data });
});

/**
 * PATCH /api/baskets/:id
 * Rename a basket and/or replace its items (ownership enforced).
 */
export const updateBasket = asyncHandler(async (req: Request, res: Response) => {
  // String-coerce every value before it reaches the update/filter documents.
  const update: Record<string, unknown> = {};
  if (req.body.name !== undefined) update.name = String(req.body.name).trim();
  if (req.body.items !== undefined) update.items = await resolveItems(req.body.items);

  const basket = await SavedBasket.findOneAndUpdate(
    { _id: String(req.params.id), patientId: req.user!._id }, // ownership: only the owner's doc matches
    update,
    { new: true, runValidators: true }
  );

  if (!basket) {
    throw new AppError('Basket not found.', 404, ERROR_CODES.SAVED_BASKET_NOT_FOUND);
  }

  const [data] = await aggregateBaskets({ _id: basket._id });
  res.json({ success: true, data });
});

/**
 * DELETE /api/baskets/:id
 * Delete a basket. Ownership is enforced by scoping the query to the
 * authenticated patient — another user's id simply won't match (404).
 */
export const deleteBasket = asyncHandler(async (req: Request, res: Response) => {
  const basket = await SavedBasket.findOneAndDelete({
    _id: String(req.params.id),
    patientId: req.user!._id,
  });

  if (!basket) {
    throw new AppError('Basket not found.', 404, ERROR_CODES.SAVED_BASKET_NOT_FOUND);
  }

  res.json({ success: true, data: { _id: basket._id } });
});
