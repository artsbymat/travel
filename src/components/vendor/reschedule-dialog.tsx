/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { useTripStore } from "@/stores/tripStore";
import dayjs from "dayjs";

export default function RescheduleDialog() {
  const {
    rescheduleDialogOpen, selectedTrip, loading, error,
    setRescheduleDialogOpen, rescheduleTrip,
  } = useTripStore();

  const [vehicles, setVehicles] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [form, setForm] = useState({
    newDepartureTime: "",
    newArrivalTime: "",
    reason: "",
    newVehicleId: "",
    newDriverId: "",
  });

  useEffect(() => {
    if (rescheduleDialogOpen && selectedTrip) {
      setForm({
        newDepartureTime: dayjs(selectedTrip.departureTime).add(1, "day").format("YYYY-MM-DDTHH:mm"),
        newArrivalTime: selectedTrip.arrivalTime
          ? dayjs(selectedTrip.arrivalTime).add(1, "day").format("YYYY-MM-DDTHH:mm")
          : "",
        reason: "",
        newVehicleId: "",
        newDriverId: "",
      });
      fetch("/api/vendor/fleet").then(r => r.json()).then(d => {
        if (Array.isArray(d)) setVehicles(d.filter((v: any) => v.status === "ACTIVE"));
      }).catch(() => {});
      fetch("/api/vendor/drivers").then(r => r.json()).then(d => {
        if (Array.isArray(d)) setDrivers(d);
      }).catch(() => {});
    }
  }, [rescheduleDialogOpen, selectedTrip]);

  const handleChange = (e: any) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    if (!selectedTrip || !form.newDepartureTime || !form.reason) return;
    await rescheduleTrip(selectedTrip.id, {
      newDepartureTime: new Date(form.newDepartureTime).toISOString(),
      newArrivalTime: form.newArrivalTime ? new Date(form.newArrivalTime).toISOString() : undefined,
      reason: form.reason,
      newVehicleId: form.newVehicleId || undefined,
      newDriverId: form.newDriverId || undefined,
    });
  };

  if (!rescheduleDialogOpen || !selectedTrip) return null;

  return (
    <div className="trip-modal-overlay" onClick={() => setRescheduleDialogOpen(false)}>
      <div className="trip-modal" onClick={e => e.stopPropagation()}>
        <div className="trip-modal-header">
          <h2 className="trip-modal-title">🔄 Reschedule Trip</h2>
          <button className="trip-btn trip-btn-ghost trip-btn-icon" onClick={() => setRescheduleDialogOpen(false)}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="trip-modal-body">
            {/* Current Trip Info */}
            <div className="trip-route-visual" style={{ marginBottom: "1.5rem" }}>
              <div className="trip-route-point">
                <div className="trip-route-city">{selectedTrip.origin} → {selectedTrip.destination}</div>
                <div className="trip-route-detail">
                  Jadwal lama: {dayjs(selectedTrip.departureTime).format("DD MMM YYYY, HH:mm")}
                </div>
              </div>
            </div>

            <div className="trip-form">
              <div className="trip-form-row">
                <div className="trip-form-group">
                  <label className="trip-form-label">Waktu Berangkat Baru *</label>
                  <input className="trip-form-input" type="datetime-local" name="newDepartureTime" value={form.newDepartureTime} onChange={handleChange} required />
                </div>
                <div className="trip-form-group">
                  <label className="trip-form-label">Waktu Tiba Baru</label>
                  <input className="trip-form-input" type="datetime-local" name="newArrivalTime" value={form.newArrivalTime} onChange={handleChange} />
                </div>
              </div>
              <div className="trip-form-row">
                <div className="trip-form-group">
                  <label className="trip-form-label">Ganti Kendaraan (opsional)</label>
                  <select className="trip-form-select" name="newVehicleId" value={form.newVehicleId} onChange={handleChange}>
                    <option value="">Tetap sama</option>
                    {vehicles.map(v => (
                      <option key={v.id} value={v.id}>{v.brand} {v.model} ({v.licensePlate})</option>
                    ))}
                  </select>
                </div>
                <div className="trip-form-group">
                  <label className="trip-form-label">Ganti Driver (opsional)</label>
                  <select className="trip-form-select" name="newDriverId" value={form.newDriverId} onChange={handleChange}>
                    <option value="">Tetap sama</option>
                    {drivers.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="trip-form-group">
                <label className="trip-form-label">Alasan Reschedule *</label>
                <textarea className="trip-form-textarea" name="reason" value={form.reason} onChange={handleChange} placeholder="Jelaskan alasan reschedule..." required />
              </div>

              <div className="trip-conflict-warning" style={{ background: "#fef9c3", borderColor: "#facc15" }}>
                <span className="trip-conflict-icon">ℹ️</span>
                <div className="trip-conflict-text" style={{ color: "#713f12" }}>
                  Trip lama akan ditandai sebagai &quot;Dijadwal Ulang&quot; dan trip baru akan dibuat.
                  Booking yang ada akan otomatis dipindahkan ke trip baru.
                </div>
              </div>

              {error && <div className="trip-form-error">❌ {error}</div>}
            </div>
          </div>
          <div className="trip-modal-footer">
            <button type="button" className="trip-btn trip-btn-secondary" onClick={() => setRescheduleDialogOpen(false)}>Batal</button>
            <button type="submit" className="trip-btn trip-btn-primary" disabled={loading}>
              {loading ? "Memproses..." : "Reschedule Trip"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
