import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import { FixeoLogo } from "@/components/FixeoLogo";
import { useUserRole } from "@/hooks/use-user-role";

const baseExploreLinks = [
  { label: "Inicio", to: "/" as const },
  { label: "Buscar especialista", to: "/search" as const },
];
const providerExploreLink = { label: "Ofrecer mis servicios", to: "/become-provider" as const };

const categoryLinks = [
  { label: "Aires acondicionados", slug: "aires-acondicionados" },
  { label: "Electricistas", slug: "electricistas" },
  { label: "Fontanería", slug: "fontaneria" },
  { label: "Ver más oficios", slug: undefined },
];

const legalLinks = [
  { label: "Términos", to: "/terms" as const },
  { label: "Privacidad", to: "/terms" as const },
  { label: "Contacto", href: "mailto:hola@fixeo.app" },
];

function FooterLink({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span className={className}>
      {children}
      <ArrowUpRight className="ml-1 inline h-3.5 w-3.5 opacity-0 transition group-hover:opacity-70" />
    </span>
  );
}

export function Footer() {
  const { isClient } = useUserRole();
  const exploreLinks = isClient ? baseExploreLinks : [...baseExploreLinks, providerExploreLink];
  return (
    <footer className="mt-auto border-t border-border bg-muted/40">

      <div className="h-1 gradient-brand" />

      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-2 lg:grid-cols-4">
        <div className="md:col-span-2 lg:col-span-1">
          <Link to="/" aria-label="FIXEO - inicio">
            <FixeoLogo className="h-10" />
          </Link>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">
            Marketplace de especialistas del hogar y oficios en Latinoamérica.
          </p>
        </div>

        <div>
          <h4 className="text-sm font-semibold tracking-wide text-foreground">Explorar</h4>
          <ul className="mt-4 space-y-3 text-sm">
            {exploreLinks.map((item) => (
              <li key={item.to}>
                <Link
                  to={item.to}
                  className="group inline-flex items-center text-muted-foreground transition hover:text-primary"
                >
                  <FooterLink>{item.label}</FooterLink>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold tracking-wide text-foreground">Técnicos y oficios</h4>
          <ul className="mt-4 space-y-3 text-sm">
            {categoryLinks.map((item) => (
              <li key={item.label}>
                {item.slug ? (
                  <Link
                    to="/search"
                    search={{ category: item.slug } as never}
                    className="group inline-flex items-center text-muted-foreground transition hover:text-primary"
                  >
                    <FooterLink>{item.label}</FooterLink>
                  </Link>
                ) : (
                  <Link
                    to="/search"
                    className="group inline-flex items-center text-muted-foreground transition hover:text-primary"
                  >
                    <FooterLink>{item.label}</FooterLink>
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold tracking-wide text-foreground">Legal</h4>
          <ul className="mt-4 space-y-3 text-sm">
            {legalLinks.map((item) => (
              <li key={item.label}>
                {"href" in item ? (
                  <a
                    href={item.href}
                    className="group inline-flex items-center text-muted-foreground transition hover:text-primary"
                  >
                    <FooterLink>{item.label}</FooterLink>
                  </a>
                ) : (
                  <Link
                    to={item.to}
                    className="group inline-flex items-center text-muted-foreground transition hover:text-primary"
                  >
                    <FooterLink>{item.label}</FooterLink>
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-border/80 bg-background/40 py-5">
        <p className="text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} FIXEO — Encontrar un especialista del hogar de confianza, tan fácil como pedir un Uber.
        </p>
      </div>
    </footer>
  );
}
