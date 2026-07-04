import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, ArrowLeft, Phone, DollarSign, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/chat/$requestId")({
  component: ChatPage,
});

function ChatPage() {
  const { requestId } = Route.useParams();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [text, setText] = useState("");
  const [quoteAmount, setQuoteAmount] = useState("");
  const [showQuote, setShowQuote] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [user, loading, navigate]);

  const { data: req } = useQuery({
    queryKey: ["request", requestId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quote_requests")
        .select(`id, description, status, client_id, provider_id, address, preferred_date,
                 client:profiles!quote_requests_client_id_fkey(full_name, avatar_url),
                 provider:providers!inner(id, whatsapp_number, profiles!inner(full_name, avatar_url, phone))`)
        .eq("id", requestId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: messages = [] } = useQuery({
    queryKey: ["messages", requestId],
    queryFn: async () => {
      const { data } = await supabase
        .from("messages")
        .select("id, content, sender_id, created_at")
        .eq("request_id", requestId)
        .order("created_at");
      return data ?? [];
    },
    enabled: !!user,
    refetchInterval: 3000,
  });

  const { data: quotes = [] } = useQuery({
    queryKey: ["quotes", requestId],
    queryFn: async () => {
      const { data } = await supabase
        .from("quotes")
        .select("id, amount, notes, estimated_days, created_at")
        .eq("request_id", requestId)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
    enabled: !!user,
  });

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages]);

  const sendMut = useMutation({
    mutationFn: async () => {
      if (!user || !text.trim()) return;
      const { error } = await supabase.from("messages").insert({
        request_id: requestId,
        sender_id: user.id,
        content: text.trim(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setText("");
      qc.invalidateQueries({ queryKey: ["messages", requestId] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Error"),
  });

  const quoteMut = useMutation({
    mutationFn: async () => {
      if (!user) return;
      const amount = parseFloat(quoteAmount);
      if (!amount) throw new Error("Ingresa un monto");
      const { error } = await supabase.from("quotes").insert({
        request_id: requestId,
        provider_id: user.id,
        amount,
      });
      if (error) throw error;
      await supabase.from("quote_requests").update({ status: "quoted" }).eq("id", requestId);
    },
    onSuccess: () => {
      toast.success("Cotización enviada");
      setShowQuote(false);
      setQuoteAmount("");
      qc.invalidateQueries({ queryKey: ["quotes", requestId] });
      qc.invalidateQueries({ queryKey: ["request", requestId] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Error"),
  });

  const acceptMut = useMutation({
    mutationFn: async () => {
      await supabase.from("quote_requests").update({ status: "accepted" }).eq("id", requestId);
    },
    onSuccess: () => {
      toast.success("¡Servicio aceptado!");
      qc.invalidateQueries({ queryKey: ["request", requestId] });
    },
  });

  if (!req) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Navbar />
        <div className="p-10 text-center">Cargando conversación…</div>
      </div>
    );
  }

  const isProvider = user?.id === req.provider_id;
  const other = isProvider ? req.client : req.provider?.profiles;
  const otherName = other?.full_name ?? "Usuario";
  const waPhone = req.provider?.whatsapp_number || req.provider?.profiles?.phone;
  const waLink = waPhone
    ? `https://wa.me/${waPhone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
        `Hola, sigo nuestra conversación de FIXEO sobre: ${req.description}`,
      )}`
    : null;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-4 py-6 sm:px-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" size="icon">
              <Link to="/dashboard"><ArrowLeft className="h-4 w-4" /></Link>
            </Button>
            <Avatar className="h-10 w-10">
              <AvatarImage src={other?.avatar_url ?? undefined} />
              <AvatarFallback>{otherName.slice(0,2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <div className="font-semibold">{otherName}</div>
              <div className="text-xs text-muted-foreground capitalize">{req.status}</div>
            </div>
          </div>
          <div className="flex gap-2">
            {waLink && !isProvider && (
              <Button asChild variant="outline" size="sm" className="rounded-xl">
                <a href={waLink} target="_blank" rel="noreferrer"><Phone className="h-4 w-4" /> WhatsApp</a>
              </Button>
            )}
            {isProvider && req.status !== "completed" && (
              <Button size="sm" className="gradient-brand rounded-xl" onClick={() => setShowQuote((v) => !v)}>
                <DollarSign className="h-4 w-4" /> Cotizar
              </Button>
            )}
          </div>
        </div>

        <div className="mb-3 rounded-2xl border border-border bg-brand-soft/50 p-4">
          <div className="text-xs font-medium uppercase tracking-wide text-primary">Solicitud</div>
          <p className="mt-1 text-sm text-foreground">{req.description}</p>
          {req.address && <p className="mt-1 text-xs text-muted-foreground">📍 {req.address}</p>}
        </div>

        {quotes.length > 0 && (
          <div className="mb-3 space-y-2">
            {quotes.map((q) => (
              <div key={q.id} className="flex items-center justify-between rounded-xl border border-primary/30 bg-primary/5 p-3">
                <div>
                  <div className="text-sm font-semibold text-primary">Cotización: ${Number(q.amount).toLocaleString()}</div>
                  {q.notes && <div className="text-xs text-muted-foreground">{q.notes}</div>}
                </div>
                {!isProvider && req.status !== "accepted" && (
                  <Button size="sm" onClick={() => acceptMut.mutate()} className="gradient-brand">
                    <CheckCircle2 className="h-4 w-4" /> Aceptar
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}

        {showQuote && (
          <div className="mb-3 rounded-2xl border border-border bg-card p-4">
            <div className="flex gap-2">
              <Input type="number" placeholder="Monto en tu moneda" value={quoteAmount} onChange={(e) => setQuoteAmount(e.target.value)} />
              <Button onClick={() => quoteMut.mutate()} disabled={quoteMut.isPending} className="gradient-brand rounded-xl">Enviar</Button>
            </div>
          </div>
        )}

        <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto rounded-2xl border border-border bg-card p-4 shadow-soft min-h-[300px] max-h-[55vh]">
          {messages.length === 0 && <p className="text-center text-sm text-muted-foreground">Envía el primer mensaje 👋</p>}
          {messages.map((m) => {
            const mine = m.sender_id === user?.id;
            return (
              <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${mine ? "gradient-brand text-primary-foreground" : "bg-muted text-foreground"}`}>
                  {m.content}
                </div>
              </div>
            );
          })}
        </div>

        <form
          onSubmit={(e) => { e.preventDefault(); sendMut.mutate(); }}
          className="mt-3 flex items-center gap-2 rounded-2xl border border-border bg-card p-2 shadow-soft"
        >
          <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="Escribe un mensaje…" className="border-0 shadow-none focus-visible:ring-0" />
          <Button type="submit" className="gradient-brand rounded-xl" disabled={sendMut.isPending}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
