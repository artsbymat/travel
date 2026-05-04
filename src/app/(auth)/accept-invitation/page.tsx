"use client";

import "../reset-password-form/reset-password-form.css";
import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Car, Lock, Eye, EyeOff, ArrowLeft, CheckCircle2, ShieldAlert } from "lucide-react";

export default function AcceptInvitationPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const passwordsMatch = password === confirmPassword;
  const passwordStrong = password.length >= 8;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordsMatch) {
      setError("Password dan konfirmasi password tidak cocok.");
      return;
    }
    if (!passwordStrong) {
      setError("Password minimal harus 8 karakter.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/accept-invitation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password })
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Gagal mengaktifkan akun. Coba lagi.");
      } else {
        setSuccess(true);
      }
    } catch {
      setError("Terjadi kesalahan. Periksa koneksi kamu dan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="login-wrapper">
        <div className="login-left">
          <div className="login-left-grid" aria-hidden="true" />
          <div className="login-glow" aria-hidden="true" />
          <div className="login-logo">
            <span className="login-logo-icon">
              <Car size={18} strokeWidth={2.5} />
            </span>
            <span className="login-logo-text">FluxFleet</span>
          </div>
          <div className="login-hero">
            <h2 className="login-headline">
              Aktivasi akun
              <br />
              <span className="login-headline-accent">owner kamu.</span>
            </h2>
          </div>
          <div className="login-badge">
            <span className="login-badge-dot" />
            <span>Trusted by enterprise fleets worldwide</span>
          </div>
        </div>
        <div className="login-right">
          <div className="login-form-container">
            <div className="rp-invalid-wrap">
              <div className="rp-invalid-icon">
                <ShieldAlert size={40} strokeWidth={1.8} />
              </div>
              <h1 className="login-form-title">Link Tidak Valid</h1>
              <p className="login-form-subtitle">
                Link undangan ini tidak valid atau sudah kadaluarsa. Hubungi admin untuk mendapatkan
                undangan baru.
              </p>
              <div className="fp-back-link" style={{ marginTop: "1rem" }}>
                <Link href="/login" className="fp-back-btn">
                  <ArrowLeft size={15} />
                  <span>Kembali ke Login</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="login-wrapper">
      {/* ─── LEFT PANEL ─── */}
      <div className="login-left">
        <div className="login-left-grid" aria-hidden="true" />
        <div className="login-glow" aria-hidden="true" />

        <div className="login-logo">
          <span className="login-logo-icon">
            <Car size={18} strokeWidth={2.5} />
          </span>
          <span className="login-logo-text">FluxFleet</span>
        </div>

        <div className="login-hero">
          <h2 className="login-headline">
            Aktifkan akun
            <br />
            <span className="login-headline-accent">owner kamu.</span>
          </h2>
          <p className="login-subtext">
            Buat password yang kuat untuk mengamankan akun kamu.
            <br />
            Setelah diaktifkan, kamu langsung bisa login.
          </p>

          <div className="fp-security-cards">
            <div className="fp-security-item">
              <span className="fp-security-icon">✅</span>
              <div>
                <p className="fp-security-title">Minimal 8 Karakter</p>
                <p className="fp-security-desc">Gunakan kombinasi huruf &amp; angka</p>
              </div>
            </div>
            <div className="fp-security-item">
              <span className="fp-security-icon">🔐</span>
              <div>
                <p className="fp-security-title">Tersimpan Aman</p>
                <p className="fp-security-desc">Password di-hash dengan bcrypt</p>
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
          {!success ? (
            <>
              <div className="login-form-header">
                <div className="fp-icon-wrap">
                  <Lock size={26} strokeWidth={1.8} />
                </div>
                <h1 className="login-form-title">Buat Password Akun</h1>
                <p className="login-form-subtitle">
                  Selamat datang! Buat password untuk mengaktifkan akun owner kamu.
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
                  <label className="login-label" htmlFor="inv-password">
                    Password Baru
                  </label>
                  <div className="login-input-wrapper">
                    <span className="login-input-icon">
                      <Lock size={16} />
                    </span>
                    <input
                      id="inv-password"
                      type={showPassword ? "text" : "password"}
                      className="login-input login-input-password"
                      placeholder="Min. 8 karakter"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoFocus
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      className="login-eye-btn"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {password.length > 0 && (
                    <div className="rp-strength">
                      <div
                        className={`rp-strength-bar ${
                          password.length >= 12
                            ? "strong"
                            : password.length >= 8
                              ? "medium"
                              : "weak"
                        }`}
                      />
                      <span className="rp-strength-label">
                        {password.length >= 12 ? "Kuat" : password.length >= 8 ? "Cukup" : "Lemah"}
                      </span>
                    </div>
                  )}
                </div>

                <div className="login-field">
                  <label className="login-label" htmlFor="inv-confirm">
                    Konfirmasi Password
                  </label>
                  <div className="login-input-wrapper">
                    <span className="login-input-icon">
                      <Lock size={16} />
                    </span>
                    <input
                      id="inv-confirm"
                      type={showConfirm ? "text" : "password"}
                      className={`login-input login-input-password ${
                        confirmPassword.length > 0 && !passwordsMatch ? "rp-input-error" : ""
                      }`}
                      placeholder="Ulangi password baru"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      className="login-eye-btn"
                      onClick={() => setShowConfirm(!showConfirm)}
                      aria-label={showConfirm ? "Sembunyikan password" : "Tampilkan password"}
                    >
                      {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {confirmPassword.length > 0 && !passwordsMatch && (
                    <p className="rp-field-error">Password tidak cocok</p>
                  )}
                  {confirmPassword.length > 0 && passwordsMatch && (
                    <p className="rp-field-ok">✓ Password cocok</p>
                  )}
                </div>

                <button
                  type="submit"
                  className="login-btn"
                  disabled={loading || !passwordStrong || !passwordsMatch}
                >
                  {loading ? (
                    <>
                      <span className="login-spinner" aria-hidden="true" />
                      <span>Mengaktifkan...</span>
                    </>
                  ) : (
                    <>
                      <Lock size={17} />
                      <span>Aktifkan Akun</span>
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
            <>
              <div className="fp-success-wrap">
                <div className="fp-success-icon-ring">
                  <CheckCircle2 size={40} strokeWidth={1.8} />
                </div>

                <h1 className="login-form-title fp-success-title">Akun Berhasil Diaktifkan!</h1>
                <p className="fp-success-subtitle" style={{ marginBottom: "1.5rem" }}>
                  Password kamu telah dibuat dan akun owner kamu sudah aktif. Silakan login untuk
                  mulai mengelola vendor.
                </p>

                <div className="fp-info-box" style={{ textAlign: "left" }}>
                  <ul className="fp-info-list">
                    <li>
                      Akun kamu sekarang <strong>aktif</strong> dan siap digunakan
                    </li>
                    <li>
                      Login menggunakan <strong>email dan password</strong> yang baru dibuat
                    </li>
                  </ul>
                </div>
              </div>

              <Link
                href="/login"
                className="login-btn"
                style={{
                  textDecoration: "none",
                  display: "flex",
                  justifyContent: "center",
                  gap: "0.5rem",
                  marginTop: "1.5rem"
                }}
              >
                <ArrowLeft size={18} />
                <span>Login Sekarang</span>
              </Link>

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
