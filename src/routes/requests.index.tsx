import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Plus, MapPin, Clock, Zap, FileText, Inbox, CheckCircle2, XCircle } from "lucide-react";

export const Route = createFileRoute("/requests/")({
  component: RequestsPage,
  head: () => ({
    meta: [
      { title: "Mis solicitudes · FIXEO" },
      { name: "description", content: "Gestiona tus solicitudes de servicio, revisa cotizaciones y sigue el estado de tus trabajos." },
    ],
  }),
});

type Row = {
  id: string;
  title: string | null;
  description: string;
  status: string;
  city: string | null;
  urgency: string;
  created_at: string;
  preferred_date: string | null;
  budget_min: number | null;
  budget_max: number | null;
  category: { name: string } | null;
  quotes: { count: number }[];
};

function RequestsPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [user, loading, navigate]);

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["my-requests", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("quote_requests")
        .select(`id, title, description, status, city, urgency, created_at, preferred_date, budget_min, budget_max,
                 category:categories(name), quotes(count)`)
        .eq("client_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Row[];
    },
    enabled: !!user,
  });

  const groups = {
    active: rows.filter((r) => r.status === "pending" || r.status === "quoted"),
    inProgress: rows.filter((r) => r.status === "accepted"),
    completed: rows.filter((r) => r.status === "completed"),
    cancelled: rows.filter((r) => r.status === "cancelled"),
  };

  if (!user) return null;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 sm:py-10">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold sm:text-3xl">Mis solicitudes</h1>
            <p className="text-sm text-muted-foreground">Historial completo y estado de tus contrataciones.</p>
          </div>
          <Button asChild className="rounded-xl">
            <Link to="/requests/new"><Plus className="mr-1 h-4 w-4" />Nueva solicitud</Link>
          </Button>
        </div>

        <Tabs defaultValue="active" className="w-full">
          <TabsList className="w-full justify-start overflow-x-auto">
            <TabsTrigger value="active">Activas <Badge variant="secondary" className="ml-2">{groups.active.length}</Badge></TabsTrigger>
            <TabsTrigger value="inProgress">En proceso <Badge variant="secondary" className="ml-2">{groups.inProgress.length}</Badge></TabsTrigger>
            <TabsTrigger value="completed">Finalizadas <Badge variant="secondary" className="ml-2">{groups.completed.length}</Badge></TabsTrigger>
            <TabsTrigger value="cancelled">Canceladas <Badge variant="secondary" className="ml-2">{groups.cancelled.length}</Badge></TabsTrigger>
          </TabsList>

          {isLoading ? (
            <div className="mt-6 text-sm text-muted-foreground">Cargando…</div>
          ) : (
            <>
              <TabsContent value="active" className="mt-4"><RequestGrid rows={groups.active} emptyText="No tienes solicitudes activas. Publica una nueva para recibir cotizaciones." /></TabsContent>
              <TabsContent value="inProgress" className="mt-4"><RequestGrid rows={groups.inProgress} emptyText="No hay trabajos en proceso." /></TabsContent>
              <TabsContent value="completed" className="mt-4"><RequestGrid rows={groups.completed} emptyText="Aún no has finalizado ningún trabajo." /></TabsContent>
              <TabsContent value="cancelled" className="mt-4"><RequestGrid rows={groups.cancelled} emptyText="No hay solicitudes canceladas." /></TabsContent>
            </>
          )}
        </Tabs>
      </div>
      <Footer />
    </div>
  );
}

const STATUS_META: Record<string, { label: string; className: string; icon: React.ElementType }> = {
  pending: { label: "Esperando cotizaciones", className: "bg-warning/15 text-warning", icon: Inbox },
  quoted: { label: "Cotizaciones recibidas", className: "bg-primary/15 text-primary", icon: FileText },
  accepted: { label: "En proceso", className: "bg-brand-soft text-primary", icon: Clock },
  completed: { label: "Finalizada", className: "bg-success/15 text-success", icon: CheckCircle2 },
  cancelled: { label: "Cancelada", className: "bg-muted text-muted-foreground", icon: XCircle },
};

const URGENCY_META: Record<string, { label: string; className: string }> = {
  low: { label: "Baja", className: "bg-muted text-muted-foreground" },
  medium: { label: "Media", className: "bg-warning/15 text-warning" },
  high: { label: "Urgente", className: "bg-destructive/15 text-destructive" },
};

function RequestGrid({ rows, emptyText }: { rows: Row[]; emptyText: string }) {
  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
        <Inbox className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">{emptyText}</p>
      </div>
    );
  }
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {rows.map((r) => {
        const st = STATUS_META[r.status] ?? STATUS_META.pending;
        const StatusIcon = st.icon;
        const urg = URGENCY_META[r.urgency] ?? URGENCY_META.medium;
        const quotesCount = r.quotes?.[0]?.count ?? 0;
        return (
          <Link
            key={r.id}
            to="/requests/$requestId"
            params={{ requestId: r.id }}
            className="group rounded-2xl border border-border bg-card p-4 shadow-soft transition hover:border-primary/40 hover:shadow-md"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${st.className}`}>
                    <StatusIcon className="h-3 w-3" /> {st.label}
                  </span>
                  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${urg.className}`}>
                    <Zap className="h-3 w-3" /> {urg.label}
                  </span>
                </div>
                <h3 className="mt-2 truncate font-semibold text-foreground group-hover:text-primary">
                  {r.title ?? r.description.slice(0, 60)}
                </h3>
                {r.category && <p className="text-xs text-muted-foreground">{r.category.name}</p>}
              </div>
            </div>
            <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{r.description}</p>
            <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              {r.city && <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{r.city}</span>}
              {r.preferred_date && <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" />{new Date(r.preferred_date).toLocaleDateString()}</span>}
              {(r.status === "pending" || r.status === "quoted") && (
                <span className="inline-flex items-center gap-1 rounded-full bg-brand-soft px-2 py-0.5 font-medium text-primary">
                  {quotesCount} {quotesCount === 1 ? "cotización" : "cotizaciones"}
                </span>
              )}
            </div>
          </Link>
        );
      })}
    </div>
  );
}
