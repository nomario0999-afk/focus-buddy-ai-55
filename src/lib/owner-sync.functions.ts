import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const Kind = z.enum(["person", "class", "report", "pro", "request", "feedback"]);

/** Anyone using Focuser reports activity so the owner can see it from any device. */
export const reportActivity = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z
      .object({
        kind: Kind,
        ref: z.string().min(1).max(80),
        name: z.string().max(120),
        data: z.record(z.string(), z.unknown()).default({}),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const json = JSON.stringify(data.data);
    if (json.length > 20000) return { ok: false };
    await supabaseAdmin
      .from("app_activity" as never)
      .upsert(
        { kind: data.kind, ref: data.ref, name: data.name, data: data.data, updated_at: new Date().toISOString() } as never,
        { onConflict: "kind,ref" },
      );
    return { ok: true };
  });

export type ActivityRow = {
  id: string;
  kind: z.infer<typeof Kind>;
  ref: string;
  name: string;
  data: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

/** Owner only: the code is checked on the server. */
export const ownerOverview = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ code: z.string().max(60) }).parse(d))
  .handler(async ({ data }) => {
    const { OWNER_CODE } = await import("./owner-sync.server");
    if (data.code.trim().toUpperCase() !== OWNER_CODE) return { ok: false as const, json: "[]" };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error } = await supabaseAdmin
      .from("app_activity" as never)
      .select("*")
      .order("updated_at", { ascending: false })
      .limit(1000);
    if (error) throw new Error(error.message);
    return { ok: true as const, json: JSON.stringify(rows ?? []) };
  });
