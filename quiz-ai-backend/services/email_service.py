import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from config import Config


def send_otp_email(recipient_email: str, otp_code: str) -> tuple[bool, str]:
    """
    Sends a 6-digit OTP verification code to the recipient's email address.
    Returns (success: bool, message: str).
    """
    smtp_server = Config.SMTP_SERVER
    smtp_port = Config.SMTP_PORT
    smtp_email = (Config.SMTP_EMAIL or "").strip()
    smtp_password = (Config.SMTP_PASSWORD or "").strip()
    from_name = Config.SMTP_FROM_NAME

    if not smtp_email or not smtp_password:
        msg = "SMTP email or password is not configured in .env."
        print(f"[EMAIL_SERVICE] Warning: {msg}")
        return False, msg

    try:
        # Create email message
        msg = MIMEMultipart("alternative")
        msg["Subject"] = f"{otp_code} is your Synapse Verification Code"
        msg["From"] = f"{from_name} <{smtp_email}>"
        msg["To"] = recipient_email

        # Plain text version
        text_content = f"""Hello,

You requested a password reset for your Synapse Video Intelligence account.

Your 6-digit verification code is: {otp_code}

This code is valid for 10 minutes. If you did not request this password reset, please ignore this email.

Best regards,
Synapse Video Intelligence Team
"""

        # Modern HTML version
        html_content = f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f1f5f9; padding: 40px 15px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" max-width="560px" cellspacing="0" cellpadding="0" border="0" style="max-width: 560px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0;">
          
          <!-- Header Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%); padding: 32px 36px; text-align: left;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td>
                    <div style="display: inline-block; background: linear-gradient(135deg, #3b82f6, #6366f1); border-radius: 10px; width: 36px; height: 36px; text-align: center; vertical-align: middle; line-height: 36px; color: #ffffff; font-weight: 800; font-size: 18px;">
                      S
                    </div>
                    <span style="color: #ffffff; font-size: 20px; font-weight: 800; letter-spacing: -0.5px; vertical-align: middle; margin-left: 10px;">Synapse</span>
                    <span style="display: inline-block; background-color: rgba(59, 130, 246, 0.25); color: #93c5fd; font-size: 10px; font-weight: 700; text-transform: uppercase; padding: 2px 8px; border-radius: 4px; border: 1px solid rgba(147, 197, 253, 0.3); vertical-align: middle; margin-left: 6px;">Security</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding: 36px 36px 28px 36px;">
              <h1 style="margin: 0 0 12px 0; font-size: 22px; font-weight: 800; color: #0f172a; letter-spacing: -0.5px;">Password Reset Verification</h1>
              <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.6; color: #475569;">
                We received a request to reset the password for your account associated with <strong style="color: #0f172a;">{recipient_email}</strong>. Use the verification code below to complete the process.
              </p>

              <!-- OTP Code Display Card -->
              <div style="background: linear-gradient(180deg, #f8fafc 0%, #eff6ff 100%); border: 2px dashed #bfdbfe; border-radius: 14px; padding: 24px; text-align: center; margin: 24px 0;">
                <div style="font-size: 12px; font-weight: 700; color: #2563eb; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">Your 6-Digit Code</div>
                <div style="font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace; font-size: 38px; font-weight: 800; letter-spacing: 8px; color: #1e3a8a; margin: 6px 0 10px 0;">
                  {otp_code}
                </div>
                <div style="font-size: 12px; color: #64748b;">
                  ⏱ Valid for <strong>10 minutes</strong>
                </div>
              </div>

              <!-- Security Tips -->
              <div style="background-color: #f8fafc; border-radius: 10px; border-left: 4px solid #3b82f6; padding: 14px 16px; margin-top: 24px;">
                <p style="margin: 0; font-size: 13px; line-height: 1.5; color: #475569;">
                  <strong>Didn't request this?</strong> If you did not make this request, you can safely ignore this email. Your current password remains secure.
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 36px 32px 36px; border-top: 1px solid #f1f5f9; text-align: center; background-color: #fafafa;">
              <p style="margin: 0 0 6px 0; font-size: 12px; color: #94a3b8;">
                © 2026 Synapse Video Intelligence. All rights reserved.
              </p>
              <p style="margin: 0; font-size: 11px; color: #cbd5e1;">
                This is an automated system email. Please do not reply directly to this message.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
"""

        msg.attach(MIMEText(text_content, "plain"))
        msg.attach(MIMEText(html_content, "html"))

        # Connect to SMTP server and send
        with smtplib.SMTP(smtp_server, smtp_port, timeout=15) as server:
            server.ehlo()
            server.starttls()
            server.ehlo()
            server.login(smtp_email, smtp_password)
            server.sendmail(smtp_email, recipient_email, msg.as_string())

        print(f"[EMAIL_SERVICE] Successfully sent OTP code to {recipient_email}")
        return True, "Email sent successfully"

    except Exception as e:
        error_msg = f"Failed to send email via SMTP: {str(e)}"
        print(f"[EMAIL_SERVICE] Error: {error_msg}")
        return False, error_msg
