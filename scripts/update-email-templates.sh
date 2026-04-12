#!/usr/bin/env bash
# Usage: bash scripts/update-email-templates.sh <SUPABASE_ACCESS_TOKEN>
# Personal access token: https://supabase.com/dashboard/account/tokens

TOKEN="${1:-$SUPABASE_ACCESS_TOKEN}"
REF="lvcgmadvtvwbppejmmmb"

if [ -z "$TOKEN" ]; then
  echo "ERROR: Pass your Supabase personal access token as first argument"
  echo "  bash scripts/update-email-templates.sh sbp_xxxxxxxxxxxx"
  exit 1
fi

CONFIRM_HTML='<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="margin:0;padding:0;background:#f3f4f6;"><div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;margin-top:40px;"><div style="background:#4f46e5;padding:32px;text-align:center;"><h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:700;">Gestivio</h1><p style="color:#c7d2fe;margin:8px 0 0 0;font-size:14px;">Field Service Management Platform</p></div><div style="padding:40px 32px;"><h2 style="color:#1e1b4b;font-size:22px;margin:0 0 16px 0;">Confirm your email address</h2><p style="color:#4b5563;font-size:16px;line-height:1.6;margin:0 0 32px 0;">Thank you for creating your Gestivio account. Click the button below to confirm your email address and get started.</p><div style="text-align:center;margin:32px 0;"><a href="{{ .ConfirmationURL }}" style="background:#4f46e5;color:#ffffff;padding:16px 32px;border-radius:8px;text-decoration:none;font-size:16px;font-weight:600;display:inline-block;">Confirm my email</a></div><p style="color:#9ca3af;font-size:14px;line-height:1.6;margin:32px 0 0 0;">If you did not create a Gestivio account you can safely ignore this email. This link expires in 24 hours.</p></div><div style="background:#f9fafb;padding:24px 32px;text-align:center;border-top:1px solid #e5e7eb;"><p style="color:#9ca3af;font-size:12px;margin:0;">© 2025 Gestivio — Made in Québec, Canada 🍁</p><p style="margin:8px 0 0 0;"><a href="https://gestivio.ca/privacy" style="color:#6b7280;font-size:12px;text-decoration:none;margin:0 8px;">Privacy Policy</a><a href="https://gestivio.ca/terms" style="color:#6b7280;font-size:12px;text-decoration:none;margin:0 8px;">Terms of Service</a><a href="https://gestivio.ca/support" style="color:#6b7280;font-size:12px;text-decoration:none;margin:0 8px;">Support</a></p></div></div></body></html>'

MAGIC_HTML='<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="margin:0;padding:0;background:#f3f4f6;"><div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;margin-top:40px;"><div style="background:#4f46e5;padding:32px;text-align:center;"><h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:700;">Gestivio</h1><p style="color:#c7d2fe;margin:8px 0 0 0;font-size:14px;">Field Service Management Platform</p></div><div style="padding:40px 32px;"><h2 style="color:#1e1b4b;font-size:22px;margin:0 0 16px 0;">Your magic login link</h2><p style="color:#4b5563;font-size:16px;line-height:1.6;margin:0 0 32px 0;">Click the button below to sign in to your Gestivio account. This link will log you in automatically — no password required.</p><div style="text-align:center;margin:32px 0;"><a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=magiclink" style="background:#4f46e5;color:#ffffff;padding:16px 32px;border-radius:8px;text-decoration:none;font-size:16px;font-weight:600;display:inline-block;">Sign in to Gestivio</a></div><p style="color:#9ca3af;font-size:14px;line-height:1.6;margin:32px 0 0 0;">If you did not request this link, you can safely ignore this email. This link expires in 1 hour and can only be used once.</p></div><div style="background:#f9fafb;padding:24px 32px;text-align:center;border-top:1px solid #e5e7eb;"><p style="color:#9ca3af;font-size:12px;margin:0;">© 2025 Gestivio — Made in Québec, Canada 🍁</p><p style="margin:8px 0 0 0;"><a href="https://gestivio.ca/privacy" style="color:#6b7280;font-size:12px;text-decoration:none;margin:0 8px;">Privacy Policy</a><a href="https://gestivio.ca/terms" style="color:#6b7280;font-size:12px;text-decoration:none;margin:0 8px;">Terms of Service</a><a href="https://gestivio.ca/support" style="color:#6b7280;font-size:12px;text-decoration:none;margin:0 8px;">Support</a></p></div></div></body></html>'

RECOVERY_HTML='<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="margin:0;padding:0;background:#f3f4f6;"><div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;margin-top:40px;"><div style="background:#4f46e5;padding:32px;text-align:center;"><h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:700;">Gestivio</h1><p style="color:#c7d2fe;margin:8px 0 0 0;font-size:14px;">Field Service Management Platform</p></div><div style="padding:40px 32px;"><h2 style="color:#1e1b4b;font-size:22px;margin:0 0 16px 0;">Reset your password</h2><p style="color:#4b5563;font-size:16px;line-height:1.6;margin:0 0 32px 0;">We received a request to reset the password for your Gestivio account. Click the button below to choose a new password.</p><div style="text-align:center;margin:32px 0;"><a href="{{ .SiteURL }}/reset-password?token_hash={{ .TokenHash }}&type=recovery" style="background:#4f46e5;color:#ffffff;padding:16px 32px;border-radius:8px;text-decoration:none;font-size:16px;font-weight:600;display:inline-block;">Reset my password</a></div><p style="color:#9ca3af;font-size:14px;line-height:1.6;margin:32px 0 0 0;">If you did not request a password reset, you can safely ignore this email. This link expires in 1 hour.</p></div><div style="background:#f9fafb;padding:24px 32px;text-align:center;border-top:1px solid #e5e7eb;"><p style="color:#9ca3af;font-size:12px;margin:0;">© 2025 Gestivio — Made in Québec, Canada 🍁</p><p style="margin:8px 0 0 0;"><a href="https://gestivio.ca/privacy" style="color:#6b7280;font-size:12px;text-decoration:none;margin:0 8px;">Privacy Policy</a><a href="https://gestivio.ca/terms" style="color:#6b7280;font-size:12px;text-decoration:none;margin:0 8px;">Terms of Service</a><a href="https://gestivio.ca/support" style="color:#6b7280;font-size:12px;text-decoration:none;margin:0 8px;">Support</a></p></div></div></body></html>'

EMAIL_CHANGE_HTML='<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="margin:0;padding:0;background:#f3f4f6;"><div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;margin-top:40px;"><div style="background:#4f46e5;padding:32px;text-align:center;"><h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:700;">Gestivio</h1><p style="color:#c7d2fe;margin:8px 0 0 0;font-size:14px;">Field Service Management Platform</p></div><div style="padding:40px 32px;"><h2 style="color:#1e1b4b;font-size:22px;margin:0 0 16px 0;">Confirm your new email address</h2><p style="color:#4b5563;font-size:16px;line-height:1.6;margin:0 0 32px 0;">You have requested to change the email address on your Gestivio account. Click the button below to confirm your new email address.</p><div style="text-align:center;margin:32px 0;"><a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email_change" style="background:#4f46e5;color:#ffffff;padding:16px 32px;border-radius:8px;text-decoration:none;font-size:16px;font-weight:600;display:inline-block;">Confirm new email</a></div><p style="color:#9ca3af;font-size:14px;line-height:1.6;margin:32px 0 0 0;">If you did not request this change, please contact us immediately at support@gestivio.ca. This link expires in 24 hours.</p></div><div style="background:#f9fafb;padding:24px 32px;text-align:center;border-top:1px solid #e5e7eb;"><p style="color:#9ca3af;font-size:12px;margin:0;">© 2025 Gestivio — Made in Québec, Canada 🍁</p><p style="margin:8px 0 0 0;"><a href="https://gestivio.ca/privacy" style="color:#6b7280;font-size:12px;text-decoration:none;margin:0 8px;">Privacy Policy</a><a href="https://gestivio.ca/terms" style="color:#6b7280;font-size:12px;text-decoration:none;margin:0 8px;">Terms of Service</a><a href="https://gestivio.ca/support" style="color:#6b7280;font-size:12px;text-decoration:none;margin:0 8px;">Support</a></p></div></div></body></html>'

INVITE_HTML='<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="margin:0;padding:0;background:#f3f4f6;"><div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;margin-top:40px;"><div style="background:#4f46e5;padding:32px;text-align:center;"><h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:700;">Gestivio</h1><p style="color:#c7d2fe;margin:8px 0 0 0;font-size:14px;">Field Service Management Platform</p></div><div style="padding:40px 32px;"><h2 style="color:#1e1b4b;font-size:22px;margin:0 0 16px 0;">You have been invited to Gestivio</h2><p style="color:#4b5563;font-size:16px;line-height:1.6;margin:0 0 32px 0;">You have been invited to join a Gestivio workspace. Click the button below to accept the invitation and create your account.</p><div style="text-align:center;margin:32px 0;"><a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=invite" style="background:#4f46e5;color:#ffffff;padding:16px 32px;border-radius:8px;text-decoration:none;font-size:16px;font-weight:600;display:inline-block;">Accept invitation</a></div><p style="color:#9ca3af;font-size:14px;line-height:1.6;margin:32px 0 0 0;">If you were not expecting an invitation, you can safely ignore this email. This link expires in 24 hours.</p></div><div style="background:#f9fafb;padding:24px 32px;text-align:center;border-top:1px solid #e5e7eb;"><p style="color:#9ca3af;font-size:12px;margin:0;">© 2025 Gestivio — Made in Québec, Canada 🍁</p><p style="margin:8px 0 0 0;"><a href="https://gestivio.ca/privacy" style="color:#6b7280;font-size:12px;text-decoration:none;margin:0 8px;">Privacy Policy</a><a href="https://gestivio.ca/terms" style="color:#6b7280;font-size:12px;text-decoration:none;margin:0 8px;">Terms of Service</a><a href="https://gestivio.ca/support" style="color:#6b7280;font-size:12px;text-decoration:none;margin:0 8px;">Support</a></p></div></div></body></html>'

# Build JSON payload using Python to handle escaping properly
PAYLOAD=$(python3 -c "
import json, sys
data = {
  'mailer_subjects_confirmation': 'Confirm your Gestivio account',
  'mailer_templates_confirmation_content': sys.argv[1],
  'mailer_subjects_magic_link': 'Your Gestivio login link',
  'mailer_templates_magic_link_content': sys.argv[2],
  'mailer_subjects_recovery': 'Reset your Gestivio password',
  'mailer_templates_recovery_content': sys.argv[3],
  'mailer_subjects_email_change': 'Confirm your new email address',
  'mailer_templates_email_change_content': sys.argv[4],
  'mailer_subjects_invite': 'You have been invited to Gestivio',
  'mailer_templates_invite_content': sys.argv[5],
  'site_url': 'https://gestivio.ca',
}
print(json.dumps(data))
" "$CONFIRM_HTML" "$MAGIC_HTML" "$RECOVERY_HTML" "$EMAIL_CHANGE_HTML" "$INVITE_HTML")

echo "Updating Supabase email templates for project: $REF"
echo ""

RESPONSE=$(curl -s -w "\n%{http_code}" \
  -X PATCH \
  "https://api.supabase.com/v1/projects/$REF/config/auth" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD")

HTTP_CODE=$(echo "$RESPONSE" | tail -1)
BODY=$(echo "$RESPONSE" | head -n -1)

echo "HTTP Status: $HTTP_CODE"
if [ "$HTTP_CODE" = "200" ]; then
  echo "✅ All 5 email templates updated successfully!"
  echo ""
  echo "Templates updated:"
  echo "  ✅ Confirm signup     — 'Confirm your Gestivio account'"
  echo "  ✅ Magic link         — 'Your Gestivio login link'"
  echo "  ✅ Reset password     — 'Reset your Gestivio password'"
  echo "  ✅ Email change       — 'Confirm your new email address'"
  echo "  ✅ Invite user        — 'You have been invited to Gestivio'"
else
  echo "❌ Error updating templates:"
  echo "$BODY" | python3 -c "import json,sys; d=json.load(sys.stdin); print(json.dumps(d, indent=2))" 2>/dev/null || echo "$BODY"
fi
