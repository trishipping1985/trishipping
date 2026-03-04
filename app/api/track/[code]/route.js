import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET(request, context) {
  try {
    const url = new URL(request.url);

    // Works even if Next.js doesn't pass params for some reason
    const codeFromParams = context?.params?.code;
    const codeFromPath = url.pathname.split("/").pop();
    const code = codeFromParams || codeFromPath;

    if (!code || code === "track") {
      return NextResponse.json({
        ok: false,
        error: "Missing tracking code",
        debug: {
          pathname: url.pathname,
          codeFromParams: codeFromParams ?? null,
          codeFromPath: codeFromPath ?? null,
        },
      });
    }

    const { data, error } = await supabase
      .from("packages")
      .select("*")
      .eq("tracking_code", code)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ ok: false, error: error.message });
    }

    if (!data) {
      return NextResponse.json({ ok: true, found: false, code });
    }

    return NextResponse.json({ ok: true, found: true, code, package: data });
  } catch (err) {
    return NextResponse.json({ ok: false, error: err.message });
  }
}
