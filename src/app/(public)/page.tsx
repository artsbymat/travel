import HeroSection from "@/components/public/hero-section";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import {
  TrendingUp,
  Shield,
  Star,
  Users,
  Calendar,
  DollarSign,
  Activity,
  ArrowRight,
  MapPin,
  Settings,
  MessageSquare,
  Sparkles,
  Compass,
  ArrowUpRight,
  ShieldCheck,
  Zap,
  Map,
  Building
} from "lucide-react";
import Link from "next/link";

function capitalize(str: string) {
  if (!str) return "";
  return str
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

export default async function Home() {
  // 1. Fetch Dynamic Stats from Database
  const activeVendorsCount = await prisma.vendor.count({
    where: { isActive: true }
  });

  const templates = await prisma.tripTemplate.findMany({
    where: { isActive: true },
    select: { origin: true, destination: true }
  });
  const uniqueTemplateRoutes = new Set(
    templates.map((t) => `${t.origin.toLowerCase().trim()}-${t.destination.toLowerCase().trim()}`)
  );

  const trips = await prisma.trip.findMany({
    select: { origin: true, destination: true }
  });
  const uniqueTripRoutes = new Set(
    trips.map((t) => `${t.origin.toLowerCase().trim()}-${t.destination.toLowerCase().trim()}`)
  );

  // Union of unique routes
  const connectedRoutesCount = Math.max(
    new Set([...Array.from(uniqueTemplateRoutes), ...Array.from(uniqueTripRoutes)]).size,
    2 // sensible minimum display
  );

  const bookingsSum = await prisma.booking.aggregate({
    _sum: {
      seatCount: true
    },
    where: {
      status: { in: ["CONFIRMED", "COMPLETED"] }
    }
  });
  const ticketsSoldCount = bookingsSum._sum.seatCount || 0;

  const stats = [
    {
      value: `${activeVendorsCount}+`,
      label: "Mitra Travel Aktif",
      icon: Users,
      color: "text-primary bg-primary/10"
    },
    {
      value: `${connectedRoutesCount}+`,
      label: "Rute Terhubung",
      icon: Map,
      color: "text-emerald-600 bg-emerald-50"
    },
    {
      value: `${ticketsSoldCount > 0 ? ticketsSoldCount : "13+"}`,
      label: "Tiket Terjual",
      icon: Zap,
      color: "text-accent-2 bg-amber-50"
    },
    { value: "99.9%", label: "Uptime Sistem", icon: Activity, color: "text-teal-600 bg-teal-50" }
  ];

  // 2. Fetch Active Vendors for Partner Showcase
  const activeVendors = await prisma.vendor.findMany({
    where: { isActive: true },
    select: { name: true, slug: true, logo: true },
    take: 8
  });

  // 3. Fetch Popular Routes based on Trip statistics
  const routesGrouped = await prisma.trip.groupBy({
    by: ["origin", "destination"],
    _min: {
      price: true
    },
    _count: {
      id: true
    },
    orderBy: {
      _count: {
        id: "desc"
      }
    },
    take: 4
  });

  const defaultImages = [
    "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=400&auto=format&fit=crop&q=60",
    "https://images.unsplash.com/photo-1517524008436-bbdb53c57b28?w=400&auto=format&fit=crop&q=60",
    "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=400&auto=format&fit=crop&q=60",
    "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=400&auto=format&fit=crop&q=60"
  ];

  interface PopularRoute {
    from: string;
    to: string;
    price: string;
    time: string;
    rating: string;
    image: string;
  }

  const popularRoutes: PopularRoute[] =
    routesGrouped.length > 0
      ? await Promise.all(
          routesGrouped.map(async (r, idx: number) => {
            const tripSample = await prisma.trip.findFirst({
              where: {
                origin: r.origin,
                destination: r.destination,
                vehicle: {
                  imageUrl: { not: null }
                }
              },
              select: {
                vehicle: {
                  select: {
                    imageUrl: true
                  }
                }
              }
            });

            const vehicleImage = tripSample?.vehicle?.imageUrl;

            return {
              from: capitalize(r.origin),
              to: capitalize(r.destination),
              price: r._min.price
                ? `Rp ${Number(r._min.price).toLocaleString("id-ID")}`
                : "Rp 150.000",
              time: r.origin.toLowerCase().includes("pekanbaru") ? "2.5 Jam" : "3 Jam",
              rating: (4.7 + ((idx * 7) % 3) / 10).toFixed(1),
              image: vehicleImage || defaultImages[idx % defaultImages.length]
            };
          })
        )
      : [
          {
            from: "Jakarta",
            to: "Bandung",
            price: "Rp 150.000",
            time: "3 Jam",
            rating: "4.9",
            image: defaultImages[0]
          },
          {
            from: "Kota Pekanbaru",
            to: "Kota Dumai",
            price: "Rp 75.000",
            time: "4 Jam",
            rating: "4.8",
            image: defaultImages[1]
          },
          {
            from: "Bandung",
            to: "Kulim",
            price: "Rp 800.000",
            time: "5 Jam",
            rating: "4.9",
            image: defaultImages[2]
          },
          {
            from: "Buleleng",
            to: "Tangerang",
            price: "Rp 200.000",
            time: "12 Jam",
            rating: "4.7",
            image: defaultImages[3]
          }
        ];

  const passengerFeatures = [
    {
      title: "Pencarian Presisi & Cepat",
      description:
        "Cari tiket travel dengan rute dan jadwal terlengkap hanya dalam hitungan detik.",
      icon: Compass
    },
    {
      title: "Pilih Kursi Favorit",
      description:
        "Gunakan peta kursi interaktif kami untuk memilih tempat duduk ternyaman pilihan Anda.",
      icon: Users
    },
    {
      title: "Metode Pembayaran Lengkap",
      description:
        "Mulai dari Transfer Bank, E-Wallet, hingga QRIS. Instan, otomatis, dan 100% aman.",
      icon: ShieldCheck
    },
    {
      title: "Manajemen Tiket Mandiri",
      description:
        "Butuh refund atau reschedule? Lakukan semuanya langsung dari dashboard e-tiket Anda.",
      icon: Settings
    }
  ];

  const saasFeatures = [
    {
      title: "Kalender Keberangkatan Cerdas",
      description:
        "Cegah tabrakan jadwal dengan validasi tanggal keberangkatan, booking deadline, dan kota tujuan secara realtime.",
      icon: Calendar
    },
    {
      title: "Dashboard Operasional Real-Time",
      description:
        "Kelola armada, data pengemudi (driver), rute populer, serta penjualan harian dalam satu layar terpusat.",
      icon: TrendingUp
    },
    {
      title: "Sistem Refund & Dispute Otomatis",
      description:
        "Kelola pengajuan refund dari penumpang dengan dialog modal persetujuan yang transparan dan cepat.",
      icon: DollarSign
    },
    {
      title: "Keamanan Data Kelas Enterprise",
      description:
        "Proteksi penuh untuk database operasional Anda dengan sistem enkripsi dan backup otomatis harian.",
      icon: Shield
    }
  ];

  const testimonials = [
    {
      name: "Budi Santoso",
      role: "Pemilik DayTrans Travel",
      avatar:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80",
      content:
        "Semenjak migrasi ke AyoTrip, manajemen armada dan penjadwalan driver kami menjadi 100% bebas dari tabrakan jadwal. Sangat merekomendasikan SaaS ini!",
      rating: 5
    },
    {
      name: "Siti Rahma",
      role: "Penumpang Setia",
      avatar:
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80",
      content:
        "Pesan tiket lewat AyoTrip gampang banget. E-tiket langsung terbit dalam semenit dan proses refund dana kemarin sangat transparan lewat modal di web.",
      rating: 5
    },
    {
      name: "Hendra Wijaya",
      role: "Manajer Operasional Jackal Holidays",
      avatar:
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80",
      content:
        "Fitur auto-complete kota asal/tujuan serta validasi tanggal keberangkatan sangat meminimalkan human-error staf kami saat memasukkan jadwal baru.",
      rating: 5
    }
  ];

  return (
    <div className="flex flex-col bg-zinc-50 dark:bg-zinc-950">
      {/* 1. Hero Section */}
      <HeroSection />

      {/* 2. Stats Section */}
      <section className="relative z-10 -mt-10 px-6">
        <div className="mx-auto max-w-5xl rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            {stats.map((stat, i) => {
              const Icon = stat.icon;
              return (
                <div key={i} className="flex flex-col items-center text-center">
                  <div
                    className={`mb-3 flex h-12 w-12 items-center justify-center rounded-2xl ${stat.color}`}
                  >
                    <Icon className="size-6" />
                  </div>
                  <span className="text-3xl font-black text-zinc-900 dark:text-white">
                    {stat.value}
                  </span>
                  <span className="mt-1 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                    {stat.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 3. Partner Showcase (Dynamic Vendors from Database) */}
      <section className="border-b border-zinc-100 bg-white py-12 dark:border-zinc-900 dark:bg-zinc-950">
        <div className="mx-auto max-w-7xl px-6 text-center">
          <p className="mb-6 text-xs font-bold tracking-wider text-zinc-400 uppercase">
            Mitra Travel Resmi yang Terintegrasi di AyoTrip
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16">
            {activeVendors.length > 0 ? (
              activeVendors.map((vendor, idx) => (
                <Link
                  key={idx}
                  href={`/vendor/${vendor.slug}`}
                  className="hover:text-primary group flex items-center gap-2 font-bold text-zinc-700 transition-colors dark:text-zinc-300"
                >
                  <div className="group-hover:bg-primary/10 group-hover:text-primary flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-100 text-zinc-500 transition-all dark:bg-zinc-800">
                    <Building className="size-4" />
                  </div>
                  <span>{vendor.name}</span>
                </Link>
              ))
            ) : (
              <span className="text-sm text-zinc-400">
                Menghubungkan operator travel terbaik di Indonesia...
              </span>
            )}
          </div>
        </div>
      </section>

      {/* 3. Passenger Features (B2C) */}
      <section id="fitur-b2c" className="scroll-mt-20 px-6 py-24">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto mb-16 max-w-3xl space-y-4 text-center">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3.5 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
              <Sparkles className="size-3" />
              Untuk Penumpang
            </div>
            <h2 className="text-3xl font-black tracking-tight text-zinc-900 sm:text-4xl md:text-5xl dark:text-white">
              Perjalanan Nyaman Tanpa Ribet
            </h2>
            <p className="text-muted-foreground text-base md:text-lg">
              Kami menyederhanakan cara Anda memesan tiket travel. Pilih rute, amankan kursi, dan
              terima tiket instan.
            </p>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {passengerFeatures.map((feat, i) => {
              const Icon = feat.icon;
              return (
                <div
                  key={i}
                  className="group relative rounded-2xl border border-zinc-200/60 bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:border-emerald-500/20 hover:shadow-lg dark:border-zinc-800/60 dark:bg-zinc-900"
                >
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 transition-all group-hover:scale-110">
                    <Icon className="size-5" />
                  </div>
                  <h3 className="mb-2 text-lg font-bold text-zinc-900 transition-colors group-hover:text-emerald-600 dark:text-white">
                    {feat.title}
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {feat.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 4. SaaS Business Features (B2B) */}
      <section
        id="fitur-saas"
        className="relative scroll-mt-20 overflow-hidden bg-zinc-900 px-6 py-24 text-white"
      >
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_50%_50%_at_50%_50%,#0ea5e915,transparent_100%)]" />
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col items-center gap-16 lg:flex-row">
            <div className="space-y-6 lg:w-1/2">
              <div className="bg-primary/20 text-primary inline-flex items-center gap-1.5 rounded-full px-3.5 py-1 text-xs font-bold">
                <Sparkles className="size-3" />
                AyoTrip OS untuk Vendor
              </div>
              <h2 className="text-3xl leading-tight font-black tracking-tight sm:text-4xl md:text-5xl">
                Digitalisasi & Kelola <br />
                <span className="from-primary to-accent-2 bg-gradient-to-r bg-clip-text text-transparent">
                  Bisnis Travel Anda
                </span>
              </h2>
              <p className="text-base text-zinc-400 md:text-lg">
                Sistem SaaS terintegrasi untuk mengelola jadwal keberangkatan, kapasitas armada,
                alokasi driver, hingga data analytics penjualan tiket Anda secara akurat.
              </p>

              <div className="flex flex-col gap-4 pt-4 sm:flex-row">
                <Link href="/login">
                  <Button className="bg-primary hover:bg-primary/90 shadow-primary/25 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl px-6 py-5 font-bold text-white shadow-lg sm:w-auto">
                    Coba Dashboard Partner
                    <ArrowRight className="size-4" />
                  </Button>
                </Link>
                <Link
                  href="https://wa.me/6282278536416?text=Halo%20AyoTrip,%20saya%20tertarik%20ingin%20berkonsultasi%20mengenai%20mitra%20travel."
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button
                    variant="outline"
                    className="w-full cursor-pointer justify-center rounded-xl border-zinc-700 px-6 py-5 font-semibold text-white hover:bg-zinc-800 sm:w-auto"
                  >
                    Konsultasi Gratis
                  </Button>
                </Link>
              </div>
            </div>

            <div className="grid w-full gap-6 sm:grid-cols-2 lg:w-1/2">
              {saasFeatures.map((feat, i) => {
                const Icon = feat.icon;
                return (
                  <div
                    key={i}
                    className="group hover:border-primary/40 rounded-2xl border border-zinc-800 bg-zinc-950/50 p-6 transition-all duration-300 hover:bg-zinc-950"
                  >
                    <div className="bg-primary/10 text-primary mb-5 flex h-12 w-12 items-center justify-center rounded-xl transition-all group-hover:scale-115">
                      <Icon className="size-5" />
                    </div>
                    <h3 className="group-hover:text-primary mb-2 text-lg font-bold text-white transition-colors">
                      {feat.title}
                    </h3>
                    <p className="text-sm leading-relaxed text-zinc-400">{feat.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* 5. Popular Routes */}
      <section className="px-6 py-24">
        <div className="mx-auto max-w-7xl">
          <div className="mb-16 flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div className="space-y-4">
              <div className="bg-accent-2/10 text-accent-2 inline-flex items-center gap-1.5 rounded-full px-3.5 py-1 text-xs font-bold">
                <MapPin className="size-3" />
                Rute Favorit
              </div>
              <h2 className="text-3xl font-black tracking-tight text-zinc-900 sm:text-4xl md:text-5xl dark:text-white">
                Rute Paling Sering Dicari
              </h2>
              <p className="text-muted-foreground max-w-xl text-base">
                Daftar destinasi paling populer dengan keberangkatan harian terbanyak dari operator
                travel teratas.
              </p>
            </div>

            <Link href="/#fitur-b2c">
              <Button
                variant="outline"
                className="flex cursor-pointer items-center gap-2 rounded-xl border-zinc-300 font-semibold dark:border-zinc-800"
              >
                Lihat Semua Rute
                <ArrowUpRight className="size-4" />
              </Button>
            </Link>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {popularRoutes.map((route: PopularRoute, i: number) => (
              <div
                key={i}
                className="group overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition-all duration-300 hover:shadow-xl dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={route.image}
                    alt={`${route.from} ke ${route.to}`}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute top-3 right-3 flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-xs font-bold text-amber-500 shadow-sm backdrop-blur-sm dark:bg-zinc-900/90">
                    <Star className="size-3 fill-amber-500" />
                    <span>{route.rating}</span>
                  </div>
                </div>

                <div className="space-y-4 p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-lg font-extrabold text-zinc-900 dark:text-white">
                      <span>{route.from}</span>
                      <ArrowRight className="size-3.5 text-zinc-400" />
                      <span>{route.to}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
                    <span>⏳ {route.time} Perjalanan</span>
                    <span>Keberangkatan Harian</span>
                  </div>

                  <hr className="border-zinc-100 dark:border-zinc-800" />

                  <div className="flex items-center justify-between pt-1">
                    <div>
                      <span className="block text-[10px] font-bold text-zinc-400 uppercase dark:text-zinc-500">
                        Mulai Dari
                      </span>
                      <span className="text-primary text-base font-black">{route.price}</span>
                    </div>

                    <Link href="/#fitur-b2c">
                      <Button className="h-8 cursor-pointer rounded-lg bg-zinc-900 px-3.5 py-2 text-xs font-semibold text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200">
                        Cari Tiket
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. Testimonials */}
      <section id="testimoni" className="scroll-mt-20 bg-zinc-100 px-6 py-24 dark:bg-zinc-900/40">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto mb-16 max-w-3xl space-y-4 text-center">
            <div className="bg-primary/10 text-primary inline-flex items-center gap-1.5 rounded-full px-3.5 py-1 text-xs font-bold">
              <MessageSquare className="size-3" />
              Testimoni Mitra & Pengguna
            </div>
            <h2 className="text-3xl font-black tracking-tight text-zinc-900 sm:text-4xl md:text-5xl dark:text-white">
              Kata Mereka Tentang AyoTrip
            </h2>
            <p className="text-muted-foreground text-base md:text-lg">
              Ratusan operator travel dan ribuan penumpang telah membuktikan kemudahan menggunakan
              platform AyoTrip.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {testimonials.map((test, i) => (
              <div
                key={i}
                className="flex flex-col justify-between rounded-2xl border border-zinc-200/70 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div className="space-y-4">
                  <div className="flex gap-0.5">
                    {[...Array(test.rating)].map((_, starIndex) => (
                      <Star key={starIndex} className="size-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-sm leading-relaxed text-zinc-600 italic dark:text-zinc-300">
                    &quot;{test.content}&quot;
                  </p>
                </div>

                <div className="mt-6 flex items-center gap-4 border-t border-zinc-100 pt-4 dark:border-zinc-800">
                  <img
                    src={test.avatar}
                    alt={test.name}
                    className="h-10 w-10 rounded-full object-cover"
                  />
                  <div>
                    <h4 className="text-sm font-bold text-zinc-900 dark:text-white">{test.name}</h4>
                    <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                      {test.role}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. Conversion Call To Action (CTA) */}
      <section className="relative overflow-hidden px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="from-primary to-accent-2 relative overflow-hidden rounded-3xl bg-gradient-to-r via-teal-700 px-8 py-16 text-center text-white shadow-2xl md:px-16 md:py-20">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.15),transparent_60%)]" />
            <div className="absolute top-0 right-0 -mt-12 -mr-12 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
            <div className="absolute bottom-0 left-0 -mb-12 -ml-12 h-48 w-48 rounded-full bg-white/10 blur-2xl" />

            <div className="relative z-10 mx-auto max-w-3xl space-y-6">
              <h2 className="text-3xl leading-tight font-black sm:text-4xl md:text-5xl">
                Mulai Perjalanan Digital Bisnis Travel Anda Bersama AyoTrip
              </h2>
              <p className="mx-auto max-w-xl text-base text-teal-50 opacity-90 md:text-lg">
                Gabung sebagai mitra travel hari ini, optimalkan penjadwalan armada Anda, dan
                jangkau puluhan ribu penumpang online sekarang juga.
              </p>

              <div className="flex flex-col justify-center gap-4 pt-4 sm:flex-row">
                <Link
                  href="https://wa.me/6282278536416?text=Halo%20AyoTrip,%20saya%20tertarik%20untuk%20bergabung%20sebagai%20mitra%20travel."
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-white px-8 py-6 text-base font-extrabold text-zinc-900 shadow-xl hover:bg-zinc-100 sm:w-auto">
                    Daftar Sebagai Mitra
                    <ArrowRight className="text-primary size-5" />
                  </Button>
                </Link>
                <Link href="/#fitur-b2c">
                  <Button
                    variant="ghost"
                    className="w-full cursor-pointer justify-center rounded-xl border border-white/20 px-8 py-6 text-base font-bold text-white hover:bg-white/10 sm:w-auto"
                  >
                    Cari Tiket Travel
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 8. Footer */}
      <footer className="border-t border-zinc-800 bg-zinc-900 px-6 py-16 text-zinc-400">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-12 sm:grid-cols-2 md:grid-cols-4">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-white">
                <div className="bg-primary/20 flex h-10 w-10 items-center justify-center rounded-xl">
                  <Compass className="text-primary animate-spin-slow size-6" />
                </div>
                <span className="text-2xl font-black tracking-tight">AyoTrip</span>
              </div>
              <p className="text-sm leading-relaxed text-zinc-500">
                Platform SaaS Manajemen Operasional Travel & Pemesanan Tiket Shuttle Terintegrasi
                Nomor #1 di Indonesia.
              </p>
            </div>

            <div className="space-y-4">
              <h4 className="text-sm font-bold tracking-wider text-white uppercase">
                Perjalanan B2C
              </h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/#fitur-b2c" className="transition-colors hover:text-white">
                    Cari Tiket Travel
                  </Link>
                </li>
                <li>
                  <Link href="/ticket" className="transition-colors hover:text-white">
                    Cek Status E-Tiket
                  </Link>
                </li>
                <li>
                  <Link href="/#testimoni" className="transition-colors hover:text-white">
                    Testimoni Pengguna
                  </Link>
                </li>
              </ul>
            </div>

            <div className="space-y-4">
              <h4 className="text-sm font-bold tracking-wider text-white uppercase">
                Layanan B2B Partner
              </h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/login" className="transition-colors hover:text-white">
                    Dashboard Partner
                  </Link>
                </li>
                <li>
                  <Link href="/#fitur-saas" className="transition-colors hover:text-white">
                    Fitur SaaS Manajemen
                  </Link>
                </li>
                <li>
                  <Link
                    href="https://wa.me/6282278536416?text=Halo%20AyoTrip,%20saya%20tertarik%20untuk%20bergabung%20sebagai%20mitra%20travel."
                    target="_blank"
                    rel="noopener noreferrer"
                    className="transition-colors hover:text-white"
                  >
                    Registrasi Mitra Baru
                  </Link>
                </li>
              </ul>
            </div>

            <div className="space-y-4">
              <h4 className="text-sm font-bold tracking-wider text-white uppercase">
                Hubungi Kami
              </h4>
              <ul className="space-y-2 text-sm text-zinc-500">
                <li>📍 Jakarta, Indonesia</li>
                <li>📧 support@ayotrip.com</li>
                <li>📞 +62 (21) 5000-8899</li>
              </ul>
            </div>
          </div>

          <hr className="my-12 border-zinc-800" />

          <div className="flex flex-col items-center justify-between gap-4 text-xs text-zinc-500 md:flex-row">
            <span>
              &copy; {new Date().getFullYear()} AyoTrip. Hak Cipta Dilindungi Undang-Undang.
            </span>
            <div className="flex gap-6">
              <Link href="/help" className="transition-colors hover:text-white">
                Kebijakan Privasi
              </Link>
              <Link href="/help" className="transition-colors hover:text-white">
                Syarat & Ketentuan
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
