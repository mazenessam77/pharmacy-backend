import { Types } from 'mongoose';

export interface IUser {
  _id: Types.ObjectId;
  name: string;
  email: string;
  password: string;
  phone?: string;
  role: 'patient' | 'pharmacy' | 'admin';
  avatar?: string;
  location: {
    type: string;
    coordinates: number[];
  };
  address?: string;
  searchRadius: number;
  fcmToken?: string;
  isActive: boolean;
  isBanned: boolean;
  googleId?: string;
  refreshToken?: string;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  createdAt: Date;
}

export interface IPharmacy {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  pharmacyName: string;
  license?: string;
  licenseImage?: string;
  location: {
    type: string;
    coordinates: number[];
  };
  workingHours: {
    open?: string;
    close?: string;
  };
  rating: number;
  totalReviews: number;
  governorate: string;
  isVerified: boolean;
  isOpen: boolean;
  verifiedAt?: Date;
  rejectionReason?: string;
  createdAt: Date;
}

export interface IOrder {
  _id: Types.ObjectId;
  patientId: Types.ObjectId;
  medicines: {
    name: string;
    quantity: number;
    medicineId?: Types.ObjectId;
  }[];
  prescriptionId?: Types.ObjectId;
  governorate: string;
  patientLocation?: {
    type: string;
    coordinates: number[];
  };
  status: 'pending' | 'offered' | 'confirmed' | 'preparing' | 'out_for_delivery' | 'delivered' | 'cancelled';
  deliveryType: 'delivery' | 'pickup';
  paymentMethod: 'cash' | 'instapay';
  acceptedPharmacy?: Types.ObjectId;
  acceptedResponse?: Types.ObjectId;
  notes?: string;
  cancelReason?: string;
  deliveredAt?: Date;
  createdAt: Date;
}

export interface IOrderResponse {
  _id: Types.ObjectId;
  orderId: Types.ObjectId;
  pharmacyId: Types.ObjectId;
  availableMeds: {
    name: string;
    price: number;
    inStock: boolean;
  }[];
  alternatives: {
    originalName: string;
    alternativeName: string;
    alternativePrice: number;
  }[];
  totalPrice: number;
  deliveryFee: number;
  distanceKm?: number;
  estimatedTime?: string;
  status: 'offered' | 'accepted' | 'rejected' | 'expired';
  createdAt: Date;
}

export interface IPrescription {
  _id: Types.ObjectId;
  patientId: Types.ObjectId;
  imageUrl: string;
  extractedText?: string;
  extractedMeds: {
    name: string;
    confidence: number;
  }[];
  isVerified: boolean;
  doctorName?: string;
  createdAt: Date;
}

export interface IMessage {
  _id: Types.ObjectId;
  orderId: Types.ObjectId;
  senderId: Types.ObjectId;
  receiverId: Types.ObjectId;
  senderRole: 'patient' | 'pharmacy';
  content?: string;
  messageType: 'text' | 'image' | 'alternative';
  imageUrl?: string;
  alternativeData?: {
    originalMedicine: string;
    suggestedMedicine: string;
    suggestedPrice: number;
    status: 'pending' | 'accepted' | 'rejected';
  };
  isRead: boolean;
  createdAt: Date;
}

export interface IMedicine {
  _id: Types.ObjectId;
  name: string;
  genericName?: string;
  category?: string;
  requiresPrescription: boolean;
  description?: string;
  alternatives: Types.ObjectId[];
  isActive: boolean;
  createdAt: Date;
}

export interface IInventory {
  _id: Types.ObjectId;
  pharmacyId: Types.ObjectId;
  medicineId?: Types.ObjectId;
  medicineName: string;
  genericName?: string;
  price: number;
  quantity: number;
  isAvailable: boolean;
  updatedAt: Date;
}

export interface IReview {
  _id: Types.ObjectId;
  patientId: Types.ObjectId;
  pharmacyId: Types.ObjectId;
  orderId: Types.ObjectId;
  rating: number;
  comment?: string;
  createdAt: Date;
}

export interface INotification {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  type: 'new_offer' | 'order_confirmed' | 'order_status' | 'new_message' | 'new_order' | 'medicine_available' | 'pharmacy_verified' | 'system';
  title: string;
  body: string;
  data?: Record<string, any>;
  isRead: boolean;
  createdAt: Date;
}

export interface PaginationResult {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  pagination?: PaginationResult;
  error?: {
    message: string;
    code: string;
    stack?: string;
  };
}
