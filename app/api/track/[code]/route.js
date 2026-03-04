import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(req, ctx) {
  try {
    // 1) Try Next params
    let code = ctx?.params?.code;

    // 2) Fallback: try query string ?code=TRI-001
    if (!code) {
      code = req.nextUrl?.searchParams?.get("code");
    }

    // 3) Fallback: parse last URL segment /api/track/TRI-001
    if (!code) {
      const pathname = req.nextUrl?.pathname || "";
      const parts = pathname.split("/").filter(Boolean);
      code = parts[parts.length - 1]; // last segment
      // if last segment is literally "track", then it means no code
      if (code === "track") code = null;
    }

    if (!code) {
      return NextResponse.json(
        { ok: false, error: "Missing tracking code" },
        { status: 400 }
      );
    }

    const supabaseUrl =
      process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { ok: false, error: "Missing Supabase env vars" },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    const { data, error } = await supabase
      .from("packages")
      .select("id, user_id, tracking_code, status, created_at")
      .eq("tracking_code", code)
      .order("created_at", { ascending: false })
      .limit(1);

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    const row = data?.[0] || null;

    if (!row) {
      return NextResponse.json({ ok: true, found: false }, { status: 200 });
    }

    return NextResponse.json({ ok: true, found: true, package: row }, { status: 200 });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Server error" },
      { status: 500 }
    );
  }
}
