import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { ArrowLeft, Cog, Home, LayoutDashboard, LogOut, Moon, Search, Sun, User as UserIcon, Wrench } from "lucide-react";
import { useEffect, useState } from "react";
import logoLight from "@/assets/fixeo-logo-light.png.asset.json";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const guestNavItems = [
  { label: "Inicio", to: "/", icon: Home, exact: true },
  { label: "Buscar servicio", to: "/search", icon: Search, exact: false },
  { label: "Ofrecer mis servicios", to: "/become-provider", icon: Wrench, exact: false },
] as const;

const userNavItems = [
  { label: "Inicio", to: "/", icon: Home, exact: true },
  { label: "Perfil", to: "/become-provider", icon: UserIcon, exact: false },
  { label: "Dashboard", to: "/dashboard", icon: LayoutDashboard, exact: false },
  { label: "Buscar servicio", to: "/search", icon: Search, exact: false },
] as const;

function isNavActive(pathname: string, to: string, exact: boolean) {
  if (exact) return pathname === to;
  return pathname === to || pathname.startsWith(`${to}/`);
}

function NavLinks({
  items,
  pathname,
}: {
  items: typeof guestNavItems | typeof userNavItems;
  pathname: string;
}) {
  return (
    <nav className="flex flex-1 flex-wrap items-center justify-center gap-1">
      {items.map(({ label, to, icon: Icon, exact }) => {
        const active = isNavActive(pathname, to, exact);
        return (
          <Link
            key={to}
            to={to}
            className={cn(
              "inline-flex h-10 items-center gap-2 rounded-lg px-3 text-sm font-medium transition",
              active
                ? "bg-brand-soft text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <Icon className="h-4 w-4" />
            <span className="hidden sm:inline">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function Navbar() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const [isDark, setIsDark] = useState(false);
  const isHome = pathname === "/";
  const navItems = user ? userNavItems : guestNavItems;

  useEffect(() => {
    const savedTheme = window.localStorage.getItem("fixeo-theme");
    const shouldUseDark = savedTheme === "dark";
    document.documentElement.classList.toggle("dark", shouldUseDark);
    setIsDark(shouldUseDark);
  }, []);

  const toggleTheme = () => {
    const next = !isDark;
    document.documentElement.classList.toggle("dark", next);
    window.localStorage.setItem("fixeo-theme", next ? "dark" : "light");
    setIsDark(next);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur-lg">
      <div className="mx-auto flex min-h-16 max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-2 sm:px-6">
        <div className="flex items-center gap-2">
          {!isHome && (
            <Button asChild variant="ghost" size="sm" className="rounded-lg px-2 sm:px-3">
              <Link to="/" aria-label="Volver al inicio">
                <ArrowLeft className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Inicio</span>
              </Link>
            </Button>
          )}
          <Link to="/" className="flex items-center gap-2" aria-label="FIXEO - inicio">
            <img src={logoLight.url} alt="FIXEO" className="h-9 w-auto" />
          </Link>
        </div>

        <NavLinks items={navItems} pathname={pathname} />

        <div className="flex items-center gap-2">
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="rounded-full"
                  aria-label="Abrir opciones"
                >
                  <Cog className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={toggleTheme}>
                  {isDark ? <Sun className="mr-2 h-4 w-4" /> : <Moon className="mr-2 h-4 w-4" />}
                  {isDark ? "Modo claro" : "Modo oscuro"}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={async () => {
                    await signOut();
                    navigate({ to: "/" });
                  }}
                >
                  <LogOut className="mr-2 h-4 w-4" /> Cerrar sesión
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {!user && (
            <>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="rounded-full"
                onClick={toggleTheme}
                aria-label={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
                title={isDark ? "Modo claro" : "Modo oscuro"}
              >
                <Cog className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" className="border border-current shadow-sm" onClick={() => navigate({ to: "/auth" })}>
                Iniciar sesión
              </Button>
              <Button size="sm" className="gradient-brand" onClick={() => navigate({ to: "/auth", search: { mode: "signup" } as never })}>
                Registrarse
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
