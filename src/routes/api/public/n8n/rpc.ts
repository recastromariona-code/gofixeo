import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { z } from "zod";

// Single endpoint that n8n calls with `{ action, ... }` bodies.
// Auth: Bearer <N8N_INBOUND_SECRET>.
// Any action that mutates or reads private user data requires `phone` (E.164 or
// digits) of a *verified* profile — we resolve the user by matching
// public.normalize_phone(phone) against profiles.phone_normalized with
// phone_verified_at IS NOT NULL.

const JSON_HEADERS = { "content-type": "application/json" };

function ok(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), { ...init, headers: { ...JSON_HEADERS, ...(init.headers ?? {}) } });
}
function bad(status: number, message: string, extra?: Record<string, unknown>) {
  return ok({ ok: false, error: message, ...(extra ?? {}) }, { status });
}
function normalize(phone: string) {
  return phone.replace(/[^0-9]/g, "");
}

function admin() {
  return createClient<Database>(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function resolveVerified(sb: ReturnType<typeof admin>, phone: string) {
  const norm = normalize(phone);
  if (!norm) return null;
  const { data } = await sb
    .from("profiles")
    .select("id, full_name, role, city, phone, phone_verified_at")
    .eq("phone_normalized", norm)
    .not("phone_verified_at", "is", null)
    .maybeSingle();
  return data ?? null;
}

const bodySchema = z.object({ action: z.string().min(1) }).passthrough();

export const Route = createFileRoute("/api/public/n8n/rpc")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        // Bearer auth
        const auth = request.headers.get("authorization") ?? "";
        const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
        const expected = process.env.N8N_INBOUND_SECRET;
        if (!expected || token !== expected) return bad(401, "unauthorized");

        let raw: unknown;
        try {
          raw = await request.json();
        } catch {
          return bad(400, "invalid_json");
        }
        const parsed = bodySchema.safeParse(raw);
        if (!parsed.success) return bad(400, "invalid_body");
        const body = parsed.data as Record<string, unknown> & { action: string };
        const sb = admin();

        try {
          switch (body.action) {
            // ── Public reads ───────────────────────────────────────────
            case "list_categories": {
              const { data } = await sb.from("categories").select("slug, name").order("sort_order");
              return ok({ ok: true, categories: data ?? [] });
            }

            case "search_services": {
              const q = (body.query as string | undefined)?.trim();
              const cat = body.category as string | undefined;
              let query = sb
                .from("services")
                .select(
                  "id, title, description, starting_price, providers!inner(id, profiles!providers_id_fkey!inner(full_name, city)), categories(slug, name)",
                )
                .eq("is_active", true)
                .limit(20);
              if (cat) {
                const { data: c } = await sb.from("categories").select("id").eq("slug", cat).maybeSingle();
                if (c) query = query.eq("category_id", c.id);
              }
              const { data } = await query;
              let rows = data ?? [];
              if (q) {
                const n = q.toLowerCase();
                rows = rows.filter(
                  (r) =>
                    (r.title ?? "").toLowerCase().includes(n) ||
                    (r.description ?? "").toLowerCase().includes(n),
                );
              }
              return ok({ ok: true, services: rows });
            }

            case "search_providers": {
              const q = (body.query as string | undefined)?.trim();
              const cat = body.category as string | undefined;
              let ids: string[] | null = null;
              if (cat) {
                const { data: c } = await sb.from("categories").select("id").eq("slug", cat).maybeSingle();
                if (c) {
                  const { data: pcs } = await sb
                    .from("provider_categories")
                    .select("provider_id")
                    .eq("category_id", c.id);
                  ids = (pcs ?? []).map((p) => p.provider_id);
                  if (ids.length === 0) return ok({ ok: true, providers: [] });
                }
              }
              let query = sb
                .from("providers")
                .select("id, bio, rating, reviews_count, headline, profiles!providers_id_fkey!inner(full_name, city)")
                .order("rating", { ascending: false })
                .limit(20);
              if (ids) query = query.in("id", ids);
              const { data } = await query;
              let rows = data ?? [];
              if (q) {
                const n = q.toLowerCase();
                rows = rows.filter(
                  (r) =>
                    (r.bio ?? "").toLowerCase().includes(n) ||
                    (r.profiles?.full_name ?? "").toLowerCase().includes(n),
                );
              }
              return ok({ ok: true, providers: rows });
            }

            case "list_open_requests": {
              const cat = body.category as string | undefined;
              let query = sb
                .from("quote_requests")
                .select("id, title, description, city, urgency, budget_min, budget_max, preferred_date, created_at, categories(slug, name)")
                .is("provider_id", null)
                .in("status", ["pending", "quoted"])
                .order("created_at", { ascending: false })
                .limit(20);
              if (cat) {
                const { data: c } = await sb.from("categories").select("id").eq("slug", cat).maybeSingle();
                if (c) query = query.eq("category_id", c.id);
              }
              const { data } = await query;
              return ok({ ok: true, requests: data ?? [] });
            }

            // ── Identity ───────────────────────────────────────────────
            case "lookup": {
              const phone = body.phone as string | undefined;
              if (!phone) return bad(400, "missing_phone");
              const profile = await resolveVerified(sb, phone);
              if (!profile) return ok({ ok: true, found: false });
              return ok({
                ok: true,
                found: true,
                user: {
                  id: profile.id,
                  full_name: profile.full_name,
                  role: profile.role,
                  city: profile.city,
                },
              });
            }

            // ── Authenticated by verified phone ────────────────────────
            case "my_requests": {
              const phone = body.phone as string | undefined;
              if (!phone) return bad(400, "missing_phone");
              const me = await resolveVerified(sb, phone);
              if (!me) return bad(403, "phone_not_verified");
              const { data } = await sb
                .from("quote_requests")
                .select("id, title, status, city, urgency, created_at, categories(name), quotes(count)")
                .eq("client_id", me.id)
                .order("created_at", { ascending: false })
                .limit(20);
              return ok({ ok: true, requests: data ?? [] });
            }

            case "my_quotes": {
              const phone = body.phone as string | undefined;
              if (!phone) return bad(400, "missing_phone");
              const me = await resolveVerified(sb, phone);
              if (!me) return bad(403, "phone_not_verified");
              if (me.role !== "provider") return bad(403, "not_a_provider");
              const { data } = await sb
                .from("quotes")
                .select("id, amount, notes, estimated_days, created_at, quote_requests(id, title, status)")
                .eq("provider_id", me.id)
                .order("created_at", { ascending: false })
                .limit(20);
              return ok({ ok: true, quotes: data ?? [] });
            }

            case "create_request": {
              const schema = z.object({
                phone: z.string(),
                title: z.string().min(3),
                description: z.string().min(10),
                category: z.string(),
                city: z.string(),
                urgency: z.enum(["low", "medium", "high"]).optional(),
                budget_min: z.number().nonnegative().optional(),
                budget_max: z.number().nonnegative().optional(),
                preferred_date: z.string().optional(),
              });
              const p = schema.safeParse(body);
              if (!p.success) return bad(400, "invalid_input", { issues: p.error.issues });
              const me = await resolveVerified(sb, p.data.phone);
              if (!me) return bad(403, "phone_not_verified");
              if (me.role !== "client") return bad(403, "not_a_client");
              const { data: cat } = await sb.from("categories").select("id").eq("slug", p.data.category).maybeSingle();
              if (!cat) return bad(400, "unknown_category");
              const { data, error } = await sb
                .from("quote_requests")
                .insert({
                  client_id: me.id,
                  category_id: cat.id,
                  title: p.data.title,
                  description: p.data.description,
                  city: p.data.city,
                  urgency: p.data.urgency ?? "medium",
                  budget_min: p.data.budget_min ?? null,
                  budget_max: p.data.budget_max ?? null,
                  preferred_date: p.data.preferred_date ?? null,
                  status: "pending",
                })
                .select("id, title, status")
                .single();
              if (error) return bad(500, error.message);
              // Fire-and-forget: avisar a proveedores por WhatsApp
              const notifyUrl = process.env.N8N_NEW_REQUEST_WEBHOOK_URL;
              if (notifyUrl) {
                fetch(notifyUrl, {
                  method: "POST",
                  headers: {
                    "content-type": "application/json",
                    "x-fixeo-secret": process.env.N8N_WEBHOOK_SECRET ?? "",
                  },
                  body: JSON.stringify({
                    request_id: data.id,
                    title: p.data.title,
                    category: p.data.category,
                    city: p.data.city,
                    urgency: p.data.urgency ?? "medium",
                  }),
                }).catch((e) => console.error("notify new_request failed", e));
              }
              return ok({ ok: true, request: data });
            }

            case "create_quote": {
              const schema = z.object({
                phone: z.string(),
                request_id: z.string().uuid(),
                amount: z.number().positive(),
                notes: z.string().optional(),
                estimated_days: z.number().int().positive().optional(),
              });
              const p = schema.safeParse(body);
              if (!p.success) return bad(400, "invalid_input", { issues: p.error.issues });
              const me = await resolveVerified(sb, p.data.phone);
              if (!me) return bad(403, "phone_not_verified");
              if (me.role !== "provider") return bad(403, "not_a_provider");
              const { data, error } = await sb
                .from("quotes")
                .insert({
                  request_id: p.data.request_id,
                  provider_id: me.id,
                  amount: p.data.amount,
                  notes: p.data.notes ?? null,
                  estimated_days: p.data.estimated_days ?? null,
                })
                .select("id, amount, created_at")
                .single();
              if (error) return bad(500, error.message);
              return ok({ ok: true, quote: data });
            }

            case "update_profile": {
              const schema = z.object({
                phone: z.string(),
                full_name: z.string().min(2).max(100).optional(),
                city: z.string().max(80).optional(),
                bio: z.string().max(500).optional(),
              });
              const p = schema.safeParse(body);
              if (!p.success) return bad(400, "invalid_input", { issues: p.error.issues });
              const me = await resolveVerified(sb, p.data.phone);
              if (!me) return bad(403, "phone_not_verified");
              const upd: { full_name?: string; city?: string } = {};
              if (p.data.full_name !== undefined) upd.full_name = p.data.full_name;
              if (p.data.city !== undefined) upd.city = p.data.city;
              if (Object.keys(upd).length) {
                const { error } = await sb.from("profiles").update(upd).eq("id", me.id);
                if (error) return bad(500, error.message);
              }
              if (p.data.bio !== undefined && me.role === "provider") {
                const { error } = await sb.from("providers").update({ bio: p.data.bio }).eq("id", me.id);
                if (error) return bad(500, error.message);
              }
              return ok({ ok: true });
            }

            case "signup": {
              // Onboarding directly from WhatsApp: n8n has already confirmed
              // the phone belongs to the sender, so we create the auth user
              // and mark the phone as verified in one step.
              const schema = z.object({
                phone: z.string().min(6),
                full_name: z.string().min(2),
                role: z.enum(["client", "provider"]),
                email: z.string().email().optional(),
              });
              const p = schema.safeParse(body);
              if (!p.success) return bad(400, "invalid_input", { issues: p.error.issues });
              const norm = normalize(p.data.phone);
              // If already linked, just return it.
              const existing = await resolveVerified(sb, p.data.phone);
              if (existing) return ok({ ok: true, user: { id: existing.id, role: existing.role }, existed: true });

              const email = p.data.email ?? `wa_${norm}@wa.fixeo.local`;
              const password = crypto.randomUUID() + crypto.randomUUID();
              const { data: created, error: cErr } = await sb.auth.admin.createUser({
                email,
                password,
                email_confirm: true,
                user_metadata: { full_name: p.data.full_name, role: p.data.role },
              });
              if (cErr || !created.user) return bad(500, cErr?.message ?? "create_user_failed");
              // handle_new_user trigger inserts a profile row; now enrich it.
              const { error: uErr } = await sb
                .from("profiles")
                .update({
                  full_name: p.data.full_name,
                  phone: p.data.phone,
                  role: p.data.role,
                  phone_verified_at: new Date().toISOString(),
                })
                .eq("id", created.user.id);
              if (uErr) return bad(500, uErr.message);
              if (p.data.role === "provider") {
                await sb.from("providers").insert({ id: created.user.id }).select().maybeSingle();
              }
              return ok({ ok: true, user: { id: created.user.id, role: p.data.role }, existed: false });
            }

            default:
              return bad(400, "unknown_action");
          }
        } catch (e) {
          console.error("n8n rpc error", body.action, e);
          return bad(500, "internal_error");
        }
      },
      OPTIONS: async () =>
        new Response(null, {
          status: 204,
          headers: {
            "access-control-allow-origin": "*",
            "access-control-allow-headers": "authorization, content-type",
            "access-control-allow-methods": "POST, OPTIONS",
          },
        }),
    },
  },
});
