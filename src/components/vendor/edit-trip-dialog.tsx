/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { useTripStore } from "@/stores/tripStore";
import dayjs from "dayjs";

export default function EditTripDialog() {
  const { editDialogOpen, selectedTrip, loading, error, setEditDialogOpen, updateTrip } = useTripStore();

  const [vehicles, setVehicles] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [form, setForm] = useState<any>({});

  useEffect(() => {
    if (editDialogOpen && selectedTrip) {
      setForm({
        departureTime: dayjs(selectedTrip.departureTime).format("YYYY-MM-DDTHH:mm"),
        arrivalTime: selectedTrip.arrivalTime ? dayjs(selectedTrip.arrivalTime).format("YYYY-MM-DDTHH:mm") : "",
        durationMinutes: selectedTrip.durationMinutes || 120,
        vehicleId: selectedTrip.vehicleId,
        driverId: selectedTrip.driverId || "",
        price: selectedTrip.price,
        notes: selectedTrip.notes || "",
        status: selectedTrip.status,
        bookingDeadline: selectedTrip.bookingDeadline ? dayjs(selectedTrip.bookingDeadline).format("YYYY-MM-DDTHH:mm") : "",
        origin: selectedTrip.origin,
        destination: selectedTrip.destination,
        minBooking: selectedTrip.minBooking || 1,
      });
      fetch("/api/vendor/fleet").then(r => r.json()).then(d => { if (Array.isArray(d)) setVehicles(d.filter((v: any) => v.status === "ACTIVE")); }).catch(() => {});
      fetch("/api/vendor/drivers").then(r => r.json()).then(d => { if (Array.isArray(d)) setDrivers(d); }).catch(() => {});
    }
  }, [editDialogOpen, selectedTrip]);

  const handleChange = (e: any) => setForm((f: any) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    if (!selectedTrip) return;
    const payload: any = {};
    if (form.departureTime) payload.departureTime = new Date(form.departureTime).toISOString();
    if (form.arrivalTime) payload.arrivalTime = new Date(form.arrivalTime).toISOString();
    if (form.durationMinutes) payload.durationMinutes = parseInt(form.durationMinutes);
    if (form.vehicleId) payload.vehicleId = form.vehicleId;
    payload.driverId = form.driverId || null;
    if (form.price) payload.price = parseFloat(form.price);
    payload.notes = form.notes || null;
    if (form.status) payload.status = form.status;
    if (form.bookingDeadline) payload.bookingDeadline = new Date(form.bookingDeadline).toISOString();
    if (form.origin) payload.origin = form.origin;
    if (form.destination) payload.destination = form.destination;
    if (form.minBooking !== undefined) payload.minBooking = parseInt(form.minBooking);
    await updateTrip(selectedTrip.id, payload);
  };

  if (!editDialogOpen || !selectedTrip) return null;

  return (
    <div className="trip-modal-overlay" onClick={() => setEditDialogOpen(false)}>
      <div className="trip-modal" onClick={e => e.stopPropagation()}>
        <div className="trip-modal-header">
          <h2 className="trip-modal-title">✏️ Edit Trip</h2>
          <button className="trip-btn trip-btn-ghost trip-btn-icon" onClick={() => setEditDialogOpen(false)}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="trip-modal-body">
            <div className="trip-form">
              <div className="trip-form-row">
                <div className="trip-form-group">
                  <label className="trip-form-label">Kota Asal</label>
                  <input className="trip-form-input" name="origin" value={form.origin || ""} onChange={handleChange} />
                </div>
                <div className="trip-form-group">
                  <label className="trip-form-label">Kota Tujuan</label>
                  <input className="trip-form-input" name="destination" value={form.destination || ""} onChange={handleChange} />
                </div>
              </div>
              <div className="trip-form-row">
                <div className="trip-form-group">
                  <label className="trip-form-label">Waktu Berangkat</label>
                  <input className="trip-form-input" type="datetime-local" name="departureTime" value={form.departureTime || ""} onChange={handleChange} />
                </div>
                <div className="trip-form-group">
                  <label className="trip-form-label">Waktu Tiba</label>
                  <input className="trip-form-input" type="datetime-local" name="arrivalTime" value={form.arrivalTime || ""} onChange={handleChange} />
                </div>
              </div>
              <div className="trip-form-row">
                <div className="trip-form-group">
                  <label className="trip-form-label">Kendaraan</label>
                  <select className="trip-form-select" name="vehicleId" value={form.vehicleId || ""} onChange={handleChange}>
                    {vehicles.map(v => (
                      <option key={v.id} value={v.id}>{v.brand} {v.model} ({v.licensePlate})</option>
                    ))}
                  </select>
                </div>
                <div className="trip-form-group">
                  <label className="trip-form-label">Driver</label>
                  <select className="trip-form-select" name="driverId" value={form.driverId || ""} onChange={handleChange}>
                    <option value="">Belum ditentukan</option>
                    {drivers.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="trip-form-row">
                <div className="trip-form-group">
                  <label className="trip-form-label">Harga (Rp)</label>
                  <input className="trip-form-input" type="number" name="price" value={form.price || ""} onChange={handleChange} />
                </div>
                <div className="trip-form-group">
                  <label className="trip-form-label">Min. Keberangkatan (Kursi)</label>
                  <input className="trip-form-input" type="number" name="minBooking" value={form.minBooking || "1"} onChange={handleChange} min="1" />
                </div>
              </div>
              <div className="trip-form-row">
                <div className="trip-form-group">
                  <label className="trip-form-label">Status</label>
                  <select className="trip-form-select" name="status" value={form.status || ""} onChange={handleChange}>
                    <option value="SCHEDULED">Terjadwal</option>
                    <option value="ONGOING">Berlangsung</option>
                    <option value="COMPLETED">Selesai</option>
                    <option value="DELAYED">Tertunda</option>
                    <option value="WAITING_DRIVER">Menunggu Driver</option>
                  </select>
                </div>
                <div className="trip-form-group" />
              </div>
              <div className="trip-form-group">
                <label className="trip-form-label">Catatan</label>
                <textarea className="trip-form-textarea" name="notes" value={form.notes || ""} onChange={handleChange} />
              </div>
              {error && <div className="trip-form-error">❌ {error}</div>}
            </div>
          </div>
          <div className="trip-modal-footer">
            <button type="button" className="trip-btn trip-btn-secondary" onClick={() => setEditDialogOpen(false)}>Batal</button>
            <button type="submit" className="trip-btn trip-btn-primary" disabled={loading}>
              {loading ? "Menyimpan..." : "Simpan Perubahan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
