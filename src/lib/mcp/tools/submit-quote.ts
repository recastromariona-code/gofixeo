import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser, textResult, errorResult } from "../supabase";

export default defineTool({
  name: "submit_quote",
  title: "Enviar cotización a una solicitud",
  description:
    "Como prestador autenticado, envía una propuesta económica a una solicitud abierta. Las RLS de FIXEO validan que la solicitud sea compatible con tus categorías.",
  inputSchema: {
    request_id: z.string().uuid().describe("ID de la solicitud (obtenido con list_open_requests)."),
    amount: z.number().positive().describe("Monto propuesto (en moneda del prestador)."),
    message: z.string().min(5).describe("Mensaje al comprador explicando la propuesta."),
    estimated_days: z.number().int().positive().optional().describe("Días estimados para completar."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async ({ request_id, amount, message, estimated_days }, ctx) => {
    if (!ctx.isAuthenticated()) return errorResult("Debes estar autenticado como prestador.");
    if (!request_id || amount == null || !message) return errorResult("Faltan parámetros obligatorios.");
    const sb = supabaseForUser(ctx);
    const { data, error } = await sb
      .from("quotes")
      .insert({
        request_id,
        provider_id: ctx.getUserId(),
        amount,
        notes: message,
        estimated_days: estimated_days ?? null,
      })
      .select("id, amount, created_at")
      .single();
    if (error) return errorResult(error.message);
    return textResult({ quote: data, message: "Cotización enviada." }, { quote_id: data.id });
  },
});
