import { Link } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";
import {
  ArrowUpRight,
  Axe,
  Droplet,
  Hammer,
  HelpCircle,
  PaintBucket,
  Snowflake,
  Sprout,
  Wind,
  Wrench,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

const ICONS: Record<string, LucideIcon> = {
  Wind,
  Zap,
  Droplet,
  Hammer,
  PaintBucket,
  Axe,
  Sprout,
  Snowflake,
  Wrench,
};

export function categoryIcon(name?: string | null): LucideIcon {
  return (name && ICONS[name]) || HelpCircle;
}

export type CategoryCardData = {
  id: string;
  slug: string;
  name: string;
  icon: string | null;
  description?: string | null;
};

export function CategoryCard({
  category,
  className,
  compact = false,
}: {
  category: CategoryCardData;
  className?: string;
  compact?: boolean;
}) {
  const Icon = categoryIcon(category.icon);

  return (
    <Link
      to="/search"
      search={{ category: category.slug } as never}
      className={cn(
        "group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-soft transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-elevated",
        compact ? "gap-2 p-4" : "gap-3 p-5",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div
          className={cn(
            "flex items-center justify-center rounded-xl bg-brand-soft text-primary transition group-hover:gradient-brand group-hover:text-primary-foreground",
            compact ? "h-10 w-10" : "h-12 w-12",
          )}
        >
          <Icon className={cn(compact ? "h-5 w-5" : "h-6 w-6")} strokeWidth={1.75} />
        </div>
        <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition group-hover:opacity-100 group-hover:text-primary" />
      </div>

      <div className="relative z-10">
        <h3 className={cn("font-semibold text-foreground", compact && "text-sm")}>{category.name}</h3>
        {!compact && category.description && (
          <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
            {category.description}
          </p>
        )}
        <p className="mt-2 text-xs font-medium text-primary opacity-0 transition group-hover:opacity-100">
          Explorar →
        </p>
      </div>

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/0 to-primary-glow/0 transition group-hover:from-primary/[0.03] group-hover:to-primary-glow/[0.06]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1 scale-x-0 bg-gradient-to-r from-primary to-primary-glow transition group-hover:scale-x-100" />
    </Link>
  );
}
