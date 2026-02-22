export type Role = 'CUSTOMER' | 'EXECUTOR' | 'ADMIN';
export type UserStatus = 'PENDING' | 'ACTIVE' | 'REJECTED' | 'BLOCKED';
export type Specialization =
  | 'WINDOWS'
  | 'DOORS'
  | 'CEILINGS'
  | 'CONDITIONERS'
  | 'BLINDS'
  | 'FURNITURE';

export interface User {
  id: string;
  role: Role;
  phone: string;
  email?: string;
  fullName: string;
  organization?: string;
  city: string;
  address?: string;
  messengers?: {
    whatsapp?: string;
    telegram?: string;
  };
  photo?: string;
  inn?: string;
  ogrn?: string;
  aboutDescription?: string;
  website?: string;
  rating: number;
  completedOrders: number;
  status: UserStatus;
  isPhoneVerified: boolean;
  createdAt: string;
  updatedAt: string;
  executorProfile?: ExecutorProfile;
  balance?: Balance;
  subscription?: Subscription;
}

export interface ExecutorProfile {
  id: string;
  userId: string;
  region: string;
  specializations: Specialization[];
  shortDescription?: string;
  fullDescription?: string;
  bio?: string;
  workPhotos: string[];
  isSelfEmployed?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Balance {
  id: string;
  userId: string;
  amount: string;
  bonusAmount: string;
  createdAt: string;
  updatedAt: string;
}

export interface Subscription {
  id: string;
  userId: string;
  tariffType: 'STANDARD' | 'COMFORT' | 'PREMIUM';
  expiresAt: string;
  specializationCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface RegisterData {
  role: Role;
  phone: string;
  email?: string;
  password: string;
  fullName: string;
  organization?: string;
  city: string;
  address?: string;
  messengers?: {
    whatsapp?: string;
    telegram?: string;
  };
  inn?: string;
  ogrn?: string;
  agreeToTerms: boolean;
}

export interface LoginData {
  phone: string;
  password: string;
}

// Order types
export type OrderStatus = 'PUBLISHED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'ARCHIVED';
export type PaymentMethod = 'CASH' | 'CARD' | 'BANK';

export interface Order {
  id: string;
  orderNumber?: number;
  customerId: string;
  executorId?: string;
  category: Specialization;
  title: string;
  description: string;
  region: string;
  address: string;
  latitude?: number;
  longitude?: number;
  startDate: string;
  endDate?: string;
  budget: string;
  budgetType: string;
  paymentMethod: PaymentMethod;
  files: string[];
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
  workStartedAt?: string;  // Когда исполнитель приступил к работе
  closedAt?: string;
  hasViewed?: boolean;  // Исполнитель уже просматривал этот заказ
  customer?: {
    id: string;
    fullName: string;
    organization?: string;
    city: string;
    rating: number;
    completedOrders: number;
    phone?: string;
    email?: string;
    messengers?: any;
  };
  executor?: {
    id: string;
    fullName: string;
    phone?: string;
    email?: string;
    rating: number;
    completedOrders: number;
    executorProfile?: ExecutorProfile;
  };
  responses?: Response[];
  _count?: {
    responses: number;
  };
}

export interface Response {
  id: string;
  orderId: string;
  executorId: string;
  commissionPaid: string;
  tariffType: 'STANDARD' | 'COMFORT' | 'PREMIUM';
  status: string;
  createdAt: string;
  acceptedAt?: string;
  rejectedAt?: string;
  executor?: {
    id: string;
    fullName: string;
    photo?: string;
    rating: number;
    completedOrders: number;
    executorProfile?: ExecutorProfile;
  };
  order?: {
    id: string;
    title: string;
    status: string;
  };
}

export interface CreateOrderData {
  category: Specialization;
  title: string;
  description: string;
  region: string;
  address: string;
  latitude?: number;
  longitude?: number;
  startDate: Date | string;
  endDate?: Date | string;
  budget: number;
  budgetType?: string;
  paymentMethod: PaymentMethod;
  files?: string[];
}

export interface OrderFilters {
  category?: Specialization;
  region?: string;
  minBudget?: number;
  maxBudget?: number;
  status?: OrderStatus;
  sortBy?: 'createdAt' | 'startDate';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

// Review types
export type ReviewStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface Review {
  id: string;
  orderId: string;
  reviewerId: string;
  revieweeId: string;
  rating: number;
  comment: string;
  status: ReviewStatus;
  moderationNote?: string;
  moderatedBy?: string;
  moderatedAt?: string;
  createdAt: string;
  updatedAt: string;
  reviewer?: {
    id: string;
    fullName: string;
    photo?: string;
    role: 'CUSTOMER' | 'EXECUTOR';
  };
  reviewee?: {
    id: string;
    fullName: string;
    photo?: string;
    role: 'CUSTOMER' | 'EXECUTOR';
  };
  order?: {
    id: string;
    title: string;
    category?: Specialization;
  };
}

export interface CreateReviewData {
  orderId: string;
  rating: number;
  comment: string;
}

export interface ReviewStats {
  total: number;
  averageRating: number;
  distribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
}

