import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CircleAlert, Menu, LogOut, LayoutDashboard, User as UserIcon } from "lucide-react";
import logoLight from "@/assets/fixeo-logo-light.png.asset.json";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
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
  const { data: profile } = useQuery({
    queryKey: ["profile-role", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
      return data;
    },
    enabled: !!user,
  });
  const showProviderLinks = !!user && profile?.role === "provider";

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur-lg">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2" aria-label="FIXEO — inicio">
          <img src={logoLight.url} alt="FIXEO" className="h-9 w-auto" />
        </Link>

        {showProviderLinks && (
          <nav className="hidden items-center gap-1 md:flex">
            <Link to="/search" className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground">
              Buscar servicio
            </Link>
            <Link to="/become-provider" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-warning/15 text-warning">
                <CircleAlert className="h-3.5 w-3.5" />
              </span>
              Completa tu perfil de prestador
            </Link>
          </nav>
        )}

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
              <Button variant="ghost" size="sm" className="border border-current shadow-sm" onClick={() => navigate({ to: "/auth" })}>
                Iniciar sesión
              </Button>
              <Button size="sm" className="gradient-brand" onClick={() => navigate({ to: "/auth", search: { mode: "signup" } as never })}>
                Registrarse
              </Button>
            </>
          )}
          {showProviderLinks && (
            <button
              className="ml-1 rounded-lg p-2 text-foreground hover:bg-muted md:hidden"
              onClick={() => setOpen((v) => !v)}
              aria-label="Menú"
            >
              <Menu className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>
      {open && showProviderLinks && (
        <div className="border-t border-border md:hidden">
          <div className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-3">
            <Link to="/search" className="rounded-lg px-3 py-2 text-sm font-medium hover:bg-muted" onClick={() => setOpen(false)}>
              Buscar servicio
            </Link>
            <Link to="/become-provider" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium hover:bg-muted" onClick={() => setOpen(false)}>
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-warning/15 text-warning">
                <CircleAlert className="h-3.5 w-3.5" />
              </span>
              Completa tu perfil de prestador
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
