import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  badgeLabel?: string;
  actions?: React.ReactNode;
  className?: string;
}

export function OwnerPageHeader({
  title,
  subtitle,
  icon,
  badgeLabel = "Owner Console",
  actions,
  className
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "scaffold-header relative flex flex-col justify-between gap-6 pb-2 md:flex-row md:items-center",
        className
      )}
    >
      <div className="relative pl-6 md:pl-8">
        <div className="from-primary via-primary/50 absolute top-2 bottom-2 left-0 w-1.5 rounded-full bg-linear-to-b to-transparent" />
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <div className="bg-primary/5 border-primary/10 inline-flex items-center gap-2 rounded-full border px-2.5 py-1 shadow-sm backdrop-blur-sm">
              {icon && <span className="[&>svg]:text-primary [&>svg]:size-3.5">{icon}</span>}
              <span className="text-primary text-[10px] font-extrabold tracking-[0.2em] uppercase">
                {badgeLabel}
              </span>
            </div>
            <div className="bg-border/60 hidden h-px w-8 sm:block" />
          </div>
          <div className="space-y-2">
            <h1 className="scaffold-title">{title}</h1>
            {subtitle && (
              <p className="scaffold-subtitle leading-relaxed font-medium">{subtitle}</p>
            )}
          </div>
        </div>
      </div>

      {actions && (
        <div className="flex shrink-0 items-center gap-3 self-end md:self-center">{actions}</div>
      )}

      <div className="bg-primary/5 absolute -top-20 -left-20 -z-10 size-64 rounded-full opacity-60 blur-[100px]" />
      <div className="absolute top-0 right-0 -z-10 size-40 rounded-full bg-teal-500/5 opacity-40 blur-[80px]" />
    </div>
  );
}
