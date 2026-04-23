import Link from "next/link";

export default function ForbiddenPage() {
    return (
        <div style={{
            minHeight: "100svh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: "#f1f5f9",
            fontFamily: "inherit",
            textAlign: "center",
            padding: "2rem",
        }}>
            <div style={{
                fontSize: "5rem",
                fontWeight: 900,
                color: "#e2e8f0",
                lineHeight: 1,
                letterSpacing: "-0.05em",
            }}>403</div>
            <h1 style={{
                marginTop: "1rem",
                fontSize: "1.5rem",
                fontWeight: 700,
                color: "#0f172a",
            }}>Akses Ditolak</h1>
            <p style={{
                marginTop: "0.5rem",
                fontSize: "0.95rem",
                color: "#64748b",
                maxWidth: "360px",
            }}>
                Kamu tidak memiliki izin untuk mengakses halaman ini. Hubungi admin jika kamu merasa ini keliru.
            </p>
            <Link href="/login" style={{
                marginTop: "2rem",
                padding: "0.75rem 1.75rem",
                background: "linear-gradient(135deg, #0a2e2a, #0d9488)",
                color: "#fff",
                borderRadius: "12px",
                fontWeight: 700,
                fontSize: "0.9rem",
                textDecoration: "none",
                boxShadow: "0 4px 16px rgba(13,148,136,0.3)",
            }}>
                Kembali ke Login
            </Link>
        </div>
    );
}
