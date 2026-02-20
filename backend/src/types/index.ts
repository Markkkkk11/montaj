import { Request } from 'express';

export interface AuthRequest extends Request {
  user?: any;
}

export interface RegisterData {
  role: 'CUSTOMER' | 'EXECUTOR';
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

export interface SMSCodeData {
  phone: string;
  code: string;
}

export interface UpdateProfileData {
  fullName?: string;
  organization?: string;
  city?: string;
  address?: string;
  email?: string;
  messengers?: {
    whatsapp?: string;
    telegram?: string;
  };
  inn?: string;
  ogrn?: string;
}

export interface UpdateExecutorProfileData {
  region?: string;
  specializations?: string[];
  shortDescription?: string;
  fullDescription?: string;
  isSelfEmployed?: boolean;
}

export interface JWTPayload {
  userId: string;
  role: string;
}

