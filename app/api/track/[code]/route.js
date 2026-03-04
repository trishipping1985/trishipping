import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET(request, { params }) {
  try {
    const code = params.code;

    if (!code) {
      return NextResponse.json({
        ok: false,
        error: "Missing tracking code",
      });
    }

    const { data, error } = await supabase
      .from("packages")
      .select("*")
      .eq("tracking_code", code)
      .limit(1)
      .single();

    if (error || !data) {
      return NextResponse.json({
        ok: true,
        found: false,
      });
    }

    return NextResponse.json({
      ok: true,
      found: true,
      package: data,
    });

  } catch (err) {
    return NextResponse.json({
      ok: false,
      error: err.message,
    });
  }
}
