export interface OwnerUpdatePayload {
  name?: string;
  email?: string;
  phone?: string;
  vendorId?: string;
  password?: string;
}

export interface OwnerCreatePayload {
  name: string;
  email: string;
  phone?: string;
  vendorId: string;
}
