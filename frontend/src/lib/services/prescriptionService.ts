import axios from 'axios';
import api from '@/lib/api';
import { Prescription, PaginatedResponse } from '@/types';

export const prescriptionService = {
  /**
   * Upload: presign → PUT straight to S3 → complete.
   * `complete` creates the Prescription (status REVIEW_REQUIRED — no automated
   * analysis; pharmacies review the image manually with the order).
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

  getAll: (params?: { page?: number; limit?: number }) =>
    api.get<PaginatedResponse<Prescription>>('/prescriptions', { params }),

  /**
   * Works for the owning patient and for pharmacies that received an order
   * carrying this prescription. `data.imageUrl` is a short-lived signed URL.
   */
  getById: (id: string) =>
    api.get<{ success: boolean; data: Prescription }>(`/prescriptions/${id}`),
};
