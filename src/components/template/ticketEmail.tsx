/* eslint-disable @next/next/no-head-element */
import * as React from "react";

interface TicketEmailProps {
  customerName: string;
  bookingCode: string;
  ticketUrl: string;
  route: string;
  departureDate: string;
  departureTime: string;
  seats: string;
  passengerCount: number;
  pickup: string;
  dropoff: string;
  vehicle: string;
  licensePlate: string;
  totalAmount: string;
}

export function TicketEmail({
  customerName,
  bookingCode,
  ticketUrl,
  route,
  departureDate,
  departureTime,
  seats,
  passengerCount,
  pickup,
  dropoff,
  vehicle,
  licensePlate,
  totalAmount
}: TicketEmailProps) {
  return (
    <html lang="id">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Tiket Digital {bookingCode}</title>
      </head>
      <body style={styles.body}>
        <table width="100%" cellPadding={0} cellSpacing={0} style={styles.outerTable}>
          <tbody>
            <tr>
              <td align="center" style={styles.outerTd}>
                <table width="100%" cellPadding={0} cellSpacing={0} style={styles.card}>
                  <tbody>
                    <tr>
                      <td style={styles.header}>
                        <p style={styles.kicker}>Tiket Digital</p>
                        <h1 style={styles.headerTitle}>Pembayaran Berhasil</h1>
                        <p style={styles.headerSubtitle}>{bookingCode}</p>
                      </td>
                    </tr>

                    <tr>
                      <td style={styles.body2}>
                        <p style={styles.greeting}>
                          Halo, <strong>{customerName}</strong>.
                        </p>
                        <p style={styles.paragraph}>
                          Pembayaran Anda sudah kami terima. Tiket digital untuk perjalanan berikut
                          sudah aktif dan dapat ditunjukkan saat boarding.
                        </p>

                        <table width="100%" cellPadding={0} cellSpacing={0} style={styles.ticketBox}>
                          <tbody>
                            <tr>
                              <td style={styles.route}>{route}</td>
                            </tr>
                            <tr>
                              <td style={styles.bookingCode}>{bookingCode}</td>
                            </tr>
                          </tbody>
                        </table>

                        <table width="100%" cellPadding={0} cellSpacing={0} style={styles.detailTable}>
                          <tbody>
                            <DetailRow label="Tanggal" value={departureDate} />
                            <DetailRow label="Jam" value={departureTime} />
                            <DetailRow label="Kursi" value={seats} />
                            <DetailRow label="Penumpang" value={`${passengerCount} orang`} />
                            <DetailRow label="Jemput" value={pickup} />
                            <DetailRow label="Antar" value={dropoff} />
                            <DetailRow label="Armada" value={`${vehicle} (${licensePlate})`} />
                            <DetailRow label="Total Bayar" value={totalAmount} strong />
                          </tbody>
                        </table>

                        <table width="100%" cellPadding={0} cellSpacing={0} style={{ margin: "28px 0" }}>
                          <tbody>
                            <tr>
                              <td align="center">
                                <a
                                  href={ticketUrl}
                                  style={styles.button}
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  Buka Tiket Digital
                                </a>
                              </td>
                            </tr>
                          </tbody>
                        </table>

                        <p style={styles.fallbackLabel}>Atau salin link berikut ke browser:</p>
                        <p style={styles.fallbackUrl}>{ticketUrl}</p>

                        <hr style={styles.divider} />

                        <p style={styles.paragraph}>
                          Pastikan data tiket sesuai. Simpan email ini dan tunjukkan tiket digital
                          kepada driver atau staff saat keberangkatan.
                        </p>
                      </td>
                    </tr>

                    <tr>
                      <td style={styles.footer}>
                        <p style={styles.footerText}>
                          Email ini dikirim otomatis setelah pembayaran berhasil.
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

function DetailRow({
  label,
  value,
  strong = false
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <tr>
      <td style={styles.detailLabel}>{label}</td>
      <td style={strong ? styles.detailValueStrong : styles.detailValue}>{value}</td>
    </tr>
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
    maxWidth: "560px",
    width: "100%",
    backgroundColor: "#ffffff",
    borderRadius: "16px",
    overflow: "hidden",
    boxShadow: "0 4px 6px -1px rgba(0,0,0,0.07), 0 2px 4px -1px rgba(0,0,0,0.04)",
    margin: "0 auto"
  },
  header: {
    background: "linear-gradient(135deg, #0d9488 0%, #0f766e 100%)",
    padding: "36px 40px 32px",
    textAlign: "center"
  },
  kicker: {
    margin: "0 0 10px",
    color: "#ccfbf1",
    fontSize: "12px",
    fontWeight: 700,
    letterSpacing: "1.8px",
    textTransform: "uppercase"
  },
  headerTitle: {
    margin: "0 0 8px",
    fontSize: "28px",
    fontWeight: 700,
    color: "#ffffff"
  },
  headerSubtitle: {
    margin: 0,
    color: "#ffffff",
    fontSize: "15px",
    fontWeight: 700,
    letterSpacing: "1px"
  },
  body2: {
    padding: "32px 36px"
  },
  greeting: {
    margin: "0 0 14px",
    color: "#0f172a",
    fontSize: "16px",
    lineHeight: 1.6
  },
  paragraph: {
    margin: "0 0 18px",
    color: "#475569",
    fontSize: "14px",
    lineHeight: 1.7
  },
  ticketBox: {
    margin: "24px 0",
    border: "1px solid #ccfbf1",
    backgroundColor: "#f0fdfa",
    borderRadius: "14px",
    padding: "18px"
  },
  route: {
    padding: "18px 18px 8px",
    color: "#0f172a",
    fontSize: "20px",
    fontWeight: 800,
    textAlign: "center"
  },
  bookingCode: {
    padding: "0 18px 18px",
    color: "#0f766e",
    fontSize: "13px",
    fontWeight: 800,
    letterSpacing: "1.4px",
    textAlign: "center"
  },
  detailTable: {
    borderCollapse: "collapse",
    width: "100%",
    marginTop: "8px"
  },
  detailLabel: {
    width: "34%",
    padding: "12px 0",
    borderBottom: "1px solid #e2e8f0",
    color: "#64748b",
    fontSize: "12px",
    fontWeight: 700,
    textTransform: "uppercase"
  },
  detailValue: {
    padding: "12px 0",
    borderBottom: "1px solid #e2e8f0",
    color: "#0f172a",
    fontSize: "14px",
    fontWeight: 600,
    textAlign: "right"
  },
  detailValueStrong: {
    padding: "12px 0",
    borderBottom: "1px solid #e2e8f0",
    color: "#0f766e",
    fontSize: "15px",
    fontWeight: 800,
    textAlign: "right"
  },
  button: {
    display: "inline-block",
    backgroundColor: "#0f766e",
    color: "#ffffff",
    textDecoration: "none",
    borderRadius: "12px",
    padding: "14px 24px",
    fontSize: "14px",
    fontWeight: 800
  },
  fallbackLabel: {
    margin: "0 0 8px",
    color: "#64748b",
    fontSize: "12px",
    fontWeight: 700
  },
  fallbackUrl: {
    margin: 0,
    padding: "12px",
    backgroundColor: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: "10px",
    color: "#0f766e",
    fontSize: "12px",
    lineHeight: 1.5,
    wordBreak: "break-all"
  },
  divider: {
    border: "none",
    borderTop: "1px solid #e2e8f0",
    margin: "28px 0"
  },
  footer: {
    backgroundColor: "#f8fafc",
    padding: "22px 36px",
    textAlign: "center",
    borderTop: "1px solid #e2e8f0"
  },
  footerText: {
    margin: "4px 0",
    color: "#94a3b8",
    fontSize: "12px",
    lineHeight: 1.5
  }
};
