"""
Email Notification Service for Detection Alerts.

Sends HTML-formatted email alerts to administrators when critical
security incidents are detected by the AI pipeline.
Uses Python's built-in smtplib over TLS for secure delivery.
"""

import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime

from app.core.config import settings

logger = logging.getLogger(__name__)


def _humanize_metadata(metadata: dict) -> dict:
    """
    Converts raw AI pipeline metadata into clean, human-readable
    key-value pairs suitable for display in alert emails.
    Removes technical coordinates and internal labels that end users
    would not understand.
    """
    friendly = {}

    # Object/person count
    count = metadata.get("count")
    if count is not None:
        friendly["Objects Detected"] = str(count)

    # Restricted zone entries — just show how many zones were breached, not coordinates
    entries = metadata.get("restricted_entries")
    if entries and isinstance(entries, list):
        zone_indices = set()
        for entry in entries:
            if isinstance(entry, dict) and "zone_index" in entry:
                zone_indices.add(entry["zone_index"])
        zone_count = len(zone_indices)
        person_count = len(entries)
        friendly["Zones Breached"] = str(zone_count)
        if person_count > 1:
            friendly["Persons in Restricted Area"] = str(person_count)

    # Dwell duration — format as readable time
    dwell_duration = metadata.get("dwell_duration")
    if dwell_duration is not None:
        secs = float(dwell_duration)
        if secs >= 60:
            friendly["Time in Zone"] = f"{int(secs // 60)}m {int(secs % 60)}s"
        else:
            friendly["Time in Zone"] = f"{secs:.1f}s"

    # Dwell limit — format as readable time
    dwell_limit = metadata.get("dwell_limit")
    if dwell_limit is not None and float(dwell_limit) > 0:
        limit_secs = float(dwell_limit)
        if limit_secs >= 60:
            friendly["Allowed Limit"] = f"{int(limit_secs // 60)}m {int(limit_secs % 60)}s"
        else:
            friendly["Allowed Limit"] = f"{limit_secs:.0f}s"

    # Visitor limit (for VISITOR_COUNT_LIMIT_EXCEEDED)
    visitor_limit = metadata.get("visitor_limit")
    if visitor_limit is not None:
        friendly["Visitor Limit"] = str(visitor_limit)

    # Skip raw_labels and restricted_entries (already handled above)
    # Include any other unknown keys in a clean format (future-proofing)
    skip_keys = {"count", "raw_labels", "restricted_entries", "dwell_duration", "dwell_limit", "visitor_limit"}
    for k, v in metadata.items():
        if k not in skip_keys:
            # Convert key to title case and replace underscores
            clean_key = k.replace("_", " ").title()
            # Only include simple values (strings/numbers), skip nested objects
            if isinstance(v, (str, int, float, bool)):
                friendly[clean_key] = str(v)

    return friendly


def _build_alert_html(event_details: dict) -> str:
    """
    Builds a professional HTML email body from the detection event details.
    Uses a clean, side-by-side wide layout if a detection image is present.
    """
    scenario = event_details.get("scenario_key", "Unknown Scenario")
    camera_name = event_details.get("camera_name", f"CAM-{event_details.get('camera_id', '?')}")
    area_name = event_details.get("area_name", "Unknown Area")
    severity = event_details.get("severity", "Medium")
    confidence = event_details.get("confidence", 0.0)
    timestamp = event_details.get("timestamp", datetime.now().strftime("%Y-%m-%d %H:%M:%S"))
    metadata = event_details.get("metadata", {})
    has_image = bool(event_details.get("image_base64"))

    # Severity color mapping
    severity_colors = {
        "Critical": "#dc2626",
        "High": "#ea580c",
        "Medium": "#ca8a04",
        "Low": "#16a34a",
    }
    severity_color = severity_colors.get(severity, "#6b7280")

    # Format scenario name nicely (replace underscores and format to title case)
    formatted_scenario = scenario.replace("_", " ").title()

    # Pre-build metadata section — convert raw technical data to human-readable info
    metadata_html = ""
    if metadata:
        friendly_metadata = _humanize_metadata(metadata)
        metadata_rows = "".join(
            f'<tr><td style="color: #64748b; padding: 5px 10px; font-weight: 500; border-bottom: 1px solid #f1f5f9;">{k}</td><td style="color: #1e293b; padding: 5px 10px; text-align: right; border-bottom: 1px solid #f1f5f9;">{v}</td></tr>'
            for k, v in friendly_metadata.items()
        )
        metadata_html = f"""
        <div style="margin-top: 18px;">
            <h3 style="color: #334155; font-size: 12px; margin: 0 0 8px 0; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #e2e8f0; padding-bottom: 5px;">Additional Metadata</h3>
            <table width="100%" cellpadding="0" cellspacing="0" style="font-size: 12px; background-color: #f8fafc; border-radius: 6px; overflow: hidden;">
                {metadata_rows}
            </table>
        </div>
        """

    # Detail Table Rows
    details_rows = f"""
    <tr>
        <td style="color: #64748b; padding: 7px 0; font-weight: 500; border-bottom: 1px solid #f1f5f9;">Camera</td>
        <td style="color: #0f172a; padding: 7px 0; text-align: right; font-weight: 600; border-bottom: 1px solid #f1f5f9;">{camera_name}</td>
    </tr>
    <tr>
        <td style="color: #64748b; padding: 7px 0; font-weight: 500; border-bottom: 1px solid #f1f5f9;">Area</td>
        <td style="color: #0f172a; padding: 7px 0; text-align: right; font-weight: 600; border-bottom: 1px solid #f1f5f9;">{area_name}</td>
    </tr>
    <tr>
        <td style="color: #64748b; padding: 7px 0; font-weight: 500; border-bottom: 1px solid #f1f5f9;">Confidence</td>
        <td style="color: #0284c7; padding: 7px 0; text-align: right; font-weight: 700; border-bottom: 1px solid #f1f5f9;">{confidence:.1%}</td>
    </tr>
    <tr>
        <td style="color: #64748b; padding: 7px 0; font-weight: 500;">Timestamp</td>
        <td style="color: #0f172a; padding: 7px 0; text-align: right; font-weight: 600;">{timestamp}</td>
    </tr>
    """

    # Create a 2-column wide layout if there is an image, else a standard 1-column layout
    if has_image:
        content_section = f"""
        <tr>
            <!-- Left Column: Details -->
            <td width="52%" style="padding: 22px 15px 25px 25px; vertical-align: top;">
                <!-- Severity Badge -->
                <div style="background-color: {severity_color}15; border-left: 4px solid {severity_color}; padding: 8px 14px; border-radius: 0 6px 6px 0; margin-bottom: 18px;">
                    <span style="color: {severity_color}; font-weight: 700; font-size: 12px; letter-spacing: 0.5px;">
                        {severity.upper()} SEVERITY
                    </span>
                </div>

                <h3 style="color: #334155; font-size: 12px; margin: 0 0 8px 0; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #e2e8f0; padding-bottom: 5px;">Incident Details</h3>
                <table width="100%" cellpadding="0" cellspacing="0" style="font-size: 13px; margin-bottom: 10px;">
                    {details_rows}
                </table>
                
                {metadata_html}
            </td>
            <!-- Right Column: Image -->
            <td width="48%" style="padding: 22px 25px 25px 15px; vertical-align: top; text-align: center;">
                <div style="background-color: #f8fafc; border-radius: 8px; padding: 8px; border: 1px solid #e2e8f0; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
                    <div style="font-size: 11px; color: #64748b; font-weight: 600; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px; text-align: left;">Live Capture Feed</div>
                    <img src="cid:detection_image" style="width: 100%; height: auto; border-radius: 6px; border: 1px solid #e2e8f0; display: block;" alt="Incident Capture" />
                </div>
            </td>
        </tr>
        """
        table_width = "720"
    else:
        content_section = f"""
        <tr>
            <td style="padding: 22px 30px 25px 30px;">
                <!-- Severity Badge -->
                <div style="background-color: {severity_color}15; border-left: 4px solid {severity_color}; padding: 10px 16px; border-radius: 0 6px 6px 0; margin-bottom: 20px;">
                    <span style="color: {severity_color}; font-weight: 700; font-size: 13px; letter-spacing: 0.5px;">
                        {severity.upper()} SEVERITY
                    </span>
                </div>

                <h3 style="color: #334155; font-size: 13px; margin: 0 0 8px 0; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #e2e8f0; padding-bottom: 5px;">Incident Details</h3>
                <table width="100%" cellpadding="0" cellspacing="0" style="font-size: 13px; margin-bottom: 15px;">
                    {details_rows}
                </table>
                
                {metadata_html}
            </td>
        </tr>
        """
        table_width = "550"

    html = f"""
    <html>
    <body style="font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 0; background-color: #f1f5f9; -webkit-font-smoothing: antialiased;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f1f5f9; padding: 25px 0;">
            <tr>
                <td align="center">
                    <table width="{table_width}" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">
                        <!-- Header -->
                        <tr>
                            <td colspan="{"2" if has_image else "1"}" style="background: linear-gradient(135deg, {severity_color}, #1e293b); padding: 20px 25px;">
                                <table width="100%" cellpadding="0" cellspacing="0">
                                    <tr>
                                        <td>
                                            <h1 style="color: #ffffff; margin: 0; font-size: 18px; font-weight: 700; letter-spacing: 0.5px; text-shadow: 0 2px 4px rgba(0,0,0,0.3);">
                                                🚨 {formatted_scenario}
                                            </h1>
                                            <p style="color: rgba(255,255,255,0.8); margin: 4px 0 0 0; font-size: 11px; font-weight: 500;">
                                                Automated Security Alert — AI Vision Pipeline
                                            </p>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>

                        <!-- Main Content -->
                        {content_section}

                        <!-- Footer -->
                        <tr>
                            <td colspan="{"2" if has_image else "1"}" style="padding: 16px 25px; border-top: 1px solid #e2e8f0; background-color: #f8fafc; text-align: center;">
                                <p style="color: #94a3b8; font-size: 11px; margin: 0; font-weight: 500; line-height: 1.5;">
                                    This is an automated alert from Video Analytics Solutions.<br>
                                    Please review this incident in the Crisis Center dashboard immediately.
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
    return html


def send_alert_email(event_details: dict, recipient_emails: list[str]) -> None:
    """
    Sends an HTML alert email to the specified recipients.
    Designed to be run as a FastAPI BackgroundTask so it does NOT block the request.

    Args:
        event_details: Dict containing scenario_key, camera_name, area_name,
                       severity, confidence, timestamp, metadata, image_base64.
        recipient_emails: List of email addresses to send the alert to.
    """
    smtp_user = settings.SMTP_USER
    smtp_password = settings.SMTP_PASSWORD
    smtp_host = settings.SMTP_HOST
    smtp_port = settings.SMTP_PORT
    sender = settings.SMTP_SENDER or smtp_user

    if not smtp_user or not smtp_password:
        logger.warning(
            "SMTP credentials not configured (SMTP_USER / SMTP_PASSWORD missing in .env). "
            "Skipping email notification."
        )
        return

    if not recipient_emails:
        logger.warning("No recipient emails provided. Skipping email notification.")
        return

    scenario = event_details.get("scenario_key", "Detection Alert")
    severity = event_details.get("severity", "Medium")

    formatted_scenario = scenario.replace("_", " ").title()
    subject = f"🚨 [{severity}] {formatted_scenario} — Video Analytics Alert"

    # Use MIMEMultipart("related") to allow inline images via CID
    msg = MIMEMultipart("related")
    msg["From"] = sender
    msg["To"] = ", ".join(recipient_emails)
    msg["Subject"] = subject

    # Nest MIMEMultipart("alternative") inside "related" for maximum mail client compatibility
    msg_alternative = MIMEMultipart("alternative")
    msg.attach(msg_alternative)

    html_body = _build_alert_html(event_details)
    msg_html = MIMEText(html_body, "html")
    msg_alternative.attach(msg_html)

    # Attach base64 image if present
    image_data = event_details.get("image_base64")
    if image_data:
        import base64
        from email.mime.image import MIMEImage
        try:
            # Strip base64 header if present (e.g. "data:image/jpeg;base64,...")
            if "," in image_data:
                image_data = image_data.split(",")[1]
            decoded_image = base64.b64decode(image_data)
            mime_image = MIMEImage(decoded_image)
            mime_image.add_header('Content-ID', '<detection_image>')
            mime_image.add_header('Content-Disposition', 'inline', filename='detection.jpg')
            msg.attach(mime_image)
        except Exception as e:
            logger.error(f"Error attaching base64 image to email: {e}")

    try:
        with smtplib.SMTP(smtp_host, smtp_port, timeout=15) as server:
            server.ehlo()
            server.starttls()
            server.ehlo()
            server.login(smtp_user, smtp_password)
            server.sendmail(sender, recipient_emails, msg.as_string())
        logger.info(
            f"Alert email sent successfully to {recipient_emails} "
            f"for scenario '{scenario}' (severity: {severity})"
        )
    except smtplib.SMTPAuthenticationError:
        logger.error(
            "SMTP authentication failed. Please verify SMTP_USER and SMTP_PASSWORD in .env. "
            "If using Gmail, ensure you are using an App Password."
        )
    except smtplib.SMTPException as e:
        logger.error(f"SMTP error while sending alert email: {e}")
    except Exception as e:
        logger.error(f"Unexpected error sending alert email: {e}")
