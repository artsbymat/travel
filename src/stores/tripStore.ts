/* eslint-disable @typescript-eslint/no-explicit-any */
import { create } from "zustand";
import type {
  Trip,
  TripCalendarEvent,
  CreateTripPayload,
  UpdateTripPayload,
  RescheduleTripPayload,
  ConflictResult,
  TripStatus,
} from "@/types/trip";
import { TRIP_STATUS_COLORS } from "@/types/trip";

interface TripStore {
  // State
  trips: Trip[];
  selectedTrip: Trip | null;
  calendarEvents: TripCalendarEvent[];
  loading: boolean;
  error: string | null;
  conflicts: ConflictResult | null;

  // Dialogs
  createDialogOpen: boolean;
  detailDrawerOpen: boolean;
  rescheduleDialogOpen: boolean;
  editDialogOpen: boolean;
  templateDrawerOpen: boolean;
  filters: { vehicleId: string; driverId: string };

  // Calendar defaults
  createDefaults: { start?: string; end?: string } | null;

  // Actions
  setCreateDialogOpen: (open: boolean, defaults?: { start?: string; end?: string }) => void;
  setDetailDrawerOpen: (open: boolean) => void;
  setRescheduleDialogOpen: (open: boolean) => void;
  setEditDialogOpen: (open: boolean) => void;
  setTemplateDrawerOpen: (open: boolean) => void;
  setSelectedTrip: (trip: Trip | null) => void;
  setFilters: (filters: { vehicleId: string; driverId: string }) => void;

  // API Actions
  fetchTrips: (start: string, end: string) => Promise<void>;
  fetchTripDetail: (id: string) => Promise<void>;
  createTrip: (payload: CreateTripPayload) => Promise<Trip | null>;
  updateTrip: (id: string, payload: UpdateTripPayload) => Promise<Trip | null>;
  rescheduleTrip: (id: string, payload: RescheduleTripPayload) => Promise<Trip | null>;
  cancelTrip: (id: string, reason?: string) => Promise<Trip | null>;
  duplicateTrip: (id: string) => Promise<Trip | null>;
  checkConflicts: (params: {
    vehicleId: string;
    driverId?: string;
    departureTime: string;
    arrivalTime?: string;
    durationMinutes?: number;
    excludeTripId?: string;
  }) => Promise<ConflictResult>;

  // Drag & Drop
  handleEventDrop: (tripId: string, newStart: string, newEnd: string) => Promise<void>;
  handleEventResize: (tripId: string, newStart: string, newEnd: string) => Promise<void>;
}

function tripToCalendarEvent(trip: Trip): TripCalendarEvent {
  const statusColors = TRIP_STATUS_COLORS[trip.status as TripStatus] || TRIP_STATUS_COLORS.SCHEDULED;
  const seatsBooked = trip.seats?.filter((s) => s.status === "BOOKED").length || 0;
  const totalSeats = trip.seats?.length || trip._count?.seats || 0;

  return {
    id: trip.id,
    title: `${trip.origin} → ${trip.destination}`,
    start: trip.departureTime,
    end:
      trip.arrivalTime ||
      new Date(
        new Date(trip.departureTime).getTime() +
        (trip.durationMinutes || 120) * 60000
      ).toISOString(),
    backgroundColor: statusColors.bg,
    borderColor: statusColors.border,
    textColor: statusColors.text,
    extendedProps: {
      trip,
      status: trip.status as TripStatus,
      origin: trip.origin,
      destination: trip.destination,
      driverName: trip.driver?.name || null,
      vehicleName: trip.vehicle
        ? `${trip.vehicle.brand} ${trip.vehicle.model} (${trip.vehicle.licensePlate})`
        : "",
      seatsBooked,
      totalSeats,
    },
    classNames: [`trip-event-status-${trip.status.toLowerCase()}`],
  };
}

export const useTripStore = create<TripStore>((set, get) => ({
  // Initial State
  trips: [],
  selectedTrip: null,
  calendarEvents: [],
  loading: false,
  error: null,
  conflicts: null,

  createDialogOpen: false,
  detailDrawerOpen: false,
  rescheduleDialogOpen: false,
  editDialogOpen: false,
  templateDrawerOpen: false,
  createDefaults: null,
  filters: { vehicleId: "", driverId: "" },

  // Dialog actions
  setCreateDialogOpen: (open, defaults) =>
    set({ createDialogOpen: open, createDefaults: defaults || null }),

  setDetailDrawerOpen: (open) => set({ detailDrawerOpen: open }),
  setRescheduleDialogOpen: (open) => set((state) => ({ 
    rescheduleDialogOpen: open,
    detailDrawerOpen: open ? false : state.detailDrawerOpen
  })),
  setEditDialogOpen: (open) => set((state) => ({ 
    editDialogOpen: open,
    detailDrawerOpen: open ? false : state.detailDrawerOpen
  })),
  setTemplateDrawerOpen: (open) => set({ templateDrawerOpen: open }),
  setSelectedTrip: (trip) => set({ selectedTrip: trip }),
  setFilters: (filters) => set({ filters }),

  // Fetch trips for calendar
  fetchTrips: async (start, end) => {
    const { filters } = get();
    set({ loading: true, error: null });
    try {
      let url = `/api/vendor/trips?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`;
      if (filters.vehicleId) url += `&vehicleId=${filters.vehicleId}`;
      if (filters.driverId) url += `&driverId=${filters.driverId}`;

      const res = await fetch(url);
      if (!res.ok) throw new Error("Gagal mengambil data trip");
      const trips: Trip[] = await res.json();
      const calendarEvents = trips.map(tripToCalendarEvent);
      set({ trips, calendarEvents, loading: false });
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },

  // Fetch single trip detail
  fetchTripDetail: async (id) => {
    try {
      const res = await fetch(`/api/vendor/trips/${id}`);
      if (!res.ok) throw new Error("Gagal mengambil detail trip");
      const trip: Trip = await res.json();
      set({ selectedTrip: trip });
    } catch (err: any) {
      set({ error: err.message });
    }
  },

  // Create trip
  createTrip: async (payload) => {
    set({ loading: true, error: null });
    try {
      const res = await fetch("/api/vendor/trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        set({ error: data.error || "Gagal membuat trip", loading: false });
        return null;
      }
      // Optimistic update
      const { trips, calendarEvents } = get();
      const newEvent = tripToCalendarEvent(data);
      set({
        trips: [...trips, data],
        calendarEvents: [...calendarEvents, newEvent],
        loading: false,
        createDialogOpen: false,
      });
      return data;
    } catch (err: any) {
      set({ error: err.message, loading: false });
      return null;
    }
  },

  // Update trip
  updateTrip: async (id, payload) => {
    set({ loading: true, error: null });
    try {
      const res = await fetch(`/api/vendor/trips/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        set({ error: data.error || "Gagal mengupdate trip", loading: false });
        return null;
      }
      // Update in list
      const { trips, calendarEvents } = get();
      const updatedTrips = trips.map((t) => (t.id === id ? data : t));
      const updatedEvents = calendarEvents.map((e) =>
        e.id === id ? tripToCalendarEvent(data) : e
      );
      set({
        trips: updatedTrips,
        calendarEvents: updatedEvents,
        selectedTrip: data,
        loading: false,
        editDialogOpen: false,
      });
      return data;
    } catch (err: any) {
      set({ error: err.message, loading: false });
      return null;
    }
  },

  // Reschedule trip
  rescheduleTrip: async (id, payload) => {
    set({ loading: true, error: null });
    try {
      const res = await fetch(`/api/vendor/trips/${id}/reschedule`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        set({ error: data.error || "Gagal reschedule", loading: false });
        return null;
      }
      // Update list: mark old as rescheduled, add new
      const { trips, calendarEvents } = get();
      const updatedTrips = trips.map((t) =>
        t.id === id ? { ...t, status: "RESCHEDULED" as TripStatus } : t
      );
      updatedTrips.push(data);
      const updatedEvents = updatedTrips.map(tripToCalendarEvent);
      set({
        trips: updatedTrips,
        calendarEvents: updatedEvents,
        loading: false,
        rescheduleDialogOpen: false,
        detailDrawerOpen: false,
      });
      return data;
    } catch (err: any) {
      set({ error: err.message, loading: false });
      return null;
    }
  },

  // Cancel trip
  cancelTrip: async (id, reason) => {
    set({ loading: true, error: null });
    try {
      const res = await fetch(`/api/vendor/trips/${id}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      const data = await res.json();
      if (!res.ok) {
        set({ error: data.error || "Gagal membatalkan trip", loading: false });
        return null;
      }
      const { trips, calendarEvents } = get();
      const updatedTrips = trips.map((t) => (t.id === id ? data : t));
      const updatedEvents = calendarEvents.map((e) =>
        e.id === id ? tripToCalendarEvent(data) : e
      );
      set({
        trips: updatedTrips,
        calendarEvents: updatedEvents,
        selectedTrip: data,
        loading: false,
      });
      return data;
    } catch (err: any) {
      set({ error: err.message, loading: false });
      return null;
    }
  },

  // Duplicate trip
  duplicateTrip: async (id) => {
    set({ loading: true, error: null });
    try {
      const res = await fetch(`/api/vendor/trips/${id}/duplicate`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        set({ error: data.error || "Gagal duplikasi trip", loading: false });
        return null;
      }
      const { trips, calendarEvents } = get();
      set({
        trips: [...trips, data],
        calendarEvents: [...calendarEvents, tripToCalendarEvent(data)],
        loading: false,
      });
      return data;
    } catch (err: any) {
      set({ error: err.message, loading: false });
      return null;
    }
  },

  // Check conflicts
  checkConflicts: async (params) => {
    try {
      const res = await fetch("/api/vendor/trips/conflicts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });
      const data = await res.json();
      set({ conflicts: data });
      return data;
    } catch {
      const noConflict: ConflictResult = {
        hasConflict: false,
        vehicleConflicts: [],
        driverConflicts: [],
      };
      set({ conflicts: noConflict });
      return noConflict;
    }
  },

  // Drag & Drop: Move event
  handleEventDrop: async (tripId, newStart, newEnd) => {
    const { updateTrip } = get();
    await updateTrip(tripId, {
      departureTime: newStart,
      arrivalTime: newEnd,
    });
  },

  // Drag & Drop: Resize event
  handleEventResize: async (tripId, newStart, newEnd) => {
    const { updateTrip } = get();
    const depTime = new Date(newStart);
    const arrTime = new Date(newEnd);
    const durationMinutes = Math.round(
      (arrTime.getTime() - depTime.getTime()) / 60000
    );
    await updateTrip(tripId, {
      departureTime: newStart,
      arrivalTime: newEnd,
      durationMinutes,
    });
  },
}));
