import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET(req, { params }) {
  const code = decodeURIComponent(params.code || "").trim();

  if (!code) {
    return NextResponse.json(
      { ok: false, error: "Missing tracking code" },
      { status: 400 }
    );
  }

  const { data, error } = await supabaseAdmin
    .from("packages")
    .select("id, tracking_code, status, created_at, user_id")
    .eq("tracking_code", code)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ ok: true, found: false, code }, { status: 200 });
  }

  return NextResponse.json({ ok: true, found: true, code, package: data }, { status: 200 });
}
