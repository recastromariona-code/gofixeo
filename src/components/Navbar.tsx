import { Link, useNavigate } from "@tanstack/react-router";
import { Cog, Home, LayoutDashboard, LogOut, Moon, Search, Sun, User as UserIcon } from "lucide-react";
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
