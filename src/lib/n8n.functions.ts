import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

// Fire-and-forget notification to n8n so it can WhatsApp matching providers.
// Failures are swallowed — the request is already saved in the DB.
export const notifyNewRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: {
    request_id: string;
    title: string;
    category: string;
    city: string;
    urgency: string;
  }) =>
    z
      .object({
        request_id: z.string().uuid(),
        title: z.string(),
        category: z.string(),
        city: z.string(),
        urgency: z.string(),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const url = process.env.N8N_NEW_REQUEST_WEBHOOK_URL;
    if (!url) return { ok: false as const, reason: "no_webhook_url" };
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-fixeo-secret": process.env.N8N_WEBHOOK_SECRET ?? "",
        },
        body: JSON.stringify(data),
      });
      return { ok: res.ok };
    } catch (e) {
      console.error("n8n new-request webhook failed", e);
      return { ok: false as const, reason: "fetch_failed" };
    }
  });
