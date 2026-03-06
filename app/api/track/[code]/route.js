import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(request, { params }) {
  const code = params.code?.toUpperCase();

  if (!code) {
    return NextResponse.json(
      { error: "Missing tracking code" },
      { status: 400 }
    );
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { data, error } = await supabase
    .from("packages")
    .select("*")
    .eq("tracking_code", code)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ package: data || null });
}
