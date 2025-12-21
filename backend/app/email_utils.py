"""
Lightweight SMTP helper for transactional email (Mailtrap-ready).
"""
import smtplib
from email.message import EmailMessage
from typing import Optional
from app.config import Config


def send_email(subject: str, recipient: str, text_body: str, html_body: Optional[str] = None) -> bool:
    """Send an email using configured SMTP provider (default Mailtrap sandbox)."""
    if not Config.MAIL_ENABLED:
        print("MAIL: disabled via configuration; skipping send.")
        return False

    required = [Config.MAIL_HOST, Config.MAIL_PORT, Config.MAIL_USERNAME, Config.MAIL_PASSWORD]
    if not all(required):
        print("MAIL: missing SMTP credentials; cannot deliver email.")
        return False

    msg = EmailMessage()
    msg['Subject'] = subject
    msg['From'] = Config.MAIL_DEFAULT_SENDER
    msg['To'] = recipient
    msg.set_content(text_body)
    if html_body:
        msg.add_alternative(html_body, subtype='html')

    try:
        with smtplib.SMTP(Config.MAIL_HOST, Config.MAIL_PORT) as server:
            if Config.MAIL_USE_TLS:
                server.starttls()
            server.login(Config.MAIL_USERNAME, Config.MAIL_PASSWORD)
            server.send_message(msg)
        return True
    except Exception as exc:
        print(f"MAIL: error sending email -> {exc}")
        return False


def send_verification_email(username: str, recipient: str, verify_url: str) -> bool:
    """Compose and dispatch verification email."""
    subject = "Verify your F1 Race Analytics account"
    text_body = f"Hello {username},\n\nConfirm your email by visiting {verify_url}\n\nIf you did not register, ignore this message."
    html_body = f"""
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0b1119;padding:40px 0;font-family:'Poppins',Arial,sans-serif;color:#e6ecf5;">
            <tr>
                <td align="center">
                    <table role="presentation" width="520" cellpadding="0" cellspacing="0" style="background:#101825;border-radius:18px;padding:32px;border:1px solid rgba(255,255,255,0.06);">
                        <tr>
                            <td align="center" style="padding-bottom:24px;">
                                <div style="display:inline-block;padding:6px 16px;border-radius:999px;border:1px solid rgba(255,255,255,0.15);font-size:12px;letter-spacing:0.2em;color:#ff6551;text-transform:uppercase;">F1 Race Analytics</div>
                            </td>
                        </tr>
                        <tr>
                            <td style="font-size:30px;font-weight:700;color:#fff;text-align:center;padding-bottom:12px;">
                                Confirm your email, {username}
                            </td>
                        </tr>
                        <tr>
                            <td style="font-size:15px;line-height:1.7;color:#b3bfd6;text-align:center;padding:0 12px 28px;">
                                Thanks for joining F1 Race Analytics. Tap the button below to verify your address and unlock the full dashboard experience.
                            </td>
                        </tr>
                        <tr>
                            <td align="center" style="padding-bottom:22px;">
                                <a href="{verify_url}" style="background:#ff1e15;color:#fff;text-decoration:none;padding:14px 34px;border-radius:999px;font-weight:600;display:inline-block;">Verify Email</a>
                            </td>
                        </tr>
                        <tr>
                            <td style="font-size:13px;color:#8390a5;line-height:1.6;text-align:center;">
                                If the button does not work, copy and paste this URL into your browser:<br/>
                                <a href="{verify_url}" style="color:#ff8c7a;text-decoration:none;word-break:break-all;">{verify_url}</a>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding-top:30px;font-size:13px;color:#5f6e84;text-align:center;">
                                Stay fast,<br/>The F1 Race Analytics Crew
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    """
    return send_email(subject, recipient, text_body, html_body)
