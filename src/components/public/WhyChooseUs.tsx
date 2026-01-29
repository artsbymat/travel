import { CheckCircle, ShieldCheck, Clock, Zap } from "lucide-react";
import { Card } from "@/components/ui/card";

const features = [
  {
    icon: Zap,
    title: "Multi-Vendor",
    description:
      "Pilih dari berbagai vendor terverifikasi dan bandingkan harga secara instan",
  },
  {
    icon: ShieldCheck,
    title: "Sopir Terverifikasi",
    description:
      "Semua sopir telah melalui proses verifikasi dan pemeriksaan latar belakang",
  },
  {
    icon: Clock,
    title: "Tepat Waktu",
    description:
      "Jadwal keberangkatan dan kedatangan yang akurat untuk kenyamanan Anda",
  },
  {
    icon: CheckCircle,
    title: "Pembayaran Aman",
    description:
      "Metode pembayaran aman dan terenkripsi dengan perlindungan pembeli",
  },
];

export function WhyChooseUs() {
  return (
    <section className="w-full py-12 md:py-16">
      <div className="container px-4 mx-auto max-w-7xl">
        <div className="mb-8 md:mb-12 text-center">
          <h2 className="mb-2 text-2xl font-bold text-foreground md:text-3xl">
            Kenapa Memilih Kami?
          </h2>
          <p className="text-muted-foreground">
            Kami menawarkan berbagai fitur unggulan untuk memastikan pengalaman
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <Card
                key={idx}
                className="p-6 bg-secondary hover:shadow-md transition-shadow"
              >
                <div className="gap-2 rounded-lg bg-transparent flex">
                  <Icon className="h-6 w-6 text-chart-3 dark:text-chart-2" />
                  <h3 className="font-semibold text-foreground">
                    {feature.title}
                  </h3>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
