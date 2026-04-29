"use client";

import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  subtitle,
  icon: Icon,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn("scaffold-header relative flex flex-col md:flex-row md:items-center justify-between gap-6 pb-2", className)}>
      <div className="relative pl-6 md:pl-8">
        {/* Vertical Accent Line */}
        <div className="absolute left-0 top-2 bottom-2 w-1.5 rounded-full bg-gradient-to-b from-primary via-primary/50 to-transparent" />
        
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-primary/5 border border-primary/10 backdrop-blur-sm shadow-sm">
              {Icon && <Icon size={14} className="text-primary" />}
              <span className="text-[10px] font-extrabold tracking-[0.2em] text-primary uppercase">
                Super Admin
              </span>
            </div>
            <div className="h-px w-8 bg-border/60 hidden sm:block" />
          </div>
          
          <div className="space-y-2">
            <h1 className="scaffold-title">{title}</h1>
            {subtitle && (
              <p className="scaffold-subtitle font-medium leading-relaxed">
                {subtitle}
              </p>
            )}
          </div>
        </div>
      </div>
      
      {actions && (
        <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
          {actions}
        </div>
      )}
      
      {/* Decorative gradient blur background */}
      <div className="absolute -top-20 -left-20 size-64 bg-primary/5 blur-[100px] -z-10 rounded-full opacity-60" />
      <div className="absolute top-0 right-0 size-40 bg-blue-500/5 blur-[80px] -z-10 rounded-full opacity-40" />
    </div>
  );
}
