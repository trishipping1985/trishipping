import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { cert, getApps, initializeApp, type ServiceAccount } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";

export const runtime = "nodejs";

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing Supabase environment variables");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function getFirebaseCredential() {
  const serviceAccountJson =
    process.env.FIREBASE_SERVICE_ACCOUNT_KEY ||
    process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT;

  if (serviceAccountJson) {
    const parsed = JSON.parse(serviceAccountJson);

    if (parsed.private_key) {
      parsed.private_key = parsed.private_key.replace(/\\n/g, "\n");
    }

    return cert(parsed as ServiceAccount);
  }

  const projectId =
    process.env.FIREBASE_PROJECT_ID ||
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error("Missing Firebase Admin environment variables");
  }

  return cert({
    projectId,
    clientEmail,
    privateKey,
  });
}

function getFirebaseMessaging() {
  const app = getApps().length
    ? getApps()[0]
    : initializeApp({
        credential: getFirebaseCredential(),
      });

  return getMessaging(app);
}

function isInvalidFcmTokenError(code?: string) {
  return (
    code === "messaging/registration-token-not-registered" ||
    code === "messaging/invalid-registration-token"
  );
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const packageIds = Array.isArray(body.packageIds) ? body.packageIds : [];
    const status = String(body.status || "");

    if (packageIds.length === 0 || !status) {
      return NextResponse.json(
        { error: "Missing packageIds or status" },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    const { data: packages, error: packagesError } = await supabase
      .from("packages")
      .select("id, user_id, tracking_code")
      .in("id", packageIds);

    if (packagesError) {
      throw packagesError;
    }

    const userIds = Array.from(
      new Set((packages || []).map((pkg) => pkg.user_id).filter(Boolean))
    );

    if (userIds.length === 0) {
      return NextResponse.json({
        success: true,
        sent: 0,
        skipped: true,
        reason: "No package users found",
      });
    }

    const { data: tokenRows, error: tokenError } = await supabase
      .from("notification_tokens")
      .select("token, user_id")
      .in("user_id", userIds)
      .eq("platform", "android");

    if (tokenError) {
      throw tokenError;
    }

    const tokens = Array.from(
      new Set((tokenRows || []).map((row) => row.token).filter(Boolean))
    );

    if (tokens.length === 0) {
      return NextResponse.json({
        success: true,
        sent: 0,
        skipped: true,
        reason: "No Android tokens found",
      });
    }

    const messaging = getFirebaseMessaging();

    const response = await messaging.sendEachForMulticast({
      tokens,
      notification: {
        title: "TRI Shipping",
        body: "Your shipment status was updated to " + status + ".",
      },
      data: {
        type: "package_status_update",
        status,
      },
      android: {
        priority: "high",
        notification: {
          sound: "default",
        },
      },
    });

    const invalidTokens: string[] = [];

    response.responses.forEach((result, index) => {
      if (!result.success && isInvalidFcmTokenError(result.error?.code)) {
        invalidTokens.push(tokens[index]);
      }
    });

    if (invalidTokens.length > 0) {
      await supabase
        .from("notification_tokens")
        .delete()
        .in("token", invalidTokens);
    }

    return NextResponse.json({
      success: true,
      sent: response.successCount,
      failed: response.failureCount,
      invalidTokensRemoved: invalidTokens.length,
    });
  } catch (error) {
    console.error("[package-status-android-push] failed", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Android push failed",
      },
      { status: 500 }
    );
  }
}
