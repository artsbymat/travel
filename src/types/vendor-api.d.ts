export interface VendorCreatePayload {
  name: string;
  slug: string;
  description?: string;
  address?: string;
  cityId?: string;
  phone?: string;
  email?: string;
  logo?: string;
  isActive?: boolean;
  isHeld?: boolean;
  legalName?: string;
  npwp?: string;
  siup?: string;
  taxEnabled?: boolean;
  taxRate?: number;
  taxName?: string;
  acceptCash?: boolean;
  platformFeeRate?: number;
  bankName?: string;
  bankAccountNo?: string;
  bankAccountName?: string;
}

export interface VendorUpdatePayload {
  name?: string;
  slug?: string;
  description?: string;
  address?: string;
  cityId?: string;
  phone?: string;
  email?: string;
  logo?: string;
  isActive?: boolean;
  isHeld?: boolean;
  legalName?: string;
  npwp?: string;
  siup?: string;
  taxEnabled?: boolean;
  taxRate?: number;
  taxName?: string;
  acceptCash?: boolean;
  platformFeeRate?: number;
  bankName?: string;
  bankAccountNo?: string;
  bankAccountName?: string;
}

export interface Vendor {
  id: string;
  name: string;
  slug: string;
  description?: string;
  address?: string;
  cityId?: string;
  phone?: string;
  email?: string;
  logo?: string;
  isActive: boolean;
  isHeld: boolean;
  legalName?: string;
  npwp?: string;
  siup?: string;
  taxEnabled: boolean;
  taxRate?: number;
  taxName?: string;
  acceptCash: boolean;
  platformFeeRate?: number;
  bankName?: string;
  bankAccountNo?: string;
  bankAccountName?: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    users: number;
    vehicles: number;
  };
}
