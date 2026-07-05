import { Link, useNavigate } from "@tanstack/react-router";
import { Cog, Home, LayoutDashboard, LogOut, Search, User as UserIcon } from "lucide-react";
import { useEffect, useState } from "react";
import logoLight from "@/assets/fixeo-logo-light.png.asset.json";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";

const navItems = [
  { label: "Bienvenida", to: "/", icon: Home },
  { label: "Perfil", to: "/become-provider", icon: UserIcon },
  { label: "Dashboard", to: "/dashboard", icon: LayoutDashboard },
  { label: "Buscar servicio", to: "/search", icon: Search },
] as const;

export function Navbar() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const savedTheme = window.localStorage.getItem("fixeo-theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const shouldUseDark = savedTheme ? savedTheme === "dark" : prefersDark;
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
        <Link to="/" className="flex items-center gap-2" aria-label="FIXEO - inicio">
          <img src={logoLight.url} alt="FIXEO" className="h-9 w-auto" />
        </Link>

        {user && (
          <nav className="flex flex-1 flex-wrap items-center justify-center gap-1">
            {navItems.map(({ label, to, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                className="inline-flex h-10 items-center gap-2 rounded-lg px-3 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
              >
                <Icon className="h-4 w-4" />
                <span>{label}</span>
              </Link>
            ))}
          </nav>
        )}

        <div className="flex items-center gap-2">
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

          {user ? (
            <Button
              variant="outline"
              size="sm"
              className="rounded-full"
              onClick={async () => {
                await signOut();
                navigate({ to: "/" });
              }}
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Cerrar sesión</span>
            </Button>
          ) : (
            <>
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
