import { MailIcon, MapPinIcon, PhoneIcon } from "lucide-react";
import Link from "next/link";

export function Contact() {
  return (
    <section id="contact">
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <b className="font-semibold text-muted-foreground text-sm uppercase">
            Kontak
          </b>
          <h2 className="mt-3 font-semibold text-2xl tracking-tight md:text-4xl">
            Hubungi Tim Support Kami
          </h2>
          <p className="mt-4 text-base text-muted-foreground sm:text-lg">
            Punya pertanyaan atau butuh bantuan? Tim support kami siap membantu
            Anda. Jangan ragu untuk menghubungi kami melalui email.
          </p>
          <div className="mx-auto grid max-w-(--breakpoint-xl) gap-16 px-6 py-24 md:grid-cols-2 md:gap-10 md:px-0 lg:grid-cols-3">
            <div className="flex flex-col items-center text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full border border-border/30 bg-primary/30 text-primary shadow-xl/2">
                <MailIcon className="text-chart-3 dark:text-primary" />
              </div>
              <h3 className="mt-6 font-semibold text-xl">Email</h3>
              <p className="mt-2 text-muted-foreground">
                Our friendly team is here to help.
              </p>
              <Link
                className="mt-4 font-medium dark:text-primary text-chart-3"
                href="mailto:akashmoradiya3444@gmail.com"
              >
                akashmoradiya3444@gmail.com
              </Link>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full border border-border/30 bg-primary/30 text-primary shadow-xl/2">
                <MapPinIcon className="text-chart-3 dark:text-primary" />
              </div>
              <h3 className="mt-6 font-semibold text-xl">Office</h3>
              <p className="mt-2 text-muted-foreground">
                Come say hello at our office HQ.
              </p>
              <Link
                className="mt-4 font-medium dark:text-primary text-chart-3"
                href="https://map.google.com"
                target="_blank"
              >
                100 Smith Street Collingwood <br /> VIC 3066 AU
              </Link>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full border border-border/30 bg-primary/30 text-primary shadow-xl/2">
                <PhoneIcon className="text-chart-3 dark:text-primary" />
              </div>
              <h3 className="mt-6 font-semibold text-xl">Phone</h3>
              <p className="mt-2 text-muted-foreground">
                Mon-Fri from 8am to 5pm.
              </p>
              <Link
                className="mt-4 font-medium dark:text-primary text-chart-3"
                href="tel:akashmoradiya3444@gmail.com"
              >
                +1 (555) 000-0000
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
