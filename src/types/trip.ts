/* eslint-disable @typescript-eslint/no-explicit-any */
export type TripStatus =
  | "SCHEDULED"
  | "ONGOING"
  | "COMPLETED"
  | "CANCELLED"
  | "RESCHEDULED"
  | "DELAYED"
  | "WAITING_DRIVER";

export type SeatStatus = "AVAILABLE" | "BOOKED" | "BROKEN" | "BLOCKED";

export interface TripVehicle {
  id: string;
  licensePlate: string;
  name: string | null;
  brand: string;
  model: string;
  capacity: number;
  color: string | null;
  seatLayout: any;
  status: string;
}

export interface TripDriver {
  id: string;
  name: string;
  phone: string | null;
  profile?: {
    photoUrl: string | null;
    simNumber: string | null;
  } | null;
}

export interface TripSeat {
  id: string;
  seatNo: string;
  row: number;
  column: number;
  status: SeatStatus;
  bookingId: string | null;
}

export interface TripBooking {
  id: string;
  bookingCode: string;
  customerName: string;
  customerPhone: string;
  seatCount: number;
  totalAmount: string;
  paymentStatus: string;
  status: string;
  createdAt: string;
  seats: { seatNo: string }[];
}

export interface TripActivity {
  id: string;
  action: string;
  description: string | null;
  oldData: any;
  newData: any;
  userId: string | null;
  createdAt: string;
}

export interface Trip {
  id: string;
  origin: string;
  destination: string;
  originDetail: string | null;
  destinationDetail: string | null;
  departureTime: string;
  arrivalTime: string | null;
  durationMinutes: number | null;
  price: string;
  amenities: string[];
  minBooking: number;
  bookingDeadline: string | null;
  status: TripStatus;
  notes: string | null;
  vehicleId: string;
  driverId: string | null;
  templateId: string | null;
  rescheduledFromId: string | null;
  rescheduledReason: string | null;
  createdAt: string;
  updatedAt: string;
  vehicle: TripVehicle;
  driver: TripDriver | null;
  seats: TripSeat[];
  bookings: TripBooking[];
  activities?: TripActivity[];
  rescheduledFrom?: Trip | null;
  rescheduledTo?: Trip | null;
  _count?: {
    bookings: number;
    seats: number;
  };
}

export interface TripCalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  backgroundColor: string;
  borderColor: string;
  textColor: string;
  classNames?: string[];
  extendedProps: {
    trip: Trip;
    status: TripStatus;
    origin: string;
    destination: string;
    driverName: string | null;
    vehicleName: string;
    seatsBooked: number;
    totalSeats: number;
  };
}

export interface CreateTripPayload {
  origin: string;
  destination: string;
  originDetail?: string;
  destinationDetail?: string;
  departureTime: string;
  arrivalTime?: string;
  durationMinutes?: number;
  vehicleId: string;
  driverId?: string;
  price: number;
  amenities?: string[];
  bookingDeadline?: string;
  notes?: string;
}

export interface UpdateTripPayload {
  departureTime?: string;
  arrivalTime?: string;
  durationMinutes?: number;
  vehicleId?: string;
  driverId?: string;
  price?: number;
  notes?: string;
  status?: TripStatus;
  bookingDeadline?: string;
}

export interface RescheduleTripPayload {
  newDepartureTime: string;
  newArrivalTime?: string;
  reason: string;
  newVehicleId?: string;
  newDriverId?: string;
}

export interface ConflictResult {
  hasConflict: boolean;
  vehicleConflicts: Trip[];
  driverConflicts: Trip[];
}

export const TRIP_STATUS_COLORS: Record<TripStatus, { bg: string; border: string; text: string; label: string }> = {
  SCHEDULED: { bg: "#3b82f6", border: "#2563eb", text: "#ffffff", label: "Terjadwal" },
  ONGOING: { bg: "#f59e0b", border: "#d97706", text: "#ffffff", label: "Berlangsung" },
  COMPLETED: { bg: "#10b981", border: "#059669", text: "#ffffff", label: "Selesai" },
  CANCELLED: { bg: "#ef4444", border: "#dc2626", text: "#ffffff", label: "Dibatalkan" },
  RESCHEDULED: { bg: "#8b5cf6", border: "#7c3aed", text: "#ffffff", label: "Dijadwal Ulang" },
  DELAYED: { bg: "#f97316", border: "#ea580c", text: "#ffffff", label: "Tertunda" },
  WAITING_DRIVER: { bg: "#06b6d4", border: "#0891b2", text: "#ffffff", label: "Menunggu Driver" },
};

export interface TripTemplateSchedule {
  id: string;
  templateId: string;
  vehicleId: string;
  driverId: string | null;
  dayOfWeek: "MONDAY" | "TUESDAY" | "WEDNESDAY" | "THURSDAY" | "FRIDAY" | "SATURDAY" | "SUNDAY";
  departureTime: string;
  priceOverride: string | null;
  isActive: boolean;
  vehicle?: TripVehicle;
  driver?: TripDriver | null;
}

export interface TripTemplate {
  id: string;
  vendorId: string;
  name: string;
  origin: string;
  destination: string;
  originDetail: string | null;
  destinationDetail: string | null;
  price: string;
  amenities: string[];
  minBooking: number;
  bookingDeadlineHours: number | null;
  notes: string | null;
  isActive: boolean;
  validFrom: string | null;
  validUntil: string | null;
  schedules: TripTemplateSchedule[];
}
