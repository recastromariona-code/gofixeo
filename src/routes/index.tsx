import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  MessageCircle,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { CategoryCard, type CategoryCardData } from "@/components/CategoryCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { TrustSpecialistsBar } from "@/components/TrustSpecialistsBar";
import { useUserRole } from "@/hooks/use-user-role";
import { useState } from "react";
import techAc1 from "@/assets/tech-ac-1.png.asset.json";
import techAc2 from "@/assets/tech-ac-2.png.asset.json";
import techAc3 from "@/assets/tech-ac-3.png.asset.json";

const TRUST_SPECIALISTS = [
  { url: techAc1.url, name: "Camila", role: "Técnica HVAC certificada" },
  { url: techAc2.url, name: "Kenji", role: "Refrigeración industrial" },
  { url: techAc3.url, name: "Marco", role: "Instalación y mantenimiento" },
];

export const Route = createFileRoute("/")({
  component: Landing,
});

const TRUST_PILLARS = [
  {
    icon: ShieldCheck,
    title: "Perfiles verificados",
    text: "Revisamos identidad y experiencia antes de publicar a cada especialista.",
  },
  {
    icon: Star,
    title: "Reseñas reales",
    text: "Opiniones de clientes que ya contrataron el servicio, sin filtros.",
  },
  {
    icon: MessageCircle,
    title: "Cotización sin costo",
    text: "Describe tu necesidad y recibe propuestas por chat o WhatsApp.",
  },
  {
    icon: CheckCircle2,
    title: "Contratación segura",
    text: "Compara opciones, negocia y elige con toda la información a la vista.",
  },
] as const;

const POPULAR_SEARCHES = [
  "Aire acondicionado",
  "Electricista",
  "Plomería",
  "Pintura",
] as const;

const HOW_IT_WORKS = [
  {
    step: "01",
    icon: Search,
    title: "Cuéntanos qué necesitas",
    text: "Describe tu proyecto o elige una categoría de servicio del hogar.",
  },
  {
    step: "02",
    icon: MessageCircle,
    title: "Recibe cotizaciones",
    text: "Los especialistas te contactan por chat o WhatsApp con propuestas claras.",
  },
  {
    step: "03",
    icon: ShieldCheck,
    title: "Contrata con confianza",
    text: "Compara reseñas, precios y tiempos antes de decidir.",
  },
] as const;

function Landing() {
  const navigate = useNavigate();
  const { isClient } = useUserRole();
  const [q, setQ] = useState("");

  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
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

  const goToSearch = (query?: string) => {
    navigate({ to: "/search", search: { q: query ?? q } as never });
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border/60">
        <div className="absolute inset-0 gradient-hero" />
        <div className="absolute inset-0 hero-grid opacity-60" />
        <div className="pointer-events-none absolute -right-24 top-10 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
        <div className="pointer-events-none absolute -left-16 bottom-0 h-56 w-56 rounded-full bg-accent/40 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-4 pt-12 pb-16 sm:px-6 lg:pt-20 lg:pb-24">
          <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <span className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-card/70 px-3 py-1 text-xs font-medium text-primary shadow-soft backdrop-blur">
                <Sparkles className="h-3.5 w-3.5" />
                Marketplace de servicios · Latinoamérica
              </span>

              <h1 className="mt-5 max-w-2xl text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl lg:text-[3.25rem] lg:leading-[1.08]">
                Encuentra especialistas del hogar de{" "}
                <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
                  confianza
                </span>{" "}
                para cualquier técnico u oficio
              </h1>

              <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted-foreground">
                Solicita cotizaciones en minutos y contrata de forma segura. Tan fácil como pedir un Uber.
              </p>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  goToSearch();
                }}
                className="mt-8 flex flex-col gap-2 rounded-2xl border border-border/80 bg-card/95 p-2 shadow-elevated backdrop-blur sm:flex-row sm:items-center"
              >
                <div className="flex flex-1 items-center gap-2 px-3">
                  <Search className="h-5 w-5 shrink-0 text-muted-foreground" />
                  <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Ej: necesito instalar un aire acondicionado"
                    className="w-full border-0 bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground"
                  />
                </div>
                <Button type="submit" className="gradient-brand h-11 shrink-0 rounded-xl px-6 sm:mr-1">
                  Buscar especialista
                </Button>
              </form>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className="text-xs font-medium text-muted-foreground">Popular:</span>
                {POPULAR_SEARCHES.map((term) => (
                  <button
                    key={term}
                    type="button"
                    onClick={() => goToSearch(term)}
                    className="rounded-full border border-border bg-card/80 px-3 py-1 text-xs font-medium text-foreground transition hover:border-primary/30 hover:bg-brand-soft/60"
                  >
                    {term}
                  </button>
                ))}
              </div>

              {!isClient && (
                <div className="mt-8 flex flex-wrap gap-3">
                  <Button asChild variant="outline" size="lg" className="rounded-xl bg-card/60">
                    <Link to="/become-provider">Quiero ofrecer mis servicios</Link>
                  </Button>
                </div>
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.1 }}
              className="relative mx-auto w-full max-w-md lg:max-w-none"
            >
              <div className="rounded-3xl border border-border/80 bg-card/90 p-6 shadow-elevated backdrop-blur">
                <p className="text-sm font-semibold text-foreground">Tu proyecto, resuelto en 3 pasos</p>
                <div className="mt-5 space-y-4">
                  {HOW_IT_WORKS.map((step, index) => (
                    <div key={step.step} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-soft text-primary">
                          <step.icon className="h-4 w-4" />
                        </div>
                        {index < HOW_IT_WORKS.length - 1 && (
                          <div className="mt-2 h-full min-h-6 w-px bg-border" />
                        )}
                      </div>
                      <div className="pb-1 pt-1">
                        <p className="text-xs font-semibold uppercase tracking-wide text-primary/70">
                          Paso {step.step}
                        </p>
                        <p className="mt-0.5 font-medium text-foreground">{step.title}</p>
                        <p className="mt-1 text-sm text-muted-foreground">{step.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Categorías */}
      <section className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="inline-flex rounded-full bg-brand-soft px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
              Categorías
            </span>
            <h2 className="mt-3 text-2xl font-bold sm:text-3xl">Explora técnicos y oficios del hogar</h2>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              Los servicios más solicitados por familias y negocios en toda Latinoamérica.
            </p>
          </div>
          <Link
            to="/search"
            className="inline-flex items-center text-sm font-medium text-primary transition hover:text-primary-glow"
          >
            Ver todas las categorías
            <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 lg:grid-cols-4">
          {categoriesLoading
            ? Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-36 rounded-2xl" />
              ))
            : categories.map((c, i) => (
                <motion.div
                  key={c.id}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.04 }}
                >
                  <CategoryCard category={c} />
                </motion.div>
              ))}
        </div>
      </section>

      {/* Confianza */}
      <section className="gradient-section border-y border-border/60 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <span className="inline-flex rounded-full bg-brand-soft px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
              Confianza
            </span>
            <h2 className="mt-3 text-2xl font-bold sm:text-3xl">Por qué elegir FIXEO</h2>
            <p className="mt-2 text-muted-foreground">
              Diseñamos cada paso para que contratar un especialista sea claro, rápido y seguro.
            </p>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {TRUST_PILLARS.map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="rounded-2xl border border-border bg-card p-6 shadow-soft"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-soft text-primary">
                  <item.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Cómo funciona */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <span className="inline-flex rounded-full bg-brand-soft px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
              Proceso
            </span>
            <h2 className="mt-3 text-2xl font-bold sm:text-3xl">Cómo funciona</h2>
            <p className="mt-2 text-muted-foreground">
              De la búsqueda a la contratación, todo ocurre en la misma plataforma.
            </p>
          </div>

          <div className="relative mt-12 grid gap-6 md:grid-cols-3">
            <div className="pointer-events-none absolute left-[16.5%] right-[16.5%] top-8 hidden h-px bg-border md:block" />
            {HOW_IT_WORKS.map((step, i) => (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
                className="relative rounded-2xl border border-border bg-card p-6 shadow-soft"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                    {step.step}
                  </span>
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl gradient-brand text-primary-foreground">
                    <step.icon className="h-5 w-5" />
                  </div>
                </div>
                <h3 className="mt-5 font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA ofrecer servicios (oculto para clientes) */}
      {!isClient && (
        <section className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6">
          <div className="relative overflow-hidden rounded-3xl gradient-brand p-8 shadow-elevated md:p-14">
            <div className="relative z-10 max-w-2xl text-primary-foreground">
              <span className="inline-flex rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary-foreground/90">
                Ofrecer servicios
              </span>
              <h2 className="mt-4 text-3xl font-bold sm:text-4xl">¿Eres técnico o dominas un oficio?</h2>
              <p className="mt-3 text-base leading-relaxed text-primary-foreground/90">
                Consigue clientes en tu ciudad. Regístrate gratis y recibe cotizaciones directamente en tu WhatsApp.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button asChild size="lg" variant="secondary" className="rounded-xl">
                  <Link to="/become-provider">Ofrecer mis servicios</Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="rounded-xl border-white/30 bg-white/10 text-primary-foreground hover:bg-white/20 hover:text-primary-foreground"
                >
                  <Link to="/search">Ver cómo lo ven los clientes</Link>
                </Button>
              </div>
            </div>
            <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 right-24 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
          </div>
        </section>
      )}

      <Footer />
    </div>
  );
}
