import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

function json(data, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

export async function GET(req, { params }) {
  const url = new URL(req.url);
  const raw =
    params?.code ||
    url.searchParams.get("code") ||
    url.searchParams.get("tracking_code") ||
    "";

  const code = decodeURIComponent(raw).trim().toUpperCase();

  if (!code) return json({ ok: false, error: "Missing tracking code" }, 400);

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  );

  const { data, error } = await supabase
    .from("packages")
    .select("id,user_id,tracking_code,status,created_at")
    .eq("tracking_code", code)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) return json({ ok: false, error: error.message }, 500);
  if (!data) return json({ ok: true, found: false }, 200);

  return json({ ok: true, found: true, package: data }, 200);
}
