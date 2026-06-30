import { Request, Response, NextFunction } from 'express';
import { Delivery, DeliveryDocument } from '../models/Delivery';
import { Driver } from '../models/Driver';
import { Pharmacy } from '../models/Pharmacy';
import { AppError } from '../utils/AppError';
import { ERROR_CODES } from '../utils/constants';
import { toObjectId } from '../utils/objectId';
import { IUser } from '../types';

type AuthedUser = IUser & { _id: any };

/**
 * A user may read a delivery iff they are a participant: the order's patient,
 * the assigned driver, the fulfilling pharmacy's owner, or an admin. This is the
 * core guarantee against location leakage / IDOR.
 */
export async function canAccessDelivery(user: AuthedUser, delivery: DeliveryDocument): Promise<boolean> {
  if (user.role === 'admin') return true;
  if (delivery.patientId.equals(user._id)) return true;

  if (user.role === 'pharmacy') {
    const pharmacy = await Pharmacy.findOne({ userId: user._id }).select('_id');
    if (pharmacy && delivery.pharmacyId.equals(pharmacy._id)) return true;
  }

  if (delivery.driverId) {
    const driver = await Driver.findById(delivery.driverId).select('userId');
    if (driver?.userId && driver.userId.equals(user._id)) return true;
  }

  return false;
}

/** Is this user the assigned driver (or an admin)? Required for writes (status, GPS). */
export async function isDeliveryDriver(user: AuthedUser, delivery: DeliveryDocument): Promise<boolean> {
  if (user.role === 'admin') return true;
  if (!delivery.driverId) return false;
  const driver = await Driver.findById(delivery.driverId).select('userId');
  return !!(driver?.userId && driver.userId.equals(user._id));
}

/**
 * Express guard for routes scoped to `/deliveries/:orderId/...`. Loads the
 * delivery, enforces participant access, and attaches it to `req.delivery`.
 */
export const authorizeDelivery = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // toObjectId rejects any non-ObjectId id (objects/operators/invalid) with a
    // 400 before the value can reach the query.
    const delivery = await Delivery.findOne({ orderId: toObjectId(req.params.orderId) });
    if (!delivery) {
      throw new AppError('Delivery not found.', 404, ERROR_CODES.DELIVERY_NOT_FOUND);
    }
    const ok = await canAccessDelivery(req.user as AuthedUser, delivery);
    if (!ok) {
      throw new AppError('You are not allowed to access this delivery.', 403, ERROR_CODES.FORBIDDEN);
    }
    req.delivery = delivery;
    next();
  } catch (err) {
    next(err);
  }
};
