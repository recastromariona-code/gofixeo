import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { User as UserIcon, ShieldCheck, MessageCircle } from "lucide-react";
import { requestPhoneCode, confirmPhoneCode } from "@/lib/phone-verification.functions";

export const Route = createFileRoute("/profile")({
  component: ProfilePage,
  head: () => ({
    meta: [
      { title: "Mi perfil · FIXEO" },
      { name: "description", content: "Administra tu información personal en FIXEO." },
    ],
  }),
});

function ProfilePage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [code, setCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);

  const requestCodeFn = useServerFn(requestPhoneCode);
  const confirmCodeFn = useServerFn(confirmPhoneCode);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [user, loading, navigate]);

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("full_name, phone, city, role, avatar_url, phone_verified_at")
        .eq("id", user!.id)
        .maybeSingle();
      if (data) {
        setFullName(data.full_name ?? "");
        setPhone(data.phone ?? "");
        setCity(data.city ?? "");
      }
      return data;
    },
  });

  const isVerified = !!profile?.phone_verified_at;
  const phoneChanged = (profile?.phone ?? "") !== phone;

  const saveMut = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Sin sesión");
      const patch: {
        full_name: string | null;
        city: string | null;
        phone?: string | null;
        phone_verified_at?: string | null;
      } = {
        full_name: fullName.trim() || null,
        city: city.trim() || null,
      };
      if (phoneChanged) {
        patch.phone = phone.trim() || null;
        patch.phone_verified_at = null;
      }
      const { error } = await supabase.from("profiles").update(patch).eq("id", user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Perfil actualizado");
      setCodeSent(false);
      setCode("");
      qc.invalidateQueries({ queryKey: ["profile"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Error"),
  });

  const requestMut = useMutation({
    mutationFn: async () => {
      if (phoneChanged) await saveMut.mutateAsync();
      return requestCodeFn({ data: { phone: phone.trim() } });
    },
    onSuccess: (r) => {
      setCodeSent(true);
      toast.success(r.dispatched ? "Código enviado por WhatsApp" : "Código generado (revisa registros)");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Error"),
  });

  const confirmMut = useMutation({
    mutationFn: () => confirmCodeFn({ data: { code: code.trim() } }),
    onSuccess: () => {
      toast.success("¡Teléfono verificado!");
      setCodeSent(false);
      setCode("");
      qc.invalidateQueries({ queryKey: ["profile"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Error"),
  });

  if (!user) return null;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <div className="mx-auto w-full max-w-2xl px-4 py-8 sm:px-6">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-soft text-primary">
            <UserIcon className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Mi perfil</h1>
            <p className="text-sm text-muted-foreground">Información personal que usarás para contratar servicios.</p>
          </div>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            saveMut.mutate();
          }}
          className="space-y-5 rounded-2xl border border-border bg-card p-6 shadow-soft"
        >
          <div className="space-y-2">
            <Label>Correo</Label>
            <Input value={user.email ?? ""} readOnly className="bg-muted/40" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">Nombre completo</Label>
            <Input id="name" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Tu nombre" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="city">Ciudad</Label>
              <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Ej. San Salvador" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-2">
                Teléfono
                {isVerified && !phoneChanged && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                    <ShieldCheck className="h-3 w-3" /> Verificado
                  </span>
                )}
              </Label>
              <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+503 6000-0000" />
            </div>
          </div>

          <div className="flex flex-wrap justify-end gap-2">
            <Button type="submit" disabled={saveMut.isPending} variant="outline" className="rounded-xl">
              {saveMut.isPending ? "Guardando…" : "Guardar cambios"}
            </Button>
          </div>
        </form>

        <div className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-soft">
          <div className="mb-2 flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-primary" />
            <h2 className="font-semibold">Asistente por WhatsApp</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Verifica tu número para consultar y publicar en FIXEO desde WhatsApp. Te enviaremos un código de 6 dígitos.
          </p>

          {!codeSent ? (
            <Button
              type="button"
              onClick={() => requestMut.mutate()}
              disabled={requestMut.isPending || !phone.trim() || (isVerified && !phoneChanged)}
              className="mt-4 rounded-xl gradient-brand"
            >
              {isVerified && !phoneChanged
                ? "Ya verificado"
                : requestMut.isPending
                  ? "Enviando…"
                  : phoneChanged
                    ? "Guardar y enviar código"
                    : "Enviar código por WhatsApp"}
            </Button>
          ) : (
            <div className="mt-4 flex flex-wrap items-end gap-2">
              <div className="space-y-2">
                <Label htmlFor="code">Código recibido</Label>
                <Input
                  id="code"
                  inputMode="numeric"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, ""))}
                  placeholder="123456"
                  className="w-40 tracking-widest"
                />
              </div>
              <Button
                type="button"
                onClick={() => confirmMut.mutate()}
                disabled={confirmMut.isPending || code.length !== 6}
                className="rounded-xl"
              >
                {confirmMut.isPending ? "Verificando…" : "Verificar"}
              </Button>
              <Button type="button" variant="ghost" onClick={() => requestMut.mutate()} disabled={requestMut.isPending}>
                Reenviar
              </Button>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
