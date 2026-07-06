// ── Auth ──
export interface User {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'patient' | 'pharmacy' | 'admin';
  avatar?: string;
  location?: { type: string; coordinates: [number, number] };
  address?: string;
  searchRadius: number;
  isActive: boolean;
  isBanned: boolean;
  googleId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  success: boolean;
  data: { accessToken: string; refreshToken: string; user: User };
}

export interface ApiError {
  success: false;
  error: { message: string; code: string };
}

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  phone?: string;
  role: 'patient' | 'pharmacy';
  pharmacyName?: string;
  license?: string;
  location?: { lat: number; lng: number };
  address?: string;
  workingHours?: { open: string; close: string };
}

// ── Pharmacy ──
export interface Pharmacy {
  _id: string;
  userId: string | User;
  pharmacyName: string;
  license: string;
  licenseImage?: string;
  governorate: string;
  location: { type: string; coordinates: [number, number] };
  workingHours: { open: string; close: string };
  rating: number;
  totalReviews: number;
  isVerified: boolean;
  isOpen: boolean;
  verifiedAt?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface NearbyPharmacy extends Pharmacy {
  distance: number;
}

// ── Medicine ──
export interface Medicine {
  _id: string;
  name: string;
  genericName?: string;
  category?: string;
  requiresPrescription: boolean;
  description?: string;
  alternatives?: string[];
  isActive: boolean;
}

// ── Saved Medications (favourites / quick reorder) ──
export type ReminderFrequency = 'none' | 'daily' | 'weekly' | 'monthly';

export interface SavedMedication {
  _id: string;
  patientId: string;
  medicineId: Medicine; // populated by the API
  notes?: string;
  reminderFrequency: ReminderFrequency;
  createdAt: string;
  updatedAt: string;
}

// ── Saved Baskets (reusable medicine groups for one-click requests) ──
export interface SavedBasketItem {
  medicine: Medicine; // joined via $lookup by the API
  quantity: number;
}

export interface SavedBasket {
  _id: string;
  patientId: string;
  name: string;
  items: SavedBasketItem[];
  createdAt: string;
  updatedAt: string;
}

// ── Order ──
export type OrderStatus =
  | 'pending'
  | 'offered'
  | 'confirmed'
  | 'preparing'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled';

export interface OrderMedicine {
  name: string;
  quantity: number;
  medicineId?: string;
}

export interface Order {
  _id: string;
  patientId: string | User;
  medicines: OrderMedicine[];
  prescriptionId?: string | Prescription;
  patientLocation: { type: string; coordinates: [number, number] };
  status: OrderStatus;
  deliveryType: 'delivery' | 'pickup';
  paymentMethod: 'cash' | 'instapay';
  acceptedPharmacy?: string | Pharmacy;
  acceptedResponse?: string | OrderResponse;
  notes?: string;
  cancelReason?: string;
  deliveredAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrderData {
  medicines: { name: string; quantity: number; medicineId?: string }[];
  prescriptionId?: string;
  governorate: string;
  deliveryType: 'delivery' | 'pickup';
  paymentMethod: 'cash' | 'instapay';
  notes?: string;
  patientLocation?: { lat: number; lng: number };
}

// ── Order Response (Offer) ──
export type OfferAvailability = 'full' | 'partial' | 'none';

export interface OrderResponse {
  _id: string;
  orderId: string;
  pharmacyId: string | Pharmacy;
  availableMeds: { name: string; quantity?: number; price: number; inStock: boolean }[];
  alternatives: { originalName: string; alternativeName: string; alternativePrice: number }[];
  totalPrice: number;
  deliveryFee: number;
  distanceKm?: number;
  estimatedTime: string;
  notes?: string;
  availability?: OfferAvailability;
  status: 'offered' | 'accepted' | 'rejected' | 'expired';
  createdAt: string;
  updatedAt: string;
}

export interface SubmitOfferData {
  availableMeds: { name: string; quantity?: number; price: number; inStock: boolean }[];
  alternatives?: { originalName: string; alternativeName: string; alternativePrice: number }[];
  totalPrice: number;
  deliveryFee: number;
  estimatedTime: string;
  notes?: string;
  availability?: OfferAvailability;
}

// ── Prescription ──
// Pharmacies viewing an order's prescription receive a trimmed shape
// (_id, imageUrl, doctorName, createdAt) — hence the optional owner fields.
export interface Prescription {
  _id: string;
  patientId?: string;
  imageUrl: string;
  extractedText?: string;
  extractedMeds?: { name: string; confidence: number }[];
  isVerified?: boolean;
  doctorName?: string;
  s3Key?: string;
  // REVIEW_REQUIRED (awaiting manual pharmacy review) is the post-upload
  // state; the others are legacy statuses from the retired auto pipeline.
  status?: PrescriptionStatus;
  queuedAt?: string;
  processingStartedAt?: string;
  processedAt?: string;
  failedAt?: string;
  errorDetails?: string;
  processingNotes?: string;
  createdAt: string;
  updatedAt?: string;
}

export type PrescriptionStatus =
  | 'UPLOADED'
  | 'QUEUED'
  | 'PROCESSING'
  | 'PROCESSED'
  | 'FAILED'
  | 'REVIEW_REQUIRED';


// ── Message ──
export type MessageType = 'text' | 'image' | 'alternative';

export interface AlternativeData {
  originalMedicine: string;
  suggestedMedicine: string;
  suggestedPrice: number;
  status?: 'pending' | 'accepted' | 'rejected';
}

export interface Message {
  _id: string;
  orderId: string;
  senderId: string | User;
  receiverId: string | User;
  senderRole: 'patient' | 'pharmacy';
  content?: string;
  messageType: MessageType;
  imageUrl?: string;
  alternativeData?: AlternativeData;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
}

// ── Notification ──
export type NotificationType =
  | 'new_offer'
  | 'order_confirmed'
  | 'order_status'
  | 'new_message'
  | 'new_order'
  | 'medicine_available'
  | 'pharmacy_verified'
  | 'system';

export interface Notification {
  _id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: any;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
}

// ── Inventory ──
export interface InventoryItem {
  _id: string;
  pharmacyId: string;
  medicineId?: string;
  medicineName: string;
  genericName?: string;
  price: number;
  quantity: number;
  isAvailable: boolean;
  createdAt: string;
  updatedAt: string;
}

// ── Review ──
export interface Review {
  _id: string;
  patientId: string | User;
  pharmacyId: string;
  orderId: string;
  rating: number;
  comment?: string;
  createdAt: string;
  updatedAt: string;
}

// ── Admin ──
export interface AdminStats {
  totalPatients: number;
  totalPharmacies: number;
  totalOrders: number;
  todayOrders: number;
  deliveredOrders: number;
}

// ── Pagination ──
export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}
