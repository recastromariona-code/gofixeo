import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import type { User as AuthUser } from "@supabase/supabase-js";
import { useState, useEffect } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Mail, Loader2, Eye, EyeOff, Home, Wrench, ArrowLeft, ShieldCheck, Sparkles } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

import logoDark from "@/assets/fixeo-logo-dark.png.asset.json";
import { FixeoLogo } from "@/components/FixeoLogo";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

const TRUST_POINTS = [
  "Cotizaciones gratis en minutos",
  "Especialistas verificados",
  "Chat y WhatsApp directo",
] as const;

const searchSchema = z.object({
  mode: z.enum(["login", "signup"]).optional(),
  next: z.string().optional(),
});
const googleRoleStorageKey = "fixeo-google-role";
const nextStorageKey = "fixeo-next-redirect";
type UserRole = "client" | "provider";

const isUserRole = (value: string | null): value is UserRole =>
  value === "client" || value === "provider";

/** Only accept safe same-origin relative paths as `next`. */
const safeNext = (raw: string | null | undefined): string | null => {
  if (!raw || typeof raw !== "string") return null;
  if (!raw.startsWith("/") || raw.startsWith("//")) return null;
  return raw;
};

export const Route = createFileRoute("/auth")({
  validateSearch: searchSchema,
  component: AuthPage,
});

function AuthPage() {
  const { mode: initialMode, next: nextParam } = Route.useSearch();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [mode, setMode] = useState<"login" | "signup">(initialMode ?? "login");
  const nextRedirect = safeNext(nextParam);
  const goNextOr = (fallback: string) => {
    const stored = safeNext(typeof window !== "undefined" ? window.localStorage.getItem(nextStorageKey) : null);
    const target = nextRedirect ?? stored;
    if (typeof window !== "undefined") window.localStorage.removeItem(nextStorageKey);
    if (target) {
      window.location.href = target;
      return;
    }
    navigate({ to: fallback });
  };
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState<string | null>(null);
  const [signupMethod, setSignupMethod] = useState<"email" | "google" | null>(null);

  const applyRoleToCurrentUser = async (role: UserRole, authUser: AuthUser) => {
    const displayName =
      authUser.user_metadata?.full_name ??
      authUser.user_metadata?.name ??
      authUser.email?.split("@")[0] ??
      null;
    const avatarUrl =
      authUser.user_metadata?.avatar_url ??
      authUser.user_metadata?.picture ??
      null;

    const { error: profileError } = await supabase
      .from("profiles")
      .upsert(
        {
          id: authUser.id,
          full_name: displayName,
          avatar_url: avatarUrl,
          role,
        },
        { onConflict: "id" },
      );

    if (profileError) throw profileError;

    if (role === "provider") {
      const { error: providerError } = await supabase
        .from("providers")
        .upsert({ id: authUser.id }, { onConflict: "id" });

      if (providerError) throw providerError;
    }
  };

  // Persist the requested next-redirect so it survives OAuth round-trips and email verification.
  useEffect(() => {
    if (nextRedirect && typeof window !== "undefined") {
      window.localStorage.setItem(nextStorageKey, nextRedirect);
    }
  }, [nextRedirect]);

  useEffect(() => {
    if (authLoading || !user || showRoleDialog) return;

    const storedRole = window.localStorage.getItem(googleRoleStorageKey);
    const pendingRole = isUserRole(storedRole) ? storedRole : null;

    if (!pendingRole) {
      goNextOr("/dashboard");
      return;
    }

    let ignore = false;
    setLoading(true);
    applyRoleToCurrentUser(pendingRole, user)
      .then(() => {
        window.localStorage.removeItem(googleRoleStorageKey);
        if (!ignore) {
          goNextOr(pendingRole === "provider" ? "/become-provider" : "/search");
        }
      })
      .catch((err) => {
        if (!ignore) toast.error(getAuthErrorMessage(err));
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading, showRoleDialog]);

  const getAuthErrorMessage = (err: unknown): string => {
    if (!(err instanceof Error)) return "Ocurrió un error inesperado. Intenta de nuevo.";
    const msg = err.message.toLowerCase();
    const code = (err as any).code?.toLowerCase?.() ?? "";

    if (code === "email_already_in_use" || msg.includes("already registered") || msg.includes("user already registered")) {
      return "Este correo ya está registrado. Intenta iniciar sesión o usa otro correo.";
    }
    if (code === "user_not_found" || msg.includes("user not found") || msg.includes("no user")) {
      return "No encontramos una cuenta con este correo. Verifica que esté bien escrito o crea una cuenta.";
    }
    if (code === "invalid_credentials" || msg.includes("invalid login credentials")) {
      return "Correo o contraseña incorrectos. Verifica tus datos e intenta de nuevo.";
    }
    if (code === "weak_password" || msg.includes("password should be") || msg.includes("weak")) {
      return "La contraseña es muy débil. Usa al menos 6 caracteres.";
    }
    if (code === "invalid_email" || msg.includes("invalid email")) {
      return "El formato del correo no es válido. Revisa que esté bien escrito.";
    }
    if (code === "email_not_confirmed" || msg.includes("email not confirmed")) {
      return "Tu correo aún no ha sido confirmado. Revisa tu bandeja de entrada.";
    }
    if (code === "rate_limit_exceeded" || msg.includes("rate limit") || msg.includes("too many requests")) {
      return "Demasiados intentos. Espera un momento y vuelve a intentarlo.";
    }
    if (code === "signup_disabled" || msg.includes("signup disabled")) {
      return "El registro está desactivado temporalmente. Intenta más tarde.";
    }
    if (msg.includes("network") || msg.includes("fetch") || msg.includes("connection")) {
      return "Hubo un problema de conexión. Revisa tu internet e intenta de nuevo.";
    }
    return err.message;
  };

  const handleGoogle = async (role?: UserRole) => {
    if (mode === "signup" && !role) {
      setSignupMethod("google");
      setShowRoleDialog(true);
      return;
    }

    setLoading(true);
    if (role) {
      window.localStorage.setItem(googleRoleStorageKey, role);
    }

    const nextQ = nextRedirect ? `&next=${encodeURIComponent(nextRedirect)}` : "";
    const redirectPath = role || mode === "signup" ? `/auth?mode=signup${nextQ}` : `/auth${nextQ ? `?${nextQ.slice(1)}` : ""}`;
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin + redirectPath,
    });

    if (result.error) {
      if (role) window.localStorage.removeItem(googleRoleStorageKey);
      toast.error(getAuthErrorMessage(result.error));
      setLoading(false);
      return;
    }

    if (!result.redirected) {
      if (role) {
        const { data, error } = await supabase.auth.getUser();
        if (error || !data.user) {
          window.localStorage.removeItem(googleRoleStorageKey);
          toast.error("No pudimos confirmar la sesión de Google. Intenta de nuevo.");
          setLoading(false);
          return;
        }
        await applyRoleToCurrentUser(role, data.user);
        window.localStorage.removeItem(googleRoleStorageKey);
        goNextOr(role === "provider" ? "/become-provider" : "/search");
        return;
      }
      goNextOr("/dashboard");
    }
  };

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "signup") {
      setVerificationEmail(null);
      if (password.length < 6) {
        toast.error("La contraseña debe tener al menos 6 caracteres");
        return;
      }
      if (!fullName.trim()) {
        toast.error("Escribe tu nombre para continuar");
        return;
      }
      setSignupMethod("email");
      setShowRoleDialog(true);
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      toast.success("Bienvenido de nuevo");
      goNextOr("/dashboard");
    } catch (err) {
      toast.error(getAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };


  const selectRole = async (role: UserRole) => {
    if (signupMethod === "google") {
      await handleGoogle(role);
      return;
    }

    setLoading(true);
    try {
      const emailRedirect = nextRedirect
        ? `${window.location.origin}/auth?next=${encodeURIComponent(nextRedirect)}`
        : `${window.location.origin}/dashboard`;
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: emailRedirect,
          data: { full_name: fullName, role },
        },
      });
      if (error) throw error;

      if (data.session) {
        toast.success("¡Cuenta creada! Redirigiendo...");
        goNextOr(role === "provider" ? "/become-provider" : "/search");
      } else {
        setVerificationEmail(email);
        setShowRoleDialog(false);
        setSignupMethod(null);
      }
    } catch (err) {
      toast.error(getAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-svh md:h-svh md:grid-cols-2 md:overflow-hidden">
      {/* Left / brand */}
      <div className="relative hidden overflow-hidden gradient-brand p-8 text-primary-foreground md:flex md:min-h-0 md:flex-col md:justify-between">
        <div className="absolute inset-0 hero-grid opacity-20" />
        <div className="pointer-events-none absolute -bottom-20 -right-20 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -left-16 top-24 h-56 w-56 rounded-full bg-white/5 blur-3xl" />

        <Link to="/" className="relative flex items-center gap-2 text-primary-foreground">
          <img src={logoDark.url} alt="FIXEO" className="h-10 w-auto" />
        </Link>

        <div className="relative max-w-md">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-primary-foreground/90">
            <Sparkles className="h-3.5 w-3.5" />
            Marketplace de servicios
          </span>
          <h2 className="mt-4 text-3xl font-bold leading-tight">
            Servicios del hogar, rápido y de confianza.
          </h2>
          <p className="mt-3 text-primary-foreground/85">
            Miles de especialistas en Latinoamérica listos para ayudarte con tu próximo proyecto.
          </p>
          <ul className="mt-8 space-y-3">
            {TRUST_POINTS.map((point) => (
              <li key={point} className="flex items-center gap-2 text-sm text-primary-foreground/90">
                <ShieldCheck className="h-4 w-4 shrink-0" />
                {point}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative text-xs text-primary-foreground/70">
          © {new Date().getFullYear()} FIXEO
        </div>
      </div>

      {/* Right / form */}
      <div className="relative flex min-h-svh items-center justify-center bg-background p-3 md:min-h-0 md:p-6">
        <Button asChild variant="ghost" size="sm" className="absolute left-3 top-3 z-10 rounded-lg md:left-6 md:top-6">
          <Link to="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver al inicio
          </Link>
        </Button>

        <div className="w-full max-w-md pt-12 md:pt-0">
          <div className="mb-6 md:hidden">
            <Link to="/" aria-label="FIXEO - inicio">
              <FixeoLogo className="h-10" />
            </Link>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 shadow-soft sm:p-8">
            <div className="mb-6 grid grid-cols-2 gap-1 rounded-xl bg-muted/60 p-1">
              <button
                type="button"
                onClick={() => setMode("login")}
                className={cn(
                  "rounded-lg px-3 py-2 text-sm font-medium transition",
                  mode === "login"
                    ? "bg-card text-foreground shadow-soft"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                Iniciar sesión
              </button>
              <button
                type="button"
                onClick={() => setMode("signup")}
                className={cn(
                  "rounded-lg px-3 py-2 text-sm font-medium transition",
                  mode === "signup"
                    ? "bg-card text-foreground shadow-soft"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                Crear cuenta
              </button>
            </div>

            <h1 className="text-2xl font-bold">
              {mode === "signup" ? "Crea tu cuenta" : "Bienvenido de vuelta"}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {mode === "signup"
                ? "Empieza a contratar o a ofrecer tus servicios en minutos."
                : "Ingresa a tu cuenta para continuar."}
            </p>

            {verificationEmail && (
              <div className="verification-notice mt-4 overflow-hidden rounded-xl border border-primary/20 bg-brand-soft/60 p-3 text-sm text-foreground">
                <div className="flex gap-3">
                  <Mail className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <div>
                    <p className="font-semibold">Verifica tu correo para activar la cuenta</p>
                    <p className="mt-1 text-muted-foreground">
                      Te llegará un mensaje a {verificationEmail}. Confírmalo y volverás a FIXEO con la sesión iniciada.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-5">
              <Button
                type="button"
                variant="outline"
                className="h-11 w-full rounded-xl border-border/80 bg-background"
                onClick={() => handleGoogle()}
                disabled={loading}
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.26 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"/>
                </svg>
                Continuar con Google
              </Button>
            </div>

            <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
              <div className="h-px flex-1 bg-border" />
              o con correo
              <div className="h-px flex-1 bg-border" />
            </div>

            <form onSubmit={handleEmail} className="space-y-4">
              {mode === "signup" && (
                <div>
                  <Label htmlFor="name">Nombre completo</Label>
                  <Input
                    id="name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    className="mt-1.5 rounded-xl"
                    placeholder="Juan Pérez"
                  />
                </div>
              )}
              <div>
                <Label htmlFor="email">Correo</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="mt-1.5 rounded-xl"
                  placeholder="tu@correo.com"
                />
              </div>
              <div>
                <Label htmlFor="password">Contraseña</Label>
                <div className="relative mt-1.5">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="rounded-xl pr-10"
                    placeholder="Mínimo 6 caracteres"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground"
                    aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              {mode === "signup" && (
                <div>
                  <Label htmlFor="confirm-password">Confirmar contraseña</Label>
                  <div className="relative mt-1.5">
                    <Input
                      id="confirm-password"
                      type={showConfirm ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      minLength={6}
                      className="rounded-xl pr-10"
                      placeholder="Repite tu contraseña"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm((v) => !v)}
                      className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground"
                      aria-label={showConfirm ? "Ocultar contraseña" : "Mostrar contraseña"}
                    >
                      {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {confirmPassword && confirmPassword !== password && (
                    <p className="mt-1 text-xs text-destructive">Las contraseñas no coinciden</p>
                  )}
                </div>
              )}
              <Button type="submit" disabled={loading} className="gradient-brand h-11 w-full rounded-xl">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                {mode === "signup" ? "Crear cuenta" : "Iniciar sesión"}
              </Button>
            </form>
          </div>

          <p className="mt-5 text-center text-sm text-muted-foreground">
            {mode === "signup" ? "¿Ya tienes cuenta?" : "¿Nuevo en FIXEO?"}{" "}
            <button
              type="button"
              onClick={() => setMode(mode === "signup" ? "login" : "signup")}
              className="font-semibold text-primary hover:underline"
            >
              {mode === "signup" ? "Inicia sesión" : "Crea una cuenta"}
            </button>
          </p>
        </div>
      </div>

      <Dialog
        open={showRoleDialog}
        onOpenChange={(open) => {
          setShowRoleDialog(open);
          if (!open) setSignupMethod(null);
        }}
      >
        <DialogContent className="max-w-md sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-center text-xl">
              ¿Cómo quieres usar FIXEO?
            </DialogTitle>
            <DialogDescription className="text-center">
              Elige una opción para personalizar tu experiencia. Puedes cambiarlo después.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <button
              type="button"
              disabled={loading}
              onClick={() => selectRole("client")}
              className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6 text-center transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-soft focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-60"
            >
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl gradient-brand text-primary-foreground transition group-hover:scale-105">
                <Home className="h-7 w-7" />
              </div>
              <div className="mt-4">
                <p className="font-semibold text-foreground">Quiero contratar</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Busca especialistas y solicita cotizaciones.
                </p>
              </div>
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => selectRole("provider")}
              className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6 text-center transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-soft focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-60"
            >
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-soft text-primary transition group-hover:gradient-brand group-hover:text-primary-foreground group-hover:scale-105">
                <Wrench className="h-7 w-7" />
              </div>
              <div className="mt-4">
                <p className="font-semibold text-foreground">Ofrecer mis servicios</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Crea tu perfil y recibe solicitudes de clientes.
                </p>
              </div>
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
