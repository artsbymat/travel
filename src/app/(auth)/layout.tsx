import Image from "next/image";
import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#E0F2F1]">
      <Image
        src={"/Gradient.svg"}
        className="fixed top-0 left-0"
        alt="Gradient Background"
        width={400}
        height={400}
      />
      <section className="z-30">{children}</section>
    </div>
  );
}
