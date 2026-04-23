"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
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
  Wifi
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { SteeringWheel } from "@/components/icons";

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
  dropoffAddress: string;
  notes: string;
}

const seatLayout = {
  rows: 5,
  columns: 3,
  driverPosition: { row: 1, column: 3 },
  seats: [
    { id: "01", row: 1, column: 1, status: "available" },
    { id: "02", row: 2, column: 1, status: "available" },
    { id: "03", row: 2, column: 3, status: "locked" },
    { id: "04", row: 3, column: 1, status: "available" },
    { id: "05", row: 3, column: 3, status: "booked" },
    { id: "06", row: 4, column: 1, status: "available" },
    { id: "07", row: 4, column: 3, status: "available" },
    { id: "08", row: 5, column: 1, status: "available" },
    { id: "09", row: 5, column: 2, status: "available" },
    { id: "10", row: 5, column: 3, status: "booked" }
  ] satisfies Seat[]
};

const trip = {
  id: "1",
  origin: "Jakarta",
  destination: "Bandung",
  departureDate: "Selasa, 21 April 2026",
  departureTime: "08:00 AM",
  arrivalTime: "11:00 AM",
  duration: "3 jam",
  provider: "Toyota Hiace Super Grandia",
  vehicleType: "KELAS PREMIUM",
  imageUrl: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=900&q=80",
  amenities: ["AC", "WiFi", "Port USB", "Kursi Reclining"],
  pickupPoint: "Pool Jakarta Selatan",
  dropoffPoint: "Pool Bandung Pasteur",
  pricePerSeat: 150000,
  serviceFee: 5000,
  minPassengers: 5,
  bookedPassengers: 3
};

const paymentMethods = [
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
  const searchParams = useSearchParams();
  const passengerCount = getPassengerCount(searchParams.get("passengers"));
  const [step, setStep] = useState<"booking" | "payment">("booking");
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [passengers, setPassengers] = useState<Passenger[]>(() => createPassengers(passengerCount));
  const [contact, setContact] = useState<Contact>({
    name: "",
    phone: "",
    email: "",
    pickupAddress: "",
    dropoffAddress: "",
    notes: ""
  });
  const [agreed, setAgreed] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("qris");

  const seatTotal = trip.pricePerSeat * passengerCount;
  const totalPrice = seatTotal + trip.serviceFee;

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
    return new Map(seatLayout.seats.map((seat) => [`${seat.row}-${seat.column}`, seat]));
  }, []);

  const toggleSeat = (seat: Seat) => {
    if (seat.status !== "available") {
      return;
    }

    setSelectedSeats((current) => {
      if (current.includes(seat.id)) {
        return current.filter((seatId) => seatId !== seat.id);
      }

      if (current.length >= passengerCount) {
        return current;
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

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-36">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:py-12">
        <header className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-bold tracking-[0.2em] text-teal-700 uppercase">
              Detail Trip
            </p>
            <h1 className="mt-2 text-3xl font-bold text-gray-950 sm:text-5xl">
              Pilih kursi dan lengkapi data penumpang
            </h1>
            <p className="mt-3 max-w-2xl text-sm font-medium text-gray-500 sm:text-base">
              Selesaikan data perjalanan terlebih dahulu, lalu lanjutkan ke metode pembayaran di
              halaman yang sama.
            </p>
          </div>

          <div className="grid grid-cols-2 overflow-hidden rounded-2xl border border-gray-200 bg-white p-1 shadow-sm">
            <StepBadge active={step === "booking"} done={step === "payment"} label="Data Booking" />
            <StepBadge active={step === "payment"} done={false} label="Pembayaran" />
          </div>
        </header>

        <TripInfo />
        <WarningBox />

        {step === "booking" ? (
          <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
            <main className="space-y-8">
              <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
                <SectionHeader
                  icon={ShieldCheck}
                  title="Pilih Kursi"
                  description={`${selectedSeats.length}/${passengerCount} kursi dipilih untuk ${passengerCount} penumpang.`}
                />
                <SeatLayout
                  passengerCount={passengerCount}
                  selectedSeats={selectedSeats}
                  availableSeats={
                    seatLayout.seats.filter((seat) => seat.status === "available").length
                  }
                  seatByPosition={seatByPosition}
                  onToggleSeat={toggleSeat}
                />
              </section>

              <PassengerFormList
                passengers={passengers}
                selectedSeats={selectedSeats}
                onChange={updatePassenger}
              />

              <ContactForm contact={contact} onChange={updateContact} />

              <PolicyAgreement checked={agreed} onChange={setAgreed} />
            </main>

            <aside className="lg:sticky lg:top-6 lg:self-start">
              <PriceSummary
                passengerCount={passengerCount}
                selectedSeatLabel={selectedSeatLabel}
                seatTotal={seatTotal}
                serviceFee={trip.serviceFee}
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

              <div className="mt-6 grid gap-4 md:grid-cols-3">
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
                      <span className="mt-2 block text-sm leading-6 text-gray-500">
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
                serviceFee={trip.serviceFee}
                totalPrice={totalPrice}
                canContinue
                paymentMode
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
        "flex min-w-36 items-center justify-center gap-2 rounded-xl px-4 py-3 text-xs font-bold uppercase",
        active || done ? "bg-teal-700 text-white" : "text-gray-500"
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

function TripInfo() {
  return (
    <section className="grid overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm lg:grid-cols-[360px_minmax(0,1fr)]">
      <div className="relative min-h-72 overflow-hidden bg-gray-100">
        <Image
          src={trip.imageUrl}
          alt={trip.provider}
          fill
          unoptimized
          className="object-cover"
          sizes="(min-width: 1024px) 360px, 100vw"
        />
        <div className="absolute top-4 left-4 rounded bg-teal-700 px-3 py-2 text-[10px] font-bold tracking-widest text-white uppercase">
          {trip.vehicleType}
        </div>
      </div>

      <div className="p-5 sm:p-6 lg:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-950">{trip.provider}</h2>
            <p className="mt-2 text-sm leading-6 text-gray-500">
              {trip.origin} ke {trip.destination} dengan armada premium, kursi reclining, dan
              fasilitas kabin lengkap.
            </p>
            <div className="mt-4 flex flex-wrap gap-3 text-gray-500">
              {trip.amenities.includes("AC") && <Amenity icon={AirVent} label="AC" />}
              {trip.amenities.includes("WiFi") && <Amenity icon={Wifi} label="WiFi" />}
              {trip.amenities.includes("Port USB") && <Amenity icon={Usb} label="USB" />}
            </div>
          </div>

          <div className="rounded-2xl bg-gray-50 p-4 text-left lg:min-w-52">
            <p className="text-xs font-bold tracking-[0.18em] text-gray-400 uppercase">
              Harga per kursi
            </p>
            <p className="mt-1 text-2xl font-bold text-teal-700">
              {currencyFormatter.format(trip.pricePerSeat)}
            </p>
          </div>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <InfoTile label="Rute" value={`${trip.origin} - ${trip.destination}`} />
          <InfoTile label="Tanggal" value={trip.departureDate} />
          <InfoTile label="Jam" value={`${trip.departureTime} - ${trip.arrivalTime}`} />
          <InfoTile label="Durasi" value={trip.duration} />
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <PointTile dotClassName="bg-teal-600" label="Titik Jemput" value={trip.pickupPoint} />
          <PointTile dotClassName="bg-amber-600" label="Titik Turun" value={trip.dropoffPoint} />
        </div>
      </div>
    </section>
  );
}

function WarningBox() {
  const remainingPassengers = Math.max(trip.minPassengers - trip.bookedPassengers, 0);

  return (
    <section className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-950">
      <div className="flex gap-4">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
          <AlertTriangle size={20} />
        </div>
        <div>
          <h2 className="font-bold">Ketentuan minimum penumpang</h2>
          <p className="mt-1 text-sm leading-6">
            Jika minimal penumpang belum terpenuhi keberangkatan akan{" "}
            <strong>dijadwalkan ulang</strong>, <strong>dibatalkan</strong> atau penumpang bisa{" "}
            <strong>dipindahkan ke mobil lain</strong>. Cek halaman status tiket untuk update
            terbaru.
          </p>
          <p className="mt-3 text-xs font-bold tracking-widest uppercase">
            Butuh {remainingPassengers} penumpang lagi untuk memenuhi minimum keberangkatan.
          </p>
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
  onToggleSeat
}: {
  passengerCount: number;
  selectedSeats: string[];
  availableSeats: number;
  seatByPosition: Map<string, Seat>;
  onToggleSeat: (seat: Seat) => void;
}) {
  const cells = [];

  for (let row = 1; row <= seatLayout.rows; row += 1) {
    for (let column = 1; column <= seatLayout.columns; column += 1) {
      cells.push({ row, column, seat: seatByPosition.get(`${row}-${column}`) });
    }
  }

  return (
    <div className="mt-6 grid gap-8 xl:grid-cols-[320px_minmax(0,1fr)]">
      <div className="rounded-2xl bg-gray-50 p-5">
        <div className="mx-auto max-w-[260px] rounded-[32px] border border-gray-200 bg-white p-5 shadow-sm">
          <div
            className="grid gap-3"
            style={{ gridTemplateColumns: `repeat(${seatLayout.columns}, minmax(0, 1fr))` }}
          >
            {cells.map(({ row, column, seat }) => {
              const isDriver =
                row === seatLayout.driverPosition.row &&
                column === seatLayout.driverPosition.column;

              if (isDriver) {
                return (
                  <div
                    key={`${row}-${column}`}
                    className="flex aspect-square items-center justify-center rounded-2xl bg-gray-100 text-gray-500"
                  >
                    <SteeringWheel className="size-9" />
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
                    "flex aspect-square items-center justify-center rounded-2xl border text-sm font-bold transition-all",
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
                  {seat.id}
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
          <LegendItem className="bg-red-100" label="Booked" />
          <LegendItem className="bg-amber-100" label="Locked sementara" />
        </div>

        <div className="rounded-2xl border border-gray-100 bg-gray-50 p-5">
          <p className="text-sm font-bold text-gray-950">Kapasitas pilihan</p>
          <p className="mt-2 text-sm leading-6 text-gray-500">
            Pilih tepat {passengerCount} kursi. Kursi locked sedang ditahan sementara oleh calon
            penumpang lain dan tidak bisa dipilih sampai statusnya berubah.
          </p>
          <p className="mt-3 text-xs font-bold tracking-widest text-teal-700 uppercase">
            {availableSeats} kursi tersedia
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
        title="Data Penumpang"
        description="Isi data sesuai jumlah penumpang dan kursi yang dipilih."
      />

      <div className="mt-6 space-y-5">
        {passengers.map((passenger, index) => (
          <div key={index} className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h3 className="font-bold text-gray-950">Penumpang {index + 1}</h3>
              <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-gray-500">
                Kursi {selectedSeats[index] ?? "-"}
              </span>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <Field label="Nama Lengkap">
                <Input
                  value={passenger.fullName}
                  onChange={(event) => onChange(index, "fullName", event.target.value)}
                  placeholder="Nama penumpang"
                  className="h-12 rounded-xl bg-white"
                />
              </Field>
              <Field label="Nomor WhatsApp">
                <Input
                  value={passenger.phone}
                  onChange={(event) => onChange(index, "phone", event.target.value)}
                  placeholder="+62"
                  className="h-12 rounded-xl bg-white"
                />
              </Field>
              <Field label="No. Identitas">
                <Input
                  value={passenger.identityNumber}
                  onChange={(event) => onChange(index, "identityNumber", event.target.value)}
                  placeholder="Opsional"
                  className="h-12 rounded-xl bg-white"
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
  onChange
}: {
  contact: Contact;
  onChange: (field: keyof Contact, value: string) => void;
}) {
  return (
    <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
      <SectionHeader
        icon={Phone}
        title="Kontak dan Alamat"
        description="Kontak ini digunakan untuk konfirmasi dan update status tiket."
      />

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <Field label="Nama Kontak">
          <Input
            value={contact.name}
            onChange={(event) => onChange("name", event.target.value)}
            placeholder="Nama pemesan"
            className="h-12 rounded-xl bg-gray-50"
          />
        </Field>
        <Field label="Nomor Kontak">
          <Input
            value={contact.phone}
            onChange={(event) => onChange("phone", event.target.value)}
            placeholder="+62"
            className="h-12 rounded-xl bg-gray-50"
          />
        </Field>
        <Field label="Email">
          <Input
            type="email"
            value={contact.email}
            onChange={(event) => onChange("email", event.target.value)}
            placeholder="email@domain.com"
            className="h-12 rounded-xl bg-gray-50"
          />
        </Field>
        <Field label="Alamat Jemput">
          <Input
            value={contact.pickupAddress}
            onChange={(event) => onChange("pickupAddress", event.target.value)}
            placeholder="Alamat lengkap penjemputan"
            className="h-12 rounded-xl bg-gray-50"
          />
        </Field>
        <Field label="Alamat Turun" className="md:col-span-2">
          <Input
            value={contact.dropoffAddress}
            onChange={(event) => onChange("dropoffAddress", event.target.value)}
            placeholder="Alamat tujuan akhir"
            className="h-12 rounded-xl bg-gray-50"
          />
        </Field>
        <Field label="Catatan" className="md:col-span-2">
          <Textarea
            value={contact.notes}
            onChange={(event) => onChange("notes", event.target.value)}
            placeholder="Patokan lokasi atau kebutuhan tambahan"
            className="min-h-24 rounded-xl bg-gray-50"
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
        className="mt-1 size-5 accent-teal-700"
      />
      <span>
        <span className="block font-bold text-gray-950">Persetujuan kebijakan</span>
        <span className="mt-1 block text-sm leading-6 text-gray-500">
          Dengan melanjutkan, Anda setuju dengan syarat dan ketentuan kami.
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
  onContinue?: () => void;
  onBack?: () => void;
}) {
  return (
    <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
      <h2 className="text-xl font-bold text-gray-950">Ringkasan Harga</h2>
      <div className="mt-5 space-y-4">
        <SummaryLine label="Jumlah penumpang" value={`${passengerCount} orang`} />
        <SummaryLine label="Kursi" value={selectedSeatLabel} />
        <SummaryLine label="Harga kursi" value={currencyFormatter.format(seatTotal)} />
        <SummaryLine label="Biaya layanan" value={currencyFormatter.format(serviceFee)} />
      </div>

      <div className="mt-5 border-t border-gray-100 pt-5">
        <div className="flex items-end justify-between gap-4">
          <span className="text-sm font-bold text-gray-500">Total bayar</span>
          <span className="text-3xl font-bold text-gray-950">
            {currencyFormatter.format(totalPrice)}
          </span>
        </div>
      </div>

      {paymentMode ? (
        <div className="mt-6 space-y-3">
          <Button
            type="button"
            className="h-12 w-full rounded-xl bg-teal-700 font-bold text-white hover:bg-teal-800"
          >
            Bayar Sekarang
            <ArrowRight size={18} />
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            className="h-12 w-full rounded-xl bg-white font-bold"
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
          className="mt-6 h-12 w-full rounded-xl bg-[#8B5E02] font-bold text-white hover:bg-[#744E02]"
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
      <span className="text-sm font-medium text-gray-500">{label}</span>
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
      <span className="mb-2 block text-xs font-bold tracking-widest text-gray-400 uppercase">
        {label}
      </span>
      {children}
    </label>
  );
}

function Amenity({ icon: Icon, label }: { icon: typeof Wifi; label: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-2 text-xs font-bold text-gray-600">
      <Icon size={15} />
      {label}
    </span>
  );
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-gray-50 p-4">
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
      <span className={cn("size-2 rounded-full", dotClassName)} />
      <div>
        <p className="text-[10px] font-bold tracking-widest text-gray-400 uppercase">{label}</p>
        <p className="mt-1 text-sm font-bold text-gray-950">{value}</p>
      </div>
    </div>
  );
}

function LegendItem({ className, label }: { className: string; label: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-gray-100 p-3">
      <span className={cn("size-5 rounded-md", className)} />
      <span className="text-xs font-bold tracking-widest text-gray-500 uppercase">{label}</span>
    </div>
  );
}
