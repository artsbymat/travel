"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Compass, Menu, X, ArrowRight, ShieldCheck } from "lucide-react";
import { Button } from "../ui/button";

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "border-b border-white/10 bg-white/70 backdrop-blur-md dark:bg-zinc-950/70"
          : "bg-transparent"
      }`}
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-xl transition-all group-hover:scale-105">
            <Compass className="text-primary size-6 animate-spin-slow" />
          </div>
          <span className="text-2xl font-black tracking-tight bg-gradient-to-r from-primary to-accent-2 bg-clip-text text-transparent">
            AyoTrip
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden items-center gap-8 md:flex">
          <Link
            href="/"
            className="hover:text-primary text-sm font-medium text-zinc-600 transition-colors dark:text-zinc-300"
          >
            Beranda
          </Link>
          <Link
            href="/#fitur-b2c"
            className="hover:text-primary text-sm font-medium text-zinc-600 transition-colors dark:text-zinc-300"
          >
            Cari Tiket
          </Link>
          <Link
            href="/#fitur-saas"
            className="hover:text-primary text-sm font-medium text-zinc-600 transition-colors dark:text-zinc-300"
          >
            Fitur SaaS Bisnis
          </Link>
          <Link
            href="/#testimoni"
            className="hover:text-primary text-sm font-medium text-zinc-600 transition-colors dark:text-zinc-300"
          >
            Testimoni
          </Link>
          <Link
            href="/ticket"
            className="hover:text-primary text-sm font-medium text-zinc-600 transition-colors dark:text-zinc-300"
          >
            E-Tiket Saya
          </Link>
        </div>

        {/* Desktop CTA */}
        <div className="hidden items-center gap-4 md:flex">
          <Link href="/login">
            <Button variant="ghost" className="text-sm font-medium cursor-pointer">
              Masuk Partner
            </Button>
          </Link>
          <Link href="https://wa.me/6282278536416?text=Halo%20AyoTrip,%20saya%20tertarik%20untuk%20bergabung%20sebagai%20mitra%20travel." target="_blank" rel="noopener noreferrer">
            <Button className="bg-primary hover:bg-primary/95 text-primary-foreground font-semibold shadow-lg shadow-primary/20 cursor-pointer rounded-xl flex items-center gap-2">
              Gabung Mitra
              <ArrowRight className="size-4" />
            </Button>
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="flex items-center justify-center text-zinc-700 dark:text-zinc-300 md:hidden"
          aria-label="Toggle menu"
        >
          {isMobileMenuOpen ? <X className="size-6" /> : <Menu className="size-6" />}
        </button>
      </nav>

      {/* Mobile Menu Panel */}
      {isMobileMenuOpen && (
        <div className="border-b border-zinc-200 bg-white/95 px-6 py-6 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/95 md:hidden animate-in slide-in-from-top-5 duration-200">
          <div className="flex flex-col gap-5">
            <Link
              href="/"
              onClick={() => setIsMobileMenuOpen(false)}
              className="hover:text-primary text-base font-semibold text-zinc-800 dark:text-zinc-200"
            >
              Beranda
            </Link>
            <Link
              href="/#fitur-b2c"
              onClick={() => setIsMobileMenuOpen(false)}
              className="hover:text-primary text-base font-semibold text-zinc-800 dark:text-zinc-200"
            >
              Cari Tiket
            </Link>
            <Link
              href="/#fitur-saas"
              onClick={() => setIsMobileMenuOpen(false)}
              className="hover:text-primary text-base font-semibold text-zinc-800 dark:text-zinc-200"
            >
              Fitur SaaS Bisnis
            </Link>
            <Link
              href="/#testimoni"
              onClick={() => setIsMobileMenuOpen(false)}
              className="hover:text-primary text-base font-semibold text-zinc-800 dark:text-zinc-200"
            >
              Testimoni
            </Link>
            <Link
              href="/ticket"
              onClick={() => setIsMobileMenuOpen(false)}
              className="hover:text-primary text-base font-semibold text-zinc-800 dark:text-zinc-200"
            >
              E-Tiket Saya
            </Link>
            <hr className="border-zinc-200 dark:border-zinc-800 my-2" />
            <div className="flex flex-col gap-3">
              <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>
                <Button variant="outline" className="w-full justify-center rounded-xl cursor-pointer">
                  Masuk Partner
                </Button>
              </Link>
              <Link href="https://wa.me/6282278536416?text=Halo%20AyoTrip,%20saya%20tertarik%20untuk%20bergabung%20sebagai%20mitra%20travel." target="_blank" rel="noopener noreferrer" onClick={() => setIsMobileMenuOpen(false)}>
                <Button className="bg-primary hover:bg-primary/95 text-primary-foreground w-full justify-center rounded-xl shadow-lg shadow-primary/10 cursor-pointer">
                  Gabung Mitra
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

