"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, Lock } from "lucide-react";
import { PaymentMethodSelector } from "@/components/public/payment-method-selector";
import { PromoCodeInput } from "@/components/public/promo-code-input";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

export default function PaymentPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tripId = searchParams.get("tripId") || "";
  const seats = searchParams.get("seats") || "";
  const seatCount = seats.split(",").filter(Boolean).length;

  const [selectedPaymentMethod, setSelectedPaymentMethod] =
    useState("bank-transfer");
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const basePrice = 45000 * seatCount;
  const discountAmount = Math.floor(basePrice * promoDiscount);
  const finalPrice = basePrice - discountAmount;

  const handlePayment = () => {
    if (!termsAccepted) return;

    setIsProcessing(true);
    setTimeout(() => {
      router.push(
        `/confirmation?tripId=${tripId}&seats=${seats}&amount=${finalPrice}`,
      );
    }, 1500);
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <main className="flex-1 max-w-7xl mx-auto w-full">
        <div className="container px-4 py-8">
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <div className="mb-8">
                <h1 className="mb-2 text-3xl font-bold text-foreground">
                  Pembayaran
                </h1>
                <p className="text-muted-foreground">
                  Pilih metode pembayaran Anda dan selesaikan pemesanan
                </p>
              </div>

              <div className="space-y-6">
                <Card className="p-6 border-l-4 border-l-accent">
                  <h3 className="mb-4 text-lg font-semibold text-foreground">
                    Ringkasan Pesanan
                  </h3>
                  <div className="space-y-3 border-b border-border pb-4 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Trip</span>
                      <span className="font-semibold text-foreground">
                        Jakarta → Bandung
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        Tanggal {"&"} Waktu
                      </span>
                      <span className="font-semibold text-foreground">
                        Jan 15, 2025 at 08:00 AM
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Vendor</span>
                      <span className="font-semibold text-foreground">
                        Ramayana Express
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        Jumlah Penumpang
                      </span>
                      <span className="font-semibold text-foreground">
                        {seatCount}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Harga Dasar</span>
                      <span className="font-semibold text-foreground">
                        Rp {basePrice.toLocaleString()}
                      </span>
                    </div>
                    {promoDiscount > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Diskon</span>
                        <span className="font-semibold text-accent">
                          -Rp {discountAmount.toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold text-foreground">
                      Total Pembayaran
                    </span>
                    <span className="text-2xl font-bold text-primary">
                      Rp {finalPrice.toLocaleString()}
                    </span>
                  </div>
                </Card>

                <PaymentMethodSelector onSelect={setSelectedPaymentMethod} />

                <PromoCodeInput
                  onApply={(discount) => setPromoDiscount(discount)}
                  onRemove={() => setPromoDiscount(0)}
                />

                <Card className="p-4 bg-accent/10 border border-accent/20">
                  <div className="flex gap-3">
                    <Lock className="h-5 w-5 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-foreground text-sm mb-1">
                        Keamanan Pembayaran Terjamin
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Semua informasi pembayaran dienkripsi dan diproses
                        dengan aman. Pemesanan Anda dilindungi dengan kebijakan
                        pembatalan gratis 24 jam kami.
                      </p>
                    </div>
                  </div>
                </Card>

                <Card className="p-6">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <Checkbox
                      checked={termsAccepted}
                      onCheckedChange={(checked) =>
                        setTermsAccepted(checked as boolean)
                      }
                      className="mt-1 flex-shrink-0"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">
                        Saya setuju dengan syarat dan ketentuan
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Dengan mencentang kotak ini, saya menyatakan bahwa saya
                        telah membaca dan menyetujui syarat dan ketentuan yang
                        berlaku untuk pemesanan ini.
                      </p>
                    </div>
                  </label>
                </Card>

                <Button
                  onClick={handlePayment}
                  disabled={!termsAccepted || isProcessing}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-6 text-base disabled:opacity-50"
                >
                  {isProcessing ? "Pembayaran diproses" : "Bayar Sekarang"}
                </Button>
              </div>
            </div>

            <div className="lg:col-span-1">
              <Card className="sticky top-20 p-6">
                <h3 className="mb-4 text-lg font-semibold text-foreground">
                  Booking Details
                </h3>

                <div className="space-y-3 border-b border-border pb-4 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Vendor</span>
                    <span className="font-semibold text-foreground">
                      Ramayana
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Route</span>
                    <span className="font-semibold text-foreground">
                      Jakarta → Bandung
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Vehicle</span>
                    <span className="font-semibold text-foreground">
                      HiAce (13 seats)
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Departure</span>
                    <span className="font-semibold text-foreground">
                      08:00 AM
                    </span>
                  </div>
                </div>

                <div className="space-y-2 text-xs text-muted-foreground">
                  <p className="flex items-center gap-2">
                    <span className="text-accent">✓</span>Free cancellation 24h
                  </p>
                  <p className="flex items-center gap-2">
                    <span className="text-accent">✓</span>Instant confirmation
                  </p>
                  <p className="flex items-center gap-2">
                    <span className="text-accent">✓</span>Secure payment
                  </p>
                  <p className="flex items-center gap-2">
                    <span className="text-accent">✓</span>Live tracking
                  </p>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
