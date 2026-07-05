import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Search as SearchIcon, Filter, MapPin, Clock, DollarSign } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ProviderCard, type ProviderCardData } from "@/components/ProviderCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

const searchSchema = z.object({
  q: z.string().optional(),
  category: z.string().optional(),
  tab: z.enum(["providers", "services", "requests"]).optional(),
});

export const Route = createFileRoute("/search")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Marketplace — FIXEO" },
      { name: "description", content: "Encuentra prestadores, servicios ofertados y solicitudes abiertas de trabajo." },
    ],
  }),
  component: SearchPage,
});

function SearchPage() {
  const { q: initialQ, category, tab } = Route.useSearch();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [q, setQ] = useState(initialQ ?? "");
  const activeTab = tab ?? "providers";

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data } = await supabase.from("categories").select("id, slug, name, icon").order("sort_order");
      return data ?? [];
    },
  });

  const activeCategory = categories.find((c) => c.slug === category);

  // ============= PROVIDERS =============
  const { data: providers = [], isLoading: loadingProviders } = useQuery({
    queryKey: ["providers", { q: initialQ, category }],
    enabled: activeTab === "providers",
    queryFn: async () => {
      let query = supabase
        .from("providers")
        .select(
          `id, bio, rating, reviews_count, is_verified,
           profiles!inner(full_name, city, avatar_url),
           provider_categories!left(categories(name, slug))`,
        )
        .order("rating", { ascending: false })
        .limit(30);

      if (activeCategory) {
        const { data: pcs } = await supabase
          .from("provider_categories")
          .select("provider_id")
          .eq("category_id", activeCategory.id);
        const ids = (pcs ?? []).map((p) => p.provider_id);
        if (ids.length === 0) return [];
        query = query.in("id", ids);
      }

      const { data, error } = await query;
      if (error) throw error;

      let rows = (data ?? []).map((p): ProviderCardData => ({
        id: p.id,
        full_name: p.profiles?.full_name ?? null,
        city: p.profiles?.city ?? null,
        avatar_url: p.profiles?.avatar_url ?? null,
        rating: Number(p.rating ?? 0),
        reviews_count: p.reviews_count,
        bio: p.bio,
        is_verified: p.is_verified,
        categories: (p.provider_categories ?? [])
          .map((pc: { categories: { name: string } | null }) => pc.categories)
          .filter((c): c is { name: string } => !!c)
          .map((c) => ({ name: c.name })),
      }));

      if (initialQ) {
        const needle = initialQ.toLowerCase();
        rows = rows.filter(
          (r) =>
            (r.full_name ?? "").toLowerCase().includes(needle) ||
            (r.bio ?? "").toLowerCase().includes(needle) ||
            (r.categories ?? []).some((c) => c.name.toLowerCase().includes(needle)),
        );
      }
      return rows;
    },
  });

  // ============= SERVICES =============
  const { data: services = [], isLoading: loadingServices } = useQuery({
    queryKey: ["market-services", { q: initialQ, category: activeCategory?.id }],
    enabled: activeTab === "services",
    queryFn: async () => {
      let query = supabase
        .from("services")
        .select(
          `id, title, description, starting_price, provider_id,
           categories!inner(name, slug),
           providers!inner(id, rating, reviews_count, profiles!inner(full_name, city, avatar_url))`,
        )
        .eq("is_active", true)
        .order("starting_price", { ascending: true, nullsFirst: false })
        .limit(50);

      if (activeCategory) query = query.eq("category_id", activeCategory.id);

      const { data, error } = await query;
      if (error) throw error;
      let rows = data ?? [];
      if (initialQ) {
        const needle = initialQ.toLowerCase();
        rows = rows.filter(
          (s) =>
            s.title.toLowerCase().includes(needle) ||
            (s.description ?? "").toLowerCase().includes(needle),
        );
      }
      return rows;
    },
  });

  // ============= OPEN REQUESTS =============
  const { data: requests = [], isLoading: loadingRequests } = useQuery({
    queryKey: ["market-requests", { q: initialQ, category: activeCategory?.id, uid: user?.id }],
    enabled: activeTab === "requests" && !!user,
    queryFn: async () => {
      let query = supabase
        .from("quote_requests")
        .select(
          `id, title, description, city, urgency, budget_min, budget_max, created_at, preferred_date, status,
           categories(name, slug),
           quotes(count)`,
        )
        .is("provider_id", null)
        .in("status", ["pending", "quoted"])
        .order("created_at", { ascending: false })
        .limit(50);

      if (activeCategory) query = query.eq("category_id", activeCategory.id);

      const { data, error } = await query;
      if (error) throw error;
      let rows = data ?? [];
      if (initialQ) {
        const needle = initialQ.toLowerCase();
        rows = rows.filter(
          (r) =>
            (r.title ?? "").toLowerCase().includes(needle) ||
            (r.description ?? "").toLowerCase().includes(needle) ||
            (r.city ?? "").toLowerCase().includes(needle),
        );
      }
      return rows;
    },
  });

  const heading =
    activeTab === "services"
      ? activeCategory ? `Servicios de ${activeCategory.name.toLowerCase()}` : "Servicios ofertados"
      : activeTab === "requests"
        ? activeCategory ? `Solicitudes de ${activeCategory.name.toLowerCase()}` : "Solicitudes abiertas"
        : activeCategory ? activeCategory.name : "Buscar técnicos y oficios";

  const subheading =
    activeTab === "services"
      ? "Explora servicios publicados por prestadores con precio de referencia."
      : activeTab === "requests"
        ? "Trabajos que compradores están buscando ahora mismo. Envía tu cotización."
        : "Encuentra especialistas del hogar cerca de ti";

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <section className="border-b border-border bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
          <h1 className="text-2xl font-bold sm:text-3xl">{heading}</h1>
          <p className="mt-1 text-muted-foreground">{subheading}</p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              navigate({ to: "/search", search: { q, category, tab: activeTab } as never });
            }}
            className="mt-5 flex items-center gap-2 rounded-2xl border border-border bg-card p-2 shadow-soft"
          >
            <div className="flex flex-1 items-center gap-2 px-3">
              <SearchIcon className="h-5 w-5 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Ej: electricista, aire acondicionado, Bogotá…"
                className="border-0 bg-transparent shadow-none focus-visible:ring-0"
              />
            </div>
            <Button type="submit" className="gradient-brand rounded-xl">Buscar</Button>
          </form>
        </div>
      </section>

      <div className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-10 sm:px-6 lg:grid-cols-[240px_1fr]">
        <aside className="hidden lg:block">
          <div className="rounded-2xl border border-border bg-card p-4 shadow-soft">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
              <Filter className="h-4 w-4" /> Categorías
            </div>
            <div className="space-y-1">
              <Link
                to="/search"
                search={{ q: initialQ, tab: activeTab } as never}
                className={`block rounded-lg px-3 py-2 text-sm ${!category ? "bg-brand-soft font-medium text-primary" : "hover:bg-muted"}`}
              >
                Todas
              </Link>
              {categories.map((c) => (
                <Link
                  key={c.id}
                  to="/search"
                  search={{ q: initialQ, category: c.slug, tab: activeTab } as never}
                  className={`block rounded-lg px-3 py-2 text-sm ${category === c.slug ? "bg-brand-soft font-medium text-primary" : "hover:bg-muted"}`}
                >
                  {c.name}
                </Link>
              ))}
            </div>
          </div>
        </aside>

        <div>
          <Tabs
            value={activeTab}
            onValueChange={(v) => navigate({ to: "/search", search: { q: initialQ, category, tab: v } as never })}
          >
            <TabsList className="mb-6 grid w-full grid-cols-3 rounded-xl">
              <TabsTrigger value="providers" className="rounded-lg">Prestadores</TabsTrigger>
              <TabsTrigger value="services" className="rounded-lg">Servicios</TabsTrigger>
              <TabsTrigger value="requests" className="rounded-lg">Solicitudes</TabsTrigger>
            </TabsList>

            <TabsContent value="providers">
              {loadingProviders ? (
                <SkeletonGrid />
              ) : providers.length === 0 ? (
                <EmptyState
                  title="Aún no hay especialistas disponibles"
                  desc="Sé el primer prestador de servicios en esta categoría."
                  ctaLabel="Ofrecer mis servicios"
                  to="/become-provider"
                />
              ) : (
                <div className="grid gap-4">
                  {providers.map((p) => <ProviderCard key={p.id} provider={p} />)}
                </div>
              )}
            </TabsContent>

            <TabsContent value="services">
              {loadingServices ? (
                <SkeletonGrid />
              ) : services.length === 0 ? (
                <EmptyState
                  title="Aún no hay servicios publicados"
                  desc="Publica tus servicios con precio de referencia para atraer clientes."
                  ctaLabel="Publicar un servicio"
                  to="/become-provider"
                />
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {services.map((s) => (
                    <Link
                      key={s.id}
                      to="/provider/$providerId"
                      params={{ providerId: s.provider_id }}
                      className="group rounded-2xl border border-border bg-card p-5 shadow-soft transition hover:border-primary/40 hover:shadow-md"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <Badge variant="secondary" className="rounded-lg text-xs">{s.categories?.name}</Badge>
                          <h3 className="mt-2 font-semibold group-hover:text-primary">{s.title}</h3>
                        </div>
                        {s.starting_price != null && (
                          <div className="text-right">
                            <div className="text-xs text-muted-foreground">Desde</div>
                            <div className="font-bold text-primary">${Number(s.starting_price).toLocaleString()}</div>
                          </div>
                        )}
                      </div>
                      {s.description && (
                        <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{s.description}</p>
                      )}
                      <div className="mt-3 flex items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground">
                        <span>{s.providers?.profiles?.full_name ?? "Prestador"}</span>
                        <span>⭐ {Number(s.providers?.rating ?? 0).toFixed(1)} ({s.providers?.reviews_count ?? 0})</span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="requests">
              {!user ? (
                <EmptyState
                  title="Inicia sesión para ver oportunidades"
                  desc="Las solicitudes abiertas están disponibles para prestadores registrados."
                  ctaLabel="Ingresar"
                  to="/auth"
                />
              ) : loadingRequests ? (
                <SkeletonGrid />
              ) : requests.length === 0 ? (
                <EmptyState
                  title="No hay solicitudes abiertas por ahora"
                  desc={activeCategory ? "Prueba con otra categoría o vuelve más tarde." : "Cambia el filtro o vuelve más tarde."}
                  ctaLabel="Publicar una solicitud"
                  to="/requests/new"
                />
              ) : (
                <div className="grid gap-4">
                  {requests.map((r) => {
                    const quoteCount = Array.isArray(r.quotes) ? (r.quotes[0]?.count ?? 0) : 0;
                    const urgencyColor =
                      r.urgency === "high" ? "bg-destructive/10 text-destructive"
                        : r.urgency === "medium" ? "bg-amber-500/10 text-amber-700 dark:text-amber-400"
                          : "bg-muted text-muted-foreground";
                    return (
                      <Link
                        key={r.id}
                        to="/requests/$requestId"
                        params={{ requestId: r.id }}
                        className="group rounded-2xl border border-border bg-card p-5 shadow-soft transition hover:border-primary/40 hover:shadow-md"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              {r.categories?.name && (
                                <Badge variant="secondary" className="rounded-lg text-xs">{r.categories.name}</Badge>
                              )}
                              <span className={`rounded-lg px-2 py-0.5 text-xs font-medium ${urgencyColor}`}>
                                {r.urgency === "high" ? "Urgente" : r.urgency === "medium" ? "Media" : "Flexible"}
                              </span>
                            </div>
                            <h3 className="mt-2 font-semibold group-hover:text-primary">{r.title ?? "Solicitud"}</h3>
                            {r.description && (
                              <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{r.description}</p>
                            )}
                          </div>
                          <Badge variant="outline" className="rounded-lg">{quoteCount} cotización{quoteCount === 1 ? "" : "es"}</Badge>
                        </div>
                        <div className="mt-3 flex flex-wrap items-center gap-4 border-t border-border pt-3 text-xs text-muted-foreground">
                          {r.city && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {r.city}</span>}
                          {r.preferred_date && <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {new Date(r.preferred_date).toLocaleDateString()}</span>}
                          {(r.budget_min || r.budget_max) && (
                            <span className="flex items-center gap-1"><DollarSign className="h-3 w-3" />
                              {r.budget_min && r.budget_max
                                ? `$${Number(r.budget_min).toLocaleString()} – $${Number(r.budget_max).toLocaleString()}`
                                : `$${Number(r.budget_min ?? r.budget_max).toLocaleString()}`}
                            </span>
                          )}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
      <Footer />
    </div>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid gap-4">
      {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32 rounded-2xl" />)}
    </div>
  );
}

function EmptyState({ title, desc, ctaLabel, to }: { title: string; desc: string; ctaLabel: string; to: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
      <Button asChild className="mt-4 gradient-brand rounded-xl">
        <Link to={to}>{ctaLabel}</Link>
      </Button>
    </div>
  );
}
