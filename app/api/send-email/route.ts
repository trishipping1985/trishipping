import { Resend } from "resend";
import { NextResponse } from "next/server";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const to = String(body?.to || "").trim();
    const subject = String(body?.subject || "TRI Shipping Update").trim();
    const trackingCode = String(body?.trackingCode || "").trim();
    const status = String(body?.status || "").trim();
    const customerName = String(body?.customerName || "Customer").trim();
    const message = String(body?.message || "").trim();

    console.log("send-email body:", {
      to,
      subject,
      trackingCode,
      status,
      customerName,
      hasApiKey: !!process.env.RESEND_API_KEY,
    });

    if (!to) {
      return NextResponse.json(
        { success: false, error: "Recipient email is required" },
        { status: 400 }
      );
    }

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; background: #f8fafc; padding: 24px;">
        <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e5e7eb;">
          <div style="background: #071427; padding: 24px; text-align: center;">
            <h1 style="margin: 0; color: #F5C84B; font-size: 28px;">TRI Shipping</h1>
          </div>

          <div style="padding: 32px 24px; color: #111827;">
            <p style="margin: 0 0 16px; font-size: 16px;">Hello ${customerName},</p>

            <p style="margin: 0 0 20px; font-size: 15px; line-height: 1.6;">
              ${message || "There is a new update for your shipment."}
            </p>

            <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; padding: 20px; margin: 24px 0;">
              <p style="margin: 0 0 10px; font-size: 14px;">
                <strong>Tracking Code:</strong> ${trackingCode || "N/A"}
              </p>
              <p style="margin: 0; font-size: 14px;">
                <strong>Status:</strong> ${status || "N/A"}
              </p>
            </div>

            <p style="margin: 24px 0 0; font-size: 14px; color: #6b7280;">
              Thank you for choosing TRI Shipping.
            </p>
          </div>
        </div>
      </div>
    `;

    const { data, error } = await resend.emails.send({
      from: "TRI Shipping <no-reply@trishipping.info>",
      to,
      subject,
      html: emailHtml,
    });

    if (error) {
      console.error("Resend error:", error);

      return NextResponse.json(
        {
          success: false,
          error: typeof error === "object" ? JSON.stringify(error) : String(error),
        },
        { status: 500 }
      );
    }

    console.log("Resend success:", data);

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Send email route error:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to send email",
      },
      { status: 500 }
    );
  }
}