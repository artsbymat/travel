import type { PolicyType } from "@/generated/prisma/enums";

export interface OwnerVendorRecord {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    address: string | null;
    cityId: string | null;
    phone: string | null;
    email: string | null;
    logo: string | null;
    isActive: boolean;
    isHeld: boolean;
    legalName: string | null;
    npwp: string | null;
    siup: string | null;
    taxEnabled: boolean;
    taxRate: number | null;
    taxName: string | null;
    acceptCash: boolean;
    platformFeeRate: number | null;
    createdAt: string;
    updatedAt: string;
    city?: {
        id: string;
        name: string;
        province: { id: string; name: string };
    } | null;
}

export interface OwnerVendorUpdatePayload {
    name?: string;
    description?: string | null;
    address?: string | null;
    cityId?: string | null;
    phone?: string | null;
    email?: string | null;
    logo?: string | null;
    legalName?: string | null;
    npwp?: string | null;
    siup?: string | null;
    taxEnabled?: boolean;
    taxRate?: number | null;
    taxName?: string | null;
    acceptCash?: boolean;
}

export type VendorPolicyType =
    | "RESCHEDULE"
    | "CANCELLATION"
    | "REFUND"
    | "LUGGAGE"
    | "DEPARTURE"
    | "DISCLAIMER"
    | "OTHER";

export interface VendorPolicyRecord {
    id: string;
    vendorId: string;
    type: PolicyType;
    title: string;
    content: string;
    order: number;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface VendorPolicyCreatePayload {
    type: VendorPolicyType;
    title: string;
    content: string;
    order?: number;
    isActive?: boolean;
}

export interface VendorPolicyUpdatePayload {
    type?: VendorPolicyType;
    title?: string;
    content?: string;
    order?: number;
    isActive?: boolean;
}

export interface VendorRefundPolicyRecord {
    id: string;
    vendorId: string;
    hoursBeforeDeparture: number;
    refundPercentage: number;
    description: string | null;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface VendorRefundPolicyCreatePayload {
    hoursBeforeDeparture: number;
    refundPercentage: number;
    description?: string | null;
    isActive?: boolean;
}

export interface VendorRefundPolicyUpdatePayload {
    hoursBeforeDeparture?: number;
    refundPercentage?: number;
    description?: string | null;
    isActive?: boolean;
}
