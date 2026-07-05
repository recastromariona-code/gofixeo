import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser, textResult, errorResult } from "../supabase";

export default defineTool({
  name: "create_quote_request",
  title: "Crear solicitud de cotización",
  description:
    "Crea una nueva solicitud de cotización en FIXEO en nombre del usuario autenticado (comprador). Los prestadores que coincidan podrán enviar propuestas.",
  inputSchema: {
    title: z.string().min(3).describe("Título breve del trabajo."),
    description: z.string().min(10).describe("Descripción detallada del trabajo requerido."),
    category: z.string().describe("Slug de la categoría (usa list_categories)."),
    city: z.string().describe("Ciudad donde se realizará el trabajo."),
    address: z.string().optional(),
    urgency: z.enum(["low", "medium", "high"]).optional().describe("Nivel de urgencia (por defecto medium)."),
    budget_min: z.number().nonnegative().optional(),
    budget_max: z.number().nonnegative().optional(),
    preferred_date: z.string().optional().describe("Fecha preferida en formato ISO (YYYY-MM-DD)."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async (input, ctx) => {
    if (!ctx.isAuthenticated()) return errorResult("Debes estar autenticado para crear una solicitud.");
    const userId = ctx.getUserId();
    if (!userId) return errorResult("No pudimos identificar tu usuario.");
    const sb = supabaseForUser(ctx);

    const { data: cat, error: catErr } = await sb
      .from("categories")
      .select("id")
      .eq("slug", input.category)
      .maybeSingle();
    if (catErr) return errorResult(catErr.message);
    if (!cat) return errorResult(`Categoría '${input.category}' no encontrada. Usa list_categories.`);

    const { data, error } = await sb
      .from("quote_requests")
      .insert({
        client_id: userId,
        category_id: cat.id,
        title: input.title,
        description: input.description,
        city: input.city,
        address: input.address ?? null,
        urgency: input.urgency ?? "medium",
        budget_min: input.budget_min ?? null,
        budget_max: input.budget_max ?? null,
        preferred_date: input.preferred_date ?? null,
        status: "pending",
      })
      .select("id, title, status, created_at")
      .single();

    if (error) return errorResult(error.message);
    return textResult(
      { request: data, message: "Solicitud creada. Los prestadores compatibles ya pueden enviar cotizaciones." },
      { request_id: data.id },
    );
  },
});
