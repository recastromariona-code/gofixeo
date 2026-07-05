import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { ArrowLeft, Upload, X, Loader2, MapPin, Calendar as CalIcon, Clock, DollarSign, Zap, ImagePlus } from "lucide-react";

export const Route = createFileRoute("/requests/new")({
  component: NewRequestPage,
  head: () => ({
    meta: [
      { title: "Nueva solicitud de servicio · FIXEO" },
      { name: "description", content: "Publica tu solicitud y recibe cotizaciones de los mejores prestadores de servicios cerca de ti." },
    ],
  }),
});

const URGENCY = [
  { value: "low", label: "Puedo esperar", desc: "En los próximos días" },
  { value: "medium", label: "Pronto", desc: "En 24-48 horas" },
  { value: "high", label: "Urgente", desc: "Lo antes posible" },
];

function NewRequestPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [user, loading, navigate]);

  const [title, setTitle] = useState("");
  const [categoryId, setCategoryId] = useState<string | undefined>();
  const [description, setDescription] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [preferredDate, setPreferredDate] = useState("");
  const [preferredTime, setPreferredTime] = useState("");
  const [budgetMin, setBudgetMin] = useState("");
  const [budgetMax, setBudgetMax] = useState("");
  const [urgency, setUrgency] = useState("medium");
  const [photos, setPhotos] = useState<{ path: string; url: string }[]>([]);
  const [uploading, setUploading] = useState(false);

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data } = await supabase.from("categories").select("id, name, icon").order("name");
      return data ?? [];
    },
  });

  const uploadPhotos = async (files: FileList | null) => {
    if (!files || !user) return;
    setUploading(true);
    try {
      const uploaded: { path: string; url: string }[] = [];
      for (const file of Array.from(files).slice(0, 5 - photos.length)) {
        if (file.size > 5 * 1024 * 1024) {
          toast.error(`${file.name} supera 5MB`);
          continue;
        }
        const path = `${user.id}/${crypto.randomUUID()}-${file.name.replace(/[^\w.-]/g, "_")}`;
        const { error } = await supabase.storage.from("request-photos").upload(path, file);
        if (error) throw error;
        const { data: signed } = await supabase.storage.from("request-photos").createSignedUrl(path, 60 * 60);
        uploaded.push({ path, url: signed?.signedUrl ?? "" });
      }
      setPhotos((p) => [...p, ...uploaded]);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error subiendo fotos");
    } finally {
      setUploading(false);
    }
  };

  const removePhoto = async (path: string) => {
    await supabase.storage.from("request-photos").remove([path]);
    setPhotos((p) => p.filter((x) => x.path !== path));
  };

  const createMut = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Inicia sesión");
      if (!title.trim()) throw new Error("Agrega un título");
      if (!categoryId) throw new Error("Elige una categoría");
      if (!description.trim() || description.trim().length < 15) throw new Error("Describe el trabajo con más detalle (mín. 15 caracteres)");
      if (!city.trim()) throw new Error("Indica tu ciudad");

      const { data, error } = await supabase
        .from("quote_requests")
        .insert({
          client_id: user.id,
          provider_id: null,
          category_id: categoryId,
          title: title.trim(),
          description: description.trim(),
          city: city.trim(),
          address: address.trim() || null,
          preferred_date: preferredDate || null,
          preferred_time: preferredTime || null,
          budget_min: budgetMin ? Number(budgetMin) : null,
          budget_max: budgetMax ? Number(budgetMax) : null,
          urgency,
          photos: photos.map((p) => p.path),
          status: "pending",
        })
        .select("id")
        .single();
      if (error) throw error;
      return data.id as string;
    },
    onSuccess: (id) => {
      toast.success("Solicitud publicada. Te notificaremos las cotizaciones.");
      navigate({ to: "/requests/$requestId", params: { requestId: id } });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Error"),
  });

  if (!user) return null;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 sm:py-10">
        <Link to="/requests" className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Mis solicitudes
        </Link>
        <h1 className="text-2xl font-bold sm:text-3xl">Publica tu solicitud</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          En pocos minutos recibirás cotizaciones de prestadores calificados que cumplen con tus requisitos.
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            createMut.mutate();
          }}
          className="mt-6 space-y-6 rounded-2xl border border-border bg-card p-5 shadow-soft sm:p-7"
        >
          <div className="space-y-2">
            <Label htmlFor="title">Título breve *</Label>
            <Input
              id="title"
              placeholder="Ej. Reparar fuga en cocina"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={80}
              required
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Categoría *</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger><SelectValue placeholder="Selecciona una categoría" /></SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="city"><MapPin className="mr-1 inline h-3.5 w-3.5" />Ciudad *</Label>
              <Input id="city" placeholder="Ej. San Salvador" value={city} onChange={(e) => setCity(e.target.value)} required />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="desc">Describe el trabajo *</Label>
            <Textarea
              id="desc"
              placeholder="Cuéntanos qué necesitas: qué falla, tamaño, materiales, condiciones, etc."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              maxLength={1500}
            />
            <p className="text-xs text-muted-foreground">{description.length}/1500</p>
          </div>

          <div className="space-y-2">
            <Label>Dirección (opcional)</Label>
            <Input placeholder="Barrio, calle, referencia" value={address} onChange={(e) => setAddress(e.target.value)} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="date"><CalIcon className="mr-1 inline h-3.5 w-3.5" />Fecha preferida</Label>
              <Input id="date" type="date" value={preferredDate} onChange={(e) => setPreferredDate(e.target.value)} min={new Date().toISOString().split("T")[0]} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="time"><Clock className="mr-1 inline h-3.5 w-3.5" />Horario</Label>
              <Select value={preferredTime} onValueChange={setPreferredTime}>
                <SelectTrigger><SelectValue placeholder="Cualquier horario" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="morning">Mañana (7–12h)</SelectItem>
                  <SelectItem value="afternoon">Tarde (12–18h)</SelectItem>
                  <SelectItem value="evening">Noche (18–22h)</SelectItem>
                  <SelectItem value="flexible">Flexible</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label><DollarSign className="mr-1 inline h-3.5 w-3.5" />Presupuesto de referencia (opcional)</Label>
            <div className="grid grid-cols-2 gap-3">
              <Input type="number" min="0" placeholder="Mínimo" value={budgetMin} onChange={(e) => setBudgetMin(e.target.value)} />
              <Input type="number" min="0" placeholder="Máximo" value={budgetMax} onChange={(e) => setBudgetMax(e.target.value)} />
            </div>
          </div>

          <div className="space-y-3">
            <Label><Zap className="mr-1 inline h-3.5 w-3.5" />Nivel de urgencia</Label>
            <RadioGroup value={urgency} onValueChange={setUrgency} className="grid gap-2 sm:grid-cols-3">
              {URGENCY.map((u) => (
                <label
                  key={u.value}
                  htmlFor={`urg-${u.value}`}
                  className={`cursor-pointer rounded-xl border p-3 transition ${urgency === u.value ? "border-primary bg-brand-soft" : "border-border hover:border-primary/40"}`}
                >
                  <div className="flex items-center gap-2">
                    <RadioGroupItem id={`urg-${u.value}`} value={u.value} />
                    <span className="font-medium text-sm">{u.label}</span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{u.desc}</p>
                </label>
              ))}
            </RadioGroup>
          </div>

          <div className="space-y-3">
            <Label><ImagePlus className="mr-1 inline h-3.5 w-3.5" />Fotografías (máx. 5)</Label>
            <div className="flex flex-wrap gap-3">
              {photos.map((p) => (
                <div key={p.path} className="relative h-24 w-24 overflow-hidden rounded-xl border border-border">
                  <img src={p.url} alt="foto" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removePhoto(p.path)}
                    className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-background/90 shadow"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
              {photos.length < 5 && (
                <label className="flex h-24 w-24 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-border text-xs text-muted-foreground hover:border-primary/40 hover:text-primary">
                  {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />}
                  <span>{uploading ? "Subiendo…" : "Agregar"}</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => uploadPhotos(e.target.files)}
                    disabled={uploading}
                  />
                </label>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-3 border-t border-border pt-5 sm:flex-row sm:justify-end">
            <Button type="button" variant="ghost" onClick={() => navigate({ to: "/requests" })}>Cancelar</Button>
            <Button type="submit" disabled={createMut.isPending || uploading} className="rounded-xl">
              {createMut.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Publicando…</> : "Publicar solicitud"}
            </Button>
          </div>
        </form>
      </div>
      <Footer />
    </div>
  );
}
