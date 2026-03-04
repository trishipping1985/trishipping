import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

export async function GET(_req, { params }) {
  try {
    const code = params?.code;

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
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { ok: true, found: false, tracking_code: code },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { ok: true, found: true, package: data },
      { status: 200 }
    );
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Server error" },
      { status: 500 }
    );
  }
}
