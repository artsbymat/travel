/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useCallback } from "react";
import { useTripStore } from "@/stores/tripStore";
import { SeatLayoutPreview } from "@/components/vendor/seat-layout-builder";
import dayjs from "dayjs";

interface VehicleOption {
  id: string;
  licensePlate: string;
  name: string | null;
  brand: string;
  model: string;
  capacity: number;
  seatLayout: any;
  status: string;
}
interface DriverOption {
  id: string;
  name: string;
  phone: string | null;
}
interface Province {
  id: string;
  name: string;
}
interface City {
  id: string;
  name: string;
  provinceId: string;
}

export default function CreateTripDialog() {
  const {
    createDialogOpen,
    createDefaults,
    loading,
    error,
    conflicts,
    setCreateDialogOpen,
    createTrip,
    checkConflicts
  } = useTripStore();

  const [vehicles, setVehicles] = useState<VehicleOption[]>([]);
  const [drivers, setDrivers] = useState<DriverOption[]>([]);

  // Autocomplete states
  const [originSearch, setOriginSearch] = useState("");
  const [destSearch, setDestSearch] = useState("");
  const [originSuggestions, setOriginSuggestions] = useState<any[]>([]);
  const [destSuggestions, setDestSuggestions] = useState<any[]>([]);
  const [showOriginDropdown, setShowOriginDropdown] = useState(false);
  const [showDestDropdown, setShowDestDropdown] = useState(false);
  const [arrivalError, setArrivalError] = useState<string | null>(null);
  const [deadlineError, setDeadlineError] = useState<string | null>(null);

  const [form, setForm] = useState({
    origin: "",
    destination: "",
    originDetail: "",
    destinationDetail: "",
    departureTime: "",
    arrivalTime: "",
    durationMinutes: 120,
    vehicleId: "",
    driverId: "",
    price: "",
    bookingDeadline: "",
    notes: "",
    minBooking: "1"
  });

  const selectedVehicle = vehicles.find((v) => v.id === form.vehicleId);

  // Fetch vehicles, drivers on open
  useEffect(() => {
    if (createDialogOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setOriginSearch("");
      setDestSearch("");
      setArrivalError(null);
      setDeadlineError(null);
      fetch("/api/vendor/fleet")
        .then((r) => r.json())
        .then((d) => {
          if (Array.isArray(d)) setVehicles(d.filter((v: any) => v.status === "ACTIVE"));
        })
        .catch(() => {});
      fetch("/api/vendor/drivers")
        .then((r) => r.json())
        .then((d) => {
          if (Array.isArray(d)) setDrivers(d);
        })
        .catch(() => {});
    }
  }, [createDialogOpen]);

  // Fetch autocomplete suggestions
  useEffect(() => {
    if (originSearch.trim().length > 1) {
      const timer = setTimeout(() => {
        fetch(`/api/cities?q=${encodeURIComponent(originSearch)}&limit=10`)
          .then((r) => r.json())
          .then((d) => {
            if (Array.isArray(d)) setOriginSuggestions(d);
          })
          .catch(() => {});
      }, 200);
      return () => clearTimeout(timer);
    } else {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setOriginSuggestions([]);
    }
  }, [originSearch]);

  useEffect(() => {
    if (destSearch.trim().length > 1) {
      const timer = setTimeout(() => {
        fetch(`/api/cities?q=${encodeURIComponent(destSearch)}&limit=10`)
          .then((r) => r.json())
          .then((d) => {
            if (Array.isArray(d)) setDestSuggestions(d);
          })
          .catch(() => {});
      }, 200);
      return () => clearTimeout(timer);
    } else {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDestSuggestions([]);
    }
  }, [destSearch]);

  // Set defaults from calendar click
  useEffect(() => {
    if (createDialogOpen && createDefaults?.start) {
      const start = createDefaults.start.includes("T")
        ? createDefaults.start
        : `${createDefaults.start}T08:00`;
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setForm((f) => ({
        ...f,
        departureTime: dayjs(start).format("YYYY-MM-DDTHH:mm"),
        arrivalTime: createDefaults.end
          ? dayjs(createDefaults.end).format("YYYY-MM-DDTHH:mm")
          : dayjs(start).add(2, "hour").format("YYYY-MM-DDTHH:mm")
      }));
    }
  }, [createDialogOpen, createDefaults]);

  // Realtime conflict check
  const doConflictCheck = useCallback(() => {
    if (form.vehicleId && form.departureTime) {
      checkConflicts({
        vehicleId: form.vehicleId,
        driverId: form.driverId || undefined,
        departureTime: new Date(form.departureTime).toISOString(),
        arrivalTime: form.arrivalTime ? new Date(form.arrivalTime).toISOString() : undefined,
        durationMinutes: form.durationMinutes
      });
    }
  }, [
    form.vehicleId,
    form.driverId,
    form.departureTime,
    form.arrivalTime,
    form.durationMinutes,
    checkConflicts
  ]);

  useEffect(() => {
    const timer = setTimeout(doConflictCheck, 500);
    return () => clearTimeout(timer);
  }, [doConflictCheck]);

  // Real-time per-field validation
  useEffect(() => {
    if (form.departureTime && form.arrivalTime) {
      const depTime = new Date(form.departureTime);
      const arrTime = new Date(form.arrivalTime);
      if (arrTime <= depTime) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setArrivalError("Waktu tiba harus setelah waktu keberangkatan.");
      } else {
        setArrivalError(null);
      }
    } else {
      setArrivalError(null);
    }
  }, [form.departureTime, form.arrivalTime]);

  useEffect(() => {
    if (form.departureTime && form.bookingDeadline) {
      const depTime = new Date(form.departureTime);
      const deadline = new Date(form.bookingDeadline);
      if (deadline >= depTime) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setDeadlineError("Deadline booking harus sebelum waktu keberangkatan.");
      } else {
        setDeadlineError(null);
      }
    } else {
      setDeadlineError(null);
    }
  }, [form.departureTime, form.bookingDeadline]);

  const handleChange = (e: any) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    if (!form.origin || !form.destination || !form.departureTime || !form.vehicleId || !form.price)
      return;
    // Block submit if there are inline validation errors
    if (arrivalError || deadlineError) return;

    const success = await createTrip({
      origin: form.origin,
      destination: form.destination,
      originDetail: form.originDetail || undefined,
      destinationDetail: form.destinationDetail || undefined,
      departureTime: new Date(form.departureTime).toISOString(),
      arrivalTime: form.arrivalTime ? new Date(form.arrivalTime).toISOString() : undefined,
      durationMinutes: form.durationMinutes || undefined,
      vehicleId: form.vehicleId,
      driverId: form.driverId || undefined,
      price: parseFloat(form.price),
      bookingDeadline: form.bookingDeadline
        ? new Date(form.bookingDeadline).toISOString()
        : undefined,
      notes: form.notes || undefined,
      minBooking: parseInt(form.minBooking) || 1
    });

    if (success) {
      resetForm();
    }
  };

  const resetForm = () => {
    setForm({
      origin: "",
      destination: "",
      originDetail: "",
      destinationDetail: "",
      departureTime: "",
      arrivalTime: "",
      durationMinutes: 120,
      vehicleId: "",
      driverId: "",
      price: "",
      bookingDeadline: "",
      notes: "",
      minBooking: "1"
    });
    setOriginSearch("");
    setDestSearch("");
    setArrivalError(null);
    setDeadlineError(null);
  };

  const handleClose = () => {
    setCreateDialogOpen(false);
    resetForm();
  };

  if (!createDialogOpen) return null;

  return (
    <div className="trip-modal-overlay" onClick={handleClose}>
      <div className="trip-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="trip-modal-header">
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <span
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: "linear-gradient(135deg, #3b82f6, #6366f1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.1rem",
                flexShrink: 0
              }}
            >
              🚐
            </span>
            <div>
              <h2 className="trip-modal-title">Buat Trip Baru</h2>
              <p style={{ fontSize: "0.72rem", color: "#94a3b8", fontWeight: 500, margin: 0 }}>
                Isi detail perjalanan yang akan dijadwalkan
              </p>
            </div>
          </div>
          <button className="trip-btn trip-btn-ghost trip-btn-icon" onClick={handleClose}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="trip-modal-body">
            <div className="trip-form">
              {/* ═══ SECTION: RUTE ═══ */}
              <div className="trip-form-section-label">Rute Perjalanan</div>

              {/* Origin and Destination Autocomplete Row */}
              <div className="trip-form-row">
                <div className="trip-form-group" style={{ position: "relative" }}>
                  <label className="trip-form-label">Kota Asal *</label>
                  <input
                    className="trip-form-input"
                    placeholder="Cari kota asal..."
                    value={originSearch}
                    onChange={(e) => {
                      setOriginSearch(e.target.value);
                      setForm((f) => ({ ...f, origin: e.target.value }));
                      setShowOriginDropdown(true);
                    }}
                    onFocus={() => setShowOriginDropdown(true)}
                    onBlur={() => setTimeout(() => setShowOriginDropdown(false), 200)}
                    required
                  />
                  {showOriginDropdown && originSuggestions.length > 0 && (
                    <div
                      style={{
                        position: "absolute",
                        top: "100%",
                        left: 0,
                        right: 0,
                        backgroundColor: "#ffffff",
                        border: "1px solid #e2e8f0",
                        borderRadius: "10px",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                        zIndex: 1000,
                        maxHeight: "200px",
                        overflowY: "auto",
                        marginTop: "4px"
                      }}
                    >
                      {originSuggestions.map((city) => (
                        <div
                          key={city.id}
                          onClick={() => {
                            setForm((f) => ({ ...f, origin: city.name }));
                            setOriginSearch(city.name);
                            setShowOriginDropdown(false);
                          }}
                          style={{
                            padding: "0.6rem 0.9rem",
                            cursor: "pointer",
                            fontSize: "0.85rem",
                            color: "#0f172a",
                            fontWeight: 500,
                            borderBottom: "1px solid #f1f5f9"
                          }}
                          onMouseDown={(e) => e.preventDefault()} // prevents input blur before click
                        >
                          📍 {city.name} {city.province ? `(${city.province.name})` : ""}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="trip-form-group" style={{ position: "relative" }}>
                  <label className="trip-form-label">Kota Tujuan *</label>
                  <input
                    className="trip-form-input"
                    placeholder="Cari kota tujuan..."
                    value={destSearch}
                    onChange={(e) => {
                      setDestSearch(e.target.value);
                      setForm((f) => ({ ...f, destination: e.target.value }));
                      setShowDestDropdown(true);
                    }}
                    onFocus={() => setShowDestDropdown(true)}
                    onBlur={() => setTimeout(() => setShowDestDropdown(false), 200)}
                    required
                  />
                  {showDestDropdown && destSuggestions.length > 0 && (
                    <div
                      style={{
                        position: "absolute",
                        top: "100%",
                        left: 0,
                        right: 0,
                        backgroundColor: "#ffffff",
                        border: "1px solid #e2e8f0",
                        borderRadius: "10px",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                        zIndex: 1000,
                        maxHeight: "200px",
                        overflowY: "auto",
                        marginTop: "4px"
                      }}
                    >
                      {destSuggestions.map((city) => (
                        <div
                          key={city.id}
                          onClick={() => {
                            setForm((f) => ({ ...f, destination: city.name }));
                            setDestSearch(city.name);
                            setShowDestDropdown(false);
                          }}
                          style={{
                            padding: "0.6rem 0.9rem",
                            cursor: "pointer",
                            fontSize: "0.85rem",
                            color: "#0f172a",
                            fontWeight: 500,
                            borderBottom: "1px solid #f1f5f9"
                          }}
                          onMouseDown={(e) => e.preventDefault()} // prevents input blur before click
                        >
                          📍 {city.name} {city.province ? `(${city.province.name})` : ""}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Detail titik keberangkatan/tujuan */}
              <div className="trip-form-row">
                <div className="trip-form-group">
                  <label className="trip-form-label">Detail Titik Asal</label>
                  <input
                    className="trip-form-input"
                    name="originDetail"
                    value={form.originDetail}
                    onChange={handleChange}
                    placeholder="Terminal / Pool / Alamat"
                  />
                </div>
                <div className="trip-form-group">
                  <label className="trip-form-label">Detail Titik Tujuan</label>
                  <input
                    className="trip-form-input"
                    name="destinationDetail"
                    value={form.destinationDetail}
                    onChange={handleChange}
                    placeholder="Terminal / Pool / Alamat"
                  />
                </div>
              </div>

              {/* ═══ SECTION: JADWAL ═══ */}
              <div className="trip-form-section-label">Jadwal</div>
              <div className="trip-form-row">
                <div className="trip-form-group">
                  <label className="trip-form-label">Waktu Berangkat *</label>
                  <input
                    className="trip-form-input"
                    type="datetime-local"
                    name="departureTime"
                    value={form.departureTime}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="trip-form-group">
                  <label className="trip-form-label">Waktu Tiba</label>
                  <input
                    className="trip-form-input"
                    type="datetime-local"
                    name="arrivalTime"
                    value={form.arrivalTime}
                    onChange={handleChange}
                    style={arrivalError ? { borderColor: "#ef4444", background: "#fff5f5" } : {}}
                  />
                  {arrivalError && (
                    <div className="trip-field-error">
                      <span>⚠️</span> {arrivalError}
                    </div>
                  )}
                </div>
              </div>
              <div className="trip-form-row">
                <div className="trip-form-group">
                  <label className="trip-form-label">Durasi (menit)</label>
                  <input
                    className="trip-form-input"
                    type="number"
                    name="durationMinutes"
                    value={form.durationMinutes}
                    onChange={handleChange}
                    min="15"
                  />
                </div>
                <div className="trip-form-group">
                  <label className="trip-form-label">Deadline Booking</label>
                  <input
                    className="trip-form-input"
                    type="datetime-local"
                    name="bookingDeadline"
                    value={form.bookingDeadline}
                    onChange={handleChange}
                    style={deadlineError ? { borderColor: "#ef4444", background: "#fff5f5" } : {}}
                  />
                  {deadlineError && (
                    <div className="trip-field-error">
                      <span>⚠️</span> {deadlineError}
                    </div>
                  )}
                </div>
              </div>

              {/* ═══ SECTION: KENDARAAN & DRIVER ═══ */}
              <div className="trip-form-section-label">Kendaraan & Driver</div>
              <div className="trip-form-row">
                <div className="trip-form-group">
                  <label className="trip-form-label">Kendaraan *</label>
                  <select
                    className="trip-form-select"
                    name="vehicleId"
                    value={form.vehicleId}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Pilih kendaraan...</option>
                    {vehicles.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.brand} {v.model} ({v.licensePlate}) — {v.capacity} kursi
                      </option>
                    ))}
                  </select>
                </div>
                <div className="trip-form-group">
                  <label className="trip-form-label">Driver</label>
                  <select
                    className="trip-form-select"
                    name="driverId"
                    value={form.driverId}
                    onChange={handleChange}
                  >
                    <option value="">Pilih driver...</option>
                    {drivers.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                        {d.phone ? ` (${d.phone})` : ""}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Seat Layout Preview — show when vehicle is selected */}
              {selectedVehicle?.seatLayout && (
                <div className="trip-vehicle-preview">
                  <div className="trip-vehicle-preview-header">
                    <span className="trip-vehicle-preview-icon">💺</span>
                    <div>
                      <div className="trip-vehicle-preview-name">
                        {selectedVehicle.brand} {selectedVehicle.model}
                      </div>
                      <div className="trip-vehicle-preview-plate">
                        {selectedVehicle.licensePlate} • {selectedVehicle.capacity} kursi
                      </div>
                    </div>
                  </div>
                  <div className="trip-vehicle-preview-layout">
                    <SeatLayoutPreview layout={selectedVehicle.seatLayout} />
                  </div>
                </div>
              )}

              {/* ═══ SECTION: HARGA & SYARAT ═══ */}
              <div className="trip-form-section-label">Harga & Syarat</div>
              <div className="trip-form-row">
                <div className="trip-form-group">
                  <label className="trip-form-label">Harga per Kursi (Rp) *</label>
                  <input
                    className="trip-form-input"
                    type="number"
                    name="price"
                    value={form.price}
                    onChange={handleChange}
                    placeholder="150000"
                    min="0"
                    required
                  />
                </div>
                <div className="trip-form-group">
                  <label className="trip-form-label">Min. Keberangkatan (Kursi) *</label>
                  <input
                    className="trip-form-input"
                    type="number"
                    name="minBooking"
                    value={form.minBooking}
                    onChange={handleChange}
                    min="1"
                    required
                  />
                </div>
              </div>

              {/* Notes */}
              <div className="trip-form-group">
                <label className="trip-form-label">Catatan</label>
                <textarea
                  className="trip-form-textarea"
                  name="notes"
                  value={form.notes}
                  onChange={handleChange}
                  placeholder="Catatan tambahan untuk trip ini..."
                />
              </div>

              {/* Conflict Warning */}
              {conflicts?.hasConflict && (
                <div className="trip-conflict-warning">
                  <span className="trip-conflict-icon">⚠️</span>
                  <div>
                    <div
                      className="trip-conflict-text"
                      style={{ fontWeight: 700, marginBottom: 4 }}
                    >
                      Konflik jadwal terdeteksi!
                    </div>
                    {conflicts.vehicleConflicts.map((c: any) => (
                      <div key={c.id} className="trip-conflict-item">
                        🚐 Kendaraan: {c.origin}→{c.destination} (
                        {dayjs(c.departureTime).format("DD/MM HH:mm")})
                      </div>
                    ))}
                    {conflicts.driverConflicts.map((c: any) => (
                      <div key={c.id} className="trip-conflict-item">
                        👤 Driver: {c.origin}→{c.destination} (
                        {dayjs(c.departureTime).format("DD/MM HH:mm")})
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {error && <div className="trip-form-error">❌ {error}</div>}
            </div>
          </div>

          {/* Footer */}
          <div className="trip-modal-footer">
            <button type="button" className="trip-btn trip-btn-secondary" onClick={handleClose}>
              Batal
            </button>
            <button
              type="submit"
              className="trip-btn trip-btn-primary"
              disabled={loading}
              style={{ minWidth: 140 }}
            >
              {loading ? "Menyimpan..." : "Buat Trip"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
