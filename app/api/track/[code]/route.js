import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

export async function GET(request, { params }) {
  const pathname = new URL(request.url).pathname;
  const lastSegment = pathname.split("/").filter(Boolean).pop();

  const code = decodeURIComponent(
    (params?.code || lastSegment || "").trim()
  ).toUpperCase();

  if (!code || code === "TRACK") {
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
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ package: data || null });
}
