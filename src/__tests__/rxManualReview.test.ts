/**
 * Manual prescription review — end-to-end workflow + object-level authorization.
 *
 * Runs against a real (in-memory) MongoDB. The prescription is a legacy
 * Cloudinary-style record (no s3Key) so no AWS access is needed: the image
 * endpoint redirects to the stored URL after the same authorization checks.
 */
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../app';
import { User } from '../models/User';
import { Pharmacy } from '../models/Pharmacy';
import { Prescription } from '../models/Prescription';
import { Order } from '../models/Order';
import { generateAccessToken } from '../utils/jwt';

jest.setTimeout(120_000); // first run may download the mongod binary

let mongod: MongoMemoryServer;

// Actors
let patientAToken: string;
let patientBToken: string;
let gizaPharmacyToken: string; // eligible: same governorate as the order
let cairoPharmacyToken: string; // NOT eligible
let gizaPharmacyId: string;

let prescriptionId: string;
let orderId: string;
let responseId: string;

const auth = (token: string) => ({ Authorization: `Bearer ${token}` });

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());

  const mkUser = (name: string, role: 'patient' | 'pharmacy') =>
    User.create({
      name,
      email: `${name.toLowerCase()}@test.dev`,
      password: 'secret123',
      role,
      location: { type: 'Point', coordinates: [31.2, 30.0] },
    });

  const [patientA, patientB, gizaUser, cairoUser, unverifiedUser] = await Promise.all([
    mkUser('PatientA', 'patient'),
    mkUser('PatientB', 'patient'),
    mkUser('GizaPharm', 'pharmacy'),
    mkUser('CairoPharm', 'pharmacy'),
    mkUser('UnverifiedPharm', 'pharmacy'),
  ]);

  const [gizaPharmacy] = await Promise.all([
    Pharmacy.create({
      userId: gizaUser._id,
      pharmacyName: 'Giza Pharmacy',
      governorate: 'Giza',
      isVerified: true,
      location: { type: 'Point', coordinates: [31.2, 30.0] },
    }),
    Pharmacy.create({
      userId: cairoUser._id,
      pharmacyName: 'Cairo Pharmacy',
      governorate: 'Cairo',
      isVerified: true,
      location: { type: 'Point', coordinates: [31.24, 30.05] },
    }),
    // Same governorate but NOT verified — must be excluded from broadcasts.
    Pharmacy.create({
      userId: unverifiedUser._id,
      pharmacyName: 'Unverified Pharmacy',
      governorate: 'Giza',
      isVerified: false,
      location: { type: 'Point', coordinates: [31.21, 30.01] },
    }),
  ]);
  gizaPharmacyId = gizaPharmacy._id.toString();

  patientAToken = generateAccessToken(patientA._id.toString(), 'patient');
  patientBToken = generateAccessToken(patientB._id.toString(), 'patient');
  gizaPharmacyToken = generateAccessToken(gizaUser._id.toString(), 'pharmacy');
  cairoPharmacyToken = generateAccessToken(cairoUser._id.toString(), 'pharmacy');

  // Legacy-style stored prescription (already REVIEW_REQUIRED, plain https URL).
  const prescription = await Prescription.create({
    patientId: patientA._id,
    imageUrl: 'https://res.cloudinary.com/demo/image/upload/rx.jpg',
    status: 'REVIEW_REQUIRED',
    extractedText: '',
    extractedMeds: [],
  });
  prescriptionId = prescription._id.toString();
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

describe('Prescription-only order creation', () => {
  it('rejects an order with neither medicines nor prescription', async () => {
    const res = await request(app)
      .post('/api/orders')
      .set(auth(patientAToken))
      .send({ medicines: [], governorate: 'Giza', paymentMethod: 'cash' });
    expect(res.status).toBe(400);
  });

  it('accepts a prescription-only order (no typed medicines)', async () => {
    const res = await request(app)
      .post('/api/orders')
      .set(auth(patientAToken))
      .send({
        medicines: [],
        prescriptionId,
        governorate: 'Giza',
        deliveryType: 'delivery',
        paymentMethod: 'cash',
      });
    expect(res.status).toBe(201);
    orderId = res.body.data.order._id;
    expect(res.body.data.order.prescriptionId).toBe(prescriptionId);
    // Marketplace broadcast: only VERIFIED pharmacies in the governorate
    // (Giza has one verified + one unverified; Cairo is out of area).
    expect(res.body.data.pharmaciesNotified).toBe(1);
  });

  it("rejects using another patient's prescription", async () => {
    const res = await request(app)
      .post('/api/orders')
      .set(auth(patientBToken))
      .send({ medicines: [], prescriptionId, governorate: 'Giza', paymentMethod: 'cash' });
    expect(res.status).toBeGreaterThanOrEqual(400);
  });
});

describe('Object-level prescription authorization', () => {
  it('owner patient can view their prescription', async () => {
    const res = await request(app).get(`/api/prescriptions/${prescriptionId}`).set(auth(patientAToken));
    expect(res.status).toBe(200);
    expect(res.body.data.imageUrl).toContain('https://');
  });

  it('another patient gets a uniform 404 (no existence leak)', async () => {
    const res = await request(app).get(`/api/prescriptions/${prescriptionId}`).set(auth(patientBToken));
    expect(res.status).toBe(404);
  });

  it('eligible pharmacy (order open in its governorate) can view — trimmed shape', async () => {
    const res = await request(app).get(`/api/prescriptions/${prescriptionId}`).set(auth(gizaPharmacyToken));
    expect(res.status).toBe(200);
    expect(res.body.data.imageUrl).toContain('https://');
    // Never expose owner/internal fields to pharmacies.
    expect(res.body.data.patientId).toBeUndefined();
    expect(res.body.data.s3Key).toBeUndefined();
    expect(res.body.data.extractedText).toBeUndefined();
  });

  it('non-eligible pharmacy (other governorate) gets 403', async () => {
    const res = await request(app).get(`/api/prescriptions/${prescriptionId}`).set(auth(cairoPharmacyToken));
    expect(res.status).toBe(403);
  });

  it('eligible pharmacy can fetch the image (redirect to stored URL)', async () => {
    const res = await request(app)
      .get(`/api/prescriptions/${prescriptionId}/image`)
      .set(auth(gizaPharmacyToken))
      .redirects(0);
    expect(res.status).toBe(302);
    expect(res.headers.location).toContain('cloudinary');
  });

  it('non-eligible pharmacy cannot fetch the image', async () => {
    const res = await request(app)
      .get(`/api/prescriptions/${prescriptionId}/image`)
      .set(auth(cairoPharmacyToken))
      .redirects(0);
    expect(res.status).toBe(403);
  });
});

describe('Pharmacy response → patient selection (full loop)', () => {
  it('eligible pharmacy submits an offer composed from the prescription', async () => {
    const res = await request(app)
      .post(`/api/orders/${orderId}/responses`)
      .set(auth(gizaPharmacyToken))
      .send({
        availableMeds: [
          { name: 'Panadol Extra', quantity: 2, price: 55, inStock: true },
          { name: 'Augmentin 1g', quantity: 1, price: 120, inStock: false },
        ],
        alternatives: [
          { originalName: 'Augmentin 1g', alternativeName: 'Megamox 1g', alternativePrice: 95 },
        ],
        totalPrice: 110,
        deliveryFee: 10,
        estimatedTime: '30 mins',
        notes: 'Augmentin is out of stock — Megamox is the same active ingredient.',
      });
    expect(res.status).toBe(201);
    responseId = res.body.data.response?._id ?? res.body.data._id;
    const offer = res.body.data.response ?? res.body.data;
    expect(offer.availableMeds[0].quantity).toBe(2);
    expect(offer.notes).toContain('Megamox');
    // one of two meds out of stock -> derived availability
    expect(offer.availability).toBe('partial');

    const order = await Order.findById(orderId);
    expect(order!.status).toBe('offered');
  });

  it('patient accepts the offer → order confirmed with that pharmacy', async () => {
    const res = await request(app)
      .put(`/api/orders/${orderId}/responses/${responseId}/accept`)
      .set(auth(patientAToken));
    expect(res.status).toBe(200);

    const order = await Order.findById(orderId);
    expect(order!.status).toBe('confirmed');
    expect(order!.acceptedPharmacy!.toString()).toBe(gizaPharmacyId);
  });

  it('after confirmation the accepted pharmacy retains access', async () => {
    const res = await request(app).get(`/api/prescriptions/${prescriptionId}`).set(auth(gizaPharmacyToken));
    expect(res.status).toBe(200);
  });

  it('after confirmation an unrelated pharmacy is still denied', async () => {
    const res = await request(app).get(`/api/prescriptions/${prescriptionId}`).set(auth(cairoPharmacyToken));
    expect(res.status).toBe(403);
  });
});
