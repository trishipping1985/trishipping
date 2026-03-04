import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase =
  supabaseUrl && serviceRoleKey
    ? createClient(supabaseUrl, serviceRoleKey)
    : null;

export async function GET(_request, { params }) {
  try {
    if (!supabase) {
      return NextResponse.json(
        { found: false, error: "Missing Supabase env vars" },
        { status: 500 }
      );
    }

    const code = (params?.code || "").toString().trim();

    if (!code) {
      return NextResponse.json(
        { found: false, error: "Missing tracking code" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("packages")
      .select("id, user_id, tracking_code, status, created_at")
      .eq("tracking_code", code)
      .order("created_at", { ascending: false })
      .limit(1);

    if (error) {
      return NextResponse.json(
        { found: false, error: error.message },
        { status: 500 }
      );
    }

    const pkg = data?.[0];

    if (!pkg) {
      return NextResponse.json({ found: false }, { status: 200 });
    }

    return NextResponse.json({ found: true, package: pkg }, { status: 200 });
  } catch (e) {
    return NextResponse.json(
      { found: false, error: "Server error" },
      { status: 500 }
    );
  }
}
