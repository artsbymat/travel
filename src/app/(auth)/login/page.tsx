"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import Image from "next/image";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await signIn("credentials", {
      redirect: false,
      email,
      password,
      callbackUrl
    });
    setLoading(false);
    if (res?.error) {
      setError(res.error);
    } else if (res?.ok) {
      router.push(callbackUrl);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center">
      <section className="grid min-w-6xl grid-cols-2 overflow-hidden rounded-3xl shadow-lg">
        <div className="bg-[#E0F2F1] lg:p-16">
          {" "}
          <h1 className="logo-awaw mb-16 text-4xl font-semibold text-[#002420]">FluxFleet</h1>
          <section>
            <h3 className="text-[60px] leading-none font-bold text-[#002420]">
              Your journey,
              <br />
              <span className="text-[60px] font-bold text-[#FF9800]">happy & refined.</span>
            </h3>
          </section>
          <p className="mt-8 text-[20px] font-medium text-[#004D40]">
            The friendliest executive transport on the <br /> planet. Hop in for a smooth, fluid
            ride.
          </p>
          <div
            className="mt-4 flex w-full max-w-83.25 items-center gap-x-4 rounded-full border border-white/50 bg-white/40 p-4 shadow-2xl backdrop-blur-md"
            style={{ boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.15)" }}
          >
            <Image
              src={"/Container.png"}
              alt="Container Image"
              width={96}
              height={40}
              objectFit="contain"
              objectPosition="center"
            />
            <p className="text-[14px] font-bold text-[#004D40]">2,000+ happy travel partners!</p>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="bg-background w-full p-16">
          <h1 className="text-[36px] font-bold text-[#263238]">Welcome Back!</h1>
          <p className="mt-2 text-[18px] font-semibold text-[#546E7A]">
            Ready for your next adventure?
          </p>
          {error && (
            <div className="bg-destructive/10 text-destructive mb-2 rounded px-4 py-2 text-center">
              {error}
            </div>
          )}
          <div>
            <label className="mb-1 block font-medium">Email</label>
            <input
              type="email"
              className="focus:border-primary w-full rounded border px-3 py-2 focus:ring focus:outline-none"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />
          </div>
          <div>
            <label className="mb-1 block font-medium">Password</label>
            <input
              type="password"
              className="focus:border-primary w-full rounded border px-3 py-2 focus:ring focus:outline-none"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </Button>
        </form>
      </section>
    </div>
  );
}
