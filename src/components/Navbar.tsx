import { Link, useNavigate } from "@tanstack/react-router";
import { Menu, LogOut, LayoutDashboard, User as UserIcon } from "lucide-react";
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
import { useState } from "react";

export function Navbar() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur-lg">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2" aria-label="FIXEO — inicio">
          <img src={logoLight.url} alt="FIXEO" className="h-9 w-auto" />
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          <Link to="/search" className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground">
            Buscar servicio
          </Link>
          <Link to="/become-provider" className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground">
            Ser prestador de servicios
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="rounded-full">
                  <UserIcon className="h-4 w-4" />
                  <span className="hidden sm:inline">Mi cuenta</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={() => navigate({ to: "/dashboard" })}>
                  <LayoutDashboard className="mr-2 h-4 w-4" /> Dashboard
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate({ to: "/settings" })}>
                  <UserIcon className="mr-2 h-4 w-4" /> Perfil
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
          ) : (
            <>
              <Button variant="ghost" size="sm" onClick={() => navigate({ to: "/auth" })}>
                Iniciar sesión
              </Button>
              <Button size="sm" className="gradient-brand" onClick={() => navigate({ to: "/auth", search: { mode: "signup" } as never })}>
                Registrarse
              </Button>
            </>
          )}
          <button
            className="ml-1 rounded-lg p-2 text-foreground hover:bg-muted md:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label="Menú"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>
      {open && (
        <div className="border-t border-border md:hidden">
          <div className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-3">
            <Link to="/search" className="rounded-lg px-3 py-2 text-sm font-medium hover:bg-muted" onClick={() => setOpen(false)}>
              Buscar servicio
            </Link>
            <Link to="/become-provider" className="rounded-lg px-3 py-2 text-sm font-medium hover:bg-muted" onClick={() => setOpen(false)}>
              Ser prestador de servicios
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
