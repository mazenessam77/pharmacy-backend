import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { AppError } from '../utils/AppError';
import { ERROR_CODES } from '../utils/constants';
import { toObjectId } from '../utils/objectId';
import { Order } from '../models/Order';
import { Pharmacy } from '../models/Pharmacy';
import { Driver } from '../models/Driver';
import { DriverLocation } from '../models/DriverLocation';
import { isDeliveryDriver } from '../middleware/authorizeDelivery';
import { toTrackingResource, toDriverCard } from '../serializers/delivery.serializer';
import * as deliveryService from '../services/delivery.service';
import { startSimulation } from '../services/deliverySimulator.service';

/** POST /api/deliveries/:orderId/assign  — pharmacy owner of the order, or admin. */
export const assignDelivery = asyncHandler(async (req: Request, res: Response) => {
  const order = await Order.findById(toObjectId(req.params.orderId));
  if (!order) throw new AppError('Order not found.', 404, ERROR_CODES.ORDER_NOT_FOUND);

  if (req.user!.role !== 'admin') {
    const pharmacy = await Pharmacy.findOne({ userId: req.user!._id }).select('_id');
    if (!pharmacy || !order.acceptedPharmacy || !order.acceptedPharmacy.equals(pharmacy._id)) {
      throw new AppError('Only the fulfilling pharmacy can assign a driver.', 403, ERROR_CODES.FORBIDDEN);
    }
  }

  const delivery = await deliveryService.assignDriver({
    orderId: req.params.orderId,
    driverId: req.body.driverId,
  });
  const driver = await Driver.findById(delivery.driverId);
  res.status(201).json({ success: true, data: toTrackingResource(delivery, driver) });
});

/** GET /api/deliveries/:orderId/tracking — full snapshot (participant only). */
export const getTracking = asyncHandler(async (req: Request, res: Response) => {
  const delivery = req.delivery!;
  const driver = delivery.driverId ? await Driver.findById(delivery.driverId) : null;
  res.json({ success: true, data: toTrackingResource(delivery, driver) });
});

/** GET /api/deliveries/:orderId/eta */
export const getEta = asyncHandler(async (req: Request, res: Response) => {
  const { eta, status } = req.delivery!;
  res.json({ success: true, data: { status, eta: eta?.updatedAt ? eta : null } });
});

/** GET /api/deliveries/:orderId/driver — public driver card. */
export const getDriver = asyncHandler(async (req: Request, res: Response) => {
  const delivery = req.delivery!;
  const driver = delivery.driverId ? await Driver.findById(delivery.driverId) : null;
  res.json({ success: true, data: driver ? toDriverCard(driver) : null });
});

/** GET /api/deliveries/:orderId/history — sampled GPS breadcrumbs. */
export const getHistory = asyncHandler(async (req: Request, res: Response) => {
  const fixes = await DriverLocation.find({ deliveryId: req.delivery!._id })
    .sort({ recordedAt: 1 })
    .limit(500)
    .lean();
  res.json({
    success: true,
    data: fixes.map((f) => ({
      lng: f.point.coordinates[0],
      lat: f.point.coordinates[1],
      heading: f.heading ?? null,
      speed: f.speed ?? null,
      recordedAt: f.recordedAt,
    })),
  });
});

/** POST /api/deliveries/:orderId/location — GPS ingest (assigned driver / admin). */
export const postLocation = asyncHandler(async (req: Request, res: Response) => {
  const delivery = req.delivery!;
  if (!(await isDeliveryDriver(req.user as any, delivery))) {
    throw new AppError('Only the assigned driver may post location.', 403, ERROR_CODES.FORBIDDEN);
  }
  await deliveryService.ingestLocation(delivery, {
    lng: req.body.lng,
    lat: req.body.lat,
    heading: req.body.heading,
    speed: req.body.speed,
    accuracy: req.body.accuracy,
    recordedAt: req.body.recordedAt ? new Date(req.body.recordedAt) : new Date(),
  });
  res.json({ success: true, data: { accepted: true } });
});

/** PATCH /api/deliveries/:orderId/status — advance state (assigned driver / admin). */
export const patchStatus = asyncHandler(async (req: Request, res: Response) => {
  const delivery = req.delivery!;
  if (!(await isDeliveryDriver(req.user as any, delivery))) {
    throw new AppError('Only the assigned driver may update status.', 403, ERROR_CODES.FORBIDDEN);
  }
  const updated = await deliveryService.updateStatus(delivery, req.body.status, req.body.reason);
  res.json({ success: true, data: toTrackingResource(updated, null) });
});

/** POST /api/deliveries/:orderId/simulate — dev/ops: drive a fake GPS stream (admin). */
export const simulateDelivery = asyncHandler(async (req: Request, res: Response) => {
  if (req.user!.role !== 'admin') {
    throw new AppError('Admin only.', 403, ERROR_CODES.FORBIDDEN);
  }
  startSimulation(req.delivery!._id.toString());
  res.json({ success: true, data: { started: true } });
});
