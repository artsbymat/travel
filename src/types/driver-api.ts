import { Role } from "@prisma/client";

export interface Driver {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  role: Role; // Should always be DRIVER
  vendorId?: string | null;
  createdAt: string;
  updatedAt: string;
  vendor?: {
    id: string;
    name: string;
  } | null;
  _count?: {
    driverTrips: number;
  };
}

export interface DriverCreatePayload {
  name: string;
  email?: string;
  phone?: string;
  password?: string;
  vendorId: string;
}

export interface DriverUpdatePayload {
  name?: string;
  email?: string;
  phone?: string;
  password?: string;
  vendorId?: string;
}
