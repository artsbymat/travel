"use client";

import "./forget-password.css";
import { useState } from "react";
import Link from "next/link";
import { Car, Mail, ArrowRight, ArrowLeft, CheckCircle2 } from "lucide-react";

export default function ForgetPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/forget-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Gagal mengirim email. Coba lagi nanti.");
      } else {
        setSent(true);
      }
    } catch {
      setError("Terjadi kesalahan. Periksa koneksi kamu dan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      {/* ─── LEFT PANEL ─── */}
      <div className="login-left">
        <div className="login-left-grid" aria-hidden="true" />
        <div className="login-glow" aria-hidden="true" />

        {/* Logo */}
        <div className="login-logo">
          <span className="login-logo-icon">
            <Car size={18} strokeWidth={2.5} />
          </span>
          <span className="login-logo-text">FluxFleet</span>
        </div>

        {/* Hero content */}
        <div className="login-hero">
          <h2 className="login-headline">
            Keamanan akun
            <br />
            <span className="login-headline-accent">prioritas kami.</span>
          </h2>
          <p className="login-subtext">
            Kami menjaga akun kamu tetap aman.
            <br />
            Reset password hanya butuh beberapa menit.
          </p>

          {/* Security badges */}
          <div className="fp-security-cards">
            <div className="fp-security-item">
              <span className="fp-security-icon">🔒</span>
              <div>
                <p className="fp-security-title">Link Sekali Pakai</p>
                <p className="fp-security-desc">Token kadaluarsa dalam 1 jam</p>
              </div>
            </div>
            <div className="fp-security-item">
              <span className="fp-security-icon">🛡️</span>
              <div>
                <p className="fp-security-title">Enkripsi End-to-End</p>
                <p className="fp-security-desc">Password terenkripsi penuh</p>
              </div>
            </div>
          </div>
        </div>

        <div className="login-badge">
          <span className="login-badge-dot" />
          <span>Trusted by enterprise fleets worldwide</span>
        </div>
      </div>

      {/* ─── RIGHT PANEL ─── */}
      <div className="login-right">
        <div className="login-form-container">
          {!sent ? (
            /* ── FORM STATE ── */
            <>
              <div className="login-form-header">
                <div className="fp-icon-wrap">
                  <Mail size={26} strokeWidth={1.8} />
                </div>
                <h1 className="login-form-title">Lupa Password?</h1>
                <p className="login-form-subtitle">
                  Masukkan email kamu dan kami akan mengirimkan link untuk mereset password.
                </p>
              </div>

              {error && (
                <div className="login-error" role="alert">
                  <span className="login-error-icon">⚠</span>
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="login-form" noValidate>
                <div className="login-field">
                  <label className="login-label" htmlFor="fp-email">
                    Email Address
                  </label>
                  <div className="login-input-wrapper">
                    <span className="login-input-icon">
                      <Mail size={16} />
                    </span>
                    <input
                      id="fp-email"
                      type="email"
                      className="login-input"
                      placeholder="you@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoFocus
                      autoComplete="email"
                    />
                  </div>
                </div>

                <button type="submit" className="login-btn" disabled={loading}>
                  {loading ? (
                    <>
                      <span className="login-spinner" aria-hidden="true" />
                      <span>Mengirim...</span>
                    </>
                  ) : (
                    <>
                      <span>Kirim Link Reset Password</span>
                      <ArrowRight size={18} />
                    </>
                  )}
                </button>
              </form>

              <div className="fp-back-link">
                <Link href="/login" className="fp-back-btn">
                  <ArrowLeft size={15} />
                  <span>Kembali ke Login</span>
                </Link>
              </div>

              <div className="login-divider">
                <span className="login-divider-line" />
                <span className="login-divider-text">secured by FluxFleet</span>
                <span className="login-divider-line" />
              </div>
            </>
          ) : (
            /* ── SUCCESS STATE ── */
            <>
              <div className="fp-success-wrap">
                <div className="fp-success-icon-ring">
                  <CheckCircle2 size={40} strokeWidth={1.8} />
                </div>

                <h1 className="login-form-title fp-success-title">Email Terkirim!</h1>
                <p className="fp-success-subtitle">Link reset password telah dikirim ke</p>
                <p className="fp-success-email">{email}</p>

                <div className="fp-info-box">
                  <ul className="fp-info-list">
                    <li>
                      Periksa folder <strong>inbox</strong> atau <strong>spam</strong> kamu
                    </li>
                    <li>
                      Link berlaku selama <strong>1 jam</strong>
                    </li>
                    <li>
                      Link hanya bisa digunakan <strong>satu kali</strong>
                    </li>
                  </ul>
                </div>

                <button type="button" className="fp-resend-btn" onClick={() => setSent(false)}>
                  Tidak menerima email? Kirim ulang
                </button>
              </div>

              <div className="fp-back-link" style={{ marginTop: "1.5rem" }}>
                <Link
                  href="/login"
                  className="login-btn"
                  style={{
                    textDecoration: "none",
                    display: "flex",
                    justifyContent: "center",
                    gap: "0.5rem"
                  }}
                >
                  <ArrowLeft size={18} />
                  <span>Kembali ke Login</span>
                </Link>
              </div>

              <div className="login-divider">
                <span className="login-divider-line" />
                <span className="login-divider-text">secured by FluxFleet</span>
                <span className="login-divider-line" />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
