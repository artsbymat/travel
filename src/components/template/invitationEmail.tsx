/* eslint-disable @next/next/no-head-element */
import * as React from "react";

interface InvitationEmailProps {
  userName?: string;
  inviteToken: string;
  baseUrl: string;
  vendorName?: string;
  expiresInDays?: number;
}

export function InvitationEmail({
  userName = "Owner",
  inviteToken,
  baseUrl,
  vendorName,
  expiresInDays = 7
}: InvitationEmailProps) {
  const acceptUrl = `${baseUrl}/accept-invitation?token=${inviteToken}`;

  return (
    <html lang="id">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Undangan Akun Owner</title>
      </head>
      <body style={styles.body}>
        <table width="100%" cellPadding={0} cellSpacing={0} style={styles.outerTable}>
          <tbody>
            <tr>
              <td align="center" style={styles.outerTd}>
                <table width="100%" cellPadding={0} cellSpacing={0} style={styles.card}>
                  <tbody>
                    {/* Header */}
                    <tr>
                      <td style={styles.header}>
                        <table width="100%" cellPadding={0} cellSpacing={0}>
                          <tbody>
                            <tr>
                              <td align="center">
                                <div style={styles.logoWrap}>
                                  <svg
                                    width="32"
                                    height="32"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                  >
                                    <path
                                      d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"
                                      fill="white"
                                    />
                                  </svg>
                                </div>
                                <h1 style={styles.headerTitle}>Selamat Datang!</h1>
                                <p style={styles.headerSubtitle}>
                                  Kamu diundang sebagai Owner
                                  {vendorName ? ` — ${vendorName}` : ""}
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
                        <p style={styles.greeting}>
                          Halo, <strong>{userName}</strong>! 👋
                        </p>
                        <p style={styles.paragraph}>
                          Akun owner kamu telah dibuat oleh tim admin. Klik tombol di bawah ini
                          untuk mengaktifkan akun dan membuat password kamu sendiri.
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
                                  href={acceptUrl}
                                  style={styles.button}
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  🚀&nbsp;&nbsp;Aktifkan Akun Saya
                                </a>
                              </td>
                            </tr>
                          </tbody>
                        </table>

                        {/* URL Fallback */}
                        <p style={styles.fallbackLabel}>Atau salin link berikut ke browser kamu:</p>
                        <p style={styles.fallbackUrl}>{acceptUrl}</p>

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
                                    Link undangan ini hanya berlaku selama{" "}
                                    <strong>{expiresInDays} hari</strong> sejak email ini dikirim.
                                  </li>
                                  <li>
                                    Link hanya dapat digunakan <strong>satu kali</strong>.
                                  </li>
                                  <li>
                                    Jika kamu tidak merasa diundang, abaikan email ini dan hubungi
                                    admin segera.
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
    background: "linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%)",
    padding: "40px 40px 36px",
    textAlign: "center"
  },
  logoWrap: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: "56px",
    height: "56px",
    borderRadius: "16px",
    backgroundColor: "rgba(255,255,255,0.2)",
    marginBottom: "20px"
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
    fontSize: "15px",
    color: "rgba(255,255,255,0.85)",
    fontWeight: 400
  },
  body2: {
    padding: "40px"
  },
  greeting: {
    margin: "0 0 16px",
    fontSize: "18px",
    fontWeight: 600,
    color: "#1e293b"
  },
  paragraph: {
    margin: "0 0 16px",
    fontSize: "15px",
    lineHeight: "1.6",
    color: "#475569"
  },
  button: {
    display: "inline-block",
    backgroundColor: "#6366f1",
    color: "#ffffff",
    textDecoration: "none",
    padding: "14px 32px",
    borderRadius: "10px",
    fontSize: "15px",
    fontWeight: 600,
    letterSpacing: "0.01em"
  },
  fallbackLabel: {
    margin: "0 0 8px",
    fontSize: "13px",
    color: "#94a3b8"
  },
  fallbackUrl: {
    margin: "0 0 24px",
    fontSize: "13px",
    color: "#6366f1",
    wordBreak: "break-all"
  },
  divider: {
    border: "none",
    borderTop: "1px solid #e2e8f0",
    margin: "24px 0"
  },
  warningBox: {
    backgroundColor: "#fff7ed",
    borderRadius: "10px",
    border: "1px solid #fed7aa",
    marginBottom: "24px"
  },
  warningTitle: {
    margin: "0 0 10px",
    fontSize: "14px",
    fontWeight: 600,
    color: "#9a3412"
  },
  warningList: {
    margin: 0,
    paddingLeft: "20px",
    fontSize: "13px",
    lineHeight: "1.7",
    color: "#9a3412"
  },
  footer: {
    backgroundColor: "#f8fafc",
    padding: "24px 40px",
    textAlign: "center",
    borderTop: "1px solid #e2e8f0"
  },
  footerText: {
    margin: "0 0 4px",
    fontSize: "12px",
    color: "#94a3b8"
  }
};
