import Navbar from "@/components/public/Navbar";

export default function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="">
      <Navbar />
      <main className="mt-20 md:mt-0">{children}</main>
    </div>
  );
}
