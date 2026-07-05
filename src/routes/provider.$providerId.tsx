import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Star, MapPin, BadgeCheck, MessageSquare, Phone, Calendar, Heart } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { useUserRole } from "@/hooks/use-user-role";

export const Route = createFileRoute("/provider/$providerId")({
  component: ProviderProfile,
});

function ProviderProfile() {
  const { providerId } = Route.useParams();
  const { user } = useAuth();
  const { isProvider, isGuest } = useUserRole();
  const canRequestQuote = isGuest || !isProvider;
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["provider", providerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("providers")
        .select(
          `id, bio, years_experience, certifications, gallery_urls, service_areas, rating, reviews_count, is_verified, whatsapp_number,
           profiles!providers_id_fkey!inner(full_name, city, avatar_url, phone),
           provider_categories(categories(id, name, slug)),
           services(id, title, description, starting_price, is_active, categories(name))`,
        )
        .eq("id", providerId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: reviews = [] } = useQuery({
    queryKey: ["reviews", providerId],
    queryFn: async () => {
      const { data } = await supabase
        .from("reviews")
        .select("id, rating, comment, created_at, profiles:client_id(full_name, avatar_url)")
        .eq("provider_id", providerId)
        .order("created_at", { ascending: false })
        .limit(10);
      return data ?? [];
    },
  });

  const [openQuote, setOpenQuote] = useState(false);
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [date, setDate] = useState("");
  const [categoryId, setCategoryId] = useState<string | undefined>(undefined);

  const requestMut = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Debes iniciar sesión");
      const cat = categoryId ?? data?.provider_categories?.[0]?.categories?.id;
      const { data: row, error } = await supabase
        .from("quote_requests")
        .insert({
          client_id: user.id,
          provider_id: providerId,
          category_id: cat,
          description,
          address: address || null,
          preferred_date: date || null,
        })
        .select("id")
        .single();
      if (error) throw error;
      return row.id as string;
    },
    onSuccess: (id) => {
      toast.success("Solicitud enviada");
      setOpenQuote(false);
      navigate({ to: "/chat/$requestId", params: { requestId: id } });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Error"),
  });

  const favMut = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Inicia sesión");
      await supabase.from("favorites").insert({ client_id: user.id, provider_id: providerId });
    },
    onSuccess: () => {
      toast.success("Agregado a favoritos");
      qc.invalidateQueries({ queryKey: ["favorites"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Error"),
  });

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Navbar />
        <div className="mx-auto max-w-5xl p-6">Cargando…</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Navbar />
        <div className="mx-auto max-w-5xl p-10 text-center">
          <h1 className="text-2xl font-bold">Especialista del hogar no encontrado</h1>
          <Button asChild className="mt-4"><Link to="/search">Volver a buscar</Link></Button>
        </div>
      </div>
    );
  }

  const initials = (data.profiles?.full_name ?? "P").slice(0, 2).toUpperCase();
  const waPhone = data.whatsapp_number || data.profiles?.phone;
  const waLink = waPhone
    ? `https://wa.me/${waPhone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
        `Hola ${data.profiles?.full_name ?? ""}, te encontré en FIXEO y quisiera cotizar un servicio.`,
      )}`
    : null;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />

      <section className="border-b border-border bg-muted/30">
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
          <div className="flex flex-col gap-6 md:flex-row md:items-center">
            <Avatar className="h-24 w-24 border border-border">
              <AvatarImage src={data.profiles?.avatar_url ?? undefined} />
              <AvatarFallback className="gradient-brand text-primary-foreground text-2xl">{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold sm:text-3xl">{data.profiles?.full_name}</h1>
                {data.is_verified && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-xs font-medium text-success">
                    <BadgeCheck className="h-3 w-3" /> Verificado
                  </span>
                )}
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <Star className="h-4 w-4 fill-warning text-warning" />
                  <span className="font-semibold text-foreground">{Number(data.rating ?? 0).toFixed(1)}</span>
                  <span>({data.reviews_count ?? 0} reseñas)</span>
                </span>
                {data.profiles?.city && (
                  <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {data.profiles.city}</span>
                )}
                {data.years_experience ? <span>{data.years_experience} años de experiencia</span> : null}
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {data.provider_categories?.map((pc) =>
                  pc.categories ? (
                    <span key={pc.categories.id} className="rounded-full bg-brand-soft px-2.5 py-0.5 text-xs font-medium text-primary">
                      {pc.categories.name}
                    </span>
                  ) : null,
                )}
              </div>
            </div>
            <div className="flex flex-col gap-2 md:min-w-[220px]">
              <Dialog open={openQuote} onOpenChange={setOpenQuote}>
                <DialogTrigger asChild>
                  <Button
                    className="gradient-brand rounded-xl"
                    size="lg"
                    onClick={(e) => {
                      if (!user) {
                        e.preventDefault();
                        toast.info("Inicia sesión para solicitar cotización");
                        navigate({ to: "/auth" });
                      }
                    }}
                  >
                    <MessageSquare className="h-4 w-4" /> Solicitar cotización
                  </Button>
                </DialogTrigger>
                <DialogContent className="rounded-2xl">
                  <DialogHeader>
                    <DialogTitle>Solicita una cotización</DialogTitle>
                    <DialogDescription>Cuéntale a este especialista del hogar lo que necesitas.</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Categoría</Label>
                      <select
                        className="mt-1.5 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                        value={categoryId ?? data.provider_categories?.[0]?.categories?.id ?? ""}
                        onChange={(e) => setCategoryId(e.target.value)}
                      >
                        {data.provider_categories?.map((pc) =>
                          pc.categories ? (
                            <option key={pc.categories.id} value={pc.categories.id}>{pc.categories.name}</option>
                          ) : null,
                        )}
                      </select>
                    </div>
                    <div>
                      <Label>Descripción</Label>
                      <Textarea value={description} onChange={(e) => setDescription(e.target.value)} required rows={4} placeholder="Describe el trabajo que necesitas…" className="mt-1.5" />
                    </div>
                    <div>
                      <Label>Dirección (opcional)</Label>
                      <Input value={address} onChange={(e) => setAddress(e.target.value)} className="mt-1.5" placeholder="Barrio, calle…" />
                    </div>
                    <div>
                      <Label>Fecha preferida (opcional)</Label>
                      <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="mt-1.5" />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setOpenQuote(false)}>Cancelar</Button>
                    <Button onClick={() => requestMut.mutate()} disabled={!description || requestMut.isPending} className="gradient-brand">
                      Enviar solicitud
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              {waLink && (
                <Button asChild variant="outline" className="rounded-xl">
                  <a href={waLink} target="_blank" rel="noreferrer">
                    <Phone className="h-4 w-4" /> WhatsApp
                  </a>
                </Button>
              )}
              {user && (
                <Button variant="ghost" size="sm" onClick={() => favMut.mutate()}>
                  <Heart className="h-4 w-4" /> Guardar
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto grid w-full max-w-5xl gap-6 px-4 py-10 sm:px-6 md:grid-cols-3">
        <div className="space-y-6 md:col-span-2">
          {data.bio && (
            <section className="rounded-2xl border border-border bg-card p-6 shadow-soft">
              <h2 className="font-semibold">Sobre mí</h2>
              <p className="mt-2 whitespace-pre-line text-sm text-muted-foreground">{data.bio}</p>
            </section>
          )}

          <section className="rounded-2xl border border-border bg-card p-6 shadow-soft">
            <h2 className="font-semibold">Servicios ofrecidos</h2>
            <div className="mt-4 grid gap-3">
              {(data.services ?? []).filter((s) => s.is_active).map((s) => (
                <div key={s.id} className="rounded-xl border border-border p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">{s.title}</h3>
                    {s.starting_price != null && (
                      <span className="text-sm font-semibold text-primary">desde ${Number(s.starting_price).toLocaleString()}</span>
                    )}
                  </div>
                  {s.description && <p className="mt-1 text-sm text-muted-foreground">{s.description}</p>}
                  {s.categories?.name && (
                    <span className="mt-2 inline-block rounded-full bg-brand-soft px-2 py-0.5 text-xs font-medium text-primary">{s.categories.name}</span>
                  )}
                </div>
              ))}
              {(data.services ?? []).length === 0 && (
                <p className="text-sm text-muted-foreground">Este especialista del hogar aún no publicó servicios detallados. Puedes solicitarle una cotización directamente.</p>
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-card p-6 shadow-soft">
            <h2 className="font-semibold">Reseñas</h2>
            <div className="mt-4 space-y-4">
              {reviews.length === 0 && <p className="text-sm text-muted-foreground">Aún no hay reseñas.</p>}
              {reviews.map((r) => (
                <div key={r.id} className="border-b border-border pb-4 last:border-0">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={r.profiles?.avatar_url ?? undefined} />
                      <AvatarFallback>{(r.profiles?.full_name ?? "U").slice(0,2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="text-sm font-medium">{r.profiles?.full_name ?? "Usuario"}</div>
                      <div className="flex items-center gap-1 text-xs text-warning">
                        {Array.from({length: r.rating}).map((_, i) => <Star key={i} className="h-3 w-3 fill-warning" />)}
                      </div>
                    </div>
                  </div>
                  {r.comment && <p className="mt-2 text-sm text-muted-foreground">{r.comment}</p>}
                </div>
              ))}
            </div>
          </section>
        </div>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
            <h3 className="font-semibold">Áreas de servicio</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {data.service_areas?.length ? data.service_areas.join(", ") : data.profiles?.city ?? "No especificado"}
            </p>
          </div>
          {data.certifications && data.certifications.length > 0 && (
            <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
              <h3 className="font-semibold">Certificaciones</h3>
              <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                {data.certifications.map((c) => (
                  <li key={c} className="flex items-center gap-2"><BadgeCheck className="h-4 w-4 text-success" /> {c}</li>
                ))}
              </ul>
            </div>
          )}
          {data.gallery_urls && data.gallery_urls.length > 0 && (
            <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
              <h3 className="font-semibold">Galería</h3>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {data.gallery_urls.map((u) => (
                  <img key={u} src={u} alt="Trabajo" className="aspect-square rounded-lg object-cover" />
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>
      <Footer />
    </div>
  );
}
