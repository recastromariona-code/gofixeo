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
import { toast } from "sonner";

export const Route = createFileRoute("/settings")({
  component: Settings,
});

function Settings() {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");

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

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name ?? "");
      setPhone(profile.phone ?? "");
      setCity(profile.city ?? "");
    }
  }, [profile]);

  const mut = useMutation({
    mutationFn: async () => {
      if (!user) return;
      const { error } = await supabase
        .from("profiles")
        .update({ full_name: fullName, phone, city })
        .eq("id", user.id);
      if (error) throw error;
    },
    onSuccess: () => toast.success("Perfil actualizado"),
    onError: (e) => toast.error(e instanceof Error ? e.message : "Error"),
  });

  if (!user) return null;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <div className="mx-auto w-full max-w-3xl space-y-6 px-4 py-8 sm:px-6">
        <h1 className="text-2xl font-bold">Configuración</h1>

        <form
          onSubmit={(e) => { e.preventDefault(); mut.mutate(); }}
          className="rounded-2xl border border-border bg-card p-6 shadow-soft"
        >
          <h2 className="font-semibold">Perfil</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label>Nombre</Label>
              <Input value={fullName} onChange={(e) => setFullName(e.target.value)} className="mt-1.5" />
            </div>
            <div>
              <Label>Teléfono</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-1.5" />
            </div>
            <div>
              <Label>Ciudad</Label>
              <Input value={city} onChange={(e) => setCity(e.target.value)} className="mt-1.5" />
            </div>
          </div>
          <div className="mt-6 flex justify-end">
            <Button type="submit" className="gradient-brand rounded-xl" disabled={mut.isPending}>Guardar</Button>
          </div>
        </form>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
          <h2 className="font-semibold">Sesión</h2>
          <p className="mt-1 text-sm text-muted-foreground">{user.email}</p>
          <Button
            variant="outline"
            className="mt-4 rounded-xl"
            onClick={async () => {
              await signOut();
              navigate({ to: "/" });
            }}
          >
            Cerrar sesión
          </Button>
        </div>
      </div>
      <Footer />
    </div>
  );
}
