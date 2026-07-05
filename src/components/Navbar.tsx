import { useState } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Briefcase,
  FileText,
  Home,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Search,
  Sun,
  User as UserIcon,
  Wrench,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/hooks/use-theme";
import { FixeoLogo } from "@/components/FixeoLogo";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

type NavItem = { label: string; to: string; icon: typeof Home; exact: boolean };

const guestNavItems: readonly NavItem[] = [
  { label: "Inicio", to: "/", icon: Home, exact: true },
  { label: "Buscar servicio", to: "/search", icon: Search, exact: false },
  { label: "Ofrecer mis servicios", to: "/become-provider", icon: Wrench, exact: false },
];

const buyerNavItems: readonly NavItem[] = [
  { label: "Buscar servicio", to: "/search", icon: Search, exact: false },
  { label: "Mis solicitudes", to: "/requests", icon: FileText, exact: false },
  { label: "Dashboard", to: "/dashboard", icon: LayoutDashboard, exact: false },
  { label: "Perfil", to: "/profile", icon: UserIcon, exact: false },
];

const providerNavItems: readonly NavItem[] = [
  { label: "Dashboard", to: "/dashboard", icon: LayoutDashboard, exact: false },
  { label: "Oportunidades", to: "/search", icon: Briefcase, exact: false },
  { label: "Mi perfil profesional", to: "/become-provider", icon: Wrench, exact: false },
];

function isNavActive(pathname: string, to: string, exact: boolean) {
  if (exact) return pathname === to;
  return pathname === to || pathname.startsWith(`${to}/`);
}

function navLinkClass(active: boolean, mobile = false) {
  return cn(
    "inline-flex items-center gap-3 rounded-xl text-sm font-medium transition",
    mobile ? "w-full px-4 py-3" : "h-10 px-3",
    active
      ? "bg-brand-soft text-primary"
      : "text-muted-foreground hover:bg-muted hover:text-foreground",
  );
}

function NavLinks({
  items,
  pathname,
  mobile = false,
  onNavigate,
}: {
  items: readonly NavItem[];
  pathname: string;
  mobile?: boolean;
  onNavigate?: () => void;
}) {
  return (
    <>
      {items.map(({ label, to, icon: Icon, exact }) => {
        const active = isNavActive(pathname, to, exact);
        return (
          <Link
            key={to}
            to={to as string}
            onClick={onNavigate}
            className={navLinkClass(active, mobile)}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span>{label}</span>
          </Link>
        );
      })}
    </>
  );
}

export function Navbar() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const { isDark, toggleTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const isHome = pathname === "/";

  const { data: profile } = useQuery({
    queryKey: ["nav-profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user!.id)
        .maybeSingle();
      return data;
    },
  });

  const navItems = !user
    ? guestNavItems
    : profile?.role === "provider"
      ? providerNavItems
      : buyerNavItems;


  const handleSignOut = async () => {
    await signOut();
    navigate({ to: "/" });
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/70 bg-background/85 shadow-soft backdrop-blur-lg">
      <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-3 px-4 py-2 sm:px-6">
        <div className="flex min-w-0 items-center gap-2">
          {!isHome && (
            <Button asChild variant="ghost" size="sm" className="rounded-lg px-2 sm:px-3">
              <Link to="/" aria-label="Volver al inicio">
                <ArrowLeft className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Inicio</span>
              </Link>
            </Button>
          )}
          <Link to="/" className="flex shrink-0 items-center" aria-label="FIXEO - inicio">
            <FixeoLogo />
          </Link>
        </div>

        <nav className="hidden flex-1 items-center justify-center gap-1 lg:flex">
          <NavLinks items={navItems} pathname={pathname} />
        </nav>

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
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>

          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="rounded-full lg:hidden"
                aria-label="Abrir menú"
              >
                <Menu className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[min(100vw-2rem,320px)]">
              <SheetHeader>
                <SheetTitle>Menú</SheetTitle>
              </SheetHeader>
              <div className="mt-6 flex flex-col gap-2">
                <NavLinks
                  items={navItems}
                  pathname={pathname}
                  mobile
                  onNavigate={() => setMenuOpen(false)}
                />
              </div>
              <div className="mt-6 border-t border-border pt-6">
                {user ? (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full justify-start rounded-xl"
                    onClick={handleSignOut}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Cerrar sesión
                  </Button>
                ) : (
                  <div className="flex flex-col gap-2">
                    <Button
                      variant="outline"
                      className="w-full rounded-xl"
                      onClick={() => navigate({ to: "/auth" })}
                    >
                      Iniciar sesión
                    </Button>
                    <Button
                      className="gradient-brand w-full rounded-xl"
                      onClick={() => navigate({ to: "/auth", search: { mode: "signup" } as never })}
                    >
                      Registrarse
                    </Button>
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>

          {!user && (
            <div className="hidden items-center gap-2 sm:flex">
              <Button variant="ghost" size="sm" className="rounded-xl" onClick={() => navigate({ to: "/auth" })}>
                Iniciar sesión
              </Button>
              <Button
                size="sm"
                className="gradient-brand rounded-xl"
                onClick={() => navigate({ to: "/auth", search: { mode: "signup" } as never })}
              >
                Registrarse
              </Button>
            </div>
          )}

          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="hidden rounded-full sm:inline-flex"
                  aria-label="Abrir cuenta"
                >
                  <UserIcon className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Cerrar sesión
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  );
}
