import { Link } from "@tanstack/react-router";
import { Star, MapPin, BadgeCheck } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

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

export function ProviderCard({ provider }: { provider: ProviderCardData }) {
  const initials = (provider.full_name ?? "P").slice(0, 2).toUpperCase();
  return (
    <Link
      to="/provider/$providerId"
      params={{ providerId: provider.id }}
      className="group flex gap-4 rounded-2xl border border-border bg-card p-5 shadow-soft transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-elevated"
    >
      <Avatar className="h-16 w-16 shrink-0 border border-border">
        <AvatarImage src={provider.avatar_url ?? undefined} alt={provider.full_name ?? ""} />
        <AvatarFallback className="gradient-brand text-primary-foreground">{initials}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="truncate font-semibold text-foreground">{provider.full_name ?? "Prestador"}</h3>
          {provider.is_verified && (
            <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-xs font-medium text-success">
              <BadgeCheck className="h-3 w-3" /> Verificado
            </span>
          )}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Star className="h-4 w-4 fill-warning text-warning" />
            <span className="font-medium text-foreground">{(provider.rating ?? 0).toFixed(1)}</span>
            <span>({provider.reviews_count ?? 0})</span>
          </span>
          {provider.city && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" /> {provider.city}
            </span>
          )}
        </div>
        {provider.bio && (
          <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{provider.bio}</p>
        )}
        {provider.categories && provider.categories.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {provider.categories.slice(0, 3).map((c) => (
              <span key={c.name} className="rounded-full bg-brand-soft px-2.5 py-0.5 text-xs font-medium text-primary">
                {c.name}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
