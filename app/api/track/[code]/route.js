import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
});

export async function GET(req, context) {
  try {
    // ✅ Next.js dynamic param
    let code = context?.params?.code;

    // ✅ Fallback (in case params is not passed for any reason)
    if (!code) {
      const path = new URL(req.url).pathname; // /api/track/TRI-001
      code = path.split("/").pop();
    }

    if (!code || code === "track") {
      return NextResponse.json(
        { ok: false, error: "Missing tracking code" },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("packages")
      .select("id, user_id, tracking_code, status, created_at")
      .eq("tracking_code", code)
      .order("created_at", { ascending: false })
      .limit(1);

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 }
      );
    }

    if (!data || data.length === 0) {
      return NextResponse.json(
        { ok: true, found: false, trackingCode: code },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { ok: true, found: true, trackingCode: code, package: data[0] },
      { status: 200 }
    );
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Server error" },
      { status: 500 }
    );
  }
}
