import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Wrench, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/become-provider")({
  component: BecomeProvider,
});

function BecomeProvider() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [bio, setBio] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [city, setCity] = useState("");
  const [years, setYears] = useState("");
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth", search: { mode: "signup" } as never });
  }, [user, loading, navigate]);

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => (await supabase.from("categories").select("id, name").order("sort_order")).data ?? [],
  });

  const mut = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("No auth");
      if (selected.length === 0) throw new Error("Elige al menos una categoría");
      const { error: pErr } = await supabase
        .from("profiles")
        .update({ role: "provider", phone: phone || null, city: city || null })
        .eq("id", user.id);
      if (pErr) throw pErr;
      const { error: prErr } = await supabase.from("providers").upsert({
        id: user.id,
        bio: bio || null,
        years_experience: years ? parseInt(years) : 0,
        whatsapp_number: whatsapp || phone || null,
      });
      if (prErr) throw prErr;
      // reset categories
      await supabase.from("provider_categories").delete().eq("provider_id", user.id);
      const { error: pcErr } = await supabase
        .from("provider_categories")
        .insert(selected.map((cid) => ({ provider_id: user.id, category_id: cid })));
      if (pcErr) throw pcErr;
    },
    onSuccess: () => {
      toast.success("¡Perfil de prestador de servicios creado!");
      navigate({ to: "/dashboard" });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Error"),
  });

  if (!user) return null;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <section className="border-b border-border bg-muted/30">
        <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl gradient-brand text-primary-foreground">
              <Wrench className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Regístrate como prestador de servicios</h1>
              <p className="text-sm text-muted-foreground">Gratis. Publica los oficios que dominas y recibe clientes en tu ciudad.</p>
            </div>
          </div>
        </div>
      </section>

      <form
        onSubmit={(e) => { e.preventDefault(); mut.mutate(); }}
        className="mx-auto w-full max-w-3xl space-y-6 px-4 py-8 sm:px-6"
      >
        <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
          <h2 className="font-semibold">Datos de contacto</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Ciudad</Label>
              <Input value={city} onChange={(e) => setCity(e.target.value)} required placeholder="Bogotá" className="mt-1.5" />
            </div>
            <div>
              <Label>Teléfono</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+57 300 000 0000" className="mt-1.5" />
            </div>
            <div className="sm:col-span-2">
              <Label>WhatsApp (con código de país)</Label>
              <Input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="+57 300 000 0000" className="mt-1.5" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
          <h2 className="font-semibold">Sobre ti</h2>
          <div className="mt-4 space-y-4">
            <div>
              <Label>Presentación como especialista del hogar</Label>
              <Textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={4} placeholder="Cuenta sobre tu experiencia, oficios que dominas y disponibilidad." className="mt-1.5" />
            </div>
            <div>
              <Label>Años de experiencia</Label>
              <Input type="number" min={0} value={years} onChange={(e) => setYears(e.target.value)} className="mt-1.5 max-w-[160px]" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
          <h2 className="font-semibold">Categorías que ofreces</h2>
          <p className="text-sm text-muted-foreground">Elige una o más.</p>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
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
                    active ? "border-primary bg-brand-soft/60 text-primary" : "border-border bg-card hover:border-primary/40"
                  }`}
                >
                  <span className="font-medium">{c.name}</span>
                  {active && <CheckCircle2 className="h-4 w-4 text-primary" />}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex justify-end">
          <Button type="submit" size="lg" className="gradient-brand rounded-xl" disabled={mut.isPending}>
            Crear mi perfil
          </Button>
        </div>
      </form>
      <Footer />
    </div>
  );
}
