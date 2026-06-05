"use client";

import { useMemo, useState, useEffect } from "react";
import Image from "next/image";
import dynamic from "next/dynamic";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  AirVent,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
  CreditCard,
  Phone,
  ShieldCheck,
  Smartphone,
  Usb,
  User,
  Wallet,
  Wifi,
  Loader2,
  Lock,
  Gift,
  Coins
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { SteeringWheel } from "@/components/icons";

const LeafletMapPicker = dynamic(() => import("@/components/map/LeafletMapPicker"), { ssr: false });

type SeatStatus = "available" | "booked" | "locked";

interface Seat {
  id: string;
  row: number;
  column: number;
  status: SeatStatus;
}

interface Passenger {
  fullName: string;
  phone: string;
  identityNumber: string;
}

interface Contact {
  name: string;
  phone: string;
  email: string;
  pickupAddress: string;
  pickupLat: number | null;
  pickupLng: number | null;
  dropoffAddress: string;
  notes: string;
}

const currencyFormatter = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  minimumFractionDigits: 0
});

function createPassengers(count: number): Passenger[] {
  return Array.from({ length: count }, () => ({
    fullName: "",
    phone: "",
    identityNumber: ""
  }));
}

function getPassengerCount(value: string | null) {
  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed < 1) {
    return 1;
  }

  return Math.min(Math.floor(parsed), 8);
}

export default function DetailTrip() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const tripId = params.id as string;
  const passengerCount = getPassengerCount(searchParams.get("passengers"));
  
  // Dynamic database states
  const [trip, setTrip] = useState<any>(null);
  const [seatLayout, setSeatLayout] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submittingBooking, setSubmittingBooking] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);

  // Active created booking states for Payment Simulation Card
  const [createdBooking, setCreatedBooking] = useState<any>(null);
  const [paymentSimulating, setPaymentSimulating] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // Form states
  const [step, setStep] = useState<"booking" | "payment">("booking");
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [passengers, setPassengers] = useState<Passenger[]>(() => createPassengers(passengerCount));
  const [contact, setContact] = useState<Contact>({
    name: "",
    phone: "",
    email: "",
    pickupAddress: "",
    pickupLat: null,
    pickupLng: null,
    dropoffAddress: "",
    notes: ""
  });
  const [agreed, setAgreed] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("qris");

  // 1. Fetch trip details and seats live on mount
  useEffect(() => {
    async function loadTripDetail() {
      try {
        setLoading(true);
        const res = await fetch(`/api/public/trips/${tripId}`);
        if (res.ok) {
          const data = await res.json();
          setTrip(data.trip);
          setSeatLayout(data.seatLayout);
          
          // Pre-fill addresses based on origin/destination details
          setContact((prev) => ({
            ...prev,
            dropoffAddress: data.trip.dropoffPoint || ""
          }));
        } else {
          setBookingError("Gagal memuat jadwal perjalanan.");
        }
      } catch (err) {
        console.error("Error loading trip detail:", err);
        setBookingError("Gagal memuat jadwal perjalanan.");
      } finally {
        setLoading(false);
      }
    }
    if (tripId) {
      loadTripDetail();
    }
  }, [tripId]);

  // 2. Dynamically build payment methods list based on vendor options in DB
  const paymentMethods = useMemo(() => {
    const list = [
      {
        id: "qris",
        name: "QRIS",
        description: "Scan QR dari mobile banking atau e-wallet.",
        icon: Smartphone
      },
      {
        id: "e-wallet",
        name: "E-Wallet",
        description: "Bayar dengan dompet digital pilihan Anda.",
        icon: Wallet
      },
      {
        id: "virtual-account",
        name: "Virtual Account",
        description: "Transfer bank otomatis dengan kode pembayaran.",
        icon: CreditCard
      }
    ];

    if (trip?.vendor?.acceptCash) {
      list.push({
        id: "cash",
        name: "Bayar di Tempat (Cash)",
        description: "Bayar tunai langsung saat boarding ke staff/driver.",
        icon: Coins
      });
    }

    return list;
  }, [trip]);

  const seatTotal = useMemo(() => {
    if (!trip) return 0;
    return trip.pricePerSeat * passengerCount;
  }, [trip, passengerCount]);

  // Dynamically calculate the service fee as vendor's platform fee percentage
  const serviceFee = useMemo(() => {
    if (!trip) return 0;
    const rate = trip.platformFeeRate || 2.0;
    return seatTotal * (rate / 100);
  }, [trip, seatTotal]);

  const totalPrice = useMemo(() => {
    if (!trip) return 0;
    return seatTotal + serviceFee;
  }, [trip, seatTotal, serviceFee]);

  const isPassengerDataComplete = passengers.every(
    (passenger) => passenger.fullName.trim() && passenger.phone.trim()
  );
  const isContactComplete =
    contact.name.trim() &&
    contact.phone.trim() &&
    contact.email.trim() &&
    contact.pickupAddress.trim() &&
    contact.dropoffAddress.trim();
  const canContinue =
    selectedSeats.length === passengerCount &&
    isPassengerDataComplete &&
    isContactComplete &&
    agreed;

  const selectedSeatLabel = selectedSeats.length ? selectedSeats.join(", ") : "Belum dipilih";

  const seatByPosition = useMemo(() => {
    if (!seatLayout) return new Map();
    return new Map(seatLayout.seats.map((seat: any) => [`${seat.row}-${seat.column}`, seat]));
  }, [seatLayout]);

  const toggleSeat = (seat: Seat) => {
    if (seat.status !== "available") {
      return;
    }

    setSelectedSeats((current) => {
      if (current.includes(seat.id)) {
        return current.filter((seatId) => seatId !== seat.id);
      }

      // UX Improvement: If limit is reached, support "auto-swapping" by replacing the oldest selection (FIFO)
      // This allows users to move their group's selection easily by just clicking new seats.
      if (current.length >= passengerCount) {
        if (passengerCount === 1) {
          return [seat.id];
        }
        // Remove the first selected seat and add the new one at the end
        return [...current.slice(1), seat.id];
      }

      return [...current, seat.id];
    });
  };

  const updatePassenger = (index: number, field: keyof Passenger, value: string) => {
    setPassengers((current) =>
      current.map((passenger, passengerIndex) =>
        passengerIndex === index ? { ...passenger, [field]: value } : passenger
      )
    );
  };

  const updateContact = (field: keyof Contact, value: string) => {
    setContact((current) => ({ ...current, [field]: value }));
  };

  const handlePickupMapChange = (data: { lat: number; lng: number; address: string }) => {
    setContact((current) => ({
      ...current,
      pickupLat: data.lat,
      pickupLng: data.lng,
      pickupAddress: data.address,
    }));
  };

  // 3. Submit dynamic booking to backend
  const handleSubmitBooking = async () => {
    try {
      setBookingError(null);
      setSubmittingBooking(true);
      
      const payload = {
        tripId,
        selectedSeats,
        passengers,
        contact,
        paymentMethod
      };

      const res = await fetch("/api/public/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal memproses pemesanan.");
      }

      setCreatedBooking(data.booking);
    } catch (err: any) {
      console.error("Booking error:", err);
      setBookingError(err.message || "Gagal membuat pemesanan.");
    } finally {
      setSubmittingBooking(false);
    }
  };

  // 4. Simulated Payment sandbox handler
  const handleSimulatePayment = async () => {
    if (!createdBooking) return;
    try {
      setBookingError(null);
      setPaymentSimulating(true);

      const res = await fetch(`/api/public/bookings/${createdBooking.id}/pay-simulate`, {
        method: "POST"
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Gagal melakukan pembayaran.");
      }

      setPaymentSuccess(true);
      // Wait for 2 seconds and redirect to digital ticket
      setTimeout(() => {
        router.push(`/ticket?code=${createdBooking.bookingCode}`);
      }, 2000);
    } catch (err: any) {
      console.error("Payment simulation error:", err);
      setBookingError(err.message || "Gagal menyimulasikan pembayaran.");
      setPaymentSimulating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC]">
        <div className="text-center">
          <Loader2 className="h-16 w-16 animate-spin text-teal-700 mx-auto" />
          <p className="mt-4 text-sm font-bold text-gray-500 uppercase tracking-widest">
            Memuat Data Perjalanan...
          </p>
        </div>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC] p-6">
        <div className="max-w-md text-center rounded-3xl bg-white border border-gray-100 p-8 shadow-sm">
          <AlertTriangle className="h-16 w-16 text-rose-500 mx-auto" />
          <h2 className="mt-4 text-2xl font-bold text-gray-950">Oops!</h2>
          <p className="mt-2 text-sm text-gray-500 leading-6">
            Jadwal perjalanan tidak valid atau telah kedaluwarsa. Silakan cari rute kembali di halaman utama.
          </p>
          <Button
            onClick={() => router.push("/trips")}
            className="mt-6 rounded-xl bg-teal-700 text-white hover:bg-teal-800 font-bold"
          >
            Kembali ke Pencarian
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-36">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:py-12">
        <header className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-bold tracking-[0.2em] text-[#0D9488] uppercase">
              Detail Trip & Checkout
            </p>
            <h1 className="mt-2 text-3xl font-bold text-gray-950 sm:text-5xl tracking-tight">
              Pilih kursi dan lengkapi data
            </h1>
            <p className="mt-3 max-w-2xl text-sm font-medium text-gray-500 sm:text-base">
              Selesaikan pengisian data penumpang, kemudian lakukan simulasi pembayaran secara langsung di halaman checkout ini.
            </p>
          </div>

          <div className="grid grid-cols-2 overflow-hidden rounded-2xl border border-gray-200 bg-white p-1 shadow-sm">
            <StepBadge active={step === "booking" && !createdBooking} done={step === "payment" || !!createdBooking} label="Data Booking" />
            <StepBadge active={step === "payment" || !!createdBooking} done={paymentSuccess} label="Pembayaran" />
          </div>
        </header>

        {/* Global Error Banner */}
        {bookingError && (
          <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-bold text-rose-800 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0" />
            {bookingError}
          </div>
        )}

        {/* Trip Summary Block */}
        <TripInfo trip={trip} />
        <WarningBox trip={trip} />

        {/* Dynamic Sandbox Payment Card */}
        {createdBooking ? (
          <section className="mt-8 rounded-3xl border border-teal-100 bg-teal-50/50 p-6 md:p-8 shadow-sm flex flex-col items-center justify-center text-center">
            {createdBooking.paymentMethod === "CASH" ? (
              <div className="max-w-xl py-6">
                <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-teal-600 text-white shadow-md animate-bounce">
                  <Check className="h-8 w-8" />
                </div>
                <h3 className="mt-6 text-2xl font-bold text-gray-950">💵 Pemesanan Cash Sukses!</h3>
                <p className="mt-3 text-sm text-gray-500 leading-6">
                  Pemesanan Anda terdaftar dengan Kode Booking <span className="font-mono font-bold text-teal-800">{createdBooking.bookingCode}</span>. Pembayaran dilakukan secara tunai sebesar <span className="font-bold text-teal-700">{currencyFormatter.format(totalPrice)}</span> langsung saat keberangkatan kepada staff pool atau driver travel.
                </p>

                <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm flex items-start gap-4">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700 border border-teal-100">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-950 text-sm">Menunggu Verifikasi Boarding</h4>
                    <p className="mt-1 text-xs text-gray-500 leading-5">
                      Status tiket Anda saat ini adalah <span className="font-bold text-amber-700 uppercase tracking-wide">Menunggu Pembayaran Tunai</span>. Staff atau driver bertugas akan memverifikasi dan menandai tiket Anda lunas manual ketika Anda membayar langsung di lokasi.
                    </p>
                  </div>
                </div>

                <Button
                  onClick={() => router.push(`/ticket?code=${createdBooking.bookingCode}`)}
                  className="mt-8 h-12 w-full rounded-xl bg-teal-700 hover:bg-teal-800 font-bold text-white uppercase tracking-wider text-xs shadow-lg shadow-teal-900/10 flex items-center justify-center gap-2"
                >
                  🎫 Lihat Tiket Digital Anda
                </Button>
              </div>
            ) : paymentSuccess ? (
              <div className="max-w-md py-8">
                <div className="mx-auto flex size-20 items-center justify-center rounded-full bg-emerald-500 text-white animate-bounce">
                  <Check className="h-10 w-10" />
                </div>
                <h3 className="mt-6 text-3xl font-bold text-gray-900">Simulasi Sukses!</h3>
                <p className="mt-3 text-sm text-gray-500 leading-6">
                  Pembayaran untuk kode booking <span className="font-mono font-bold text-teal-800">{createdBooking.bookingCode}</span> lunas. Anda akan diarahkan ke tiket digital Anda dalam beberapa detik...
                </p>
                <div className="mt-6 flex items-center justify-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin text-teal-700" />
                  <span className="text-xs font-bold text-teal-800 tracking-wider uppercase">Menyiapkan Tiket Digital...</span>
                </div>
              </div>
            ) : (
              <div className="max-w-xl">
                <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-teal-600 text-white shadow-md">
                  <Coins className="h-8 w-8" />
                </div>
                <h3 className="mt-6 text-2xl font-bold text-gray-900">🎟️ Booking Berhasil Dibuat!</h3>
                <p className="mt-2 text-sm text-gray-500 leading-6">
                  Pemesanan Anda terdaftar dengan Kode Booking <span className="font-mono font-bold text-teal-800">{createdBooking.bookingCode}</span> senilai <span className="font-bold text-teal-700">{currencyFormatter.format(totalPrice)}</span>.
                </p>

                {/* Simulated payment box */}
                <div className="mt-6 rounded-2xl border border-teal-200 bg-white p-6 text-left shadow-sm">
                  <div className="flex items-start gap-4">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                      <Gift className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 text-sm">Sandbox Mode Enabled</h4>
                      <p className="mt-1 text-xs text-gray-500 leading-5">
                        Anda dapat menekan tombol emas di bawah untuk langsung menyimulasikan kelunasan tagihan ini. Ini akan memutasi saldo real-time dompet vendor, merekam entri Ledger akuntansi, dan mengaktifkan QR Code tiket instan.
                      </p>
                    </div>
                  </div>

                  <Button
                    onClick={handleSimulatePayment}
                    disabled={paymentSimulating}
                    className="mt-6 h-12 w-full rounded-xl bg-[#8B5E02] hover:bg-[#744E02] font-bold text-white uppercase tracking-wider text-xs shadow-lg shadow-amber-900/10 flex items-center justify-center gap-2"
                  >
                    {paymentSimulating ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Memproses Mutasi Wallet...
                      </>
                    ) : (
                      <>
                        💳 Simulasikan Pembayaran Lunas (Sandbox)
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </section>
        ) : step === "booking" ? (
          <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
            <main className="space-y-8">
              <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
                <SectionHeader
                  icon={ShieldCheck}
                  title="Pilih Kursi"
                  description={`${selectedSeats.length}/${passengerCount} kursi dipilih untuk ${passengerCount} penumpang.`}
                />
                {seatLayout && (
                  <SeatLayout
                    passengerCount={passengerCount}
                    selectedSeats={selectedSeats}
                    availableSeats={
                      seatLayout.seats.filter((seat: any) => seat.status === "available").length
                    }
                    seatByPosition={seatByPosition}
                    onToggleSeat={toggleSeat}
                    layoutRows={seatLayout.rows}
                    layoutColumns={seatLayout.columns}
                    driverPos={seatLayout.driverPosition}
                  />
                )}
              </section>

              <PassengerFormList
                passengers={passengers}
                selectedSeats={selectedSeats}
                onChange={updatePassenger}
              />

              <ContactForm contact={contact} onChange={updateContact} onMapChange={handlePickupMapChange} />

              <PolicyAgreement checked={agreed} onChange={setAgreed} />
            </main>

            <aside className="lg:sticky lg:top-6 lg:self-start">
              <PriceSummary
                passengerCount={passengerCount}
                selectedSeatLabel={selectedSeatLabel}
                seatTotal={seatTotal}
                serviceFee={serviceFee}
                totalPrice={totalPrice}
                canContinue={Boolean(canContinue)}
                onContinue={() => canContinue && setStep("payment")}
              />
            </aside>
          </div>
        ) : (
          <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
            <main className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
              <SectionHeader
                icon={CreditCard}
                title="Pilih Metode Pembayaran"
                description="Pilih satu metode pembayaran untuk menyelesaikan pemesanan kursi."
              />

              <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {paymentMethods.map((method) => (
                  <button
                    key={method.id}
                    type="button"
                    onClick={() => setPaymentMethod(method.id)}
                    className={cn(
                      "flex min-h-44 flex-col items-start justify-between rounded-2xl border p-5 text-left transition-all",
                      paymentMethod === method.id
                        ? "border-teal-600 bg-teal-50 shadow-sm"
                        : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                    )}
                  >
                    <span className="flex w-full items-center justify-between">
                      <span className="flex size-11 items-center justify-center rounded-xl bg-white text-teal-700 shadow-sm">
                        <method.icon size={20} />
                      </span>
                      {paymentMethod === method.id && (
                        <span className="flex size-7 items-center justify-center rounded-full bg-teal-600 text-white">
                          <Check size={16} />
                        </span>
                      )}
                    </span>
                    <span>
                      <span className="block text-lg font-bold text-gray-950">{method.name}</span>
                      <span className="mt-2 block text-xs leading-5 text-gray-500">
                        {method.description}
                      </span>
                    </span>
                  </button>
                ))}
              </div>

              <div className="mt-8 rounded-2xl border border-gray-100 bg-gray-50 p-5">
                <p className="text-xs font-bold tracking-[0.18em] text-gray-400 uppercase">
                  Data booking
                </p>
                <div className="mt-4 grid gap-4 text-sm text-gray-600 sm:grid-cols-2">
                  <SummaryLine label="Kursi" value={selectedSeatLabel} />
                  <SummaryLine label="Penumpang" value={`${passengerCount} orang`} />
                  <SummaryLine label="Kontak" value={contact.name || "-"} />
                  <SummaryLine label="Telepon" value={contact.phone || "-"} />
                </div>
              </div>
            </main>

            <aside className="lg:sticky lg:top-6 lg:self-start">
              <PriceSummary
                passengerCount={passengerCount}
                selectedSeatLabel={selectedSeatLabel}
                seatTotal={seatTotal}
                serviceFee={serviceFee}
                totalPrice={totalPrice}
                canContinue
                paymentMode
                isBooking={submittingBooking}
                onContinue={handleSubmitBooking}
                onBack={() => setStep("booking")}
              />
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}

function StepBadge({ active, done, label }: { active: boolean; done: boolean; label: string }) {
  return (
    <div
      className={cn(
        "flex min-w-36 items-center justify-center gap-2 rounded-xl px-4 py-3 text-xs font-bold uppercase transition-all duration-300",
        active
          ? "bg-teal-700 text-white shadow-sm"
          : done
          ? "bg-emerald-600 text-white"
          : "text-gray-500 bg-transparent"
      )}
    >
      {done ? <Check size={15} /> : <span className="size-2 rounded-full bg-current" />}
      {label}
    </div>
  );
}

function SectionHeader({
  icon: Icon,
  title,
  description
}: {
  icon: typeof ShieldCheck;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <div className="flex items-center gap-2">
          <Icon className="text-teal-700" size={20} />
          <h2 className="text-xl font-bold text-gray-950">{title}</h2>
        </div>
        <p className="mt-1 text-sm font-medium text-gray-500">{description}</p>
      </div>
    </div>
  );
}

function TripInfo({ trip }: { trip: any }) {
  return (
    <section className="grid overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm lg:grid-cols-[360px_minmax(0,1fr)]">
      <div className="relative min-h-72 overflow-hidden bg-gray-100">
        <Image
          src={trip.imageUrl}
          alt={trip.provider}
          fill
          unoptimized
          className="object-cover"
          sizes="(min-width: 1024px) 360px, 100vw"
        />
        <div className="absolute top-4 left-4 rounded bg-[#0D9488] px-3 py-2 text-[10px] font-bold tracking-widest text-white uppercase shadow-md">
          {trip.vehicleType}
        </div>
      </div>

      <div className="p-5 sm:p-6 lg:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-950 leading-tight">{trip.provider}</h2>
            <p className="mt-2 text-sm leading-6 text-gray-500 max-w-xl">
              {trip.origin} ke {trip.destination} dengan armada premium kelas tertinggi, dilengkapi kursi empuk, AC dingin, dan berbagai fasilitas lengkap lainnya.
            </p>
            <div className="mt-4 flex flex-wrap gap-3 text-gray-500">
              {trip.amenities.map((amenity: string, idx: number) => {
                let icon = Wifi;
                if (amenity.toLowerCase().includes("ac")) icon = AirVent;
                if (amenity.toLowerCase().includes("usb")) icon = Usb;
                return <Amenity key={idx} icon={icon} label={amenity} />;
              })}
            </div>
          </div>

          <div className="rounded-2xl bg-teal-50 border border-teal-100/50 p-4 text-left lg:min-w-52">
            <p className="text-[10px] font-bold tracking-[0.18em] text-teal-600 uppercase">
              Harga per kursi
            </p>
            <p className="mt-1 text-2xl font-bold text-[#0D9488]">
              {currencyFormatter.format(trip.pricePerSeat)}
            </p>
          </div>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <InfoTile label="Rute" value={`${trip.origin} - ${trip.destination}`} />
          <InfoTile label="Tanggal" value={trip.departureDate} />
          <InfoTile label="Jam Berangkat" value={trip.departureTime} />
          <InfoTile label="Durasi Perjalanan" value={trip.duration} />
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <PointTile dotClassName="bg-[#0D9488]" label="Titik Jemput" value={trip.pickupPoint} />
          <PointTile dotClassName="bg-amber-600" label="Titik Turun" value={trip.dropoffPoint} />
        </div>
      </div>
    </section>
  );
}

function WarningBox({ trip }: { trip: any }) {
  const remainingPassengers = Math.max(trip.minPassengers - trip.bookedPassengers, 0);

  return (
    <section className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-950">
      <div className="flex gap-4">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
          <AlertTriangle size={20} />
        </div>
        <div>
          <h2 className="font-bold text-sm">Ketentuan Keberangkatan & Pembatalan</h2>
          <p className="mt-1 text-xs leading-5 text-amber-900">
            Jadwal perjalanan ini memerlukan minimal <strong>{trip.minPassengers} penumpang</strong> untuk jaminan keberangkatan. Jika kuota tidak terpenuhi, vendor dapat menjadwalkan ulang atau melakukan refund penuh.
          </p>
          {remainingPassengers > 0 ? (
            <p className="mt-3 text-[10px] font-bold tracking-widest text-[#8B5E02] uppercase">
              Butuh {remainingPassengers} penumpang lagi untuk memenuhi batas minimal keberangkatan.
            </p>
          ) : (
            <p className="mt-3 text-[10px] font-bold tracking-widest text-[#0D9488] uppercase">
              Batas minimum terpenuhi! Keberangkatan sudah terjamin.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

function SeatLayout({
  passengerCount,
  selectedSeats,
  availableSeats,
  seatByPosition,
  onToggleSeat,
  layoutRows,
  layoutColumns,
  driverPos
}: {
  passengerCount: number;
  selectedSeats: string[];
  availableSeats: number;
  seatByPosition: Map<string, Seat>;
  onToggleSeat: (seat: Seat) => void;
  layoutRows: number;
  layoutColumns: number;
  driverPos: { row: number; column: number };
}) {
  const cells = [];

  for (let row = 1; row <= layoutRows; row += 1) {
    for (let column = 1; column <= layoutColumns; column += 1) {
      cells.push({ row, column, seat: seatByPosition.get(`${row}-${column}`) });
    }
  }

  return (
    <div className="mt-6 grid gap-8 xl:grid-cols-[320px_minmax(0,1fr)]">
      <div className="rounded-2xl bg-gray-50 p-5">
        <div className="mx-auto max-w-[260px] rounded-[32px] border border-gray-200 bg-white p-5 shadow-sm">
          <div
            className="grid gap-3"
            style={{ gridTemplateColumns: `repeat(${layoutColumns}, minmax(0, 1fr))` }}
          >
            {cells.map(({ row, column, seat }) => {
              const isDriver =
                row === driverPos.row &&
                column === driverPos.column;

              if (isDriver) {
                return (
                  <div
                    key={`${row}-${column}`}
                    className="flex aspect-square items-center justify-center rounded-2xl bg-gray-100 text-gray-500"
                  >
                    <SteeringWheel className="size-9 text-gray-400" />
                  </div>
                );
              }

              if (!seat) {
                return <div key={`${row}-${column}`} className="aspect-square" />;
              }

              const selected = selectedSeats.includes(seat.id);
              const disabled = seat.status !== "available";

              return (
                <button
                  key={seat.id}
                  type="button"
                  disabled={disabled}
                  onClick={() => onToggleSeat(seat)}
                  className={cn(
                    "flex aspect-square items-center justify-center rounded-2xl border text-xs font-bold transition-all relative",
                    selected && "border-teal-700 bg-teal-700 text-white shadow-md",
                    !selected &&
                      seat.status === "available" &&
                      "border-gray-200 bg-white text-gray-700 hover:border-teal-500 hover:bg-teal-50",
                    seat.status === "booked" &&
                      "cursor-not-allowed border-red-100 bg-red-100 text-red-400",
                    seat.status === "locked" &&
                      "cursor-not-allowed border-amber-100 bg-amber-100 text-amber-600"
                  )}
                >
                  {seat.status === "booked" ? (
                    <Lock className="h-3.5 w-3.5" />
                  ) : (
                    seat.id
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex flex-col justify-between gap-6">
        <div className="grid gap-3 sm:grid-cols-2">
          <LegendItem className="bg-white ring-1 ring-gray-200" label="Tersedia" />
          <LegendItem className="bg-teal-700" label="Dipilih" />
          <LegendItem className="bg-red-100 text-red-400 flex items-center justify-center" label="Booked" />
          <LegendItem className="bg-amber-100 text-amber-600 flex items-center justify-center" label="Kunci (Locked)" />
        </div>

        <div className="rounded-2xl border border-gray-100 bg-gray-50 p-5">
          <p className="text-sm font-bold text-gray-950">Kapasitas Pilihan Kursi</p>
          <p className="mt-2 text-xs leading-5 text-gray-500">
            Pilih tepat {passengerCount} kursi. Pastikan Anda mengisi nama dan no kontak penumpang untuk manifest boarding driver pada tabel manifest di bawah.
          </p>
          <p className="mt-3 text-xs font-bold tracking-widest text-[#0D9488] uppercase">
            {availableSeats} kursi kosong tersedia
          </p>
        </div>
      </div>
    </div>
  );
}

function PassengerFormList({
  passengers,
  selectedSeats,
  onChange
}: {
  passengers: Passenger[];
  selectedSeats: string[];
  onChange: (index: number, field: keyof Passenger, value: string) => void;
}) {
  return (
    <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
      <SectionHeader
        icon={User}
        title="Data Penumpang (Manifest Perjalanan)"
        description="Isi data setiap penumpang sesuai alokasi nomor kursi pilihan."
      />

      <div className="mt-6 space-y-5">
        {passengers.map((passenger, index) => (
          <div key={index} className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h3 className="font-bold text-gray-950 text-sm">Penumpang {index + 1}</h3>
              <span className="rounded-full bg-teal-600/10 text-teal-800 px-3 py-1 text-xs font-bold">
                Kursi: {selectedSeats[index] ?? "Belum dipilih"}
              </span>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <Field label="Nama Lengkap">
                <Input
                  value={passenger.fullName}
                  onChange={(event) => onChange(index, "fullName", event.target.value)}
                  placeholder="Contoh: Rahmat Hidayat"
                  className="h-12 rounded-xl bg-white border-gray-200"
                />
              </Field>
              <Field label="Nomor WhatsApp">
                <Input
                  value={passenger.phone}
                  onChange={(event) => onChange(index, "phone", event.target.value)}
                  placeholder="Contoh: 08123456789"
                  className="h-12 rounded-xl bg-white border-gray-200"
                />
              </Field>
              <Field label="No. Identitas (KTP)">
                <Input
                  value={passenger.identityNumber}
                  onChange={(event) => onChange(index, "identityNumber", event.target.value)}
                  placeholder="Opsional"
                  className="h-12 rounded-xl bg-white border-gray-200"
                />
              </Field>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function ContactForm({
  contact,
  onChange,
  onMapChange
}: {
  contact: Contact;
  onChange: (field: keyof Contact, value: string) => void;
  onMapChange: (data: { lat: number; lng: number; address: string }) => void;
}) {
  return (
    <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
      <SectionHeader
        icon={Phone}
        title="Informasi Kontak & Titik Penjemputan"
        description="Kontak pemesan utama untuk pengiriman e-tiket WhatsApp dan email."
      />

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <Field label="Nama Pemesan">
          <Input
            value={contact.name}
            onChange={(event) => onChange("name", event.target.value)}
            placeholder="Nama lengkap pemesan"
            className="h-12 rounded-xl bg-gray-50 border-gray-200"
          />
        </Field>
        <Field label="Nomor WhatsApp Pemesan">
          <Input
            value={contact.phone}
            onChange={(event) => onChange("phone", event.target.value)}
            placeholder="Contoh: 081234567890"
            className="h-12 rounded-xl bg-gray-50 border-gray-200"
          />
        </Field>
        <Field label="Email Konfirmasi">
          <Input
            type="email"
            value={contact.email}
            onChange={(event) => onChange("email", event.target.value)}
            placeholder="email@domain.com"
            className="h-12 rounded-xl bg-gray-50 border-gray-200"
          />
        </Field>
        <Field label="📍 Titik Penjemputan (Pilih di Peta)">
          <LeafletMapPicker
            value={contact.pickupLat && contact.pickupLng ? { lat: contact.pickupLat, lng: contact.pickupLng, address: contact.pickupAddress } : null}
            onChange={onMapChange}
            placeholder="Klik untuk pilih titik jemput di peta..."
          />
        </Field>
        <Field label="Alamat / Titik Pengantaran" className="md:col-span-2">
          <Input
            value={contact.dropoffAddress}
            onChange={(event) => onChange("dropoffAddress", event.target.value)}
            placeholder="Lokasi lengkap antar"
            className="h-12 rounded-xl bg-gray-50 border-gray-200"
          />
        </Field>
        <Field label="Catatan Tambahan Ke Driver" className="md:col-span-2">
          <Textarea
            value={contact.notes}
            onChange={(event) => onChange("notes", event.target.value)}
            placeholder="Patokan rumah, barang bawaan ekstra, dll."
            className="min-h-24 rounded-xl bg-gray-50 border-gray-200"
          />
        </Field>
      </div>
    </section>
  );
}

function PolicyAgreement({
  checked,
  onChange
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-1 size-5 accent-teal-700 rounded"
      />
      <span>
        <span className="block font-bold text-gray-950 text-sm">Persetujuan Kebijakan & Ketentuan</span>
        <span className="mt-1 block text-xs leading-5 text-gray-500">
          Saya menyetujui bahwa data penumpang di atas benar. Saya menyetujui kebijakan pembatalan & pengembalian dana (*refund*) otomatis yang disesuaikan dengan aturan vendor travel bersangkutan.
        </span>
      </span>
    </label>
  );
}

function PriceSummary({
  passengerCount,
  selectedSeatLabel,
  seatTotal,
  serviceFee,
  totalPrice,
  canContinue,
  paymentMode = false,
  isBooking = false,
  onContinue,
  onBack
}: {
  passengerCount: number;
  selectedSeatLabel: string;
  seatTotal: number;
  serviceFee: number;
  totalPrice: number;
  canContinue: boolean;
  paymentMode?: boolean;
  isBooking?: boolean;
  onContinue?: () => void;
  onBack?: () => void;
}) {
  return (
    <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
      <h2 className="text-xl font-bold text-gray-950">Ringkasan Harga</h2>
      <div className="mt-5 space-y-4">
        <SummaryLine label="Jumlah Penumpang" value={`${passengerCount} orang`} />
        <SummaryLine label="Pilihan Kursi" value={selectedSeatLabel} />
        <SummaryLine label="Harga Total Kursi" value={currencyFormatter.format(seatTotal)} />
        <SummaryLine label="Biaya Layanan Sistem" value={currencyFormatter.format(serviceFee)} />
      </div>

      <div className="mt-5 border-t border-gray-100 pt-5">
        <div className="flex items-end justify-between gap-4">
          <span className="text-sm font-bold text-gray-500">Total Pembayaran</span>
          <span className="text-3xl font-bold text-[#0D9488] tracking-tight">
            {currencyFormatter.format(totalPrice)}
          </span>
        </div>
      </div>

      {paymentMode ? (
        <div className="mt-6 space-y-3">
          <Button
            type="button"
            disabled={isBooking}
            onClick={onContinue}
            className="h-12 w-full rounded-xl bg-teal-700 font-bold text-white hover:bg-teal-800 uppercase tracking-widest text-xs shadow-lg shadow-teal-900/10 flex items-center justify-center gap-2"
          >
            {isBooking ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Membuat Kode Booking...
              </>
            ) : (
              <>
                Bayar Sekarang
                <ArrowRight size={18} />
              </>
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={isBooking}
            onClick={onBack}
            className="h-12 w-full rounded-xl bg-white font-bold text-gray-700 hover:bg-gray-50 flex items-center justify-center gap-2"
          >
            <ArrowLeft size={18} />
            Ubah Data Booking
          </Button>
        </div>
      ) : (
        <Button
          type="button"
          disabled={!canContinue}
          onClick={onContinue}
          className="mt-6 h-12 w-full rounded-xl bg-[#8B5E02] font-bold text-white hover:bg-[#744E02] uppercase tracking-widest text-xs shadow-lg shadow-amber-900/10 flex items-center justify-center gap-2"
        >
          Lanjut ke Checkout
          <ArrowRight size={18} />
        </Button>
      )}
    </section>
  );
}

function SummaryLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</span>
      <span className="text-right text-sm font-bold text-gray-950">{value}</span>
    </div>
  );
}

function Field({
  label,
  className,
  children
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-2 block text-[10px] font-bold tracking-widest text-gray-400 uppercase">
        {label}
      </span>
      {children}
    </label>
  );
}

function Amenity({ icon: Icon, label }: { icon: typeof Wifi; label: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-teal-50 px-3 py-1.5 text-xs font-bold text-teal-800 border border-teal-100/50">
      <Icon size={14} />
      {label}
    </span>
  );
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-gray-50 p-4 border border-gray-100/50">
      <p className="text-[10px] font-bold tracking-widest text-gray-400 uppercase">{label}</p>
      <p className="mt-2 text-sm font-bold text-gray-950">{value}</p>
    </div>
  );
}

function PointTile({
  dotClassName,
  label,
  value
}: {
  dotClassName: string;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-gray-100 p-4">
      <span className={cn("size-2 rounded-full shrink-0", dotClassName)} />
      <div>
        <p className="text-[10px] font-bold tracking-widest text-gray-400 uppercase">{label}</p>
        <p className="mt-1 text-sm font-bold text-gray-950">{value}</p>
      </div>
    </div>
  );
}

function LegendItem({ className, label, children }: { className: string; label: string; children?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-gray-100 p-3 bg-white shadow-xs">
      <span className={cn("size-5 rounded-md shrink-0 border border-gray-100", className)}>
        {children}
      </span>
      <span className="text-[10px] font-bold tracking-wider text-gray-500 uppercase">{label}</span>
    </div>
  );
}
