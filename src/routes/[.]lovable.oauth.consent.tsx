import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { FixeoLogo } from "@/components/FixeoLogo";

// Supabase's OAuth namespace is beta — declare a minimal local typed wrapper
// so this route is strictly typed without touching node_modules.
type AuthorizationDetails = {
  client?: { name?: string | null; client_uri?: string | null };
  redirect_url?: string | null;
  redirect_to?: string | null;
};
type OAuthResult<T> = { data: T | null; error: { message: string } | null };
type OAuthNamespace = {
  getAuthorizationDetails: (id: string) => Promise<OAuthResult<AuthorizationDetails>>;
  approveAuthorization: (id: string) => Promise<OAuthResult<AuthorizationDetails>>;
  denyAuthorization: (id: string) => Promise<OAuthResult<AuthorizationDetails>>;
};
const oauth = (supabase.auth as unknown as { oauth: OAuthNamespace }).oauth;

export const Route = createFileRoute("/.lovable/oauth/consent")({
  // Browser-only: Supabase reads its session from localStorage.
  ssr: false,
  validateSearch: (s: Record<string, unknown>) => ({
    authorization_id: typeof s.authorization_id === "string" ? s.authorization_id : "",
  }),
  beforeLoad: async ({ search, location }) => {
    if (!search.authorization_id) throw new Error("Falta authorization_id");
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      const next = location.pathname + location.searchStr;
      throw redirect({ to: "/auth", search: { next } as never });
    }
  },
  loader: async ({ location }) => {
    const authorizationId = new URLSearchParams(location.search).get("authorization_id")!;
    const { data, error } = await oauth.getAuthorizationDetails(authorizationId);
    if (error) throw new Error(error.message);
    const immediate = data?.redirect_url ?? data?.redirect_to;
    if (immediate && !data?.client) throw redirect({ href: immediate });
    return data as AuthorizationDetails;
  },
  component: Consent,
  errorComponent: ({ error }) => (
    <div className="mx-auto max-w-md p-8 text-center">
      <h1 className="text-lg font-semibold">No pudimos cargar esta autorización</h1>
      <p className="mt-2 text-sm text-muted-foreground">{String((error as Error)?.message ?? error)}</p>
    </div>
  ),
});

function Consent() {
  const details = Route.useLoaderData();
  const { authorization_id } = Route.useSearch();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const clientName = details?.client?.name ?? "una aplicación externa";

  async function decide(approve: boolean) {
    setBusy(true);
    setError(null);
    const { data, error } = approve
      ? await oauth.approveAuthorization(authorization_id)
      : await oauth.denyAuthorization(authorization_id);
    if (error) { setBusy(false); setError(error.message); return; }
    const target = data?.redirect_url ?? data?.redirect_to;
    if (!target) { setBusy(false); setError("El servidor de autorización no devolvió una URL de redirección."); return; }
    window.location.href = target;
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center p-6">
      <FixeoLogo className="h-10" />
      <div className="mt-8 w-full rounded-2xl border border-border bg-card p-6 shadow-elevated">
        <h1 className="text-xl font-bold">Conectar {clientName} a FIXEO</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          <strong>{clientName}</strong> podrá usar FIXEO en tu nombre: buscar prestadores y servicios,
          consultar tus solicitudes y crear nuevas solicitudes o cotizaciones. Puedes revocar el acceso
          desde tu cuenta en cualquier momento.
        </p>
        {error && (
          <p role="alert" className="mt-3 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</p>
        )}
        <div className="mt-6 flex gap-2">
          <Button
            type="button"
            variant="outline"
            className="flex-1 rounded-xl"
            disabled={busy}
            onClick={() => decide(false)}
          >
            Denegar
          </Button>
          <Button
            type="button"
            className="flex-1 gradient-brand rounded-xl"
            disabled={busy}
            onClick={() => decide(true)}
          >
            {busy ? "Procesando…" : "Aprobar"}
          </Button>
        </div>
      </div>
    </main>
  );
}
