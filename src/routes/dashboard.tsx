import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { MessageSquare, Clock, Star, DollarSign, Briefcase, Users } from "lucide-react";
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
        .select(`id, description, status, created_at, provider:providers!inner(profiles!inner(full_name, avatar_url))`)
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
              <Button asChild variant="outline" className="rounded-xl">
                <Link to="/become-provider">Ser prestador</Link>
              </Button>
            </div>
          )}
        </div>

        {isProvider ? (
          <>
            <div className="mb-6 grid gap-4 sm:grid-cols-3">
              <StatCard icon={Briefcase} label="Solicitudes" value={String(providerRequests.length)} />
              <StatCard icon={Star} label="Calificación" value={Number(providerStats?.rating ?? 0).toFixed(1)} />
              <StatCard icon={Users} label="Reseñas" value={String(providerStats?.reviews_count ?? 0)} />
            </div>
            <RequestList
              rows={providerRequests}
              emptyText="Aún no tienes solicitudes. Comparte tu perfil para recibir clientes."
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

function RequestList({ rows, emptyText }: { rows: RequestRow[]; emptyText: string }) {
  if (rows.length === 0) return <EmptyBox text={emptyText} />;
  return (
    <div className="space-y-3">
      {rows.map((r) => {
        const name = r.client?.full_name ?? r.provider?.profiles?.full_name ?? "Usuario";
        return (
          <Link
            key={r.id}
            to="/chat/$requestId"
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
