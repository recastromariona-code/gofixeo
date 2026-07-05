import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listCategoriesTool from "./tools/list-categories";
import searchProvidersTool from "./tools/search-providers";
import searchServicesTool from "./tools/search-services";
import listMyRequestsTool from "./tools/list-my-requests";
import listOpenRequestsTool from "./tools/list-open-requests";
import createQuoteRequestTool from "./tools/create-quote-request";
import submitQuoteTool from "./tools/submit-quote";

// Direct Supabase host (RFC 8414 issuer must match discovery doc). Read the
// project ref via VITE_ so Vite inlines it at build time; the fallback keeps
// the issuer well-formed during the manifest-extract eval.
const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "fixeo-mcp",
  title: "FIXEO — Servicios del hogar",
  version: "0.1.0",
  instructions:
    "Herramientas para FIXEO, el marketplace de servicios del hogar. Los prestadores publican servicios y los compradores publican solicitudes de cotización. Usa list_categories para obtener slugs válidos; search_providers y search_services son públicos; list_my_requests, list_open_requests, create_quote_request y submit_quote requieren autenticación del usuario y respetan sus permisos (RLS).",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [
    listCategoriesTool,
    searchProvidersTool,
    searchServicesTool,
    listMyRequestsTool,
    listOpenRequestsTool,
    createQuoteRequestTool,
    submitQuoteTool,
  ],
});
