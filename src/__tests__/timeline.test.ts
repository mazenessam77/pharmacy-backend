/**
 * Activity Timeline — authorization, patient isolation, cursor pagination,
 * type filtering, invalid input, and empty/edge behavior against in-memory Mongo.
 */
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../app';
import { User } from '../models/User';
import { Order } from '../models/Order';
import { Prescription } from '../models/Prescription';
import { Notification } from '../models/Notification';
import { SavedBasket } from '../models/SavedBasket';
import { generateAccessToken } from '../utils/jwt';

jest.setTimeout(120_000);

let mongod: MongoMemoryServer;
let patientAToken: string;
let patientBToken: string;
let pharmacyToken: string;
let patientAId: mongoose.Types.ObjectId;

const at = (minsAgo: number) => new Date(Date.now() - minsAgo * 60_000);
const get = (token: string, qs = '') =>
  request(app).get(`/api/timeline${qs}`).set('Authorization', `Bearer ${token}`);

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
  const [a, b, ph] = await Promise.all([
    mkUser('TimelineA', 'patient'),
    mkUser('TimelineB', 'patient'),
    mkUser('TimelinePharm', 'pharmacy'),
  ]);
  patientAId = a._id;
  patientAToken = generateAccessToken(a._id.toString(), 'patient');
  patientBToken = generateAccessToken(b._id.toString(), 'patient');
  pharmacyToken = generateAccessToken(ph._id.toString(), 'pharmacy');

  // Patient A's history (timestamps forced via collection writes so createdAt
  // is controlled — mongoose sets timestamps on create, so insert directly).
  const orders = Order.collection;
  const oid = () => new mongoose.Types.ObjectId();
  const orderIds = [oid(), oid(), oid()];
  await orders.insertMany([
    // delivered order: created 100m ago, delivered 10m ago
    {
      _id: orderIds[0], patientId: a._id, medicines: [{ name: 'Panadol', quantity: 1 }],
      governorate: 'Giza', status: 'delivered', deliveryType: 'delivery', paymentMethod: 'cash',
      createdAt: at(100), updatedAt: at(10), deliveredAt: at(10),
    },
    // cancelled order: created 90m ago, cancelled 50m ago
    {
      _id: orderIds[1], patientId: a._id, medicines: [{ name: 'Brufen', quantity: 2 }],
      governorate: 'Giza', status: 'cancelled', deliveryType: 'delivery', paymentMethod: 'cash',
      cancelReason: 'Changed my mind', createdAt: at(90), updatedAt: at(50),
    },
    // pending prescription-only order: created 5m ago
    {
      _id: orderIds[2], patientId: a._id, medicines: [],
      governorate: 'Giza', status: 'pending', deliveryType: 'delivery', paymentMethod: 'cash',
      createdAt: at(5), updatedAt: at(5),
    },
  ] as any);

  await Prescription.collection.insertOne({
    patientId: a._id, imageUrl: 'https://res.cloudinary.com/demo/rx.jpg',
    status: 'REVIEW_REQUIRED', extractedMeds: [], createdAt: at(7), updatedAt: at(7),
  } as any);

  await SavedBasket.collection.insertOne({
    patientId: a._id, name: 'Weekly meds',
    items: [{ medicineId: oid(), quantity: 2 }], createdAt: at(60), updatedAt: at(60),
  } as any);

  await Notification.collection.insertMany([
    { userId: a._id, type: 'new_offer', title: 'New Offer Received', body: 'ezaby offered 120 EGP',
      data: { orderId: orderIds[0].toString() }, isRead: true, createdAt: at(80), updatedAt: at(80) },
    { userId: a._id, type: 'order_status', title: 'Offer accepted', body: "You accepted ezaby's offer.",
      data: { orderId: orderIds[0].toString(), status: 'confirmed' }, isRead: true, createdAt: at(70), updatedAt: at(70) },
    { userId: a._id, type: 'order_status', title: 'Order Status Updated', body: 'preparing',
      data: { orderId: orderIds[0].toString(), status: 'preparing' }, isRead: true, createdAt: at(40), updatedAt: at(40) },
    // delivered status notification must be SKIPPED (durable event covers it)
    { userId: a._id, type: 'order_status', title: 'Order Status Updated', body: 'delivered',
      data: { orderId: orderIds[0].toString(), status: 'delivered' }, isRead: true, createdAt: at(10), updatedAt: at(10) },
    // chat noise must never appear
    { userId: a._id, type: 'new_message', title: 'New Message', body: 'hi',
      data: { orderId: orderIds[0].toString() }, isRead: false, createdAt: at(9), updatedAt: at(9) },
  ] as any);

  // Patient B has one order — must NEVER appear in A's feed.
  await orders.insertOne({
    _id: oid(), patientId: b._id, medicines: [{ name: 'SecretMed', quantity: 1 }],
    governorate: 'Cairo', status: 'pending', deliveryType: 'delivery', paymentMethod: 'cash',
    createdAt: at(1), updatedAt: at(1),
  } as any);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

describe('authorization', () => {
  it('rejects unauthenticated requests', async () => {
    expect((await request(app).get('/api/timeline')).status).toBe(401);
  });
  it('rejects pharmacy users (patient-only feed)', async () => {
    expect((await get(pharmacyToken)).status).toBe(403);
  });
});

describe('event derivation', () => {
  it('returns the full story, newest first, with expected types', async () => {
    const res = await get(patientAToken, '?limit=50');
    expect(res.status).toBe(200);
    const events = res.body.data.events;
    const types = events.map((e: any) => e.type);

    expect(types).toContain('ORDER_CREATED');
    expect(types).toContain('ORDER_DELIVERED');
    expect(types).toContain('ORDER_CANCELLED');
    expect(types).toContain('PRESCRIPTION_UPLOADED');
    expect(types).toContain('BASKET_CREATED');
    expect(types).toContain('OFFER_RECEIVED');
    expect(types).toContain('OFFER_ACCEPTED');
    expect(types).toContain('ORDER_PREPARING');

    // newest-first ordering
    const ts = events.map((e: any) => new Date(e.timestamp).getTime());
    expect([...ts].sort((x, y) => y - x)).toEqual(ts);

    // delivered status notification deduped (only the durable ORDER_DELIVERED)
    expect(events.filter((e: any) => e.type === 'ORDER_DELIVERED')).toHaveLength(1);
    // chat notifications never leak into the feed
    expect(types).not.toContain('ORDER_STATUS_MESSAGE');
    expect(events.some((e: any) => /message/i.test(e.title))).toBe(false);

    const cancelled = events.find((e: any) => e.type === 'ORDER_CANCELLED');
    expect(cancelled.description).toContain('Changed my mind');
  });

  it('never leaks another patient’s activity (isolation)', async () => {
    const res = await get(patientAToken, '?limit=50');
    expect(JSON.stringify(res.body)).not.toContain('SecretMed');
    const resB = await get(patientBToken, '?limit=50');
    expect(resB.body.data.events).toHaveLength(1); // only B's own order
    expect(resB.body.data.events[0].type).toBe('ORDER_CREATED');
  });

  it('never exposes s3 keys or foreign ids', async () => {
    const raw = JSON.stringify((await get(patientAToken, '?limit=50')).body);
    expect(raw).not.toContain('s3Key');
    expect(raw).not.toContain('prescriptions/'); // no storage paths
  });
});

describe('cursor pagination', () => {
  it('walks the whole feed with limit=3 without duplicates or gaps', async () => {
    const all = (await get(patientAToken, '?limit=50')).body.data.events.map((e: any) => e.id);
    const seen: string[] = [];
    let cursor: string | null = null;
    let hasMore = true;
    let guard = 0;
    while (hasMore && guard++ < 20) {
      const qs: string = `?limit=3${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''}`;
      const page = (await get(patientAToken, qs)).body.data;
      seen.push(...page.events.map((e: any) => e.id));
      cursor = page.nextCursor;
      hasMore = page.hasMore;
    }
    expect(new Set(seen).size).toBe(seen.length); // no duplicates
    expect(seen).toEqual(all); // no gaps, same order
  });

  it('rejects an invalid cursor with 400', async () => {
    expect((await get(patientAToken, '?cursor=not-a-cursor')).status).toBe(400);
    const evil = Buffer.from(JSON.stringify({ t: 'zzz', k: 1 })).toString('base64url');
    expect((await get(patientAToken, `?cursor=${evil}`)).status).toBe(400);
  });

  it('clamps and validates limit/type', async () => {
    expect((await get(patientAToken, '?limit=999')).status).toBe(400); // zod max 50
    expect((await get(patientAToken, '?type=hacks')).status).toBe(400);
  });
});

describe('type filtering', () => {
  it('?type=orders returns only order lifecycle events', async () => {
    const events = (await get(patientAToken, '?type=orders&limit=50')).body.data.events;
    expect(events.length).toBeGreaterThan(0);
    expect(events.every((e: any) => e.type.startsWith('ORDER_'))).toBe(true);
  });
  it('?type=prescriptions returns only prescription events', async () => {
    const events = (await get(patientAToken, '?type=prescriptions&limit=50')).body.data.events;
    expect(events).toHaveLength(1);
    expect(events[0].type).toBe('PRESCRIPTION_UPLOADED');
  });
});

describe('empty timeline', () => {
  it('a brand-new patient gets an empty feed with hasMore=false', async () => {
    const fresh = await User.create({
      name: 'FreshPatient', email: 'fresh@test.dev', password: 'secret123',
      role: 'patient', location: { type: 'Point', coordinates: [31.2, 30.0] },
    });
    const token = generateAccessToken(fresh._id.toString(), 'patient');
    const res = await get(token);
    expect(res.status).toBe(200);
    expect(res.body.data.events).toEqual([]);
    expect(res.body.data.hasMore).toBe(false);
    expect(res.body.data.nextCursor).toBeNull();
  });
});
