import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createHash, randomInt } from "crypto";
import { z } from "zod";

function normalize(phone: string) {
  return phone.replace(/[^0-9]/g, "");
}
function hashCode(code: string) {
  return createHash("sha256").update(code).digest("hex");
}

// Generates a 6-digit code, stores its hash, and dispatches it to n8n so it can
// send the WhatsApp message. The user proves ownership by returning the code.
export const requestPhoneCode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { phone: string }) => z.object({ phone: z.string().min(6) }).parse(d))
  .handler(async ({ data, context }) => {
    const norm = normalize(data.phone);
    if (norm.length < 6) throw new Error("Número inválido");

    // Prevent hijacking an already-verified number owned by someone else.
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: clash } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("phone_normalized", norm)
      .not("phone_verified_at", "is", null)
      .neq("id", context.userId)
      .maybeSingle();
    if (clash) throw new Error("Ese número ya está verificado por otra cuenta.");

    const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
    const expiresAt = new Date(Date.now() + 10 * 60_000).toISOString();

    const { error } = await supabaseAdmin.from("phone_verification_codes").insert({
      user_id: context.userId,
      phone_normalized: norm,
      code_hash: hashCode(code),
      expires_at: expiresAt,
    });
    if (error) throw new Error(error.message);

    // Also save the (unverified) phone on the profile so the UI reflects it.
    await supabaseAdmin.from("profiles").update({ phone: data.phone }).eq("id", context.userId);

    // Forward to n8n so it can WhatsApp the code. In dev n8n webhook may not
    // exist yet — swallow that so the profile flow still works and log the
    // code server-side.
    const webhookUrl = process.env.N8N_SEND_CODE_WEBHOOK_URL;
    let dispatched = false;
    if (webhookUrl) {
      try {
        const res = await fetch(webhookUrl, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-fixeo-secret": process.env.N8N_WEBHOOK_SECRET ?? "",
          },
          body: JSON.stringify({ phone: data.phone, code }),
        });
        dispatched = res.ok;
      } catch (e) {
        console.error("n8n send-code webhook failed", e);
      }
    } else {
      console.log(`[dev] Verification code for ${data.phone}: ${code}`);
    }
    return { ok: true as const, dispatched, expiresAt };
  });

export const confirmPhoneCode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { code: string }) => z.object({ code: z.string().length(6) }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("phone_verification_codes")
      .select("id, code_hash, expires_at, consumed_at, attempts, phone_normalized")
      .eq("user_id", context.userId)
      .is("consumed_at", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) throw new Error("No hay código pendiente. Solicita uno nuevo.");
    if (new Date(row.expires_at) < new Date()) throw new Error("El código expiró. Solicita uno nuevo.");
    if (row.attempts >= 5) throw new Error("Demasiados intentos. Solicita un código nuevo.");

    const match = hashCode(data.code) === row.code_hash;
    if (!match) {
      await supabaseAdmin
        .from("phone_verification_codes")
        .update({ attempts: row.attempts + 1 })
        .eq("id", row.id);
      throw new Error("Código incorrecto.");
    }

    await supabaseAdmin
      .from("phone_verification_codes")
      .update({ consumed_at: new Date().toISOString() })
      .eq("id", row.id);
    const { error: uErr } = await supabaseAdmin
      .from("profiles")
      .update({ phone_verified_at: new Date().toISOString() })
      .eq("id", context.userId);
    if (uErr) throw new Error(uErr.message);
    return { ok: true as const };
  });
