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
  updated_at: string | null;
};

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getReadableError(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "object" && error !== null) {
    const value = error as { code?: string; message?: string };
    return value.message || value.code || JSON.stringify(value);
  }

  return String(error);
}

function getServiceAccount() {
  const serviceAccountFromEnv = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

  if (serviceAccountFromEnv) {
    try {
      const parsed = JSON.parse(serviceAccountFromEnv);

      if (parsed.private_key && typeof parsed.private_key === "string") {
        parsed.private_key = parsed.private_key.replace(/\\n/g, "\n");
      }

      return parsed;
    } catch (error) {
      throw new Error(
        `FIREBASE_SERVICE_ACCOUNT_JSON is not valid JSON: ${getReadableError(
          error
        )}`
      );
    }
  }

  const serviceAccountPath = path.join(
    process.cwd(),
    "firebase-service-account.json"
  );

  if (!fs.existsSync(serviceAccountPath)) {
    throw new Error(
      "Firebase service account was not found. Add FIREBASE_SERVICE_ACCOUNT_JSON in Vercel."
    );
  }

  const parsed = JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"));

  if (parsed.private_key && typeof parsed.private_key === "string") {
    parsed.private_key = parsed.private_key.replace(/\\n/g, "\n");
  }

  return parsed;
}

function getFirebaseAdminApp() {
  if (getApps().length > 0) {
    return getApps()[0];
  }

  const serviceAccount = getServiceAccount();

  return initializeApp({
    credential: cert(serviceAccount),
    projectId: serviceAccount.project_id,
  });
}

function summarizePlatforms(tokens: NotificationTokenRow[]) {
  return tokens.reduce<Record<string, number>>((summary, row) => {
    const platform = row.platform || "unknown";
    summary[platform] = (summary[platform] || 0) + 1;
    return summary;
  }, {});
}

function chooseTokensForTest(tokens: NotificationTokenRow[]) {
  const androidTokens = tokens.filter(
    (row) => (row.platform || "").toLowerCase() === "android"
  );

  if (androidTokens.length > 0) {
    return {
      target: "android",
      tokens: androidTokens,
    };
  }

  return {
    target: "all",
    tokens,
  };
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

    const authorization = request.headers.get("authorization");

    if (!authorization?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Missing authorization token." },
        { status: 401 }
      );
    }

    const accessToken = authorization.replace("Bearer ", "").trim();

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: authorization,
        },
      },
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(accessToken);

    if (userError || !user) {
      return NextResponse.json(
        { error: userError?.message || "User is not authenticated." },
        { status: 401 }
      );
    }

    const { data: tokenRows, error: tokenError } = await supabase
      .from("notification_tokens")
      .select("id, token, platform, updated_at")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });

    if (tokenError) {
      return NextResponse.json(
        { error: `Notification token lookup failed: ${tokenError.message}` },
        { status: 500 }
      );
    }

    const allTokens = (tokenRows || []).filter(
      (row: NotificationTokenRow) =>
        typeof row.token === "string" && row.token.trim().length > 0
    );

    if (allTokens.length === 0) {
      return NextResponse.json(
        { error: "No notification tokens found for this user." },
        { status: 404 }
      );
    }

    const selected = chooseTokensForTest(allTokens);
    const tokensToSend = selected.tokens;

    if (selected.target === "android") {
      await wait(7000);
    }

    const siteUrl = (
      process.env.NEXT_PUBLIC_SITE_URL || "https://trishipping.info"
    ).replace(/\/$/, "");

    const app = getFirebaseAdminApp();

    const title = "TRI Shipping Test";
    const body =
      selected.target === "android"
        ? "Android background push notification test."
        : "Push notifications are working successfully.";

    const messages = tokensToSend.map((row: NotificationTokenRow) => {
      const platform = row.platform || "unknown";

      return {
        token: row.token,
        notification: {
          title,
          body,
        },
        data: {
          type: "test",
          title,
          body,
          url: "/dashboard",
          platform,
          target: selected.target,
        },
        android: {
          priority: "high" as const,
          notification: {
            title,
            body,
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
      };
    });

    const result = await getMessaging(app).sendEach(messages);

    const failures = result.responses
      .map((response, index) => {
        if (response.success) {
          return null;
        }

        const token = tokensToSend[index];

        return {
          tokenId: token.id,
          platform: token.platform || "unknown",
          error: response.error
            ? getReadableError(response.error)
            : "Unknown Firebase error",
        };
      })
      .filter(Boolean);

    return NextResponse.json({
      success: result.successCount > 0,
      message:
        selected.target === "android"
          ? `Android delayed test sent to ${result.successCount} of ${tokensToSend.length} Android token(s).`
          : `Sent ${result.successCount} of ${tokensToSend.length} saved notification token(s).`,
      target: selected.target,
      delaySeconds: selected.target === "android" ? 7 : 0,
      allSavedTokens: allTokens.length,
      allSavedPlatforms: summarizePlatforms(allTokens),
      testedTokens: tokensToSend.length,
      testedPlatforms: summarizePlatforms(tokensToSend),
      successCount: result.successCount,
      failureCount: result.failureCount,
      failures,
    });
  } catch (error) {
    const message = getReadableError(error);

    console.error("Test notification error:", error);

    return NextResponse.json(
      {
        error: `Failed to send test notification: ${message}`,
      },
      { status: 500 }
    );
  }
}