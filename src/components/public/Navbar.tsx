import Link from "next/link";

export default function Navbar() {
  return (
    <header className="border-border bg-background border-b">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <div className="text-primary text-2xl font-semibold tracking-tight">Travel</div>
        <div className="flex items-center gap-8">
          <Link
            href="/ticket"
            className="hover:text-muted-foreground text-sm font-medium transition-colors"
          >
            Tiket
          </Link>
          <Link
            href="/help"
            className="hover:text-muted-foreground text-sm font-medium transition-colors"
          >
            Bantuan
          </Link>
        </div>
      </nav>
    </header>
  );
}
