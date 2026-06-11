/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import "@/app/vendor-landing.css";

interface VendorData {
  vendor: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    address: string | null;
    phone: string | null;
    email: string | null;
    logo: string | null;
    city: { name: string; province: string | null } | null;
  };
  todayTrips: any[];
  upcomingTrips: any[];
  popularRoutes: { origin: string; destination: string; count: number }[];
  fleet: any[];
  policies: { id: string; type: string; title: string; content: string }[];
  stats: { completedTrips: number; activeFleet: number };
}

const currencyFormatter = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0
});

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit"
  });
}

function formatDateShort(iso: string) {
  const d = new Date(iso);
  return {
    day: d.getDate().toString(),
    month: d.toLocaleDateString("id-ID", { month: "short" }).toUpperCase()
  };
}

function getCountdown(departureIso: string) {
  const now = new Date().getTime();
  const dep = new Date(departureIso).getTime();
  const diff = dep - now;

  if (diff <= 0) return { label: "Sudah berangkat", status: "departed" };
  if (diff <= 30 * 60 * 1000) {
    const mins = Math.ceil(diff / 60000);
    return { label: `${mins} menit lagi`, status: "soon" };
  }
  const hours = Math.floor(diff / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  return {
    label: hours > 0 ? `${hours}j ${mins}m lagi` : `${mins}m lagi`,
    status: "normal"
  };
}

function getSeatStatus(available: number, total: number) {
  if (available <= 0) return { label: "Penuh", className: "vl-seats--full" };
  if (available <= Math.floor(total * 0.3))
    return {
      label: `Sisa ${available} kursi`,
      className: "vl-seats--low"
    };
  return {
    label: `${available}/${total} kursi`,
    className: "vl-seats--available"
  };
}

export default function VendorLandingPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [data, setData] = useState<VendorData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [expandedPolicies, setExpandedPolicies] = useState<Set<string>>(new Set());
  const [, setTick] = useState(0); // for countdown re-render

  // Fetch vendor data
  useEffect(() => {
    if (!slug) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setNotFound(false);
    fetch(`/api/public/vendor/${encodeURIComponent(slug)}`)
      .then((r) => {
        if (r.status === 404) {
          setNotFound(true);
          return null;
        }
        return r.json();
      })
      .then((d) => {
        if (d && !d.error) setData(d);
        else if (d?.error) setNotFound(true);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [slug]);

  // Countdown timer tick every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 30000);
    return () => clearInterval(interval);
  }, []);

  const togglePolicy = useCallback((id: string) => {
    setExpandedPolicies((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  // ─── Loading State ───
  if (loading) {
    return (
      <div className="vl-page">
        <div className="vl-loading">
          <div className="vl-loading-spinner" />
          <div className="vl-loading-text">Memuat Profil Vendor...</div>
        </div>
      </div>
    );
  }

  // ─── Not Found State ───
  if (notFound || !data) {
    return (
      <div className="vl-page">
        <div className="vl-notfound">
          <div className="vl-notfound-icon">🔍</div>
          <div className="vl-notfound-title">Vendor Tidak Ditemukan</div>
          <div className="vl-notfound-desc">
            Vendor dengan URL ini tidak ada atau sudah tidak aktif. Silakan periksa kembali alamat
            URL.
          </div>
          <Link href="/" className="vl-btn-book" style={{ marginTop: "1rem" }}>
            ← Kembali ke Beranda
          </Link>
        </div>
      </div>
    );
  }

  const { vendor, todayTrips, upcomingTrips, popularRoutes, fleet, policies, stats } = data;

  return (
    <div className="vl-page">
      {/* ═══ HERO ═══ */}
      <section className="vl-hero">
        <div className="vl-hero-inner">
          {vendor.logo ? (
            <img src={vendor.logo} alt={vendor.name} className="vl-hero-logo" />
          ) : (
            <div className="vl-hero-logo-placeholder">{vendor.name.charAt(0).toUpperCase()}</div>
          )}
          <div className="vl-hero-info">
            <h1>{vendor.name}</h1>
            {vendor.city && (
              <div className="vl-hero-location">
                📍 {vendor.city.name}
                {vendor.city.province ? `, ${vendor.city.province}` : ""}
              </div>
            )}
            {vendor.description && <p className="vl-hero-desc">{vendor.description}</p>}
            <div className="vl-hero-stats">
              <div className="vl-hero-stat">
                <span className="vl-hero-stat-value">{stats.completedTrips}</span>
                <span className="vl-hero-stat-label">Trip Selesai</span>
              </div>
              <div className="vl-hero-stat">
                <span className="vl-hero-stat-value">{stats.activeFleet}</span>
                <span className="vl-hero-stat-label">Armada Aktif</span>
              </div>
              <div className="vl-hero-stat">
                <span className="vl-hero-stat-value">{todayTrips.length}</span>
                <span className="vl-hero-stat-label">Trip Hari Ini</span>
              </div>
            </div>
            {(vendor.phone || vendor.email) && (
              <div className="vl-contact-bar">
                {vendor.phone && <span className="vl-contact-chip">📞 {vendor.phone}</span>}
                {vendor.email && <span className="vl-contact-chip">✉️ {vendor.email}</span>}
              </div>
            )}
            <div className="vl-hero-badge">✓ Vendor Terverifikasi</div>
          </div>
        </div>
      </section>

      <div className="vl-content">
        {/* ═══ TODAY'S TRIPS ═══ */}
        <section className="vl-section">
          <div className="vl-section-header">
            <div className="vl-section-icon vl-section-icon--today">🔥</div>
            <div>
              <h2 className="vl-section-title">Keberangkatan Hari Ini</h2>
              <p className="vl-section-subtitle">
                {todayTrips.length > 0
                  ? `${todayTrips.length} trip tersedia hari ini`
                  : "Tidak ada keberangkatan hari ini"}
              </p>
            </div>
          </div>

          {todayTrips.length > 0 ? (
            <div className="vl-today-grid">
              {todayTrips.map((trip) => {
                const countdown = getCountdown(trip.departureTime);
                const seats = getSeatStatus(trip.availableSeats, trip.totalSeats);
                return (
                  <div key={trip.id} className="vl-today-card">
                    <div className="vl-today-card-route">
                      <div>
                        <span className="vl-today-card-city">{trip.origin}</span>
                        {trip.originDetail && (
                          <span className="vl-today-card-detail">{trip.originDetail}</span>
                        )}
                      </div>
                      <span className="vl-today-card-arrow">→</span>
                      <div>
                        <span className="vl-today-card-city">{trip.destination}</span>
                        {trip.destinationDetail && (
                          <span className="vl-today-card-detail">{trip.destinationDetail}</span>
                        )}
                      </div>
                    </div>

                    <div className="vl-today-card-meta">
                      <span className="vl-today-card-chip">
                        🕐 {formatTime(trip.departureTime)}
                      </span>
                      {trip.durationMinutes && (
                        <span className="vl-today-card-chip">
                          ⏱ {Math.floor(trip.durationMinutes / 60)}j {trip.durationMinutes % 60}m
                        </span>
                      )}
                      <span className="vl-today-card-chip">
                        🚐 {trip.vehicle.brand} {trip.vehicle.model}
                      </span>
                      <div
                        className={`vl-countdown ${countdown.status === "soon" ? "vl-countdown--soon" : countdown.status === "departed" ? "vl-countdown--departed" : ""}`}
                      >
                        ⏳ {countdown.label}
                      </div>
                    </div>

                    <div className="vl-today-card-bottom">
                      <div>
                        <span className="vl-today-card-price">
                          {currencyFormatter.format(trip.price)}
                        </span>
                        <small> /kursi</small>
                        <div className={`vl-seats ${seats.className}`}>💺 {seats.label}</div>
                      </div>
                      {trip.availableSeats > 0 && countdown.status !== "departed" && (
                        <button
                          className="vl-btn-book"
                          onClick={() => router.push(`/trips/${trip.id}`)}
                        >
                          Pesan Sekarang →
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="vl-empty">
              <div className="vl-empty-icon">📅</div>
              <div className="vl-empty-text">Belum ada keberangkatan untuk hari ini</div>
            </div>
          )}
        </section>

        {/* ═══ UPCOMING TRIPS ═══ */}
        {upcomingTrips.length > 0 && (
          <section className="vl-section">
            <div className="vl-section-header">
              <div className="vl-section-icon vl-section-icon--upcoming">📆</div>
              <div>
                <h2 className="vl-section-title">Jadwal Mendatang</h2>
                <p className="vl-section-subtitle">
                  {upcomingTrips.length} trip dalam 7 hari ke depan
                </p>
              </div>
            </div>

            <div className="vl-upcoming-list">
              {upcomingTrips.map((trip) => {
                const dt = formatDateShort(trip.departureTime);
                const seats = getSeatStatus(trip.availableSeats, trip.totalSeats);
                return (
                  <div key={trip.id} className="vl-upcoming-item">
                    <div className="vl-upcoming-left">
                      <div className="vl-upcoming-date">
                        <span className="vl-upcoming-date-day">{dt.day}</span>
                        <span className="vl-upcoming-date-month">{dt.month}</span>
                      </div>
                      <div className="vl-upcoming-info">
                        <div className="vl-upcoming-route">
                          {trip.origin} → {trip.destination}
                        </div>
                        <div className="vl-upcoming-time">
                          🕐 {formatTime(trip.departureTime)} • {trip.vehicle.brand}{" "}
                          {trip.vehicle.model} •{" "}
                          <span className={seats.className}>{seats.label}</span>
                        </div>
                      </div>
                    </div>
                    <div className="vl-upcoming-right">
                      <span className="vl-upcoming-price">
                        {currencyFormatter.format(trip.price)}
                      </span>
                      <button
                        className="vl-btn-book vl-btn-book--outline"
                        onClick={() => router.push(`/trips/${trip.id}`)}
                      >
                        Lihat →
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ═══ POPULAR ROUTES ═══ */}
        {popularRoutes.length > 0 && (
          <section className="vl-section">
            <div className="vl-section-header">
              <div className="vl-section-icon vl-section-icon--routes">🗺️</div>
              <div>
                <h2 className="vl-section-title">Rute Populer</h2>
                <p className="vl-section-subtitle">Rute-rute yang sering dilayani vendor ini</p>
              </div>
            </div>

            <div className="vl-routes-grid">
              {popularRoutes.map((route, i) => (
                <div key={i} className="vl-route-badge">
                  {route.origin}
                  <span className="vl-route-badge-arrow">→</span>
                  {route.destination}
                  <span className="vl-route-badge-count">{route.count}x</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ═══ FLEET ═══ */}
        {fleet.length > 0 && (
          <section className="vl-section">
            <div className="vl-section-header">
              <div className="vl-section-icon vl-section-icon--fleet">🚐</div>
              <div>
                <h2 className="vl-section-title">Armada Kami</h2>
                <p className="vl-section-subtitle">
                  {fleet.length} kendaraan aktif siap melayani Anda
                </p>
              </div>
            </div>

            <div className="vl-fleet-grid">
              {fleet.map((v: any) => (
                <div key={v.id} className="vl-fleet-card">
                  {v.imageUrl ? (
                    <img
                      src={v.imageUrl}
                      alt={`${v.brand} ${v.model}`}
                      className="vl-fleet-card-img"
                    />
                  ) : (
                    <div className="vl-fleet-card-img-placeholder">🚐</div>
                  )}
                  <div className="vl-fleet-card-body">
                    <div className="vl-fleet-card-name">
                      {v.brand} {v.model}
                    </div>
                    <div className="vl-fleet-card-meta">
                      <span>💺 {v.capacity} kursi</span>
                      <span>🔖 {v.licensePlate}</span>
                      {v.color && <span>🎨 {v.color}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ═══ POLICIES ═══ */}
        {policies.length > 0 && (
          <section className="vl-section">
            <div className="vl-section-header">
              <div className="vl-section-icon vl-section-icon--policy">📋</div>
              <div>
                <h2 className="vl-section-title">Kebijakan & Informasi</h2>
                <p className="vl-section-subtitle">Syarat, ketentuan, dan kebijakan vendor</p>
              </div>
            </div>

            <div className="vl-policies">
              {policies.map((policy) => {
                const isOpen = expandedPolicies.has(policy.id);
                return (
                  <div key={policy.id} className="vl-policy-item">
                    <div className="vl-policy-header" onClick={() => togglePolicy(policy.id)}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.6rem"
                        }}
                      >
                        <span className="vl-policy-title">{policy.title}</span>
                        <span className="vl-policy-type">{policy.type}</span>
                      </div>
                      <span
                        className={`vl-policy-toggle ${isOpen ? "vl-policy-toggle--open" : ""}`}
                      >
                        ▼
                      </span>
                    </div>
                    {isOpen && <div className="vl-policy-content">{policy.content}</div>}
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
