/**
 * Reorder context (review-flow prefill) — object-level authz, delivered-only,
 * prescription handling, and no leakage. The actual re-submission reuses
 * POST /api/orders (covered by rxManualReview.test.ts), so this focuses on the
 * new read-only endpoint's guarantees.
 */
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../app';
import { User } from '../models/User';
import { Pharmacy } from '../models/Pharmacy';
import { Order } from '../models/Order';
import { OrderResponse } from '../models/OrderResponse';
import { Prescription } from '../models/Prescription';
import { generateAccessToken } from '../utils/jwt';

jest.setTimeout(120_000);
let mongod: MongoMemoryServer;
let aToken: string, bToken: string, phToken: string;
let delivered: mongoose.Types.ObjectId, cancelled: mongoose.Types.ObjectId, rxDelivered: mongoose.Types.ObjectId;

const get = (t: string, id: string) =>
  request(app).get(`/api/orders/${id}/reorder-context`).set('Authorization', `Bearer ${t}`);

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
  const mk = (n: string, r: 'patient' | 'pharmacy') =>
    User.create({ name: n, email: `${n}@t.dev`, password: 'secret123', role: r, location: { type: 'Point', coordinates: [31, 30] } });
  const [a, b, phu] = await Promise.all([mk('RA', 'patient'), mk('RB', 'patient'), mk('RPh', 'pharmacy')]);
  aToken = generateAccessToken(a._id.toString(), 'patient');
  bToken = generateAccessToken(b._id.toString(), 'patient');
  phToken = generateAccessToken(phu._id.toString(), 'pharmacy');
  const ph = await Pharmacy.create({ userId: phu._id, pharmacyName: 'ezaby', governorate: 'Giza', isVerified: true, location: { type: 'Point', coordinates: [31, 30] } });
  const rx = await Prescription.create({ patientId: a._id, imageUrl: 'https://c/rx.jpg', status: 'REVIEW_REQUIRED', extractedMeds: [] });

  const d = await Order.create({ patientId: a._id, medicines: [{ name: 'Brufen', quantity: 1 }], governorate: 'Giza', deliveryType: 'delivery', paymentMethod: 'cash', status: 'delivered', deliveredAt: new Date() });
  const resp = await OrderResponse.create({ orderId: d._id, pharmacyId: ph._id, availableMeds: [{ name: 'Brufen 400mg', quantity: 2, price: 40, inStock: true }, { name: 'Vitamin D', quantity: 1, price: 90, inStock: false }], totalPrice: 80, deliveryFee: 15, status: 'accepted' });
  d.acceptedPharmacy = ph._id; d.acceptedResponse = resp._id; await d.save();
  delivered = d._id;

  const c = await Order.create({ patientId: a._id, medicines: [{ name: 'Panadol', quantity: 1 }], governorate: 'Giza', deliveryType: 'delivery', paymentMethod: 'cash', status: 'cancelled', cancelReason: 'x' });
  cancelled = c._id;

  const rd = await Order.create({ patientId: a._id, medicines: [], prescriptionId: rx._id, governorate: 'Giza', deliveryType: 'delivery', paymentMethod: 'cash', status: 'delivered', deliveredAt: new Date() });
  rxDelivered = rd._id;
});
afterAll(async () => { await mongoose.disconnect(); await mongod.stop(); });

describe('reorder context', () => {
  it('prefills a delivered order from the accepted offer (in-stock only)', async () => {
    const res = await get(aToken, delivered.toString());
    expect(res.status).toBe(200);
    expect(res.body.data.deliveryType).toBe('delivery');
    expect(res.body.data.governorate).toBe('Giza');
    // in-stock offer line prefilled; out-of-stock (Vitamin D) excluded
    expect(res.body.data.medicines).toEqual([{ name: 'Brufen 400mg', quantity: 2 }]);
    expect(res.body.data.hadPrescription).toBe(false);
    expect(res.body.data.pharmacyName).toBe('ezaby');
  });

  it('flags a delivered PRESCRIPTION order so the UI can ask reuse-vs-upload', async () => {
    const res = await get(aToken, rxDelivered.toString());
    expect(res.status).toBe(200);
    expect(res.body.data.hadPrescription).toBe(true);
    expect(typeof res.body.data.prescriptionId).toBe('string');
  });

  it('rejects reordering a CANCELLED order (400)', async () => {
    const res = await get(aToken, cancelled.toString());
    expect(res.status).toBe(400);
  });

  it("rejects reordering another patient's order (404)", async () => {
    expect((await get(bToken, delivered.toString())).status).toBe(404);
  });

  it('rejects a pharmacy user (patient-only)', async () => {
    expect((await get(phToken, delivered.toString())).status).toBe(403);
  });

  it('never leaks patientId / s3Key / internal ids', async () => {
    const raw = JSON.stringify((await get(aToken, delivered.toString())).body);
    expect(raw).not.toContain('patientId');
    expect(raw).not.toContain('s3Key');
    expect(raw).not.toContain('acceptedResponse');
  });

  it('leaves the original order unchanged (read-only)', async () => {
    await get(aToken, delivered.toString());
    const still = await Order.findById(delivered);
    expect(still!.status).toBe('delivered');
  });
});
