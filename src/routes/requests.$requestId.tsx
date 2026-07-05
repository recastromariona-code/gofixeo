import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  ArrowLeft, MapPin, Calendar, Clock, DollarSign, Zap, MessageSquare, CheckCircle2, Star,
  ShieldCheck, Award, XCircle, Loader2,
} from "lucide-react";

export const Route = createFileRoute("/requests/$requestId")({
  component: RequestDetail,
});

function RequestDetail() {
  const { requestId } = Route.useParams();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [user, loading, navigate]);

  const [reviewOpen, setReviewOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [confirmCancel, setConfirmCancel] = useState(false);

  const { data: req, isLoading } = useQuery({
    queryKey: ["request-detail", requestId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quote_requests")
        .select(`*, category:categories(name, icon)`)
        .eq("id", requestId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
    refetchInterval: 15000,
  });

  const isOwner = user?.id === req?.client_id;

  const { data: quotes = [] } = useQuery({
    queryKey: ["request-quotes", requestId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quotes")
        .select(`id, amount, notes, estimated_days, created_at, provider_id,
                 provider:providers!inner(id, rating, reviews_count, years_experience, is_verified, headline,
                   profiles!inner(full_name, avatar_url, city))`)
        .eq("request_id", requestId);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user && !!req,
    refetchInterval: 15000,
  });

  const sortedQuotes = [...quotes].sort((a, b) => {
    const ra = Number(a.provider?.rating ?? 0);
    const rb = Number(b.provider?.rating ?? 0);
    if (rb !== ra) return rb - ra;
    return (b.provider?.reviews_count ?? 0) - (a.provider?.reviews_count ?? 0);
  });

  const { data: photoUrls = [] } = useQuery({
    queryKey: ["request-photos", requestId, (req?.photos as string[] | undefined)?.join(",")],
    queryFn: async () => {
      const paths = (req?.photos as string[] | null) ?? [];
      if (!paths.length) return [];
      const urls: string[] = [];
      for (const p of paths) {
        const { data } = await supabase.storage.from("request-photos").createSignedUrl(p, 60 * 60);
        if (data?.signedUrl) urls.push(data.signedUrl);
      }
      return urls;
    },
    enabled: !!req,
  });

  const acceptMut = useMutation({
    mutationFn: async (quote: { id: string; provider_id: string }) => {
      const { error } = await supabase
        .from("quote_requests")
        .update({ status: "accepted", provider_id: quote.provider_id, accepted_quote_id: quote.id })
        .eq("id", requestId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("¡Proveedor contratado! Puedes coordinar por chat.");
      qc.invalidateQueries({ queryKey: ["request-detail", requestId] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Error"),
  });

  const cancelMut = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("quote_requests").update({ status: "cancelled" }).eq("id", requestId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Solicitud cancelada");
      setConfirmCancel(false);
      qc.invalidateQueries({ queryKey: ["request-detail", requestId] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Error"),
  });

  const completeMut = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("quote_requests").update({ status: "completed" }).eq("id", requestId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("¡Trabajo marcado como finalizado!");
      qc.invalidateQueries({ queryKey: ["request-detail", requestId] });
      setReviewOpen(true);
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Error"),
  });

  const reviewMut = useMutation({
    mutationFn: async () => {
      if (!user || !req?.provider_id) throw new Error("Falta información");
      const { error } = await supabase.from("reviews").insert({
        client_id: user.id,
        provider_id: req.provider_id,
        request_id: requestId,
        rating,
        comment: comment.trim() || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("¡Gracias por tu reseña!");
      setReviewOpen(false);
      qc.invalidateQueries({ queryKey: ["request-detail", requestId] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Error"),
  });

  if (!user) return null;
  if (isLoading) return <Shell><div className="p-6 text-sm text-muted-foreground">Cargando…</div></Shell>;
  if (!req) return <Shell><div className="p-6 text-sm text-muted-foreground">Solicitud no encontrada.</div></Shell>;

  const acceptedQuote = quotes.find((q) => q.id === req.accepted_quote_id);

  return (
    <Shell>
      <div className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 sm:py-10">
        <Link to="/requests" className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Mis solicitudes
        </Link>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-soft sm:p-7">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <StatusBadge status={req.status} />
              <h1 className="mt-2 text-2xl font-bold sm:text-3xl">{req.title ?? req.description.slice(0, 60)}</h1>
              {req.category && <p className="mt-1 text-sm text-muted-foreground">{req.category.name}</p>}
            </div>
            {isOwner && (req.status === "pending" || req.status === "quoted") && (
              <Button variant="outline" size="sm" onClick={() => setConfirmCancel(true)} className="rounded-xl">
                <XCircle className="mr-1 h-4 w-4" /> Cancelar
              </Button>
            )}
          </div>

          <p className="mt-4 whitespace-pre-wrap text-sm text-foreground">{req.description}</p>

          <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            {req.city && <Info icon={MapPin} label="Ubicación" value={`${req.city}${req.address ? ` · ${req.address}` : ""}`} />}
            {req.preferred_date && <Info icon={Calendar} label="Fecha preferida" value={new Date(req.preferred_date).toLocaleDateString()} />}
            {req.preferred_time && <Info icon={Clock} label="Horario" value={timeLabel(req.preferred_time)} />}
            {(req.budget_min || req.budget_max) && (
              <Info
                icon={DollarSign}
                label="Presupuesto"
                value={`${req.budget_min ? `$${req.budget_min}` : "hasta"}${req.budget_max ? ` – $${req.budget_max}` : "+"}`}
              />
            )}
            <Info icon={Zap} label="Urgencia" value={urgencyLabel(req.urgency)} />
          </div>

          {photoUrls.length > 0 && (
            <div className="mt-5">
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Fotografías</p>
              <div className="flex flex-wrap gap-2">
                {photoUrls.map((u, i) => (
                  <a key={i} href={u} target="_blank" rel="noreferrer" className="block h-24 w-24 overflow-hidden rounded-xl border border-border">
                    <img src={u} alt={`foto-${i}`} className="h-full w-full object-cover" />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sección de cotizaciones / proveedor asignado */}
        {req.status === "accepted" && acceptedQuote && (
          <div className="mt-6 rounded-2xl border border-primary/40 bg-brand-soft/30 p-5 shadow-soft sm:p-7">
            <div className="flex items-center gap-2 text-primary">
              <CheckCircle2 className="h-5 w-5" />
              <h2 className="font-semibold">Proveedor contratado</h2>
            </div>
            <QuoteRow quote={acceptedQuote} accepted highlighted />
            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <Button asChild variant="outline" className="rounded-xl">
                <Link to="/chat/$requestId" params={{ requestId }}>
                  <MessageSquare className="mr-1 h-4 w-4" /> Chatear con el proveedor
                </Link>
              </Button>
              <Button onClick={() => completeMut.mutate()} disabled={completeMut.isPending} className="rounded-xl">
                {completeMut.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-1 h-4 w-4" />}
                Marcar como finalizado
              </Button>
            </div>
          </div>
        )}

        {req.status === "completed" && (
          <div className="mt-6 rounded-2xl border border-success/40 bg-success/5 p-5 shadow-soft sm:p-7">
            <div className="flex items-center gap-2 text-success">
              <CheckCircle2 className="h-5 w-5" />
              <h2 className="font-semibold">Trabajo finalizado</h2>
            </div>
            {acceptedQuote && <QuoteRow quote={acceptedQuote} accepted />}
            <Button onClick={() => setReviewOpen(true)} className="mt-3 rounded-xl">
              <Star className="mr-1 h-4 w-4" /> Calificar y dejar reseña
            </Button>
          </div>
        )}

        {(req.status === "pending" || req.status === "quoted") && (
          <div className="mt-6">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                Cotizaciones recibidas <span className="text-muted-foreground">({sortedQuotes.length})</span>
              </h2>
              <p className="text-xs text-muted-foreground">Ordenadas por reputación</p>
            </div>
            {sortedQuotes.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
                Aún no has recibido cotizaciones. Los proveedores que coincidan con tu solicitud recibirán una notificación automáticamente.
              </div>
            ) : (
              <div className="space-y-3">
                {sortedQuotes.map((q) => (
                  <div key={q.id} className="rounded-2xl border border-border bg-card p-4 shadow-soft">
                    <QuoteRow quote={q} />
                    <div className="mt-3 flex flex-col gap-2 border-t border-border pt-3 sm:flex-row sm:justify-end">
                      <Button asChild variant="outline" size="sm" className="rounded-xl">
                        <Link to="/provider/$providerId" params={{ providerId: q.provider_id }}>Ver perfil</Link>
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => acceptMut.mutate({ id: q.id, provider_id: q.provider_id })}
                        disabled={acceptMut.isPending}
                        className="rounded-xl"
                      >
                        {acceptMut.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-1 h-4 w-4" />}
                        Aceptar cotización
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Review dialog */}
      <Dialog open={reviewOpen} onOpenChange={setReviewOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Califica el trabajo</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} type="button" onClick={() => setRating(n)}>
                  <Star className={`h-8 w-8 ${n <= rating ? "fill-warning text-warning" : "text-muted-foreground"}`} />
                </button>
              ))}
            </div>
            <Textarea placeholder="Cuéntanos cómo fue tu experiencia (opcional)" value={comment} onChange={(e) => setComment(e.target.value)} rows={4} maxLength={500} />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setReviewOpen(false)}>Ahora no</Button>
            <Button onClick={() => reviewMut.mutate()} disabled={reviewMut.isPending} className="rounded-xl">
              {reviewMut.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Enviar reseña
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel dialog */}
      <Dialog open={confirmCancel} onOpenChange={setConfirmCancel}>
        <DialogContent>
          <DialogHeader><DialogTitle>¿Cancelar solicitud?</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Los proveedores ya no podrán enviarte cotizaciones para esta solicitud.</p>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setConfirmCancel(false)}>Volver</Button>
            <Button variant="destructive" onClick={() => cancelMut.mutate()} disabled={cancelMut.isPending}>
              {cancelMut.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Sí, cancelar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <div className="flex-1">{children}</div>
      <Footer />
    </div>
  );
}

function Info({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2 rounded-xl border border-border bg-background/50 p-3">
      <Icon className="mt-0.5 h-4 w-4 text-primary" />
      <div className="min-w-0">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="truncate text-sm font-medium">{value}</p>
      </div>
    </div>
  );
}

type QuoteRowT = {
  id: string;
  amount: number;
  notes: string | null;
  estimated_days: number | null;
  created_at: string;
  provider_id: string;
  provider?: {
    id: string;
    rating: number | null;
    reviews_count: number | null;
    years_experience: number | null;
    is_verified: boolean | null;
    headline: string | null;
    profiles?: { full_name: string | null; avatar_url: string | null; city: string | null } | null;
  } | null;
};

function QuoteRow({ quote, accepted, highlighted }: { quote: QuoteRowT; accepted?: boolean; highlighted?: boolean }) {
  const p = quote.provider;
  const initials = p?.profiles?.full_name?.split(" ").map((n) => n[0]).join("").slice(0, 2) ?? "?";
  return (
    <div className={`flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between ${highlighted ? "mt-3" : ""}`}>
      <div className="flex items-center gap-3 min-w-0">
        <Avatar className="h-12 w-12">
          <AvatarImage src={p?.profiles?.avatar_url ?? undefined} />
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="font-semibold truncate">{p?.profiles?.full_name ?? "Proveedor"}</span>
            {p?.is_verified && <Badge variant="secondary" className="gap-1"><ShieldCheck className="h-3 w-3" />Verificado</Badge>}
            {accepted && <Badge className="gap-1"><CheckCircle2 className="h-3 w-3" />Aceptado</Badge>}
          </div>
          {p?.headline && <p className="truncate text-xs text-muted-foreground">{p.headline}</p>}
          <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1"><Star className="h-3 w-3 fill-warning text-warning" />{Number(p?.rating ?? 0).toFixed(1)} ({p?.reviews_count ?? 0})</span>
            {!!p?.years_experience && <span className="inline-flex items-center gap-1"><Award className="h-3 w-3" />{p.years_experience} años</span>}
            {p?.profiles?.city && <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{p.profiles.city}</span>}
          </div>
        </div>
      </div>
      <div className="text-right">
        <p className="text-xl font-bold text-primary">${Number(quote.amount).toLocaleString()}</p>
        {quote.estimated_days != null && <p className="text-xs text-muted-foreground">{quote.estimated_days} día(s) estimados</p>}
        {quote.notes && <p className="mt-1 max-w-xs text-xs text-muted-foreground">{quote.notes}</p>}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const meta: Record<string, { label: string; cls: string }> = {
    pending: { label: "Esperando cotizaciones", cls: "bg-warning/15 text-warning" },
    quoted: { label: "Cotizaciones recibidas", cls: "bg-primary/15 text-primary" },
    accepted: { label: "En proceso", cls: "bg-brand-soft text-primary" },
    completed: { label: "Finalizada", cls: "bg-success/15 text-success" },
    cancelled: { label: "Cancelada", cls: "bg-muted text-muted-foreground" },
  };
  const m = meta[status] ?? meta.pending;
  return <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${m.cls}`}>{m.label}</span>;
}

function urgencyLabel(u: string) {
  return u === "high" ? "Urgente" : u === "low" ? "Puedo esperar" : "Pronto (24-48h)";
}
function timeLabel(t: string) {
  return { morning: "Mañana (7–12h)", afternoon: "Tarde (12–18h)", evening: "Noche (18–22h)", flexible: "Flexible" }[t] ?? t;
}
