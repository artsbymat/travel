/* eslint-disable @next/next/no-head-element */
import * as React from "react";

interface ResetPasswordEmailProps {
  userName?: string;
  resetToken: string;
  baseUrl: string;
  expiresInHours?: number;
}

export function ResetPasswordEmail({
  userName = "Pengguna",
  resetToken,
  baseUrl,
  expiresInHours = 1
}: ResetPasswordEmailProps) {
  const resetUrl = `${baseUrl}/reset-password-form?token=${resetToken}`;

  return (
    <html lang="id">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Reset Password</title>
      </head>
      <body style={styles.body}>
        <table width="100%" cellPadding={0} cellSpacing={0} style={styles.outerTable}>
          <tbody>
            <tr>
              <td align="center" style={styles.outerTd}>
                {/* Card Container */}
                <table width="100%" cellPadding={0} cellSpacing={0} style={styles.card}>
                  <tbody>
                    {/* Header */}
                    <tr>
                      <td style={styles.header}>
                        <table width="100%" cellPadding={0} cellSpacing={0}>
                          <tbody>
                            <tr>
                              <td align="center">
                                {/* Logo / Icon */}
                                <div style={styles.logoWrap}>
                                  <svg
                                    width="32"
                                    height="32"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                  >
                                    <path
                                      d="M12 1C8.676 1 6 3.676 6 7v1H4a1 1 0 0 0-1 1v13a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V9a1 1 0 0 0-1-1h-2V7c0-3.324-2.676-6-6-6zm0 2c2.276 0 4 1.724 4 4v1H8V7c0-2.276 1.724-4 4-4zm0 9a2 2 0 1 1 0 4 2 2 0 0 1 0-4z"
                                      fill="white"
                                    />
                                  </svg>
                                </div>
                                <h1 style={styles.headerTitle}>Reset Password</h1>
                                <p style={styles.headerSubtitle}>
                                  Permintaan reset password diterima
                                </p>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </td>
                    </tr>

                    {/* Body */}
                    <tr>
                      <td style={styles.body2}>
                        {/* Greeting */}
                        <p style={styles.greeting}>
                          Halo, <strong>{userName}</strong>! 👋
                        </p>
                        <p style={styles.paragraph}>
                          Kami menerima permintaan untuk mereset password akun kamu. Klik tombol di
                          bawah ini untuk membuat password baru.
                        </p>

                        {/* CTA Button */}
                        <table
                          width="100%"
                          cellPadding={0}
                          cellSpacing={0}
                          style={{ margin: "32px 0" }}
                        >
                          <tbody>
                            <tr>
                              <td align="center">
                                <a
                                  href={resetUrl}
                                  style={styles.button}
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  🔑&nbsp;&nbsp;Reset Password Sekarang
                                </a>
                              </td>
                            </tr>
                          </tbody>
                        </table>

                        {/* URL Fallback */}
                        <p style={styles.fallbackLabel}>Atau salin link berikut ke browser kamu:</p>
                        <p style={styles.fallbackUrl}>{resetUrl}</p>

                        {/* Divider */}
                        <hr style={styles.divider} />

                        {/* Warning Box */}
                        <table
                          width="100%"
                          cellPadding={0}
                          cellSpacing={0}
                          style={styles.warningBox}
                        >
                          <tbody>
                            <tr>
                              <td style={{ padding: "16px 20px" }}>
                                <p style={styles.warningTitle}>⚠️ Penting untuk diperhatikan</p>
                                <ul style={styles.warningList}>
                                  <li>
                                    Link ini hanya berlaku selama{" "}
                                    <strong>{expiresInHours} jam</strong> sejak email ini dikirim.
                                  </li>
                                  <li>
                                    Link hanya dapat digunakan <strong>satu kali</strong>.
                                  </li>
                                  <li>
                                    Jika kamu tidak meminta reset password, abaikan email ini.
                                    Password kamu tidak akan berubah.
                                  </li>
                                </ul>
                              </td>
                            </tr>
                          </tbody>
                        </table>

                        <p style={styles.paragraph}>
                          Jika kamu mengalami kendala, hubungi tim support kami kapan saja.
                        </p>

                        <p style={{ ...styles.paragraph, marginTop: "24px" }}>
                          Salam hangat,
                          <br />
                          <strong>Tim Travel App</strong>
                        </p>
                      </td>
                    </tr>

                    {/* Footer */}
                    <tr>
                      <td style={styles.footer}>
                        <p style={styles.footerText}>
                          Email ini dikirim secara otomatis. Mohon jangan membalas email ini.
                        </p>
                        <p style={styles.footerText}>
                          © {new Date().getFullYear()} Travel App. Semua hak dilindungi.
                        </p>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table>
      </body>
    </html>
  );
}

const styles: Record<string, React.CSSProperties> = {
  body: {
    margin: 0,
    padding: 0,
    backgroundColor: "#f1f5f9",
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
  },
  outerTable: {
    width: "100%",
    backgroundColor: "#f1f5f9",
    padding: "40px 16px"
  },
  outerTd: {
    padding: "40px 16px"
  },
  card: {
    maxWidth: "520px",
    width: "100%",
    backgroundColor: "#ffffff",
    borderRadius: "16px",
    overflow: "hidden",
    boxShadow: "0 4px 6px -1px rgba(0,0,0,0.07), 0 2px 4px -1px rgba(0,0,0,0.04)",
    margin: "0 auto"
  },
  header: {
    background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
    padding: "40px 40px 36px",
    textAlign: "center"
  },
  logoWrap: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: "60px",
    height: "60px",
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: "16px",
    marginBottom: "16px"
  },
  headerTitle: {
    margin: "0 0 8px",
    fontSize: "26px",
    fontWeight: 700,
    color: "#ffffff",
    letterSpacing: "-0.5px"
  },
  headerSubtitle: {
    margin: 0,
    fontSize: "14px",
    color: "rgba(255,255,255,0.8)"
  },
  body2: {
    padding: "40px"
  },
  greeting: {
    margin: "0 0 12px",
    fontSize: "18px",
    color: "#1e293b",
    fontWeight: 500
  },
  paragraph: {
    margin: "0 0 16px",
    fontSize: "15px",
    lineHeight: "1.7",
    color: "#475569"
  },
  button: {
    display: "inline-block",
    padding: "14px 36px",
    background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
    color: "#ffffff",
    fontSize: "15px",
    fontWeight: 600,
    textDecoration: "none",
    borderRadius: "10px",
    letterSpacing: "0.2px",
    boxShadow: "0 4px 14px rgba(99,102,241,0.4)"
  },
  fallbackLabel: {
    margin: "0 0 8px",
    fontSize: "13px",
    color: "#94a3b8",
    textAlign: "center"
  },
  fallbackUrl: {
    margin: "0 0 28px",
    fontSize: "12px",
    color: "#6366f1",
    textAlign: "center",
    wordBreak: "break-all",
    textDecoration: "underline"
  },
  divider: {
    border: "none",
    borderTop: "1px solid #e2e8f0",
    margin: "28px 0"
  },
  warningBox: {
    backgroundColor: "#fefce8",
    borderRadius: "10px",
    border: "1px solid #fde68a",
    marginBottom: "24px"
  },
  warningTitle: {
    margin: "0 0 10px",
    fontSize: "13px",
    fontWeight: 600,
    color: "#92400e"
  },
  warningList: {
    margin: 0,
    paddingLeft: "18px",
    fontSize: "13px",
    color: "#78350f",
    lineHeight: "1.8"
  },
  footer: {
    backgroundColor: "#f8fafc",
    padding: "24px 40px",
    borderTop: "1px solid #e2e8f0",
    textAlign: "center"
  },
  footerText: {
    margin: "0 0 4px",
    fontSize: "12px",
    color: "#94a3b8",
    lineHeight: "1.6"
  }
};
