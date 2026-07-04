import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Search as SearchIcon, Filter } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ProviderCard, type ProviderCardData } from "@/components/ProviderCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

const searchSchema = z.object({
  q: z.string().optional(),
  category: z.string().optional(),
});

export const Route = createFileRoute("/search")({
  validateSearch: searchSchema,
  component: SearchPage,
});

function SearchPage() {
  const { q: initialQ, category } = Route.useSearch();
  const navigate = useNavigate();
  const [q, setQ] = useState(initialQ ?? "");

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data } = await supabase.from("categories").select("id, slug, name, icon").order("sort_order");
      return data ?? [];
    },
  });

  const activeCategory = categories.find((c) => c.slug === category);

  const { data: providers = [], isLoading } = useQuery({
    queryKey: ["providers", { q: initialQ, category }],
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
        // filter via inner join by fetching provider ids in that category
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

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <section className="border-b border-border bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
          <h1 className="text-2xl font-bold sm:text-3xl">
            {activeCategory ? activeCategory.name : "Buscar técnicos y oficios"}
          </h1>
          <p className="mt-1 text-muted-foreground">
            {activeCategory
              ? `Especialistas del hogar en ${activeCategory.name.toLowerCase()}`
              : "Encuentra especialistas del hogar cerca de ti"}
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              navigate({ to: "/search", search: { q, category } as never });
            }}
            className="mt-5 flex items-center gap-2 rounded-2xl border border-border bg-card p-2 shadow-soft"
          >
            <div className="flex flex-1 items-center gap-2 px-3">
              <SearchIcon className="h-5 w-5 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Ej: electricista en Bogotá"
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
                search={{ q: initialQ } as never}
                className={`block rounded-lg px-3 py-2 text-sm ${!category ? "bg-brand-soft font-medium text-primary" : "hover:bg-muted"}`}
              >
                Todas
              </Link>
              {categories.map((c) => (
                <Link
                  key={c.id}
                  to="/search"
                  search={{ q: initialQ, category: c.slug } as never}
                  className={`block rounded-lg px-3 py-2 text-sm ${category === c.slug ? "bg-brand-soft font-medium text-primary" : "hover:bg-muted"}`}
                >
                  {c.name}
                </Link>
              ))}
            </div>
          </div>
        </aside>

        <div>
          {isLoading ? (
            <div className="grid gap-4">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-32 rounded-2xl" />
              ))}
            </div>
          ) : providers.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
              <h3 className="text-lg font-semibold">Aún no hay especialistas disponibles</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Sé el primer prestador de servicios en esta categoría.
              </p>
              <Button asChild className="mt-4 gradient-brand rounded-xl">
                <Link to="/become-provider">Ofrecer mis servicios</Link>
              </Button>
            </div>
          ) : (
            <div className="grid gap-4">
              {providers.map((p) => (
                <ProviderCard key={p.id} provider={p} />
              ))}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
