import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { MessageSquare, Clock, Star, DollarSign, Briefcase, Users, Eye, Pencil, MapPin, Zap, Inbox } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/dashboard")({
  component: Dashboard,
});

function Dashboard() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [user, loading, navigate]);

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  const isProvider = profile?.role === "provider";

  const { data: clientRequests = [] } = useQuery({
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

  const { data: providerRequests = [] } = useQuery({
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

  const { data: providerStats } = useQuery({
    queryKey: ["providerStats", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase.from("providers").select("rating, reviews_count").eq("id", user.id).maybeSingle();
      return data;
    },
    enabled: !!user && isProvider,
  });

  const { data: providerServices = [] } = useQuery({
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

  const { data: matchedRequests = [] } = useQuery({
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

  const { data: favorites = [] } = useQuery({
    queryKey: ["favorites", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from("favorites")
        .select(`provider_id, providers!inner(id, rating, profiles!inner(full_name, avatar_url, city))`)
        .eq("client_id", user.id);
      return data ?? [];
    },
    enabled: !!user && !isProvider,
  });

  if (!user) return null;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold sm:text-3xl">Hola, {profile?.full_name ?? "bienvenido"} 👋</h1>
            <p className="text-sm text-muted-foreground">
              {isProvider ? "Panel del prestador de servicios" : "Tus solicitudes y contrataciones"}
            </p>
          </div>
          {!isProvider && (
            <div className="flex flex-wrap gap-2">
              <Button asChild className="rounded-xl">
                <Link to="/requests/new">+ Nueva solicitud</Link>
              </Button>
            </div>
          )}
        </div>

        {isProvider ? (
          <>
            <div className="mb-4 flex flex-wrap justify-end gap-2">
              <Button asChild variant="outline" className="rounded-xl">
                <Link to="/become-provider">
                  <Pencil className="h-4 w-4" /> Editar mis servicios
                </Link>
              </Button>
              <Button asChild className="gradient-brand rounded-xl">
                <Link to="/provider/$providerId" params={{ providerId: user.id }}>
                  <Eye className="h-4 w-4" /> Ver como cliente
                </Link>
              </Button>
            </div>
            <div className="mb-6 grid gap-4 sm:grid-cols-3">
              <StatCard icon={Briefcase} label="Solicitudes" value={String(providerRequests.length)} />
              <StatCard icon={Star} label="Calificación" value={Number(providerStats?.rating ?? 0).toFixed(1)} />
              <StatCard icon={Users} label="Reseñas" value={String(providerStats?.reviews_count ?? 0)} />
            </div>
            <ProviderServicesPreview services={providerServices} />
            <MatchedRequestsPreview rows={matchedRequests} />
            <RequestList
              rows={providerRequests}
              emptyText="Aún no tienes solicitudes asignadas. Envía cotizaciones a las oportunidades abiertas."
            />
          </>
        ) : (
          <Tabs defaultValue="requests" className="w-full">
            <TabsList>
              <TabsTrigger value="requests">Mis solicitudes</TabsTrigger>
              <TabsTrigger value="favorites">Favoritos</TabsTrigger>
            </TabsList>
            <TabsContent value="requests" className="mt-4 space-y-3">
              <div className="flex justify-end">
                <Button asChild variant="ghost" size="sm">
                  <Link to="/requests">Ver historial completo →</Link>
                </Button>
              </div>
              <RequestList rows={clientRequests.slice(0, 6)} emptyText="Aún no has publicado solicitudes." />
            </TabsContent>

            <TabsContent value="favorites" className="mt-4">
              {favorites.length === 0 ? (
                <EmptyBox text="Aún no tienes favoritos" />
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {favorites.map((f) => (
                    <Link
                      key={f.provider_id}
                      to="/provider/$providerId"
                      params={{ providerId: f.provider_id }}
                      className="rounded-2xl border border-border bg-card p-4 shadow-soft hover:border-primary/40"
                    >
                      <div className="font-semibold">{f.providers?.profiles?.full_name}</div>
                      <div className="text-sm text-muted-foreground">{f.providers?.profiles?.city}</div>
                    </Link>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
      <Footer />
    </div>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-soft text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
          <div className="text-xl font-bold">{value}</div>
        </div>
      </div>
    </div>
  );
}

function EmptyBox({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
      {text}
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

type ServiceRow = {
  id: string;
  title: string;
  description: string | null;
  starting_price: number | null;
  is_active: boolean | null;
  categories?: { name: string | null } | null;
};

function ProviderServicesPreview({ services }: { services: ServiceRow[] }) {
  return (
    <section className="mb-6 rounded-2xl border border-border bg-card p-6 shadow-soft">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold">Mis servicios publicados</h2>
          <p className="text-sm text-muted-foreground">Vista previa de cómo tus servicios aparecen en tu perfil público.</p>
        </div>
        <Button asChild variant="ghost" size="sm">
          <Link to="/become-provider">Administrar</Link>
        </Button>
      </div>

      {services.length === 0 ? (
        <div className="mt-4 rounded-xl border border-dashed border-border bg-muted/30 p-6 text-center text-sm text-muted-foreground">
          Aún no has agregado servicios específicos.
        </div>
      ) : (
        <div className="mt-4 grid gap-3">
          {services.map((service) => (
            <div key={service.id} className="rounded-xl border border-border p-4 transition hover:border-primary/40">
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
                  {service.description && <p className="mt-1 text-sm text-muted-foreground">{service.description}</p>}
                </div>
                {service.starting_price != null && (
                  <span className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-primary">
                    <DollarSign className="h-3.5 w-3.5" />
                    desde {Number(service.starting_price).toLocaleString()}
                  </span>
                )}
              </div>
              {service.categories?.name && (
                <span className="mt-3 inline-block rounded-full bg-brand-soft px-2 py-0.5 text-xs font-medium text-primary">
                  {service.categories.name}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function RequestList({ rows, emptyText }: { rows: RequestRow[]; emptyText: string }) {
  if (rows.length === 0) return <EmptyBox text={emptyText} />;
  return (
    <div className="space-y-3">
      {rows.map((r) => {
        const name = r.client?.full_name ?? r.provider?.profiles?.full_name ?? "Usuario";
        return (
          <Link
            key={r.id}
            to="/requests/$requestId"
            params={{ requestId: r.id }}
            className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-card p-4 shadow-soft transition hover:border-primary/40"
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-brand-soft px-2 py-0.5 text-xs font-medium capitalize text-primary">{r.status}</span>
                <span className="text-sm font-medium truncate">{name}</span>
              </div>
              <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">{r.description}</p>
              <p className="mt-1 text-xs text-muted-foreground inline-flex items-center gap-1">
                <Clock className="h-3 w-3" /> {new Date(r.created_at).toLocaleDateString()}
              </p>
            </div>
            <MessageSquare className="h-5 w-5 text-primary" />
          </Link>
        );
      })}
    </div>
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

function MatchedRequestsPreview({ rows }: { rows: MatchedRow[] }) {
  return (
    <section className="mb-6 rounded-2xl border border-border bg-card p-6 shadow-soft">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold">Oportunidades que coinciden con tu perfil</h2>
          <p className="text-sm text-muted-foreground">
            Solicitudes abiertas de las categorías que ofreces. Envía tu cotización para ganar el trabajo.
          </p>
        </div>
        <Button asChild variant="ghost" size="sm">
          <Link to="/search" search={{ tab: "requests" } as never}>Ver todas</Link>
        </Button>
      </div>

      {rows.length === 0 ? (
        <div className="mt-4 rounded-xl border border-dashed border-border bg-muted/30 p-6 text-center text-sm text-muted-foreground">
          <Inbox className="mx-auto mb-2 h-6 w-6" />
          Por ahora no hay solicitudes abiertas que coincidan con tus categorías.
        </div>
      ) : (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {rows.map((r) => (
            <Link
              key={r.id}
              to="/requests/$requestId"
              params={{ requestId: r.id }}
              className="rounded-xl border border-border p-4 transition hover:border-primary/40"
            >
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                {r.category?.name && (
                  <span className="rounded-full bg-brand-soft px-2 py-0.5 font-medium text-primary">{r.category.name}</span>
                )}
                {r.urgency === "high" && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-destructive/15 px-2 py-0.5 font-medium text-destructive">
                    <Zap className="h-3 w-3" /> Urgente
                  </span>
                )}
              </div>
              <h3 className="mt-2 truncate font-medium">{r.title ?? r.description.slice(0, 60)}</h3>
              <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{r.description}</p>
              <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
                {r.city && <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{r.city}</span>}
                {(r.budget_min || r.budget_max) && (
                  <span className="inline-flex items-center gap-1">
                    <DollarSign className="h-3 w-3" />
                    {r.budget_min ?? "?"}–{r.budget_max ?? "?"}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
