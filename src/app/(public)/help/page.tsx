import {
  CalendarCheck,
  CheckCircle2,
  CreditCard,
  HelpCircle,
  MapPinned,
  MessageCircle,
  Search,
  ShieldCheck,
  TicketCheck,
  UserRound
} from "lucide-react";
import Link from "next/link";

const bookingSteps = [
  {
    icon: Search,
    title: "Cari perjalanan",
    description:
      "Pilih kota asal, kota tujuan, tanggal berangkat, dan jumlah penumpang dari halaman utama."
  },
  {
    icon: MapPinned,
    title: "Pilih travel",
    description:
      "Bandingkan harga, jam berangkat, fasilitas, sisa kursi, dan tipe kendaraan yang tersedia."
  },
  {
    icon: UserRound,
    title: "Isi data penumpang",
    description:
      "Masukkan nama penumpang dan nomor HP aktif. Akun tidak diperlukan untuk melanjutkan pemesanan."
  },
  {
    icon: CreditCard,
    title: "Lakukan pembayaran",
    description:
      "Periksa ringkasan pesanan, pilih metode pembayaran, lalu selesaikan sebelum batas waktu berakhir."
  },
  {
    icon: TicketCheck,
    title: "Cek status tiket",
    description:
      "Gunakan kode booking dan nomor HP pada halaman status tiket untuk melihat update perjalanan."
  }
];

const requirements = [
  "Rute, tanggal berangkat, dan jumlah penumpang.",
  "Nama lengkap setiap penumpang sesuai data pemesanan.",
  "Nomor HP aktif untuk menerima kode booking dan informasi perjalanan.",
  "Bukti pembayaran jika metode yang dipilih membutuhkan konfirmasi."
];

const faqs = [
  {
    question: "Apakah harus login untuk membeli tiket travel?",
    answer:
      "Tidak. Pengunjung bisa mencari trip, memilih kursi, mengisi data penumpang, dan membayar tanpa membuat akun."
  },
  {
    question: "Bagaimana cara melihat tiket setelah pembayaran?",
    answer:
      "Buka halaman status tiket, lalu masukkan kode booking dan nomor HP yang digunakan saat memesan."
  },
  {
    question: "Apa yang terjadi jika minimal penumpang belum terpenuhi?",
    answer:
      "Keberangkatan dapat dijadwalkan ulang, dibatalkan, atau penumpang dipindahkan ke kendaraan lain. Pantau perubahan melalui halaman status tiket."
  },
  {
    question: "Apakah kursi langsung aman setelah dipilih?",
    answer:
      "Kursi akan dikunci sementara saat proses pemesanan. Selesaikan pembayaran sebelum batas waktu agar pesanan tidak kedaluwarsa."
  }
];

export default function Help() {
  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <section className="bg-[#F5FAF8]">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 py-16 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <div className="text-primary mb-5 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-bold tracking-widest uppercase shadow-sm">
              <ShieldCheck className="size-4" />
              Bantuan Pemesanan
            </div>
            <h1 className="max-w-3xl text-4xl font-extrabold tracking-tight text-gray-950 md:text-5xl">
              Pesan tiket travel tanpa login
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 font-medium text-gray-600">
              Panduan ini membantu penumpang baru memahami alur pemesanan dari mencari perjalanan,
              memilih travel, mengisi data, membayar, sampai mengecek status tiket menggunakan kode
              booking.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/"
                className="bg-accent-2 hover:bg-accent-2/90 inline-flex h-12 items-center justify-center gap-2 rounded-full px-6 text-sm font-bold text-white shadow-lg shadow-amber-900/15 transition-colors"
              >
                <Search className="size-4" />
                Cari Trip
              </Link>
              <Link
                href="/ticket"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-gray-200 bg-white px-6 text-sm font-bold text-gray-700 transition-colors hover:bg-gray-50"
              >
                <TicketCheck className="text-primary size-4" />
                Cek Status Tiket
              </Link>
            </div>
          </div>

          <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-xl shadow-gray-200/60">
            <div className="mb-6 flex items-center gap-3">
              <div className="bg-primary/10 text-primary flex size-11 items-center justify-center rounded-2xl">
                <CalendarCheck className="size-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-950">Sebelum mulai</h2>
                <p className="text-sm font-medium text-gray-500">Siapkan data berikut.</p>
              </div>
            </div>
            <ul className="space-y-4">
              {requirements.map((item) => (
                <li key={item} className="flex gap-3 text-sm leading-6 font-medium text-gray-600">
                  <CheckCircle2 className="text-primary mt-0.5 size-5 shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-14">
        <div className="mb-8">
          <p className="text-primary text-xs font-bold tracking-widest uppercase">Alur pemesanan</p>
          <h2 className="mt-2 text-3xl font-bold text-gray-950">Cara membeli tiket</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {bookingSteps.map((step, index) => {
            const Icon = step.icon;

            return (
              <article
                key={step.title}
                className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"
              >
                <div className="mb-5 flex items-center justify-between">
                  <div className="bg-primary/10 text-primary flex size-11 items-center justify-center rounded-2xl">
                    <Icon className="size-5" />
                  </div>
                  <span className="text-xs font-extrabold tracking-widest text-gray-300">
                    0{index + 1}
                  </span>
                </div>
                <h3 className="text-base font-bold text-gray-950">{step.title}</h3>
                <p className="mt-3 text-sm leading-6 font-medium text-gray-500">
                  {step.description}
                </p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-6 pb-16 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="text-primary mb-5 flex size-12 items-center justify-center rounded-2xl bg-[#E0F2F1]">
            <MessageCircle className="size-6" />
          </div>
          <h2 className="text-2xl font-bold text-gray-950">Butuh bantuan?</h2>
          <p className="mt-3 text-sm leading-6 font-medium text-gray-500">
            Hubungi tim support jika kode booking tidak ditemukan, pembayaran belum berubah status,
            atau ada perubahan jadwal dari pihak travel.
          </p>
          <div className="mt-6 space-y-3 text-sm font-bold text-gray-700">
            <p>WhatsApp: 08xx-xxxx-xxxx</p>
            <p>Email: support@travel.test</p>
            <p>Jam bantuan: 08.00 - 21.00 WIB</p>
          </div>
        </div>

        <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center gap-3">
            <div className="bg-primary/10 text-primary flex size-11 items-center justify-center rounded-2xl">
              <HelpCircle className="size-5" />
            </div>
            <div>
              <p className="text-primary text-xs font-bold tracking-widest uppercase">FAQ</p>
              <h2 className="text-2xl font-bold text-gray-950">Pertanyaan umum</h2>
            </div>
          </div>
          <div className="divide-y divide-gray-100">
            {faqs.map((faq) => (
              <div key={faq.question} className="py-5 first:pt-0 last:pb-0">
                <h3 className="text-base font-bold text-gray-950">{faq.question}</h3>
                <p className="mt-2 text-sm leading-6 font-medium text-gray-500">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
