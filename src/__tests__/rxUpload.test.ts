/**
 * completeUpload — post-upload state + s3Key ownership. S3 access is mocked so
 * we can assert the controller's behavior in isolation:
 *   - the created prescription lands in REVIEW_REQUIRED (manual review, no queue)
 *   - a patient can only register keys under their own prefix
 *   - a key whose object doesn't exist is rejected
 */
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

jest.mock('../services/rxPipeline.service', () => ({
  presignPrescriptionUpload: jest.fn().mockResolvedValue({
    uploadUrl: 'https://s3.test/upload',
    s3Key: 'prescriptions/owner/xxx.jpg',
  }),
  prescriptionObjectExists: jest.fn(),
  presignPrescriptionView: jest.fn().mockResolvedValue('https://s3.test/view'),
}));

import app from '../app';
import { User } from '../models/User';
import { Prescription } from '../models/Prescription';
import { generateAccessToken } from '../utils/jwt';
import { prescriptionObjectExists } from '../services/rxPipeline.service';

jest.setTimeout(120_000);

let mongod: MongoMemoryServer;
let patientId: string;
let token: string;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
  const patient = await User.create({
    name: 'Uploader',
    email: 'uploader@test.dev',
    password: 'secret123',
    role: 'patient',
    location: { type: 'Point', coordinates: [31.2, 30.0] },
  });
  patientId = patient._id.toString();
  token = generateAccessToken(patientId, 'patient');
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

beforeEach(() => {
  (prescriptionObjectExists as jest.Mock).mockResolvedValue(true);
});

describe('POST /api/prescriptions/complete', () => {
  it('creates the prescription directly in REVIEW_REQUIRED (no queue)', async () => {
    const s3Key = `prescriptions/${patientId}/abc.jpg`;
    const res = await request(app)
      .post('/api/prescriptions/complete')
      .set('Authorization', `Bearer ${token}`)
      .send({ s3Key });

    expect(res.status).toBe(201);
    expect(res.body.data.prescription.status).toBe('REVIEW_REQUIRED');
    expect(res.body.data.prescription.queuedAt).toBeUndefined();

    const doc = await Prescription.findById(res.body.data.prescription._id);
    expect(doc!.status).toBe('REVIEW_REQUIRED');
  });

  it("rejects a key outside the patient's own prefix (403)", async () => {
    const res = await request(app)
      .post('/api/prescriptions/complete')
      .set('Authorization', `Bearer ${token}`)
      .send({ s3Key: 'prescriptions/someone-else/abc.jpg' });
    expect(res.status).toBe(403);
  });

  it('rejects a key whose object was never uploaded (404)', async () => {
    (prescriptionObjectExists as jest.Mock).mockResolvedValue(false);
    const res = await request(app)
      .post('/api/prescriptions/complete')
      .set('Authorization', `Bearer ${token}`)
      .send({ s3Key: `prescriptions/${patientId}/missing.jpg` });
    expect(res.status).toBe(404);
  });
});
