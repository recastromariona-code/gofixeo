import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Search, ShieldCheck, Sparkles, MessageCircle, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { CategoryCard, type CategoryCardData } from "@/components/CategoryCard";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export const Route = createFileRoute("/")({
  component: Landing,
});

function Landing() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("id, slug, name, icon, description")
        .order("sort_order");
      if (error) throw error;
      return (data ?? []) as CategoryCardData[];
    },
  });

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 gradient-hero" />
        <div className="relative mx-auto max-w-7xl px-4 pt-14 pb-16 sm:px-6 md:pt-24 md:pb-24">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mx-auto max-w-3xl text-center"
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-white/60 px-3 py-1 text-xs font-medium text-primary backdrop-blur">
              <Sparkles className="h-3.5 w-3.5" /> Marketplace de servicios · Latinoamérica
            </span>
            <h1 className="mt-5 text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl md:text-6xl">
              Encuentra profesionales de <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">confianza</span> para cualquier servicio del hogar
            </h1>
            <p className="mt-5 text-lg text-muted-foreground">
              Solicita cotizaciones en minutos y contrata de forma segura. Tan fácil como pedir un Uber.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                navigate({ to: "/search", search: { q } as never });
              }}
              className="mx-auto mt-8 flex max-w-2xl items-center gap-2 rounded-2xl border border-border bg-card p-2 shadow-elevated"
            >
              <div className="flex flex-1 items-center gap-2 px-3">
                <Search className="h-5 w-5 text-muted-foreground" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Ej: necesito instalar un aire acondicionado"
                  className="w-full border-0 bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground"
                />
              </div>
              <Button type="submit" className="gradient-brand h-11 rounded-xl px-5">
                Buscar
              </Button>
            </form>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Button asChild size="lg" className="gradient-brand rounded-xl">
                <Link to="/search">Buscar servicio</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="rounded-xl">
                <Link to="/become-provider">Quiero ofrecer mis servicios</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Categorías */}
      <section className="mx-auto w-full max-w-7xl px-4 py-14 sm:px-6">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold sm:text-3xl">Explora por categoría</h2>
            <p className="mt-1 text-muted-foreground">Los servicios más solicitados del hogar</p>
          </div>
          <Link to="/search" className="hidden text-sm font-medium text-primary hover:underline sm:inline-flex">
            Ver todo <ArrowRight className="ml-1 inline h-4 w-4" />
          </Link>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 lg:grid-cols-4">
          {categories.map((c) => (
            <CategoryCard key={c.id} category={c} />
          ))}
        </div>
      </section>

      {/* Cómo funciona */}
      <section className="bg-muted/40 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <h2 className="text-center text-2xl font-bold sm:text-3xl">Cómo funciona</h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {[
              { icon: Search, title: "1. Cuéntanos qué necesitas", text: "Describe tu proyecto o elige una categoría." },
              { icon: MessageCircle, title: "2. Recibe cotizaciones", text: "Los prestadores te contactan por chat o WhatsApp." },
              { icon: ShieldCheck, title: "3. Contrata con confianza", text: "Ve reseñas verificadas y elige al mejor." },
            ].map((s, i) => (
              <motion.div
                key={s.title}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="rounded-2xl border border-border bg-card p-6 shadow-soft"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl gradient-brand text-primary-foreground">
                  <s.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-semibold">{s.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{s.text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA prestadores */}
      <section className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6">
        <div className="relative overflow-hidden rounded-3xl gradient-brand p-8 shadow-elevated md:p-14">
          <div className="relative z-10 max-w-2xl text-primary-foreground">
            <h2 className="text-3xl font-bold sm:text-4xl">¿Eres un profesional?</h2>
            <p className="mt-3 text-primary-foreground/90">
              Consigue clientes en tu ciudad. Publica tus servicios gratis y recibe cotizaciones directamente en tu WhatsApp.
            </p>
            <div className="mt-6">
              <Button asChild size="lg" variant="secondary" className="rounded-xl">
                <Link to="/become-provider">Crear perfil de prestador</Link>
              </Button>
            </div>
          </div>
          <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 right-24 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
        </div>
      </section>

      <Footer />
    </div>
  );
}
