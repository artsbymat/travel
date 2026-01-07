"use client";

import Image from "next/image";
import Link from "next/link";
import Logo from "@/assets/logo.svg";
import { ModeToggle } from "../ui/theme-toggle";
import { usePathname } from "next/navigation";

const navigationLinks: Array<{ name: string; href: string }> = [
  { name: "Beranda", href: "/" },
  { name: "Partner Kami", href: "/partners" },
  { name: "Kontak", href: "/contact" },
];

export default function Navbar() {
  const pathname = usePathname();

  const isActiveLink = (href: string) => {
    return pathname === href;
  };

  return (
    <header className="max-w-7xl mx-auto h-20 md:h-24 flex items-center justify-between px-8">
      <Link href="/" className="flex items-center gap-2 text-2xl font-bold">
        <Image src={Logo} alt="Logo" width={48} height={48} />
        <span>Travel</span>
      </Link>
      <nav className="flex items-center gap-6">
        <ul className="flex items-center gap-6 md:static absolute top-20 left-0 bg-secondary w-full md:w-auto md:bg-transparent p-6 md:p-0 justify-center">
          {navigationLinks.map((link) => (
            <li key={link.href} className="font-medium">
              <Link
                href={link.href}
                className={`${isActiveLink(link.href) ? "underline" : ""}`}
              >
                {link.name}
              </Link>
            </li>
          ))}
        </ul>
        <ModeToggle />
      </nav>
    </header>
  );
}
