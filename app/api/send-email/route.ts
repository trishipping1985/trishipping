import { Resend } from "resend";
import { NextResponse } from "next/server";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const to = String(body?.to || "").trim();
    const subject = String(body?.subject || "Shipment Update").trim();
    const trackingCode = String(body?.trackingCode || "").trim();
    const status = String(body?.status || "").trim();
    const customerName = String(body?.customerName || "Customer").trim();
    const message = String(body?.message || "").trim();

    if (!to) {
      return NextResponse.json(
        { success: false, error: "Recipient email is required" },
        { status: 400 }
      );
    }

    const safeCustomerName = customerName || "Customer";
    const safeTrackingCode = trackingCode || "N/A";
    const safeStatus = status || "N/A";

    const finalSubject = subject || `Shipment Update - ${safeTrackingCode}`;
    const finalMessage =
      message || `Your shipment ${safeTrackingCode} has been updated to ${safeStatus}.`;

    const emailHtml = `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>${finalSubject}</title>
        </head>
        <body style="margin:0; padding:0; background-color:#f4f7fb; font-family:Arial, Helvetica, sans-serif; color:#111827;">
          <div style="display:none; max-height:0; overflow:hidden; opacity:0;">
            ${finalMessage}
          </div>

          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f4f7fb; margin:0; padding:32px 16px;">
            <tr>
              <td align="center">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:640px; background-color:#ffffff; border-radius:20px; overflow:hidden; border:1px solid #e5e7eb; box-shadow:0 10px 30px rgba(2, 6, 23, 0.08);">
                  <tr>
                    <td style="background:linear-gradient(135deg, #071427 0%, #0b1f3a 100%); padding:28px 32px; text-align:center;">
                      <div style="font-size:34px; font-weight:700; color:#F5C84B; letter-spacing:0.4px;">
                        TRI Shipping
                      </div>
                      <div style="margin-top:8px; font-size:14px; color:#d1d5db;">
                        Reliable shipment updates for your package
                      </div>
                    </td>
                  </tr>

                  <tr>
                    <td style="padding:36px 32px 20px;">
                      <div style="font-size:14px; font-weight:700; letter-spacing:1.2px; color:#0f172a; text-transform:uppercase; margin-bottom:12px;">
                        Shipment Update
                      </div>

                      <h1 style="margin:0 0 18px; font-size:30px; line-height:1.25; color:#111827;">
                        Hello ${safeCustomerName},
                      </h1>

                      <p style="margin:0; font-size:16px; line-height:1.7; color:#374151;">
                        ${finalMessage}
                      </p>
                    </td>
                  </tr>

                  <tr>
                    <td style="padding:10px 32px 8px;">
                      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f9fafb; border:1px solid #e5e7eb; border-radius:16px;">
                        <tr>
                          <td style="padding:24px;">
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                              <tr>
                                <td style="padding:0 0 16px; font-size:13px; font-weight:700; letter-spacing:1px; color:#6b7280; text-transform:uppercase;">
                                  Shipment Details
                                </td>
                              </tr>
                              <tr>
                                <td style="padding:0 0 14px; font-size:16px; color:#111827;">
                                  <span style="font-weight:700;">Tracking Code:</span>
                                  <span style="color:#374151;"> ${safeTrackingCode}</span>
                                </td>
                              </tr>
                              <tr>
                                <td style="padding:0; font-size:16px; color:#111827;">
                                  <span style="font-weight:700;">Status:</span>
                                  <span style="display:inline-block; margin-left:8px; padding:6px 12px; border-radius:999px; background-color:#071427; color:#F5C84B; font-size:13px; font-weight:700; letter-spacing:0.5px;">
                                    ${safeStatus}
                                  </span>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                  <tr>
                    <td style="padding:24px 32px 8px;">
                      <p style="margin:0; font-size:15px; line-height:1.7; color:#4b5563;">
                        Thank you for choosing <strong style="color:#111827;">TRI Shipping</strong>. We appreciate your trust and will continue to keep you informed throughout your shipment journey.
                      </p>
                    </td>
                  </tr>

                  <tr>
                    <td style="padding:28px 32px 34px;">
                      <div style="height:1px; background-color:#e5e7eb; margin-bottom:18px;"></div>
                      <p style="margin:0 0 8px; font-size:13px; color:#6b7280;">
                        This is an automated email from TRI Shipping.
                      </p>
                      <p style="margin:0; font-size:13px; color:#6b7280;">
                        Please do not reply to this message.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `;

    const { data, error } = await resend.emails.send({
      from: "TRI Shipping <no-reply@trishipping.info>",
      to,
      subject: finalSubject,
      html: emailHtml,
    });

    if (error) {
      console.error("Resend error:", error);
      return NextResponse.json(
        { success: false, error },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Send email route error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to send email" },
      { status: 500 }
    );
  }
}