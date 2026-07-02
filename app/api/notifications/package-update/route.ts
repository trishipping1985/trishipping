import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";
import fs from "fs";
import path from "path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type NotificationTokenRow = {
  id: string;
  token: string;
  platform: string | null;
};

function getReadableError(error: unknown) {
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && error !== null) {
    const value = error as { message?: string; code?: string };
    return value.message || value.code || JSON.stringify(value);
  }
  return String(error);
}

function getServiceAccount() {
  const serviceAccountFromEnv = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

  if (serviceAccountFromEnv) {
    const parsed = JSON.parse(serviceAccountFromEnv);
    if (parsed.private_key && typeof parsed.private_key === "string") {
      parsed.private_key = parsed.private_key.replace(/\\n/g, "\n");
    }
    return parsed;
  }

  const serviceAccountPath = path.join(process.cwd(), "firebase-service-account.json");

  if (!fs.existsSync(serviceAccountPath)) {
    throw new Error("Firebase service account was not found.");
  }

  const parsed = JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"));
  if (parsed.private_key && typeof parsed.private_key === "string") {
    parsed.private_key = parsed.private_key.replace(/\\n/g, "\n");
  }

  return parsed;
}

function getFirebaseAdminApp() {
  if (getApps().length > 0) return getApps()[0];

  const serviceAccount = getServiceAccount();

  return initializeApp({
    credential: cert(serviceAccount),
    projectId: serviceAccount.project_id,
  });
}

export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        { error: "Supabase environment variables are missing." },
        { status: 500 }
      );
    }

    const body = await request.json().catch(() => null);

    const userId = String(body?.userId || "").trim();
    const trackingCode = String(body?.trackingCode || "N/A").trim();
    const status = String(body?.status || "Updated").trim();

    if (!userId) {
      return NextResponse.json(
        { error: "Missing package user ID." },
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    const { data: tokenRows, error: tokenError } = await supabase
      .from("notification_tokens")
      .select("id, token, platform")
      .eq("user_id", userId);

    if (tokenError) {
      return NextResponse.json(
        { error: `Notification token lookup failed: ${tokenError.message}` },
        { status: 500 }
      );
    }

    const tokens = ((tokenRows || []) as NotificationTokenRow[]).filter(
      (row) => typeof row.token === "string" && row.token.trim().length > 0
    );

    if (tokens.length === 0) {
      return NextResponse.json(
        { success: false, message: "No notification tokens found for this package user." },
        { status: 200 }
      );
    }

    const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://trishipping.info").replace(/\/$/, "");

    const title = "TRI Shipping Update";
    const message = `Shipment ${trackingCode} is now ${status}.`;

    const app = getFirebaseAdminApp();

    const messages = tokens.map((row) => ({
      token: row.token,
      notification: {
        title,
        body: message,
      },
      data: {
        type: "package-update",
        title,
        body: message,
        url: "/dashboard",
        trackingCode,
        status,
      },
      android: {
        priority: "high" as const,
        notification: {
          title,
          body: message,
          sound: "default",
          channelId: "default",
        },
      },
      webpush: {
        fcmOptions: {
          link: `${siteUrl}/dashboard`,
        },
        notification: {
          icon: `${siteUrl}/trilogo.png`,
          badge: `${siteUrl}/trilogo.png`,
        },
      },
    }));

    const result = await getMessaging(app).sendEach(messages);

    return NextResponse.json({
      success: result.successCount > 0,
      message: `Push sent to ${result.successCount} of ${tokens.length} saved device(s).`,
      successCount: result.successCount,
      failureCount: result.failureCount,
    });
  } catch (error) {
    console.error("Package update push error:", error);

    return NextResponse.json(
      { error: `Failed to send package push: ${getReadableError(error)}` },
      { status: 500 }
    );
  }
}
