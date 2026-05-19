/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { useTripStore } from "@/stores/tripStore";
import type { TripTemplate, TripTemplateSchedule } from "@/types/trip";
import dayjs from "dayjs";
import { toast } from "sonner";

interface VehicleOption { id: string; licensePlate: string; brand: string; model: string; }
interface DriverOption { id: string; name: string; }

const DAYS = [
  { value: "MONDAY", label: "Senin" },
  { value: "TUESDAY", label: "Selasa" },
  { value: "WEDNESDAY", label: "Rabu" },
  { value: "THURSDAY", label: "Kamis" },
  { value: "FRIDAY", label: "Jumat" },
  { value: "SATURDAY", label: "Sabtu" },
  { value: "SUNDAY", label: "Minggu" },
];

export default function TripTemplateDrawer() {
  const { templateDrawerOpen, setTemplateDrawerOpen, fetchTrips } = useTripStore();
  const [templates, setTemplates] = useState<TripTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<"list" | "form" | "generate">("list");
  
  // Form State
  const [selectedTemplate, setSelectedTemplate] = useState<TripTemplate | null>(null);
  const [vehicles, setVehicles] = useState<VehicleOption[]>([]);
  const [drivers, setDrivers] = useState<DriverOption[]>([]);
  
  // Region State
  const [provinces, setProvinces] = useState<any[]>([]);
  const [originCities, setOriginCities] = useState<any[]>([]);
  const [destCities, setDestCities] = useState<any[]>([]);
  const [originProvinceId, setOriginProvinceId] = useState("");
  const [destProvinceId, setDestProvinceId] = useState("");

  const [templateForm, setTemplateForm] = useState({
    name: "", origin: "", destination: "", originDetail: "", destinationDetail: "",
    price: "", notes: "", isActive: true
  });
  const [schedules, setSchedules] = useState<any[]>([]);

  // Generate State
  const [genDates, setGenDates] = useState({
    startDate: dayjs().format("YYYY-MM-DD"),
    endDate: dayjs().add(30, "day").format("YYYY-MM-DD")
  });

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  useEffect(() => {
    if (templateDrawerOpen) {
      loadTemplates();
      loadResources();
      fetchProvinces();
    }
  }, [templateDrawerOpen]);

  const fetchProvinces = () => {
    fetch("/api/provinces").then(r => r.json()).then(d => {
      if (Array.isArray(d)) setProvinces(d);
    }).catch(() => {});
  };

  useEffect(() => {
    if (originProvinceId) {
      fetch(`/api/cities?provinceId=${originProvinceId}`).then(r => r.json()).then(d => {
        if (Array.isArray(d)) setOriginCities(d);
      }).catch(() => {});
    } else {
      setOriginCities([]);
    }
  }, [originProvinceId]);

  useEffect(() => {
    if (destProvinceId) {
      fetch(`/api/cities?provinceId=${destProvinceId}`).then(r => r.json()).then(d => {
        if (Array.isArray(d)) setDestCities(d);
      }).catch(() => {});
    } else {
      setDestCities([]);
    }
  }, [destProvinceId]);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/vendor/trip-templates");
      const data = await res.json();
      setTemplates(data);
    } catch (err) {
      toast.error("Gagal memuat template");
    } finally {
      setLoading(false);
    }
  };

  const loadResources = async () => {
    fetch("/api/vendor/fleet").then(r => r.json()).then(d => setVehicles(d)).catch(() => {});
    fetch("/api/vendor/drivers").then(r => r.json()).then(d => setDrivers(d)).catch(() => {});
  };

  const handleOpenForm = (template?: TripTemplate) => {
    setOriginProvinceId("");
    setDestProvinceId("");
    if (template) {
      setSelectedTemplate(template);
      setTemplateForm({
        name: template.name,
        origin: template.origin,
        destination: template.destination,
        originDetail: template.originDetail || "",
        destinationDetail: template.destinationDetail || "",
        price: template.price.toString(),
        notes: template.notes || "",
        isActive: template.isActive
      });
      setSchedules(template.schedules.map(s => ({
        id: s.id,
        dayOfWeek: s.dayOfWeek,
        departureTime: s.departureTime,
        vehicleId: s.vehicleId,
        driverId: s.driverId || "",
        priceOverride: s.priceOverride || ""
      })));
    } else {
      setSelectedTemplate(null);
      setTemplateForm({
        name: "", origin: "", destination: "", originDetail: "", destinationDetail: "",
        price: "", notes: "", isActive: true
      });
      setSchedules([]);
    }
    setView("form");
  };

  const addSchedule = () => {
    setSchedules([...schedules, { dayOfWeek: "MONDAY", departureTime: "08:00", vehicleId: "", driverId: "", priceOverride: "" }]);
  };

  const removeSchedule = (index: number) => {
    setSchedules(schedules.filter((_, i) => i !== index));
  };

  const updateSchedule = (index: number, field: string, value: any) => {
    const newSchedules = [...schedules];
    newSchedules[index][field] = value;
    setSchedules(newSchedules);
  };

  const handleSaveTemplate = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { ...templateForm, price: parseFloat(templateForm.price), schedules };
      const url = selectedTemplate ? `/api/vendor/trip-templates/${selectedTemplate.id}` : "/api/vendor/trip-templates";
      const method = selectedTemplate ? "PATCH" : "POST";
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        toast.success(selectedTemplate ? "Template diperbarui" : "Template dibuat");
        setView("list");
        loadTemplates();
      } else {
        const d = await res.json();
        toast.error(d.error || "Gagal menyimpan template");
      }
    } catch (err) {
      toast.error("Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTemplate = async () => {
    if (!confirmDeleteId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/vendor/trip-templates/${confirmDeleteId}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Template berhasil dihapus");
        setConfirmDeleteId(null);
        loadTemplates();
      } else {
        const d = await res.json();
        toast.error(d.error || "Gagal menghapus template");
      }
    } catch (err) {
      toast.error("Gagal menghapus");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/vendor/trip-templates/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(genDates)
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`${data.generatedCount} trip berhasil dibuat!`);
        if (data.errors?.length) {
          toast.warning(`${data.errors.length} jadwal terlewati karena konflik.`);
        }
        setTemplateDrawerOpen(false);
        fetchTrips(dayjs().startOf("month").toISOString(), dayjs().endOf("month").toISOString());
      } else {
        toast.error(data.error || "Gagal generate trip");
      }
    } catch (err) {
      toast.error("Terjadi kesalahan saat generate");
    } finally {
      setLoading(false);
    }
  };

  if (!templateDrawerOpen) return null;

  return (
    <>
      <div className="trip-drawer-overlay" onClick={() => setTemplateDrawerOpen(false)} />
      <div className="trip-drawer" style={{ width: view === "list" ? "520px" : "640px" }}>
        <div className="trip-drawer-header">
          <div>
            <div className="trip-drawer-title">
              {view === "list" && "Template Jadwal"}
              {view === "form" && (selectedTemplate ? "Edit Template" : "Buat Template")}
              {view === "generate" && "Generate Jadwal Rutin"}
            </div>
            <p style={{ fontSize: "0.75rem", color: "#94a3b8", margin: 0 }}>
              {view === "list" && "Kelola rute dan pola keberangkatan rutin"}
              {view === "form" && "Tentukan rute dan jadwal mingguan"}
              {view === "generate" && "Cetak jadwal ke kalender untuk periode tertentu"}
            </p>
          </div>
          <button className="trip-btn trip-btn-ghost trip-btn-icon" onClick={() => setTemplateDrawerOpen(false)}>✕</button>
        </div>

        <div className="trip-drawer-body">
          {view === "list" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button className="trip-btn trip-btn-primary trip-btn-sm" style={{ flex: 1 }} onClick={() => handleOpenForm()}>
                  + Template Baru
                </button>
                <button className="trip-btn trip-btn-secondary trip-btn-sm" style={{ flex: 1 }} onClick={() => setView("generate")}>
                  🚀 Generate Jadwal
                </button>
              </div>

              {loading && !confirmDeleteId ? <div className="trip-loading-bar"><div className="trip-loading-bar-inner" /></div> : (
                templates.length === 0 ? (
                  <div className="trip-empty">
                    <div className="trip-empty-icon">📋</div>
                    <div className="trip-empty-text">Belum ada template.<br/>Buat template untuk mempercepat input jadwal.</div>
                  </div>
                ) : (
                  templates.map(t => (
                    <div key={t.id} className="trip-booking-card" style={{ cursor: "default", flexDirection: "column", alignItems: "stretch" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div>
                          <div className="trip-booking-name" style={{ fontSize: "1rem" }}>{t.name}</div>
                          <div className="trip-booking-info">{t.origin} → {t.destination}</div>
                        </div>
                        <div style={{ display: "flex", gap: 4 }}>
                          <button className="trip-btn trip-btn-ghost trip-btn-sm" onClick={() => handleOpenForm(t)}>✏️</button>
                          <button className="trip-btn trip-btn-ghost trip-btn-sm" style={{ color: "#ef4444" }} onClick={() => setConfirmDeleteId(t.id)}>🗑️</button>
                        </div>
                      </div>
                      <div style={{ marginTop: 8, display: "flex", flexWrap: "wrap", gap: 4 }}>
                        {t.schedules.map((s, idx) => (
                          <span key={idx} style={{ fontSize: "0.65rem", background: "#f1f5f9", padding: "2px 6px", borderRadius: 4, color: "#475569" }}>
                            {DAYS.find(d => d.value === s.dayOfWeek)?.label.substring(0,3)} {s.departureTime}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))
                )
              )}
            </div>
          )}

          {/* Delete Confirmation UI */}
          {confirmDeleteId && (
            <div className="trip-detail-section" style={{ marginTop: "1rem", animation: "tripFadeIn 0.2s ease" }}>
              <div className="trip-conflict-warning" style={{ background: "#fef2f2", borderColor: "#fca5a5", padding: "1.25rem" }}>
                <span className="trip-conflict-icon" style={{ fontSize: "1.5rem" }}>⚠️</span>
                <div style={{ flex: 1 }}>
                  <div className="trip-conflict-text" style={{ color: "#991b1b", fontWeight: 800, fontSize: "0.95rem", marginBottom: 4 }}>
                    Hapus Template?
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "#b91c1c", marginBottom: 16 }}>
                    Template <strong>{templates.find(t => t.id === confirmDeleteId)?.name}</strong> akan dihapus permanen. Jadwal yang sudah tercetak di kalender tidak akan terpengaruh.
                  </div>
                  <div style={{ display: "flex", gap: 12 }}>
                    <button className="trip-btn trip-btn-danger trip-btn-sm" onClick={handleDeleteTemplate} disabled={loading} style={{ minWidth: 100 }}>
                      {loading ? "Menghapus..." : "Ya, Hapus"}
                    </button>
                    <button className="trip-btn trip-btn-secondary trip-btn-sm" onClick={() => setConfirmDeleteId(null)}>Batal</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {view === "form" && (
            <form onSubmit={handleSaveTemplate} className="trip-form">
              <div className="trip-form-section-label">Informasi Template</div>
              <div className="trip-form-group">
                <label className="trip-form-label">Nama Template *</label>
                <input className="trip-form-input" value={templateForm.name} onChange={e => setTemplateForm({...templateForm, name: e.target.value})} placeholder="Contoh: Eksekutif Pagi JKT-BDG" required />
              </div>
              <div className="trip-form-row">
                <div className="trip-form-group">
                  <label className="trip-form-label">Provinsi Asal</label>
                  <select
                    className="trip-form-select"
                    value={originProvinceId}
                    onChange={e => {
                      setOriginProvinceId(e.target.value);
                      setTemplateForm({ ...templateForm, origin: "" });
                    }}
                  >
                    <option value="">Pilih provinsi...</option>
                    {provinces.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div className="trip-form-group">
                  <label className="trip-form-label">Kota Asal *</label>
                  <select
                    className="trip-form-select"
                    value={templateForm.origin}
                    onChange={e => setTemplateForm({ ...templateForm, origin: e.target.value })}
                    disabled={!originProvinceId}
                    required
                  >
                    <option value="">{originProvinceId ? "Pilih kota..." : "Pilih provinsi dulu"}</option>
                    {originCities.map(c => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="trip-form-row">
                <div className="trip-form-group">
                  <label className="trip-form-label">Provinsi Tujuan</label>
                  <select
                    className="trip-form-select"
                    value={destProvinceId}
                    onChange={e => {
                      setDestProvinceId(e.target.value);
                      setTemplateForm({ ...templateForm, destination: "" });
                    }}
                  >
                    <option value="">Pilih provinsi...</option>
                    {provinces.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div className="trip-form-group">
                  <label className="trip-form-label">Kota Tujuan *</label>
                  <select
                    className="trip-form-select"
                    value={templateForm.destination}
                    onChange={e => setTemplateForm({ ...templateForm, destination: e.target.value })}
                    disabled={!destProvinceId}
                    required
                  >
                    <option value="">{destProvinceId ? "Pilih kota..." : "Pilih provinsi dulu"}</option>
                    {destCities.map(c => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="trip-form-row">
                <div className="trip-form-group">
                  <label className="trip-form-label">Harga Dasar *</label>
                  <input className="trip-form-input" type="number" value={templateForm.price} onChange={e => setTemplateForm({...templateForm, price: e.target.value})} placeholder="150000" required />
                </div>
                <div className="trip-form-group" />
              </div>

              <div className="trip-form-section-label" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                Jadwal Rutin Mingguan
                <button type="button" className="trip-btn trip-btn-secondary trip-btn-sm" onClick={addSchedule}>+ Tambah Jam</button>
              </div>

              {schedules.map((s, idx) => (
                <div key={idx} className="trip-booking-card" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1.5fr 1fr auto", gap: "0.5rem", padding: "0.5rem", alignItems: "end" }}>
                  <div className="trip-form-group">
                    <label className="trip-form-label">Hari</label>
                    <select className="trip-form-select" value={s.dayOfWeek} onChange={e => updateSchedule(idx, "dayOfWeek", e.target.value)} style={{ padding: "0.4rem" }}>
                      {DAYS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                    </select>
                  </div>
                  <div className="trip-form-group">
                    <label className="trip-form-label">Jam</label>
                    <input className="trip-form-input" type="time" value={s.departureTime} onChange={e => updateSchedule(idx, "departureTime", e.target.value)} style={{ padding: "0.4rem" }} />
                  </div>
                  <div className="trip-form-group">
                    <label className="trip-form-label">Kendaraan</label>
                    <select className="trip-form-select" value={s.vehicleId} onChange={e => updateSchedule(idx, "vehicleId", e.target.value)} style={{ padding: "0.4rem" }}>
                      <option value="">Pilih...</option>
                      {vehicles.map(v => <option key={v.id} value={v.id}>{v.licensePlate}</option>)}
                    </select>
                  </div>
                  <div className="trip-form-group">
                    <label className="trip-form-label">Driver</label>
                    <select className="trip-form-select" value={s.driverId} onChange={e => updateSchedule(idx, "driverId", e.target.value)} style={{ padding: "0.4rem" }}>
                      <option value="">Auto</option>
                      {drivers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                  </div>
                  <button type="button" className="trip-btn trip-btn-ghost" onClick={() => removeSchedule(idx)} style={{ padding: 4 }}>🗑️</button>
                </div>
              ))}

              {schedules.length === 0 && <div style={{ textAlign: "center", padding: "1rem", color: "#94a3b8", fontSize: "0.8rem", border: "1px dashed #e2e8f0", borderRadius: 8 }}>Belum ada jam keberangkatan. Klik Tambah Jam.</div>}

              <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem" }}>
                <button type="submit" className="trip-btn trip-btn-primary" style={{ flex: 1 }} disabled={loading}>
                  {loading ? "Menyimpan..." : (selectedTemplate ? "Simpan Perubahan" : "Buat Template")}
                </button>
                <button type="button" className="trip-btn trip-btn-secondary" onClick={() => setView("list")}>Batal</button>
              </div>
            </form>
          )}

          {view === "generate" && (
            <div className="trip-form">
              <div className="trip-conflict-warning" style={{ background: "#f0f9ff", borderColor: "#93c5fd", marginBottom: "1rem" }}>
                <span className="trip-conflict-icon">ℹ️</span>
                <div className="trip-conflict-text" style={{ color: "#1e40af" }}>
                  Sistem akan membuat jadwal di kalender berdasarkan semua template aktif untuk rentang tanggal yang Anda pilih. Trip yang sudah ada atau konflik kendaraan akan otomatis dilewati.
                </div>
              </div>
              
              <div className="trip-form-row">
                <div className="trip-form-group">
                  <label className="trip-form-label">Mulai Tanggal</label>
                  <input className="trip-form-input" type="date" value={genDates.startDate} onChange={e => setGenDates({...genDates, startDate: e.target.value})} />
                </div>
                <div className="trip-form-group">
                  <label className="trip-form-label">Sampai Tanggal</label>
                  <input className="trip-form-input" type="date" value={genDates.endDate} onChange={e => setGenDates({...genDates, endDate: e.target.value})} />
                </div>
              </div>

              <div style={{ display: "flex", gap: "0.5rem", marginTop: "1.5rem" }}>
                <button className="trip-btn trip-btn-primary" style={{ flex: 1 }} onClick={handleGenerate} disabled={loading}>
                  {loading ? "Memproses..." : "🚀 Konfirmasi Generate Sekarang"}
                </button>
                <button className="trip-btn trip-btn-secondary" onClick={() => setView("list")}>Batal</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
