import { Link } from "@tanstack/react-router";
import { ArrowUpRight, BadgeCheck, MapPin, Star } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

export type ProviderCardData = {
  id: string;
  full_name: string | null;
  city: string | null;
  avatar_url: string | null;
  rating: number | null;
  reviews_count: number | null;
  bio: string | null;
  is_verified: boolean | null;
  categories?: { name: string }[];
};

type ProviderCardView = "full" | "list";

export function ProviderCard({
  provider,
  className,
  view = "full",
}: {
  provider: ProviderCardData;
  className?: string;
  view?: ProviderCardView;
}) {
  const initials = (provider.full_name ?? "P").slice(0, 2).toUpperCase();
  const rating = Number(provider.rating ?? 0);
  const compact = view === "list";

  return (
    <Link
      to="/provider/$providerId"
      params={{ providerId: provider.id }}
      className={cn(
        "group relative flex gap-4 overflow-hidden rounded-2xl border border-border bg-card shadow-soft transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-elevated",
        compact ? "items-center p-4" : "flex-col p-5 sm:flex-row sm:items-start",
        className,
      )}
    >
      {!compact && <div className="relative shrink-0 self-start">
        <div className="rounded-2xl bg-gradient-to-br from-primary/10 to-primary-glow/10 p-0.5 transition group-hover:from-primary/25 group-hover:to-primary-glow/25">
          <Avatar className="h-[4.5rem] w-[4.5rem] rounded-[calc(1rem-2px)] border border-border/80 bg-card">
            <AvatarImage src={provider.avatar_url ?? undefined} alt={provider.full_name ?? ""} />
            <AvatarFallback className="rounded-[calc(1rem-2px)] gradient-brand text-lg font-semibold text-primary-foreground">
              {initials}
            </AvatarFallback>
          </Avatar>
        </div>
        {provider.is_verified && (
          <span className="absolute -bottom-1 -right-1 inline-flex h-6 w-6 items-center justify-center rounded-full border-2 border-card bg-success text-success-foreground">
            <BadgeCheck className="h-3.5 w-3.5" />
          </span>
        )}
      </div>}

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate text-base font-semibold text-foreground sm:text-lg">
              {provider.full_name ?? "Especialista del hogar"}
            </h3>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1 rounded-full bg-warning/10 px-2 py-0.5 text-xs font-medium text-foreground">
                <Star className="h-3.5 w-3.5 fill-warning text-warning" />
                {rating.toFixed(1)}
                <span className="font-normal text-muted-foreground">({provider.reviews_count ?? 0})</span>
              </span>
              {provider.city && (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 shrink-0" />
                  {provider.city}
                </span>
              )}
            </div>
          </div>
          <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition group-hover:opacity-100 group-hover:text-primary" />
        </div>

        {!compact && provider.bio && (
          <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-muted-foreground">{provider.bio}</p>
        )}

        {!compact && <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          {provider.categories && provider.categories.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {provider.categories.slice(0, 3).map((c) => (
                <span
                  key={c.name}
                  className="rounded-full bg-brand-soft px-2.5 py-0.5 text-xs font-medium text-primary"
                >
                  {c.name}
                </span>
              ))}
            </div>
          ) : (
            <span />
          )}
          <span className="text-xs font-semibold text-primary opacity-0 transition group-hover:opacity-100">
            Ver perfil →
          </span>
        </div>}
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1 scale-x-0 bg-gradient-to-r from-primary to-primary-glow transition group-hover:scale-x-100" />
    </Link>
  );
}
