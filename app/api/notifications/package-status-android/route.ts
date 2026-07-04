import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { cert, getApps, initializeApp, type ServiceAccount } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";

export const runtime = "nodejs";

type PackageRow = {
  id: string;
  user_id: string | null;
  tracking_code: string | null;
};

type TokenRow = {
  token: string | null;
  user_id: string | null;
};

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
    process.env.FIREBASE_SERVICE_ACCOUNT_JSON ||
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

function uniqueValues(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

function buildNotificationBody(codes: string[], status: string) {
  const cleanCodes = uniqueValues(codes);

  if (cleanCodes.length === 0) {
    return `Your shipment status was updated to ${status}.`;
  }

  if (cleanCodes.length <= 3) {
    return `${cleanCodes.join(", ")} status updated to ${status}.`;
  }

  const firstThree = cleanCodes.slice(0, 3).join(", ");
  const remaining = cleanCodes.length - 3;

  return `${firstThree} + ${remaining} more status updated to ${status}.`;
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

    console.log("[package-status-android-push] started", {
      packageIds,
      status,
    });

    const { data: packages, error: packagesError } = await supabase
      .from("packages")
      .select("id, user_id, tracking_code")
      .in("id", packageIds);

    if (packagesError) {
      throw packagesError;
    }

    const packageRows = (packages || []) as PackageRow[];

    const packagesByUser = new Map<string, PackageRow[]>();

    for (const pkg of packageRows) {
      if (!pkg.user_id) continue;

      const existing = packagesByUser.get(pkg.user_id) || [];
      existing.push(pkg);
      packagesByUser.set(pkg.user_id, existing);
    }

    const userIds = Array.from(packagesByUser.keys());

    console.log("[package-status-android-push] package users", {
      packageCount: packageRows.length,
      userIds,
    });

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

    const tokensByUser = new Map<string, string[]>();

    for (const row of ((tokenRows || []) as TokenRow[])) {
      if (!row.user_id || !row.token) continue;

      const existing = tokensByUser.get(row.user_id) || [];
      existing.push(row.token);
      tokensByUser.set(row.user_id, existing);
    }

    const allTokens = uniqueValues(
      Array.from(tokensByUser.values()).flat()
    );

    console.log("[package-status-android-push] android tokens", {
      tokenCount: allTokens.length,
      usersWithTokens: tokensByUser.size,
    });

    if (allTokens.length === 0) {
      return NextResponse.json({
        success: true,
        sent: 0,
        skipped: true,
        reason: "No Android tokens found",
      });
    }

    const messaging = getFirebaseMessaging();

    let totalSent = 0;
    let totalFailed = 0;
    const invalidTokens: string[] = [];
    const firebaseErrors: string[] = [];

    for (const userId of userIds) {
      const userTokens = uniqueValues(tokensByUser.get(userId) || []);
      const userPackages = packagesByUser.get(userId) || [];

      if (userTokens.length === 0 || userPackages.length === 0) continue;

      const trackingCodes = userPackages
        .map((pkg) => pkg.tracking_code || "")
        .filter(Boolean);

      const notificationBody = buildNotificationBody(trackingCodes, status);

      const response = await messaging.sendEachForMulticast({
        tokens: userTokens,
        notification: {
          title: "TRI Shipping",
          body: notificationBody,
        },
        data: {
          type: "package_status_update",
          status,
          package_ids: userPackages.map((pkg) => pkg.id).join(","),
          tracking_codes: trackingCodes.join(","),
        },
        android: {
          priority: "high",
          notification: {
            sound: "default",
          },
        },
      });

      totalSent += response.successCount;
      totalFailed += response.failureCount;

      response.responses.forEach((result, index) => {
        if (!result.success) {
          const errorCode = result.error?.code || result.error?.message || "Unknown Firebase error";
          firebaseErrors.push(errorCode);

          if (isInvalidFcmTokenError(result.error?.code)) {
            invalidTokens.push(userTokens[index]);
          }
        }
      });
    }

    if (invalidTokens.length > 0) {
      await supabase
        .from("notification_tokens")
        .delete()
        .in("token", uniqueValues(invalidTokens));
    }

    console.log("[package-status-android-push] firebase result", {
      sent: totalSent,
      failed: totalFailed,
      invalidTokensRemoved: uniqueValues(invalidTokens).length,
      errors: firebaseErrors,
    });

    return NextResponse.json({
      success: true,
      sent: totalSent,
      failed: totalFailed,
      invalidTokensRemoved: uniqueValues(invalidTokens).length,
      errors: firebaseErrors,
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
