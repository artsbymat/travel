/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { useTripStore } from "@/stores/tripStore";
import { TRIP_STATUS_COLORS } from "@/types/trip";
import type { TripStatus } from "@/types/trip";
import dayjs from "dayjs";

export default function TripDetailDrawer() {
  const {
    selectedTrip, detailDrawerOpen, loading,
    setDetailDrawerOpen, setEditDialogOpen, setRescheduleDialogOpen,
    cancelTrip, duplicateTrip,
  } = useTripStore();

  const [cancelReason, setCancelReason] = useState("");
  const [showCancel, setShowCancel] = useState(false);

  if (!detailDrawerOpen || !selectedTrip) return null;

  const trip = selectedTrip;
  const statusColors = TRIP_STATUS_COLORS[trip.status as TripStatus] || TRIP_STATUS_COLORS.SCHEDULED;
  const seatsAvailable = trip.seats?.filter(s => s.status === "AVAILABLE").length || 0;
  const seatsBooked = trip.seats?.filter(s => s.status === "BOOKED").length || 0;
  const totalSeats = trip.seats?.length || 0;

  const handleCancel = async () => {
    await cancelTrip(trip.id, cancelReason);
    setShowCancel(false);
    setCancelReason("");
  };

  const handleDuplicate = async () => {
    await duplicateTrip(trip.id);
  };

  const formatPrice = (p: string | number) => {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(Number(p));
  };

  return (
    <>
      <div className="trip-drawer-overlay" onClick={() => setDetailDrawerOpen(false)} />
      <div className="trip-drawer">
        {/* Header */}
        <div className="trip-drawer-header">
          <div>
            <div className="trip-drawer-title">Detail Trip</div>
            <span className="trip-status-badge" style={{
              background: statusColors.bg + "20",
              color: statusColors.bg,
              marginTop: "0.35rem", display: "inline-flex",
            }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: statusColors.bg }} />
              {statusColors.label}
            </span>
          </div>
          <button className="trip-btn trip-btn-ghost trip-btn-icon" onClick={() => setDetailDrawerOpen(false)}>✕</button>
        </div>

        {/* Body */}
        <div className="trip-drawer-body">
          {/* Route */}
          <div className="trip-route-visual">
            <div className="trip-route-point">
              <div className="trip-route-city">{trip.origin}</div>
              {trip.originDetail && <div className="trip-route-detail">{trip.originDetail}</div>}
            </div>
            <div className="trip-route-arrow">→</div>
            <div className="trip-route-point" style={{ textAlign: "right" }}>
              <div className="trip-route-city">{trip.destination}</div>
              {trip.destinationDetail && <div className="trip-route-detail">{trip.destinationDetail}</div>}
            </div>
          </div>

          {/* Schedule */}
          <div className="trip-detail-section">
            <div className="trip-detail-section-title">Jadwal</div>
            <div className="trip-detail-grid">
              <div className="trip-detail-item">
                <span className="trip-detail-label">Berangkat</span>
                <span className="trip-detail-value">{dayjs(trip.departureTime).format("DD MMM YYYY, HH:mm")}</span>
              </div>
              <div className="trip-detail-item">
                <span className="trip-detail-label">Tiba</span>
                <span className="trip-detail-value">
                  {trip.arrivalTime ? dayjs(trip.arrivalTime).format("DD MMM YYYY, HH:mm") : "-"}
                </span>
              </div>
              {trip.durationMinutes && (
                <div className="trip-detail-item">
                  <span className="trip-detail-label">Durasi</span>
                  <span className="trip-detail-value">{Math.floor(trip.durationMinutes / 60)}j {trip.durationMinutes % 60}m</span>
                </div>
              )}
              {trip.bookingDeadline && (
                <div className="trip-detail-item">
                  <span className="trip-detail-label">Deadline Booking</span>
                  <span className="trip-detail-value">{dayjs(trip.bookingDeadline).format("DD MMM YYYY, HH:mm")}</span>
                </div>
              )}
            </div>
          </div>

          {/* Vehicle & Driver */}
          <div className="trip-detail-section">
            <div className="trip-detail-section-title">Kendaraan & Driver</div>
            <div className="trip-detail-grid">
              <div className="trip-detail-item">
                <span className="trip-detail-label">Kendaraan</span>
                <span className="trip-detail-value">
                  {trip.vehicle?.brand} {trip.vehicle?.model}
                </span>
                <span className="trip-detail-label" style={{ marginTop: 2 }}>
                  {trip.vehicle?.licensePlate} • {trip.vehicle?.color || ""}
                </span>
              </div>
              <div className="trip-detail-item">
                <span className="trip-detail-label">Driver</span>
                <span className="trip-detail-value">{trip.driver?.name || "Belum ditentukan"}</span>
                {trip.driver?.phone && <span className="trip-detail-label">{trip.driver.phone}</span>}
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className="trip-detail-section">
            <div className="trip-detail-section-title">Harga & Syarat</div>
            <div className="trip-detail-grid">
              <div className="trip-detail-item">
                <span className="trip-detail-label">Harga/Kursi</span>
                <span className="trip-detail-value">{formatPrice(trip.price)}</span>
              </div>
              <div className="trip-detail-item">
                <span className="trip-detail-label">Kapasitas</span>
                <span className="trip-detail-value">
                  {seatsBooked}/{totalSeats} terisi • {seatsAvailable} tersedia
                </span>
              </div>
              <div className="trip-detail-item">
                <span className="trip-detail-label">Min. Keberangkatan</span>
                <span className="trip-detail-value">{trip.minBooking || 1} kursi terisi</span>
              </div>
            </div>
          </div>

          {/* Seats Visual */}
          {trip.seats && trip.seats.length > 0 && (
            <div className="trip-detail-section">
              <div className="trip-detail-section-title">Denah Kursi</div>
              <div className="trip-seats-grid">
                {trip.seats.map(seat => (
                  <div
                    key={seat.id}
                    className={`trip-seat-chip trip-seat-${seat.status.toLowerCase()}`}
                    title={`${seat.seatNo} - ${seat.status}`}
                  >
                    {seat.seatNo}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bookings */}
          {trip.bookings && trip.bookings.length > 0 && (
            <div className="trip-detail-section">
              <div className="trip-detail-section-title">Daftar Booking ({trip.bookings.length})</div>
              <div className="trip-booking-list">
                {trip.bookings.map(b => (
                  <div key={b.id} className="trip-booking-card">
                    <div>
                      <div className="trip-booking-code">{b.bookingCode}</div>
                      <div className="trip-booking-name">{b.customerName}</div>
                      <div className="trip-booking-info">
                        {b.seatCount} kursi • {b.seats?.map(s => s.seatNo).join(", ")}
                      </div>
                    </div>
                    <div className="trip-booking-amount">{formatPrice(b.totalAmount)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reschedule Info */}
          {trip.rescheduledFrom && (
            <div className="trip-detail-section">
              <div className="trip-detail-section-title">Riwayat Reschedule</div>
              <div className="trip-conflict-warning" style={{ background: "#f0f9ff", borderColor: "#93c5fd" }}>
                <span className="trip-conflict-icon">🔄</span>
                <div className="trip-conflict-text" style={{ color: "#1e40af" }}>
                  Dijadwalkan ulang dari trip {(trip.rescheduledFrom as any)?.origin} → {(trip.rescheduledFrom as any)?.destination}
                  {trip.rescheduledReason && <div style={{ marginTop: 4 }}>Alasan: {trip.rescheduledReason}</div>}
                </div>
              </div>
            </div>
          )}

          {/* Notes */}
          {trip.notes && (
            <div className="trip-detail-section">
              <div className="trip-detail-section-title">Catatan</div>
              <div style={{ fontSize: "0.85rem", color: "#374151", lineHeight: 1.6 }}>{trip.notes}</div>
            </div>
          )}

          {/* Activity Log */}
          {trip.activities && trip.activities.length > 0 && (
            <div className="trip-detail-section">
              <div className="trip-detail-section-title">Log Aktivitas</div>
              <div className="trip-activity-list">
                {trip.activities.map(a => (
                  <div key={a.id} className="trip-activity-item">
                    <span className="trip-activity-dot" style={{
                      background: a.action === "CREATE" ? "#10b981" :
                        a.action === "CANCEL" ? "#ef4444" :
                        a.action === "RESCHEDULE" ? "#8b5cf6" : "#cbd5e1"
                    }} />
                    <div className="trip-activity-content">
                      <div className="trip-activity-action">{a.action}</div>
                      {a.description && <div className="trip-activity-desc">{a.description}</div>}
                      <div className="trip-activity-time">{dayjs(a.createdAt).format("DD MMM YYYY, HH:mm")}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Cancel Confirmation */}
          {showCancel && (
            <div className="trip-detail-section">
              <div className="trip-conflict-warning" style={{ background: "#fef2f2", borderColor: "#fca5a5" }}>
                <span className="trip-conflict-icon">🚨</span>
                <div style={{ flex: 1 }}>
                  <div className="trip-conflict-text" style={{ color: "#991b1b", marginBottom: 8 }}>
                    Yakin batalkan trip ini?
                  </div>
                  <textarea
                    className="trip-form-textarea"
                    placeholder="Alasan pembatalan..."
                    value={cancelReason}
                    onChange={e => setCancelReason(e.target.value)}
                    style={{ marginBottom: 8, minHeight: 60 }}
                  />
                  <div style={{ display: "flex", gap: 8 }}>
                    <button className="trip-btn trip-btn-danger trip-btn-sm" onClick={handleCancel} disabled={loading}>
                      {loading ? "..." : "Ya, Batalkan"}
                    </button>
                    <button className="trip-btn trip-btn-secondary trip-btn-sm" onClick={() => setShowCancel(false)}>Tidak</button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="trip-drawer-footer">
          {trip.status !== "CANCELLED" && trip.status !== "COMPLETED" && trip.status !== "RESCHEDULED" && (
            <>
              <button className="trip-btn trip-btn-primary trip-btn-sm" onClick={() => setEditDialogOpen(true)}>
                ✏️ Edit
              </button>
              <button className="trip-btn trip-btn-secondary trip-btn-sm" onClick={() => setRescheduleDialogOpen(true)}>
                🔄 Reschedule
              </button>
              <button className="trip-btn trip-btn-secondary trip-btn-sm" style={{ color: "#ef4444" }} onClick={() => setShowCancel(true)}>
                ❌ Batalkan
              </button>
            </>
          )}
          <button
            className="trip-btn trip-btn-secondary trip-btn-sm"
            onClick={handleDuplicate}
            disabled={loading || trip.vehicle?.status !== "ACTIVE"}
            title={trip.vehicle?.status !== "ACTIVE" ? "Kendaraan tidak aktif atau sedang maintenance" : "Duplikat trip ke hari berikutnya"}
          >
            📋 Duplikat
          </button>
        </div>
      </div>
    </>
  );
}
