"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Download, Printer, Home, CheckCircle, Copy } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function ConfirmationPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tripId = searchParams.get("tripId") || "";
  const seats = searchParams.get("seats") || "";
  const amount = searchParams.get("amount") || "135000";
  const seatCount = seats.split(",").filter(Boolean).length;

  const bookingCode = `TH${Date.now().toString().slice(-6)}`.toUpperCase();
  const [copied, setCopied] = useState(false);

  const handleCopyBookingCode = () => {
    navigator.clipboard.writeText(bookingCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <main className="flex-1 max-w-7xl mx-auto w-full">
        <div className="border-b border-border bg-gradient-to-r from-accent/10 via-accent/5 to-background py-8">
          <div className="container px-4">
            <div className="text-center">
              <div className="mb-4 flex justify-center">
                <div className="relative">
                  <div className="absolute inset-0 animate-pulse rounded-full bg-accent/30 blur-lg"></div>
                  <CheckCircle className="relative h-16 w-16 " />
                </div>
              </div>
              <h1 className="mb-2 text-3xl font-bold text-foreground">
                Booking Dikonfirmasi!
              </h1>
              <p className="text-lg text-muted-foreground">
                Proses pembayaran Anda berhasil
              </p>
            </div>
          </div>
        </div>

        <div className="container px-4 py-8">
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              <Card className="p-6 border-l-4 border-l-accent">
                <h2 className="mb-4 text-xl font-semibold text-foreground">
                  Kode Booking Anda
                </h2>
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground uppercase font-semibold mb-1">
                      Referensi Pemesanan
                    </p>
                    <p className="text-3xl font-bold text-primary font-mono">
                      {bookingCode}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCopyBookingCode}
                    className="flex-shrink-0 bg-transparent"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    {copied ? "Copied!" : "Copy"}
                  </Button>
                </div>
                <p className="mt-3 text-sm text-muted-foreground">
                  Simpan kode ini untuk check-in dan pertanyaan
                </p>
              </Card>

              <Card className="p-6">
                <h3 className="mb-6 text-lg font-semibold text-foreground">
                  Detail Perjalanan
                </h3>

                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                    <div>
                      <p className="text-xs text-muted-foreground uppercase font-semibold mb-2">
                        Dari
                      </p>
                      <p className="text-lg font-bold text-foreground">
                        Jakarta
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase font-semibold mb-2">
                        Ke
                      </p>
                      <p className="text-lg font-bold text-foreground">
                        Bandung
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase font-semibold mb-2">
                        Tanggal
                      </p>
                      <p className="text-lg font-bold text-foreground">
                        Jan 15, 2025
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase font-semibold mb-2">
                        Durasi
                      </p>
                      <p className="text-lg font-bold text-foreground">
                        3h 30m
                      </p>
                    </div>
                  </div>

                  <div className="border-t border-border pt-6">
                    <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                      <div>
                        <p className="text-xs text-muted-foreground uppercase font-semibold mb-2">
                          Vendor
                        </p>
                        <p className="font-semibold text-foreground">
                          Ramayana Express
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground uppercase font-semibold mb-2">
                          Tipe Kendaraan
                        </p>
                        <p className="font-semibold text-foreground">
                          HiAce (13 seats)
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground uppercase font-semibold mb-2">
                          Seats
                        </p>
                        <p className="font-semibold text-foreground">{seats}</p>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-border pt-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground uppercase font-semibold mb-2">
                          Keberangkatan
                        </p>
                        <p className="text-lg font-bold text-foreground">
                          08:00 AM
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground uppercase font-semibold mb-2">
                          Kedatangan
                        </p>
                        <p className="text-lg font-bold text-foreground">
                          11:30 AM
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="mb-6 text-lg font-semibold text-foreground">
                  Informasi Penumpang
                </h3>

                <div className="space-y-4">
                  {Array.from({ length: seatCount }).map((_, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between rounded-lg bg-secondary/30 p-4"
                    >
                      <div>
                        <p className="font-semibold text-foreground">
                          Penumpang {idx + 1}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Seat {seats.split(",")[idx]}
                        </p>
                      </div>
                      <Badge variant="secondary">Confirmed</Badge>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="mb-6 text-lg font-semibold text-foreground">
                  Pickup & Dropoff Locations
                </h3>

                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <p className="mb-2 text-sm font-semibold text-foreground uppercase">
                      Pickup Point
                    </p>
                    <div className="rounded-lg bg-secondary/30 p-4">
                      <p className="font-semibold text-foreground mb-1">
                        Jakarta Bus Terminal
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Jl. Merdeka No. 123, Jakarta Pusat
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className="mb-2 text-sm font-semibold text-foreground uppercase">
                      Dropoff Point
                    </p>
                    <div className="rounded-lg bg-secondary/30 p-4">
                      <p className="font-semibold text-foreground mb-1">
                        Bandung City Center
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Jl. Diponegoro No. 456, Bandung
                      </p>
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="mb-6 text-lg font-semibold text-foreground">
                  Vendor Contact Information
                </h3>

                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-border pb-3">
                    <span className="text-muted-foreground">Phone</span>
                    <span className="font-semibold text-foreground">
                      +62 812 3456 7890
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-b border-border pb-3">
                    <span className="text-muted-foreground">Email</span>
                    <span className="font-semibold text-foreground">
                      support@ramayanaexpress.id
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Live Chat</span>
                    <span className="font-semibold">Available 24/7</span>
                  </div>
                </div>
              </Card>

              <div className="grid gap-3 md:grid-cols-2">
                <Button
                  type="button"
                  variant="outline"
                  className="font-semibold py-6 bg-transparent"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Ticket
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="font-semibold py-6 bg-transparent"
                >
                  <Printer className="h-4 w-4 mr-2" />
                  Print Ticket
                </Button>
              </div>
            </div>

            <div className="lg:col-span-1">
              <Card className="sticky top-20 p-6">
                <h3 className="mb-6 text-lg font-semibold text-foreground">
                  Payment Summary
                </h3>

                <div className="space-y-3 border-b border-border pb-4 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      Price per Seat
                    </span>
                    <span className="font-semibold text-foreground">
                      Rp 45,000
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      Number of Seats
                    </span>
                    <span className="font-semibold text-foreground">
                      {seatCount}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-semibold text-foreground">
                      Rp {(45000 * seatCount).toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="mb-6 flex justify-between">
                  <span className="font-semibold text-foreground">
                    Total Paid
                  </span>
                  <span className="text-2xl font-bold text-primary">
                    Rp {amount}
                  </span>
                </div>

                <div className="rounded-lg bg-accent/10 p-3 mb-6 border border-accent/20">
                  <p className="text-xs font-semibold text-accent mb-1">
                    Payment Status
                  </p>
                  <p className="text-sm font-bold text-accent">
                    Successfully Processed
                  </p>
                </div>

                <div className="space-y-2 text-xs text-muted-foreground mb-6">
                  <p className="flex items-center gap-2">
                    <span className="text-accent">✓</span>Booking confirmed
                  </p>
                  <p className="flex items-center gap-2">
                    <span className="text-accent">✓</span>Payment received
                  </p>
                  <p className="flex items-center gap-2">
                    <span className="text-accent">✓</span>Confirmation sent to
                    email
                  </p>
                </div>

                <Button
                  onClick={() => router.push("/")}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-6"
                >
                  <Home className="h-4 w-4 mr-2" />
                  Back to Home
                </Button>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
