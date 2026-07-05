import { Link, useNavigate } from "@tanstack/react-router";
import { Search, LogOut, LayoutDashboard, User as UserIcon } from "lucide-react";
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

export function Navbar() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur-lg">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2" aria-label="FIXEO — inicio">
          <img src={logoLight.url} alt="FIXEO" className="h-9 w-auto" />
        </Link>

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
                <DropdownMenuItem onClick={() => navigate({ to: "/become-provider" })}>
                  <UserIcon className="mr-2 h-4 w-4" /> Mi cuenta
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate({ to: "/search" })}>
                  <Search className="mr-2 h-4 w-4" /> Buscar servicio
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate({ to: "/dashboard" })}>
                  <LayoutDashboard className="mr-2 h-4 w-4" /> Dashboard
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
