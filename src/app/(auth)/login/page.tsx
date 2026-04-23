"use client";

import "./login.css";
import { useState } from "react";
import { signIn, getSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { Eye, EyeOff, Mail, Lock, ArrowRight, Car } from "lucide-react";

// Redirect per role — tambah/edit sesuai kebutuhan
function getDashboardUrl(role?: string): string {
  switch (role) {
    case "SUPER_ADMIN": return "/admin";
    case "OWNER":       return "/dashboard";
    case "STAFF":       return "/staff";
    case "DRIVER":      return "/driver";
    default:            return "/login";
  }
}

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await signIn("credentials", {
      redirect: false,
      email,
      password,
      callbackUrl,
    });

    setLoading(false);

    if (res?.error) {
      setError(
        res.error === "User not found"
          ? "Email tidak ditemukan. Periksa kembali email Anda."
          : res.error === "Wrong password"
          ? "Password salah. Silakan coba lagi."
          : "Gagal login. Periksa email dan password Anda."
      );
    } else if (res?.ok) {
      // Ambil session untuk tau role, lalu arahkan ke dashboard yang sesuai
      const session = await getSession();
      const destination = callbackUrl || getDashboardUrl(session?.user?.role);
      router.push(destination);
    }
  };

  return (
    <div className="login-wrapper">
      {/* ─── LEFT PANEL ─── */}
      <div className="login-left">
        {/* Background decorative grid */}
        <div className="login-left-grid" aria-hidden="true" />
        {/* Glow orb */}
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
            Your journey,
            <br />
            <span className="login-headline-accent">happy &amp; refined.</span>
          </h2>
          <p className="login-subtext">
            The friendliest executive transport on the planet.
            <br />
            Hop in for a smooth, fluid ride.
          </p>

          {/* Social proof */}
          <div className="login-social-proof">
            <div className="login-avatars">
              {["/Container.png", "/Container.png", "/Container.png"].map(
                (src, i) => (
                  <Image
                    key={i}
                    src={src}
                    alt="Partner avatar"
                    width={36}
                    height={36}
                    className="login-avatar-img"
                    style={{ zIndex: 3 - i }}
                  />
                )
              )}
            </div>
            <div className="login-social-text">
              <span className="login-social-count">2,000+</span>
              <span className="login-social-label">happy travel partners!</span>
            </div>
          </div>
        </div>

        {/* Bottom decorative badge */}
        <div className="login-badge">
          <span className="login-badge-dot" />
          <span>Trusted by enterprise fleets worldwide</span>
        </div>
      </div>

      {/* ─── RIGHT PANEL ─── */}
      <div className="login-right">
        <div className="login-form-container">
          {/* Form header */}
          <div className="login-form-header">
            <h1 className="login-form-title">Welcome Back!</h1>
            <p className="login-form-subtitle">
              Ready for your next adventure?
            </p>
          </div>

          {/* Error alert */}
          {error && (
            <div className="login-error" role="alert" id="login-error-msg">
              <span className="login-error-icon">⚠</span>
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="login-form" noValidate>
            {/* Email field */}
            <div className="login-field">
              <label className="login-label" htmlFor="login-email">
                Email Address
              </label>
              <div className="login-input-wrapper">
                <span className="login-input-icon">
                  <Mail size={16} />
                </span>
                <input
                  id="login-email"
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

            {/* Password field */}
            <div className="login-field">
              <div className="login-label-row">
                <label className="login-label" htmlFor="login-password">
                  Password
                </label>
                <button type="button" className="login-forgot">
                  Forgot password?
                </button>
              </div>
              <div className="login-input-wrapper">
                <span className="login-input-icon">
                  <Lock size={16} />
                </span>
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  className="login-input login-input-password"
                  placeholder="••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="login-eye-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit button */}
            <button
              id="login-submit-btn"
              type="submit"
              className="login-btn"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="login-spinner" aria-hidden="true" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Log In to FluxFleet</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <p className="login-footer-text">
            Don&apos;t have an account?{" "}
            <a href="#" className="login-footer-link">
              Request Access
            </a>
          </p>

          <div className="login-divider">
            <span className="login-divider-line" />
            <span className="login-divider-text">secured by FluxFleet</span>
            <span className="login-divider-line" />
          </div>
        </div>
      </div>
    </div>
  );
}
