import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Search as SearchIcon, Filter, X, MapPin, Clock, DollarSign, LayoutGrid, List } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useUserRole } from "@/hooks/use-user-role";
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
  city: z.string().optional(),
  min: z.coerce.number().optional(),
  max: z.coerce.number().optional(),
});

export const Route = createFileRoute("/search")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Marketplace â€” FIXEO" },
      { name: "description", content: "Encuentra prestadores, servicios ofertados y solicitudes abiertas de trabajo." },
    ],
  }),
  component: SearchPage,
});

function SearchPage() {
  const { q: initialQ, category, tab, city: cityParam, min, max } = Route.useSearch();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isClient, isProvider } = useUserRole();
  const [q, setQ] = useState(initialQ ?? "");
  const [providerView, setProviderView] = useState<"full" | "list">("full");
  // Providers only see client quote requests in "Oportunidades".
  const activeTab = isProvider ? "requests" : (tab === "services" ? "providers" : (tab ?? "providers"));

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
    activeTab === "requests"
      ? activeCategory ? `Solicitudes de ${activeCategory.name.toLowerCase()}` : "Solicitudes abiertas"
      : activeCategory ? activeCategory.name : "Buscar tÃ©cnicos y oficios";

  const subheading =
    activeTab === "requests"
      ? "Trabajos que compradores estÃ¡n buscando ahora mismo. EnvÃ­a tu cotizaciÃ³n."
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
                placeholder="Ej: electricista, aire acondicionado, San Salvadorâ€¦"
                className="border-0 bg-transparent shadow-none focus-visible:ring-0"
              />
            </div>
            <Button type="submit" className="gradient-brand rounded-xl">Buscar</Button>
          </form>

          <div className="mt-4 flex gap-2 overflow-x-auto pb-1 lg:hidden">
            <Link
              to="/search"
              search={{ q: initialQ, tab: activeTab, city: cityParam, min, max } as never}
              className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition ${
                !category
                  ? "bg-brand-soft text-primary"
                  : "border border-border bg-card text-muted-foreground hover:text-foreground"
              }`}
            >
              Todas
            </Link>
            {categories.map((c) => (
              <Link
                key={c.id}
                to="/search"
                search={{ q: initialQ, category: c.slug, tab: activeTab, city: cityParam, min, max } as never}
                className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition ${
                  category === c.slug
                    ? "bg-brand-soft text-primary"
                    : "border border-border bg-card text-muted-foreground hover:text-foreground"
                }`}
              >
                {c.name}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <div className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-10 sm:px-6 lg:grid-cols-[240px_1fr]">
        <aside className="hidden lg:block">
          <div className="rounded-2xl border border-border bg-card p-4 shadow-soft">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
              <Filter className="h-4 w-4" /> CategorÃ­as
            </div>
            <div className="space-y-1">
              <Link
                to="/search"
                search={{ q: initialQ, tab: activeTab, city: cityParam, min, max } as never}
                className={`block rounded-lg px-3 py-2 text-sm ${!category ? "bg-brand-soft font-medium text-primary" : "hover:bg-muted"}`}
              >
                Todas
              </Link>
              {categories.map((c) => (
                <Link
                  key={c.id}
                  to="/search"
                  search={{ q: initialQ, category: c.slug, tab: activeTab, city: cityParam, min, max } as never}
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
            {!isProvider && (
              <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
                <TabsList className="grid min-h-11 flex-1 grid-cols-2 rounded-xl">
                  <TabsTrigger value="providers" className="rounded-lg">Prestadores</TabsTrigger>
                  <TabsTrigger value="requests" className="rounded-lg">Solicitudes</TabsTrigger>
                </TabsList>
                {activeTab === "providers" && (
                  <div className="flex w-fit rounded-xl border border-border bg-card p-1 shadow-soft">
                    <button
                      type="button"
                      onClick={() => setProviderView("full")}
                      className={`inline-flex h-9 w-9 items-center justify-center rounded-lg transition ${
                        providerView === "full"
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      }`}
                      aria-label="Vista completa"
                      title="Vista completa"
                    >
                      <LayoutGrid className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setProviderView("list")}
                      className={`inline-flex h-9 w-9 items-center justify-center rounded-lg transition ${
                        providerView === "list"
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      }`}
                      aria-label="Vista de lista"
                      title="Vista de lista"
                    >
                      <List className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            )}

            <TabsContent value="providers">
              {!loadingProviders && providers.length > 0 && (
                <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm text-muted-foreground">
                    <span className="font-semibold text-foreground">{providers.length}</span>{" "}
                    {providers.length === 1 ? "especialista encontrado" : "especialistas encontrados"}
                  </p>
                  {activeCategory && (
                    <Link
                      to="/search"
                      search={{ q: initialQ, tab: activeTab, city: cityParam, min, max } as never}
                      className="inline-flex items-center gap-1 rounded-full bg-brand-soft px-3 py-1 text-xs font-medium text-primary"
                    >
                      {activeCategory.name}
                      <X className="h-3 w-3" />
                    </Link>
                  )}
                </div>
              )}
              {loadingProviders ? (
                <SkeletonGrid />
              ) : providers.length === 0 ? (
                isClient ? (
                  <EmptyState
                    title="AÃºn no hay especialistas para esta bÃºsqueda"
                    desc="Prueba con otra categorÃ­a o publica una solicitud para recibir propuestas."
                    ctaLabel="Publicar una solicitud"
                    to="/requests/new"
                  />
                ) : (
                  <EmptyState
                    title="AÃºn no hay especialistas disponibles"
                    desc="SÃ© el primero en ofrecer tus servicios en esta categorÃ­a."
                    ctaLabel="Ofrecer mis servicios"
                    to="/become-provider"
                  />
                )
              ) : (
                <div className="grid gap-4">
                  {providers.map((p) => (
                    <ProviderCard key={p.id} provider={p} view={providerView} />
                  ))}
                </div>
              )}
            </TabsContent>


            <TabsContent value="requests">
              {!user ? (
                <EmptyState
                  title="Inicia sesiÃ³n para ver oportunidades"
                  desc="Las solicitudes abiertas estÃ¡n disponibles para prestadores registrados."
                  ctaLabel="Ingresar"
                  to="/auth"
                />
              ) : loadingRequests ? (
                <SkeletonGrid />
              ) : requests.length === 0 ? (
                <EmptyState
                  title="No hay solicitudes abiertas por ahora"
                  desc={activeCategory ? "Prueba con otra categorÃ­a o vuelve mÃ¡s tarde." : "Cambia el filtro o vuelve mÃ¡s tarde."}
                  ctaLabel={isProvider ? "Ver mi perfil" : "Publicar una solicitud"}
                  to={isProvider ? "/dashboard" : "/requests/new"}
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
                        className="group relative overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-soft transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-elevated"
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
                          <Badge variant="outline" className="rounded-lg">{quoteCount} cotizaciÃ³n{quoteCount === 1 ? "" : "es"}</Badge>
                        </div>
                        <div className="mt-3 flex flex-wrap items-center gap-4 border-t border-border pt-3 text-xs text-muted-foreground">
                          {r.city && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {r.city}</span>}
                          {r.preferred_date && <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {new Date(r.preferred_date).toLocaleDateString()}</span>}
                          {(r.budget_min || r.budget_max) && (
                            <span className="flex items-center gap-1"><DollarSign className="h-3 w-3" />
                              {r.budget_min && r.budget_max
                                ? `$${Number(r.budget_min).toLocaleString()} â€“ $${Number(r.budget_max).toLocaleString()}`
                                : `$${Number(r.budget_min ?? r.budget_max).toLocaleString()}`}
                            </span>
                          )}
                        </div>
                        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1 scale-x-0 bg-gradient-to-r from-primary to-primary-glow transition group-hover:scale-x-100" />
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
