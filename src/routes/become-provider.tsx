import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Wrench,
  CheckCircle2,
  X,
  Plus,
  Upload,
  Image as ImageIcon,
  Trash2,
  Sparkles,
  Briefcase,
  Tag,
  DollarSign,
} from "lucide-react";

export const Route = createFileRoute("/become-provider")({
  component: BecomeProvider,
});

const SIGNED_URL_TTL = 60 * 60 * 24 * 365 * 10; // 10 años

type ServiceDraft = {
  id?: string;
  category_id: string;
  title: string;
  description: string;
  starting_price: string;
};

type PortfolioDraft = {
  id?: string;
  title: string;
  description: string;
  image_url: string | null;
  project_date: string;
};

function BecomeProvider() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  // Datos básicos
  const [fullName, setFullName] = useState("");
  const [headline, setHeadline] = useState("");
  const [bio, setBio] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [city, setCity] = useState("");
  const [years, setYears] = useState("");
  const [availability, setAvailability] = useState("");

  // Categorías, etiquetas y especialidades
  const [selected, setSelected] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [specInput, setSpecInput] = useState("");

  // Precios de referencia
  const [rateMin, setRateMin] = useState("");
  const [rateMax, setRateMax] = useState("");
  const [currency, setCurrency] = useState("USD");

  // Servicios específicos ofrecidos
  const [services, setServices] = useState<ServiceDraft[]>([]);

  // Galería de trabajos (imágenes sueltas)
  const [gallery, setGallery] = useState<string[]>([]);
  const [uploadingGallery, setUploadingGallery] = useState(false);

  // Historial / portafolio
  const [portfolio, setPortfolio] = useState<PortfolioDraft[]>([]);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth", search: { mode: "signup" } as never });
  }, [user, loading, navigate]);

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: async () =>
      (await supabase.from("categories").select("id, name").order("sort_order")).data ?? [],
  });

  // Precarga si ya existe perfil de prestador
  useQuery({
    queryKey: ["provider-self", user?.id],
    enabled: !!user,
    queryFn: async () => {
      if (!user) return null;
      const [prov, prof, cats, servs, ports] = await Promise.all([
        supabase.from("providers").select("*").eq("id", user.id).maybeSingle(),
        supabase.from("profiles").select("full_name, phone, city").eq("id", user.id).maybeSingle(),
        supabase.from("provider_categories").select("category_id").eq("provider_id", user.id),
        supabase.from("services").select("*").eq("provider_id", user.id),
        supabase.from("portfolio_items").select("*").eq("provider_id", user.id),
      ]);
      if (prov.data) {
        setHeadline(prov.data.headline ?? "");
        setBio(prov.data.bio ?? "");
        setYears(prov.data.years_experience?.toString() ?? "");
        setWhatsapp(prov.data.whatsapp_number ?? "");
        setTags(prov.data.tags ?? []);
        setSpecialties(prov.data.specialties ?? []);
        setRateMin(prov.data.hourly_rate_min?.toString() ?? "");
        setRateMax(prov.data.hourly_rate_max?.toString() ?? "");
        setCurrency(prov.data.currency ?? "USD");
        setAvailability(prov.data.availability ?? "");
        setGallery(prov.data.gallery_urls ?? []);
      }
      if (prof.data) {
        setFullName(prof.data.full_name ?? "");
        setPhone(prof.data.phone ?? "");
        setCity(prof.data.city ?? "");
      }
      if (cats.data) setSelected(cats.data.map((c) => c.category_id));
      if (servs.data)
        setServices(
          servs.data.map((s) => ({
            id: s.id,
            category_id: s.category_id,
            title: s.title,
            description: s.description ?? "",
            starting_price: s.starting_price?.toString() ?? "",
          })),
        );
      if (ports.data)
        setPortfolio(
          ports.data.map((p) => ({
            id: p.id,
            title: p.title,
            description: p.description ?? "",
            image_url: p.image_url,
            project_date: p.project_date ?? "",
          })),
        );
      return true;
    },
  });

  async function uploadFile(file: File, folder: "gallery" | "portfolio"): Promise<string> {
    if (!user) throw new Error("Sin sesión");
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${user.id}/${folder}/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("provider-media").upload(path, file, {
      cacheControl: "3600",
      upsert: false,
    });
    if (error) throw error;
    const { data, error: sErr } = await supabase.storage
      .from("provider-media")
      .createSignedUrl(path, SIGNED_URL_TTL);
    if (sErr || !data) throw sErr ?? new Error("No se pudo firmar URL");
    return data.signedUrl;
  }

  async function handleGalleryUpload(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploadingGallery(true);
    try {
      const urls: string[] = [];
      for (const f of Array.from(files)) {
        const url = await uploadFile(f, "gallery");
        urls.push(url);
      }
      setGallery((g) => [...g, ...urls]);
      toast.success(`${urls.length} imagen(es) agregadas`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al subir");
    } finally {
      setUploadingGallery(false);
    }
  }

  async function handlePortfolioImage(idx: number, file: File) {
    try {
      const url = await uploadFile(file, "portfolio");
      setPortfolio((p) => p.map((it, i) => (i === idx ? { ...it, image_url: url } : it)));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al subir");
    }
  }

  function addTag() {
    const t = tagInput.trim();
    if (!t) return;
    if (!tags.includes(t)) setTags([...tags, t]);
    setTagInput("");
  }
  function addSpec() {
    const t = specInput.trim();
    if (!t) return;
    if (!specialties.includes(t)) setSpecialties([...specialties, t]);
    setSpecInput("");
  }

  const mut = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Sin sesión");
      if (selected.length === 0) throw new Error("Elige al menos una categoría");

      const { error: pErr } = await supabase
        .from("profiles")
        .update({ role: "provider", full_name: fullName || null, phone: phone || null, city: city || null })
        .eq("id", user.id);
      if (pErr) throw pErr;

      const { error: prErr } = await supabase.from("providers").upsert({
        id: user.id,
        headline: headline || null,
        bio: bio || null,
        years_experience: years ? parseInt(years) : 0,
        whatsapp_number: whatsapp || phone || null,
        tags,
        specialties,
        hourly_rate_min: rateMin ? parseFloat(rateMin) : null,
        hourly_rate_max: rateMax ? parseFloat(rateMax) : null,
        currency,
        availability: availability || null,
        gallery_urls: gallery,
      });
      if (prErr) throw prErr;

      await supabase.from("provider_categories").delete().eq("provider_id", user.id);
      if (selected.length > 0) {
        const { error: pcErr } = await supabase
          .from("provider_categories")
          .insert(selected.map((cid) => ({ provider_id: user.id, category_id: cid })));
        if (pcErr) throw pcErr;
      }

      // Sync servicios: borrar todos y reinsertar los válidos
      await supabase.from("services").delete().eq("provider_id", user.id);
      const validServices = services.filter((s) => s.title.trim() && s.category_id);
      if (validServices.length > 0) {
        const { error: sErr } = await supabase.from("services").insert(
          validServices.map((s) => ({
            provider_id: user.id,
            category_id: s.category_id,
            title: s.title.trim(),
            description: s.description || null,
            starting_price: s.starting_price ? parseFloat(s.starting_price) : null,
          })),
        );
        if (sErr) throw sErr;
      }

      // Sync portafolio: borrar todo y reinsertar
      await supabase.from("portfolio_items").delete().eq("provider_id", user.id);
      const validPortfolio = portfolio.filter((p) => p.title.trim());
      if (validPortfolio.length > 0) {
        const { error: poErr } = await supabase.from("portfolio_items").insert(
          validPortfolio.map((p) => ({
            provider_id: user.id,
            title: p.title.trim(),
            description: p.description || null,
            image_url: p.image_url,
            project_date: p.project_date || null,
          })),
        );
        if (poErr) throw poErr;
      }
    },
    onSuccess: () => {
      toast.success("¡Perfil de prestador guardado!");
      qc.invalidateQueries();
      navigate({ to: "/dashboard" });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Error"),
  });

  if (!user) return null;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <section className="border-b border-border bg-muted/30">
        <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl gradient-brand text-primary-foreground">
              <Wrench className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Perfil de prestador de servicios</h1>
              <p className="text-sm text-muted-foreground">
                Solo pedimos lo esencial para publicar tu perfil. Puedes ampliar los detalles cuando quieras.
              </p>
            </div>
          </div>
        </div>
      </section>


      <form
        onSubmit={(e) => {
          e.preventDefault();
          mut.mutate();
        }}
        className="mx-auto w-full max-w-4xl space-y-6 px-4 py-8 sm:px-6"
      >
        {/* Contacto */}
        <Section title="Datos de cuenta y contacto" icon={<Briefcase className="h-4 w-4" />}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nombre" className="sm:col-span-2">
              <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Tu nombre completo" />
            </Field>
            <Field label="Correo" className="sm:col-span-2">
              <Input value={user.email ?? ""} readOnly className="bg-muted/40" />
            </Field>
            <Field label="Ciudad" required>
              <Input value={city} onChange={(e) => setCity(e.target.value)} required placeholder="San Salvador" />
            </Field>
            <Field label="Teléfono">
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+503 6000-0000" />
            </Field>
            <Field label="WhatsApp (con código de país)" className="sm:col-span-2">
              <Input
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="+503 6000-0000"
              />
            </Field>
          </div>
        </Section>

        {/* Sobre ti */}
        <Section title="Sobre ti" icon={<Sparkles className="h-4 w-4" />}>
          <div className="space-y-4">
            <Field label="Titular (una línea que te describa)">
              <Input
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                placeholder="Ej: Electricista certificado con 10 años de experiencia"
                maxLength={120}
              />
            </Field>
            <Field label="Biografía / Descripción">
              <Textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={5}
                placeholder="Cuenta sobre tu experiencia, formación, tipos de trabajos que dominas, tu forma de trabajar y qué te diferencia."
                maxLength={2000}
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Años de experiencia">
                <Input
                  type="number"
                  min={0}
                  value={years}
                  onChange={(e) => setYears(e.target.value)}
                />
              </Field>
              <Field label="Disponibilidad">
                <Input
                  value={availability}
                  onChange={(e) => setAvailability(e.target.value)}
                  placeholder="Ej: Lunes a sábado, 8am - 6pm"
                />
              </Field>
            </div>
          </div>
        </Section>

        {/* Categorías */}
        <Section title="Categorías de oficios y técnicos" icon={<Wrench className="h-4 w-4" />}>
          <p className="mb-3 text-sm text-muted-foreground">Elige una o más categorías principales.</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {categories.map((c) => {
              const active = selected.includes(c.id);
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() =>
                    setSelected((s) => (active ? s.filter((x) => x !== c.id) : [...s, c.id]))
                  }
                  className={`flex items-center justify-between rounded-xl border px-4 py-3 text-sm transition ${
                    active
                      ? "border-primary bg-brand-soft/60 text-primary"
                      : "border-border bg-card hover:border-primary/40"
                  }`}
                >
                  <span className="font-medium">{c.name}</span>
                  {active && <CheckCircle2 className="h-4 w-4 text-primary" />}
                </button>
              );
            })}
          </div>
        </Section>

        {/* Etiquetas y especialidades */}
        <Section title="Etiquetas y especialidades" icon={<Tag className="h-4 w-4" />}>
          <div className="space-y-5">
            <div>
              <Label>Etiquetas (palabras clave)</Label>
              <p className="mb-2 text-xs text-muted-foreground">
                Palabras que ayudan a encontrarte. Ej: urgente, 24/7, garantía.
              </p>
              <div className="flex gap-2">
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addTag();
                    }
                  }}
                  placeholder="Escribe y presiona Enter"
                />
                <Button type="button" variant="outline" onClick={addTag}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <ChipList
                items={tags}
                onRemove={(t) => setTags(tags.filter((x) => x !== t))}
              />
            </div>
            <div>
              <Label>Especialidades específicas</Label>
              <p className="mb-2 text-xs text-muted-foreground">
                Ej: Instalación de aire acondicionado, remodelación de baños, cerraduras electrónicas.
              </p>
              <div className="flex gap-2">
                <Input
                  value={specInput}
                  onChange={(e) => setSpecInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addSpec();
                    }
                  }}
                  placeholder="Escribe y presiona Enter"
                />
                <Button type="button" variant="outline" onClick={addSpec}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <ChipList
                items={specialties}
                onRemove={(t) => setSpecialties(specialties.filter((x) => x !== t))}
              />
            </div>
          </div>
        </Section>

        {/* Precios de referencia */}
        <Section title="Precios de referencia" icon={<DollarSign className="h-4 w-4" />}>
          <p className="mb-3 text-sm text-muted-foreground">
            Un rango orientativo por hora. Los precios específicos por servicio se definen abajo.
          </p>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Moneda">
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="USD">USD</option>
                <option value="COP">COP</option>
                <option value="MXN">MXN</option>
                <option value="ARS">ARS</option>
                <option value="CLP">CLP</option>
                <option value="PEN">PEN</option>
                <option value="VES">VES</option>
                <option value="EUR">EUR</option>
              </select>
            </Field>
            <Field label="Desde (por hora)">
              <Input
                type="number"
                min={0}
                step="0.01"
                value={rateMin}
                onChange={(e) => setRateMin(e.target.value)}
                placeholder="10"
              />
            </Field>
            <Field label="Hasta (por hora)">
              <Input
                type="number"
                min={0}
                step="0.01"
                value={rateMax}
                onChange={(e) => setRateMax(e.target.value)}
                placeholder="25"
              />
            </Field>
          </div>
        </Section>

        {/* Servicios específicos */}
        <Section title="Servicios específicos que ofreces" icon={<Sparkles className="h-4 w-4" />}>
          <p className="mb-3 text-sm text-muted-foreground">
            Añade cada servicio con su título, descripción y precio inicial (opcional).
          </p>
          <div className="space-y-3">
            {services.map((s, i) => (
              <div key={i} className="rounded-xl border border-border bg-muted/30 p-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Título del servicio">
                    <Input
                      value={s.title}
                      onChange={(e) =>
                        setServices((arr) =>
                          arr.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)),
                        )
                      }
                      placeholder="Ej: Instalación de tomacorrientes"
                    />
                  </Field>
                  <Field label="Categoría">
                    <select
                      value={s.category_id}
                      onChange={(e) =>
                        setServices((arr) =>
                          arr.map((x, j) => (j === i ? { ...x, category_id: e.target.value } : x)),
                        )
                      }
                      className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                    >
                      <option value="">Elige una categoría</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Descripción" className="sm:col-span-2">
                    <Textarea
                      rows={2}
                      value={s.description}
                      onChange={(e) =>
                        setServices((arr) =>
                          arr.map((x, j) => (j === i ? { ...x, description: e.target.value } : x)),
                        )
                      }
                      placeholder="Qué incluye, materiales, tiempo estimado..."
                    />
                  </Field>
                  <Field label={`Precio inicial (${currency})`}>
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      value={s.starting_price}
                      onChange={(e) =>
                        setServices((arr) =>
                          arr.map((x, j) =>
                            j === i ? { ...x, starting_price: e.target.value } : x,
                          ),
                        )
                      }
                    />
                  </Field>
                </div>
                <div className="mt-3 flex justify-end">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setServices((arr) => arr.filter((_, j) => j !== i))}
                  >
                    <Trash2 className="mr-1 h-4 w-4" /> Eliminar
                  </Button>
                </div>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                setServices((arr) => [
                  ...arr,
                  { category_id: "", title: "", description: "", starting_price: "" },
                ])
              }
            >
              <Plus className="mr-1 h-4 w-4" /> Agregar servicio
            </Button>
          </div>
        </Section>

        {/* Galería */}
        <Section title="Galería de trabajos" icon={<ImageIcon className="h-4 w-4" />}>
          <p className="mb-3 text-sm text-muted-foreground">
            Sube fotos de trabajos realizados para mostrar la calidad de tu trabajo.
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {gallery.map((url, i) => (
              <div
                key={i}
                className="group relative aspect-square overflow-hidden rounded-lg border border-border"
              >
                <img src={url} alt="" className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => setGallery((g) => g.filter((_, j) => j !== i))}
                  className="absolute right-1 top-1 rounded-full bg-background/90 p-1 opacity-0 shadow transition group-hover:opacity-100"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
            <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-border bg-muted/30 text-xs text-muted-foreground transition hover:border-primary hover:text-primary">
              <Upload className="h-5 w-5" />
              <span>{uploadingGallery ? "Subiendo..." : "Subir"}</span>
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                disabled={uploadingGallery}
                onChange={(e) => handleGalleryUpload(e.target.files)}
              />
            </label>
          </div>
        </Section>

        {/* Portafolio / historia */}
        <Section title="Historial de trabajos y portafolio" icon={<Briefcase className="h-4 w-4" />}>
          <p className="mb-3 text-sm text-muted-foreground">
            Cuenta la historia de tus proyectos: qué hiciste, cuándo y con una foto de referencia.
          </p>
          <div className="space-y-3">
            {portfolio.map((p, i) => (
              <div key={i} className="rounded-xl border border-border bg-muted/30 p-4">
                <div className="grid gap-3 sm:grid-cols-[140px_1fr]">
                  <div>
                    {p.image_url ? (
                      <div className="relative aspect-square overflow-hidden rounded-lg border border-border">
                        <img src={p.image_url} alt="" className="h-full w-full object-cover" />
                        <button
                          type="button"
                          onClick={() =>
                            setPortfolio((arr) =>
                              arr.map((x, j) => (j === i ? { ...x, image_url: null } : x)),
                            )
                          }
                          className="absolute right-1 top-1 rounded-full bg-background/90 p-1 shadow"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ) : (
                      <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-border bg-background text-xs text-muted-foreground transition hover:border-primary hover:text-primary">
                        <Upload className="h-5 w-5" />
                        <span>Subir foto</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) handlePortfolioImage(i, f);
                          }}
                        />
                      </label>
                    )}
                  </div>
                  <div className="space-y-3">
                    <Field label="Título del proyecto">
                      <Input
                        value={p.title}
                        onChange={(e) =>
                          setPortfolio((arr) =>
                            arr.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)),
                          )
                        }
                        placeholder="Ej: Remodelación de baño en Escalón"
                      />
                    </Field>
                    <Field label="Descripción">
                      <Textarea
                        rows={2}
                        value={p.description}
                        onChange={(e) =>
                          setPortfolio((arr) =>
                            arr.map((x, j) =>
                              j === i ? { ...x, description: e.target.value } : x,
                            ),
                          )
                        }
                        placeholder="Qué se hizo, materiales, resultado."
                      />
                    </Field>
                    <Field label="Fecha del proyecto">
                      <Input
                        type="date"
                        value={p.project_date}
                        onChange={(e) =>
                          setPortfolio((arr) =>
                            arr.map((x, j) =>
                              j === i ? { ...x, project_date: e.target.value } : x,
                            ),
                          )
                        }
                      />
                    </Field>
                  </div>
                </div>
                <div className="mt-3 flex justify-end">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setPortfolio((arr) => arr.filter((_, j) => j !== i))}
                  >
                    <Trash2 className="mr-1 h-4 w-4" /> Eliminar
                  </Button>
                </div>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                setPortfolio((arr) => [
                  ...arr,
                  { title: "", description: "", image_url: null, project_date: "" },
                ])
              }
            >
              <Plus className="mr-1 h-4 w-4" /> Agregar proyecto
            </Button>
          </div>
        </Section>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => navigate({ to: "/dashboard" })}>
            Cancelar
          </Button>
          <Button
            type="submit"
            size="lg"
            className="gradient-brand rounded-xl"
            disabled={mut.isPending}
          >
            {mut.isPending ? "Guardando..." : "Guardar perfil"}
          </Button>
        </div>
      </form>
      <Footer />
    </div>
  );
}

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
      <h2 className="mb-4 flex items-center gap-2 font-semibold">
        {icon}
        {title}
      </h2>
      {children}
    </div>
  );
}

function Field({
  label,
  children,
  required,
  className,
}: {
  label: string;
  children: React.ReactNode;
  required?: boolean;
  className?: string;
}) {
  return (
    <div className={className}>
      <Label>
        {label}
        {required && <span className="text-destructive"> *</span>}
      </Label>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

function ChipList({ items, onRemove }: { items: string[]; onRemove: (t: string) => void }) {
  if (items.length === 0) return null;
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {items.map((t) => (
        <span
          key={t}
          className="inline-flex items-center gap-1 rounded-full bg-brand-soft/60 px-3 py-1 text-xs font-medium text-primary"
        >
          {t}
          <button type="button" onClick={() => onRemove(t)} className="hover:text-destructive">
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}
    </div>
  );
}
