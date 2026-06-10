import axios from 'axios';
import api from '@/lib/api';
import { Prescription, PaginatedResponse } from '@/types';

export const prescriptionService = {
  /**
   * Async pipeline upload: presign → PUT straight to S3 → complete.
   * `complete` creates the Prescription (status UPLOADED) and queues it for
   * background processing. Returns the same `{ data: { prescription } }`
   * shape as the old multipart endpoint, so callers are unchanged.
   */
  upload: async (file: File) => {
    const presign = await api.post('/prescriptions/presign', { contentType: file.type });
    const { uploadUrl, s3Key } = presign.data.data;

    // Raw axios on purpose: the presigned URL is the only auth — an
    // Authorization header would break the S3 SigV4 signature.
    await axios.put(uploadUrl, file, { headers: { 'Content-Type': file.type } });

    return api.post('/prescriptions/complete', { s3Key });
  },

  /** Legacy multipart upload (Cloudinary) — kept for fallback/dev. */
  uploadLegacy: (file: File) => {
    const formData = new FormData();
    formData.append('image', file);        // must match upload.single('image') on the backend
    return api.post('/prescriptions/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  scan: (file: File) => {
    const formData = new FormData();
    formData.append('image', file);        // must match upload.single('image') on the backend
    return api.post('/prescriptions/scan', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  getAll: (params?: { page?: number; limit?: number }) =>
    api.get<PaginatedResponse<Prescription>>('/prescriptions', { params }),

  getById: (id: string) =>
    api.get<{ success: boolean; data: Prescription }>(`/prescriptions/${id}`),

  /** Re-queue a FAILED prescription (same S3 object, no re-upload). */
  resubmit: (id: string) =>
    api.post<{ success: boolean; data: { prescription: Prescription } }>(`/prescriptions/${id}/resubmit`),

  verify: (id: string, extractedMeds?: { name: string; confidence: number }[]) =>
    api.put(`/prescriptions/${id}/verify`, { extractedMeds }),
};
