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

export function CategoryCard({ category }: { category: CategoryCardData }) {
  const Icon = categoryIcon(category.icon);

  return (
    <Link
      to="/search"
      search={{ category: category.slug } as never}
      className="group relative flex h-full flex-col gap-3 overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-soft transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-elevated"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-soft text-primary transition group-hover:gradient-brand group-hover:text-primary-foreground">
          <Icon className="h-6 w-6" strokeWidth={1.75} />
        </div>
        <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition group-hover:opacity-100 group-hover:text-primary" />
      </div>
      <div>
        <h3 className="font-semibold text-foreground">{category.name}</h3>
        {category.description && (
          <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
            {category.description}
          </p>
        )}
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1 scale-x-0 bg-gradient-to-r from-primary to-primary-glow transition group-hover:scale-x-100" />
    </Link>
  );
}
