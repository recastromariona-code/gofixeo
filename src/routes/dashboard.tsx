import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowUpRight,
  Briefcase,
  Clock,
  DollarSign,
  Eye,
  Heart,
  Inbox,
  MapPin,
  MessageSquare,
  Pencil,
  Plus,
  Search,
  Star,
  Users,
  Zap,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/dashboard")({
  component: Dashboard,
});

const STATUS_META: Record<string, { label: string; className: string }> = {
  pending: { label: "Pendiente", className: "bg-brand-soft text-primary" },
  quoted: { label: "Cotizado", className: "bg-warning/15 text-warning-foreground" },
  accepted: { label: "Aceptado", className: "bg-success/15 text-success" },
  completed: { label: "Completado", className: "bg-muted text-muted-foreground" },
  cancelled: { label: "Cancelado", className: "bg-destructive/10 text-destructive" },
};

function Dashboard() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [user, loading, navigate]);

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  const isProvider = profile?.role === "provider";

  const { data: clientRequests = [], isLoading: loadingClientRequests } = useQuery({
    queryKey: ["clientRequests", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from("quote_requests")
        .select(`id, description, status, created_at, provider:providers(profiles(full_name, avatar_url))`)
        .eq("client_id", user.id)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
    enabled: !!user && !isProvider,
  });

  const { data: providerRequests = [], isLoading: loadingProviderRequests } = useQuery({
    queryKey: ["providerRequests", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from("quote_requests")
        .select(`id, description, status, created_at, address, client:profiles!quote_requests_client_id_fkey(full_name, avatar_url)`)
        .eq("provider_id", user.id)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
    enabled: !!user && isProvider,
  });

  const { data: providerStats, isLoading: loadingStats } = useQuery({
    queryKey: ["providerStats", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase.from("providers").select("rating, reviews_count").eq("id", user.id).maybeSingle();
      return data;
    },
    enabled: !!user && isProvider,
  });

  const { data: providerServices = [], isLoading: loadingServices } = useQuery({
    queryKey: ["providerServices", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from("services")
        .select("id, title, description, starting_price, is_active, categories(name)")
        .eq("provider_id", user.id)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
    enabled: !!user && isProvider,
  });

  const { data: matchedRequests = [], isLoading: loadingMatched } = useQuery({
    queryKey: ["matchedRequests", user?.id],
    enabled: !!user && isProvider,
    queryFn: async () => {
      const { data } = await supabase
        .from("quote_requests")
        .select("id, title, description, city, urgency, created_at, budget_min, budget_max, category:categories(name)")
        .is("provider_id", null)
        .in("status", ["pending", "quoted"])
        .order("created_at", { ascending: false })
        .limit(8);
      return data ?? [];
    },
  });

  const { data: favorites = [], isLoading: loadingFavorites } = useQuery({
    queryKey: ["favorites", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from("favorites")
        .select(`provider_id, providers!inner(id, rating, reviews_count, profiles!inner(full_name, avatar_url, city))`)
        .eq("client_id", user.id);
      return data ?? [];
    },
    enabled: !!user && !isProvider,
  });

  if (!user) return null;

  const firstName = profile?.full_name?.split(" ")[0] ?? "bienvenido";

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />

      <section className="border-b border-border bg-muted/30">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <span className="inline-flex rounded-full bg-brand-soft px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
                {isProvider ? "Panel profesional" : "Mi cuenta"}
              </span>
              <h1 className="mt-3 text-2xl font-bold sm:text-3xl">
                Hola, {profileLoading ? "…" : firstName} 👋
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {isProvider
                  ? "Gestiona tus servicios, oportunidades y solicitudes activas."
                  : "Tus solicitudes, favoritos y contrataciones en un solo lugar."}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {isProvider ? (
                <>
                  <Button asChild variant="outline" className="rounded-xl">
                    <Link to="/become-provider">
                      <Pencil className="h-4 w-4" />
                      Editar perfil
                    </Link>
                  </Button>
                  <Button asChild className="gradient-brand rounded-xl">
                    <Link to="/provider/$providerId" params={{ providerId: user.id }}>
                      <Eye className="h-4 w-4" />
                      Ver mi perfil público
                    </Link>
                  </Button>
                </>
              ) : (
                <>
                  <Button asChild variant="outline" className="rounded-xl">
                    <Link to="/search">
                      <Search className="h-4 w-4" />
                      Buscar especialista
                    </Link>
                  </Button>
                  <Button asChild className="gradient-brand rounded-xl">
                    <Link to="/requests/new">
                      <Plus className="h-4 w-4" />
                      Nueva solicitud
                    </Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
        {isProvider ? (
          <div className="space-y-8">
            <div className="grid gap-4 sm:grid-cols-3">
              {loadingStats || loadingProviderRequests ? (
                Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)
              ) : (
                <>
                  <StatCard
                    icon={Briefcase}
                    label="Solicitudes activas"
                    value={String(providerRequests.length)}
                    hint="Asignadas a ti"
                  />
                  <StatCard
                    icon={Star}
                    label="Calificación"
                    value={Number(providerStats?.rating ?? 0).toFixed(1)}
                    hint={`${providerStats?.reviews_count ?? 0} reseñas`}
                  />
                  <StatCard
                    icon={Inbox}
                    label="Oportunidades"
                    value={String(matchedRequests.length)}
                    hint="Abiertas para cotizar"
                  />
                </>
              )}
            </div>

            <ProviderServicesPreview services={providerServices} loading={loadingServices} />
            <MatchedRequestsPreview rows={matchedRequests} loading={loadingMatched} />

            <DashboardSection
              title="Mis solicitudes asignadas"
              description="Trabajos en curso con clientes que te eligieron."
            >
              <RequestList
                rows={providerRequests}
                loading={loadingProviderRequests}
                emptyText="Aún no tienes solicitudes asignadas. Envía cotizaciones a las oportunidades abiertas."
                emptyAction={{ label: "Ver oportunidades", to: "/search", search: { tab: "requests" } }}
              />
            </DashboardSection>
          </div>
        ) : (
          <>
            <div className="mb-6 grid gap-4 sm:grid-cols-2">
              <StatCard
                icon={MessageSquare}
                label="Mis solicitudes"
                value={String(clientRequests.length)}
                hint="Publicadas por ti"
                compact
              />
              <StatCard
                icon={Heart}
                label="Favoritos"
                value={String(favorites.length)}
                hint="Especialistas guardados"
                compact
              />
            </div>

            <Tabs defaultValue="requests" className="w-full">
              <TabsList className="mb-6 grid w-full grid-cols-2 rounded-xl sm:w-auto sm:inline-grid">
                <TabsTrigger value="requests" className="rounded-lg">
                  Mis solicitudes
                  {clientRequests.length > 0 && (
                    <span className="ml-2 rounded-full bg-brand-soft px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                      {clientRequests.length}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="favorites" className="rounded-lg">
                  Favoritos
                  {favorites.length > 0 && (
                    <span className="ml-2 rounded-full bg-brand-soft px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                      {favorites.length}
                    </span>
                  )}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="requests" className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm text-muted-foreground">Últimas solicitudes publicadas</p>
                  <Button asChild variant="ghost" size="sm" className="rounded-lg">
                    <Link to="/requests">Ver historial completo →</Link>
                  </Button>
                </div>
                <RequestList
                  rows={clientRequests.slice(0, 6)}
                  loading={loadingClientRequests}
                  emptyText="Aún no has publicado solicitudes."
                  emptyAction={{ label: "Crear solicitud", to: "/requests/new" }}
                />
              </TabsContent>

              <TabsContent value="favorites">
                {loadingFavorites ? (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {Array.from({ length: 2 }).map((_, i) => (
                      <Skeleton key={i} className="h-24 rounded-2xl" />
                    ))}
                  </div>
                ) : favorites.length === 0 ? (
                  <EmptyBox
                    text="Aún no tienes favoritos."
                    action={{ label: "Buscar especialistas", to: "/search" }}
                  />
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {favorites.map((f) => (
                      <FavoriteCard key={f.provider_id} favorite={f} />
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>

      <Footer />
    </div>
  );
}

function DashboardSection({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">{title}</h2>
          {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  compact = false,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  hint?: string;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-border bg-card shadow-soft",
        compact ? "p-4" : "p-5",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl gradient-brand text-primary-foreground shadow-soft">
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
            <p className={cn("font-bold text-foreground", compact ? "text-2xl" : "text-3xl")}>{value}</p>
            {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
          </div>
        </div>
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-primary/20 to-primary-glow/20" />
    </div>
  );
}

function EmptyBox({
  text,
  action,
}: {
  text: string;
  action?: { label: string; to: string; search?: Record<string, string> };
}) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
      <p className="text-sm text-muted-foreground">{text}</p>
      {action && (
        <Button asChild className="mt-4 gradient-brand rounded-xl">
          <Link to={action.to} search={action.search as never}>
            {action.label}
          </Link>
        </Button>
      )}
    </div>
  );
}

type RequestRow = {
  id: string;
  description: string;
  status: string;
  created_at: string;
  address?: string | null;
  client?: { full_name: string | null; avatar_url: string | null } | null;
  provider?: { profiles?: { full_name: string | null; avatar_url: string | null } | null } | null;
};

function statusBadge(status: string) {
  const meta = STATUS_META[status] ?? { label: status, className: "bg-muted text-muted-foreground" };
  return (
    <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium capitalize", meta.className)}>
      {meta.label}
    </span>
  );
}

function RequestList({
  rows,
  emptyText,
  emptyAction,
  loading,
}: {
  rows: RequestRow[];
  emptyText: string;
  emptyAction?: { label: string; to: string; search?: Record<string, string> };
  loading?: boolean;
}) {
  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-2xl" />
        ))}
      </div>
    );
  }

  if (rows.length === 0) return <EmptyBox text={emptyText} action={emptyAction} />;

  return (
    <div className="space-y-3">
      {rows.map((r) => {
        const name = r.client?.full_name ?? r.provider?.profiles?.full_name ?? "Usuario";
        const avatarUrl = r.client?.avatar_url ?? r.provider?.profiles?.avatar_url ?? null;
        const initials = name.slice(0, 2).toUpperCase();

        return (
          <Link
            key={r.id}
            to="/requests/$requestId"
            params={{ requestId: r.id }}
            className="group relative flex items-center gap-4 overflow-hidden rounded-2xl border border-border bg-card p-4 shadow-soft transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-elevated"
          >
            <Avatar className="h-12 w-12 shrink-0 border border-border">
              <AvatarImage src={avatarUrl ?? undefined} alt={name} />
              <AvatarFallback className="bg-brand-soft text-sm font-semibold text-primary">{initials}</AvatarFallback>
            </Avatar>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                {statusBadge(r.status)}
                <span className="truncate text-sm font-semibold text-foreground">{name}</span>
              </div>
              <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">{r.description}</p>
              <p className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                {new Date(r.created_at).toLocaleDateString()}
                {r.address && (
                  <>
                    <span className="mx-1">·</span>
                    <MapPin className="h-3 w-3" />
                    {r.address}
                  </>
                )}
              </p>
            </div>

            <div className="flex shrink-0 flex-col items-center gap-1">
              <MessageSquare className="h-5 w-5 text-primary" />
              <ArrowUpRight className="h-4 w-4 text-muted-foreground opacity-0 transition group-hover:opacity-100 group-hover:text-primary" />
            </div>

            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1 scale-x-0 bg-gradient-to-r from-primary to-primary-glow transition group-hover:scale-x-100" />
          </Link>
        );
      })}
    </div>
  );
}

type ServiceRow = {
  id: string;
  title: string;
  description: string | null;
  starting_price: number | null;
  is_active: boolean | null;
  categories?: { name: string | null } | null;
};

function ProviderServicesPreview({ services, loading }: { services: ServiceRow[]; loading?: boolean }) {
  return (
    <section className="rounded-2xl border border-border bg-card p-6 shadow-soft">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold">Mis servicios publicados</h2>
          <p className="text-sm text-muted-foreground">Así ven los clientes lo que ofreces en tu perfil.</p>
        </div>
        <Button asChild variant="ghost" size="sm" className="rounded-lg">
          <Link to="/become-provider">Administrar →</Link>
        </Button>
      </div>

      {loading ? (
        <div className="mt-4 space-y-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      ) : services.length === 0 ? (
        <EmptyBox
          text="Aún no has agregado servicios específicos."
          action={{ label: "Agregar servicios", to: "/become-provider" }}
        />
      ) : (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {services.map((service) => (
            <div
              key={service.id}
              className="group relative overflow-hidden rounded-xl border border-border p-4 transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-soft"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-medium text-foreground">{service.title}</h3>
                    {!service.is_active && (
                      <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                        Oculto
                      </span>
                    )}
                  </div>
                  {service.description && (
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{service.description}</p>
                  )}
                </div>
                {service.starting_price != null && (
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-brand-soft px-2 py-1 text-sm font-semibold text-primary">
                    <DollarSign className="h-3.5 w-3.5" />
                    {Number(service.starting_price).toLocaleString()}
                  </span>
                )}
              </div>
              {service.categories?.name && (
                <span className="mt-3 inline-block rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                  {service.categories.name}
                </span>
              )}
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1 scale-x-0 bg-gradient-to-r from-primary to-primary-glow transition group-hover:scale-x-100" />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

type MatchedRow = {
  id: string;
  title: string | null;
  description: string;
  city: string | null;
  urgency: string;
  created_at: string;
  budget_min: number | null;
  budget_max: number | null;
  category: { name: string | null } | null;
};

function MatchedRequestsPreview({ rows, loading }: { rows: MatchedRow[]; loading?: boolean }) {
  return (
    <section className="rounded-2xl border border-border bg-card p-6 shadow-soft">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold">Oportunidades para ti</h2>
          <p className="text-sm text-muted-foreground">
            Solicitudes abiertas que coinciden con tus categorías. Envía tu cotización.
          </p>
        </div>
        <Button asChild variant="ghost" size="sm" className="rounded-lg">
          <Link to="/search" search={{ tab: "requests" } as never}>
            Ver todas →
          </Link>
        </Button>
      </div>

      {loading ? (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div className="mt-4 rounded-xl border border-dashed border-border bg-muted/30 p-8 text-center">
          <Inbox className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Por ahora no hay solicitudes abiertas que coincidan con tus categorías.
          </p>
        </div>
      ) : (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {rows.map((r) => (
            <Link
              key={r.id}
              to="/requests/$requestId"
              params={{ requestId: r.id }}
              className="group relative overflow-hidden rounded-xl border border-border p-4 transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-soft"
            >
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                {r.category?.name && (
                  <span className="rounded-full bg-brand-soft px-2 py-0.5 font-medium text-primary">
                    {r.category.name}
                  </span>
                )}
                {r.urgency === "high" && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-destructive/15 px-2 py-0.5 font-medium text-destructive">
                    <Zap className="h-3 w-3" />
                    Urgente
                  </span>
                )}
              </div>
              <h3 className="mt-2 truncate font-medium text-foreground group-hover:text-primary">
                {r.title ?? r.description.slice(0, 60)}
              </h3>
              <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{r.description}</p>
              <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
                {r.city && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {r.city}
                  </span>
                )}
                {(r.budget_min || r.budget_max) && (
                  <span className="inline-flex items-center gap-1">
                    <DollarSign className="h-3 w-3" />
                    {r.budget_min != null ? `$${Number(r.budget_min).toLocaleString()}` : "?"}
                    {" – "}
                    {r.budget_max != null ? `$${Number(r.budget_max).toLocaleString()}` : "?"}
                  </span>
                )}
              </div>
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1 scale-x-0 bg-gradient-to-r from-primary to-primary-glow transition group-hover:scale-x-100" />
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

type FavoriteRow = {
  provider_id: string;
  providers: {
    id: string;
    rating: number | null;
    reviews_count: number | null;
    profiles: { full_name: string | null; avatar_url: string | null; city: string | null };
  };
};

function FavoriteCard({ favorite }: { favorite: FavoriteRow }) {
  const profile = favorite.providers?.profiles;
  const name = profile?.full_name ?? "Especialista";
  const initials = name.slice(0, 2).toUpperCase();

  return (
    <Link
      to="/provider/$providerId"
      params={{ providerId: favorite.provider_id }}
      className="group relative flex items-center gap-3 overflow-hidden rounded-2xl border border-border bg-card p-4 shadow-soft transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-elevated"
    >
      <Avatar className="h-12 w-12 shrink-0 border border-border">
        <AvatarImage src={profile?.avatar_url ?? undefined} alt={name} />
        <AvatarFallback className="bg-brand-soft text-sm font-semibold text-primary">{initials}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-foreground">{name}</p>
        {profile?.city && <p className="text-sm text-muted-foreground">{profile.city}</p>}
        <p className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground">
          <Star className="h-3 w-3 fill-warning text-warning" />
          {Number(favorite.providers?.rating ?? 0).toFixed(1)} ({favorite.providers?.reviews_count ?? 0})
        </p>
      </div>
      <Heart className="h-4 w-4 shrink-0 fill-primary/20 text-primary" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1 scale-x-0 bg-gradient-to-r from-primary to-primary-glow transition group-hover:scale-x-100" />
    </Link>
  );
}
