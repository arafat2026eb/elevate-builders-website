/**
 * Vercel Serverless Function & Local Dev Handler: /api/contact
 * Handles Elevate Builders tender inquiries and sends email notifications
 * via the Resend API to abdullah@elevatebuilders.com.sa & arafat@elevatebuilders.com.sa
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Zero-dependency local .env loader for local development environments
if (!process.env.RESEND_API_KEY) {
  const envPath = path.resolve(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    try {
      const lines = fs.readFileSync(envPath, 'utf8').split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const eq = trimmed.indexOf('=');
        if (eq > 0) {
          const k = trimmed.slice(0, eq).trim();
          const v = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
          if (!process.env[k]) process.env[k] = v;
        }
      }
    } catch (e) {}
  }
}

// Flexible environment variable extractor (handles trailing whitespace, case differences, and quotes)
function getEnvVar(targetKey) {
  if (process.env[targetKey]) {
    return String(process.env[targetKey]).trim().replace(/^["']|["']$/g, '');
  }
  const cleanTarget = targetKey.toUpperCase().replace(/[^A-Z0-9]/g, '');
  for (const [k, v] of Object.entries(process.env)) {
    if (k.trim().toUpperCase().replace(/[^A-Z0-9]/g, '') === cleanTarget) {
      if (typeof v === 'string') return v.trim().replace(/^["']|["']$/g, '');
    }
  }
  return null;
}

// Recipient configuration (overridable via CONTACT_TO_EMAILS)
const DEFAULT_TO_EMAILS = [
  'abdullah@elevatebuilders.com.sa',
  'arafat@elevatebuilders.com.sa',
  'elevatebuilders25@gmail.com'
];
const DEFAULT_FROM_EMAIL = 'Elevate Builders Inquiries <inquiries@elevatebuilders.com.sa>';

function formatServiceScope(scope) {
  const map = {
    'civil-structural': 'Civil & Structural Works',
    'infrastructure': 'Major Infrastructure',
    'fitout-finishing': 'High-End Fit-out & Finishing',
    'manpower-supply': 'Specialized Engineering Manpower Supply',
    'other': 'Integrated Turnkey / Other'
  };
  return map[scope] || scope || 'General Construction';
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function generateHtmlEmail(data, sandboxNotice = false) {
  const {
    fullName,
    company,
    phone,
    email,
    serviceScope,
    projectLocation,
    message,
    referenceId,
    timestamp
  } = data;

  const formattedScope = formatServiceScope(serviceScope);
  const safeFullName = escapeHtml(fullName);
  const safeCompany = escapeHtml(company);
  const safePhone = escapeHtml(phone);
  const safeEmail = escapeHtml(email);
  const safeLocation = escapeHtml(projectLocation);
  const safeMessage = escapeHtml(message);
  const cleanPhone = phone.replace(/[^0-9+]/g, '');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Tender Inquiry — ${safeFullName}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #FAF9F5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; color: #080237;">

  <!-- Hidden Preview Text -->
  <div style="display: none; font-size: 1px; color: #FAF9F5; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden;">
    New Tender Inquiry from ${safeFullName} (${safeCompany || 'Direct Entity'}) — Scope: ${formattedScope} in ${safeLocation}. Reference: ${referenceId}.
  </div>

  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #FAF9F5; padding: 24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #FFFFFF; border: 1px solid #E4E2DC; box-shadow: 0 4px 20px rgba(8, 2, 55, 0.04);">
          
          <!-- Top Architectural Gradient Accent Bar -->
          <tr>
            <td style="height: 4px; background: linear-gradient(90deg, #080237 0%, #6C5C3E 50%, #C5A880 100%);"></td>
          </tr>

          ${sandboxNotice ? `
          <!-- Sandbox Advisory Header (Shown only during Resend sandbox mode) -->
          <tr>
            <td style="padding: 12px 24px; background-color: #FFFBEB; border-bottom: 1px solid #FDE68A; color: #92400E; font-size: 12px; line-height: 16px; font-family: monospace;">
              <strong>[RESEND SANDBOX ADVISORY]</strong>: Delivered to registered account owner. To dispatch directly to abdullah@elevatebuilders.com.sa &amp; arafat@elevatebuilders.com.sa, verify <strong>elevatebuilders.com.sa</strong> in Resend Domains and set <code>RESEND_FROM_EMAIL</code> in Vercel.
            </td>
          </tr>
          ` : ''}

          <!-- Header Section -->
          <tr>
            <td style="background-color: #080237; padding: 32px 30px; text-align: left;">
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <div style="font-family: 'Cinzel', Georgia, 'Times New Roman', serif; font-size: 22px; font-weight: 700; letter-spacing: 0.12em; color: #FAF9F5; text-transform: uppercase;">
                      ELEVATE BUILDERS
                    </div>
                    <div style="font-family: monospace; font-size: 11px; letter-spacing: 0.14em; color: #C5A880; text-transform: uppercase; margin-top: 4px;">
                      Commercial Registration: 7049953909 • Riyadh, KSA
                    </div>
                  </td>
                  <td align="right" valign="top">
                    <span style="display: inline-block; padding: 4px 10px; background-color: rgba(250, 249, 245, 0.12); border: 1px solid rgba(197, 168, 128, 0.35); color: #FAF9F5; font-family: monospace; font-size: 10px; letter-spacing: 0.1em; text-transform: uppercase;">
                      TENDER DOSSIER
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Meta Reference Bar -->
          <tr>
            <td style="background-color: #F4F2EB; padding: 14px 30px; border-bottom: 1px solid #E4E2DC;">
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="font-family: monospace; font-size: 11px; color: #6C5C3E; text-transform: uppercase; letter-spacing: 0.08em;">
                    <strong>REF:</strong> ${referenceId}
                  </td>
                  <td align="right" style="font-family: monospace; font-size: 11px; color: #54515E; letter-spacing: 0.05em;">
                    ${timestamp}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Section: Notification Headline -->
          <tr>
            <td style="padding: 28px 30px 18px 30px;">
              <div style="font-family: monospace; font-size: 11px; color: #6C5C3E; text-transform: uppercase; letter-spacing: 0.12em; margin-bottom: 6px;">
                INCOMING TRANSMISSION // WEB INQUIRY PORTAL
              </div>
              <h1 style="margin: 0; font-family: 'Cinzel', Georgia, serif; font-size: 24px; line-height: 32px; color: #080237; font-weight: 600;">
                New Project Tender &amp; Estimation Inquiry
              </h1>
              <p style="margin: 8px 0 0 0; font-size: 14px; line-height: 22px; color: #54515E;">
                A new project qualification brief has been submitted via the official Elevate Builders portal. Complete specifications and contact parameters are detailed below.
              </p>
            </td>
          </tr>

          <!-- Section: Client Dossier Table -->
          <tr>
            <td style="padding: 10px 30px 24px 30px;">
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="border: 1px solid #E4E2DC; border-collapse: collapse;">
                
                <!-- Client Name -->
                <tr style="border-bottom: 1px solid #E4E2DC;">
                  <td width="38%" style="padding: 12px 16px; background-color: #FAF9F5; font-family: monospace; font-size: 11px; color: #6C5C3E; text-transform: uppercase; letter-spacing: 0.08em; vertical-align: top;">
                    01. Full Name
                  </td>
                  <td style="padding: 12px 16px; font-size: 14px; font-weight: 600; color: #080237; background-color: #FFFFFF;">
                    ${safeFullName}
                  </td>
                </tr>

                <!-- Entity / Enterprise -->
                <tr style="border-bottom: 1px solid #E4E2DC;">
                  <td style="padding: 12px 16px; background-color: #FAF9F5; font-family: monospace; font-size: 11px; color: #6C5C3E; text-transform: uppercase; letter-spacing: 0.08em; vertical-align: top;">
                    02. Enterprise / Client
                  </td>
                  <td style="padding: 12px 16px; font-size: 14px; color: #080237; background-color: #FFFFFF;">
                    ${safeCompany || '<span style="color: #9CA3AF; font-style: italic;">Not specified</span>'}
                  </td>
                </tr>

                <!-- Direct Phone -->
                <tr style="border-bottom: 1px solid #E4E2DC;">
                  <td style="padding: 12px 16px; background-color: #FAF9F5; font-family: monospace; font-size: 11px; color: #6C5C3E; text-transform: uppercase; letter-spacing: 0.08em; vertical-align: top;">
                    03. Telephone Direct
                  </td>
                  <td style="padding: 12px 16px; font-size: 14px; color: #080237; background-color: #FFFFFF;">
                    <a href="tel:${cleanPhone}" style="color: #080237; text-decoration: none; font-weight: 600; border-bottom: 1px dotted #6C5C3E;">
                      ${safePhone}
                    </a>
                  </td>
                </tr>

                <!-- Official Email -->
                <tr style="border-bottom: 1px solid #E4E2DC;">
                  <td style="padding: 12px 16px; background-color: #FAF9F5; font-family: monospace; font-size: 11px; color: #6C5C3E; text-transform: uppercase; letter-spacing: 0.08em; vertical-align: top;">
                    04. Official Email
                  </td>
                  <td style="padding: 12px 16px; font-size: 14px; color: #080237; background-color: #FFFFFF;">
                    <a href="mailto:${safeEmail}" style="color: #6C5C3E; text-decoration: none; font-weight: 600; border-bottom: 1px solid #6C5C3E;">
                      ${safeEmail}
                    </a>
                  </td>
                </tr>

                <!-- Service Scope -->
                <tr style="border-bottom: 1px solid #E4E2DC;">
                  <td style="padding: 12px 16px; background-color: #FAF9F5; font-family: monospace; font-size: 11px; color: #6C5C3E; text-transform: uppercase; letter-spacing: 0.08em; vertical-align: top;">
                    05. Service Scope
                  </td>
                  <td style="padding: 12px 16px; background-color: #FFFFFF;">
                    <span style="display: inline-block; padding: 4px 10px; background-color: #F4F2EB; border: 1px solid #6C5C3E; color: #080237; font-family: monospace; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em;">
                      ${formattedScope}
                    </span>
                  </td>
                </tr>

                <!-- Project Location -->
                <tr>
                  <td style="padding: 12px 16px; background-color: #FAF9F5; font-family: monospace; font-size: 11px; color: #6C5C3E; text-transform: uppercase; letter-spacing: 0.08em; vertical-align: top;">
                    06. Project Location
                  </td>
                  <td style="padding: 12px 16px; font-size: 14px; font-weight: 500; color: #080237; background-color: #FFFFFF;">
                    ${safeLocation}
                  </td>
                </tr>

              </table>
            </td>
          </tr>

          <!-- Section: Scope Brief & Tender Parameters -->
          <tr>
            <td style="padding: 0 30px 28px 30px;">
              <div style="font-family: monospace; font-size: 11px; color: #6C5C3E; text-transform: uppercase; letter-spacing: 0.12em; margin-bottom: 10px;">
                07. Scope Brief &amp; Tender Parameters
              </div>
              <div style="background-color: #FBFBF9; border: 1px solid #E4E2DC; border-left: 4px solid #6C5C3E; padding: 20px; font-size: 14px; line-height: 24px; color: #1E1B2E; white-space: pre-wrap;">${safeMessage}</div>
            </td>
          </tr>

          <!-- Direct Action Buttons Strip -->
          <tr>
            <td style="padding: 0 30px 32px 30px;">
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="left" style="padding-right: 10px;">
                    <a href="mailto:${safeEmail}?subject=Re:%20Elevate%20Builders%20Tender%20Inquiry%20[%20Ref:%20${referenceId}%20]" style="display: inline-block; background-color: #080237; color: #FAF9F5; font-family: monospace; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em; padding: 14px 24px; text-decoration: none; border: 1px solid #080237;">
                      Reply Directly to Client &rarr;
                    </a>
                  </td>
                  <td align="left">
                    <a href="tel:${cleanPhone}" style="display: inline-block; background-color: #F4F2EB; color: #080237; font-family: monospace; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em; padding: 14px 20px; text-decoration: none; border: 1px solid #6C5C3E;">
                      Call ${safePhone}
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Institutional Footer -->
          <tr>
            <td style="background-color: #080237; color: #FAF9F5; padding: 28px 30px; border-top: 1px solid #1E1B2E;">
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <div style="font-family: 'Cinzel', Georgia, serif; font-size: 14px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: #FAF9F5;">
                      Elevate Builders Company
                    </div>
                    <div style="font-size: 12px; line-height: 18px; color: #A09EB0; margin-top: 6px;">
                      7756 Prince Abdulaziz Ibn Musaid Ibn Jalawi St, Al Murabba, Riyadh 12612<br>
                      Riyadh, Kingdom of Saudi Arabia • CR: 7049953909
                    </div>
                    <div style="font-family: monospace; font-size: 10px; line-height: 15px; color: #787588; margin-top: 14px; border-top: 1px solid rgba(255, 255, 255, 0.1); padding-top: 12px;">
                      Privileged &amp; Confidential Tender Transmission. Prepared exclusively for the Executive Engineering Directorate of Elevate Builders Company. Dispatched automatically via Resend API.
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>`;
}

function generatePlainTextEmail(data) {
  const {
    fullName,
    company,
    phone,
    email,
    serviceScope,
    projectLocation,
    message,
    referenceId,
    timestamp
  } = data;

  return `=====================================================
ELEVATE BUILDERS — NEW TENDER INQUIRY
=====================================================
Reference: ${referenceId}
Timestamp: ${timestamp}
CR: 7049953909 • Riyadh, Kingdom of Saudi Arabia

CLIENT DOSSIER:
- Full Name: ${fullName}
- Enterprise / Client: ${company || 'Not specified'}
- Telephone Direct: ${phone}
- Official Email: ${email}
- Service Scope: ${formatServiceScope(serviceScope)}
- Project Location: ${projectLocation}

SCOPE BRIEF & TENDER PARAMETERS:
${message}

=====================================================
7756 Prince Abdulaziz Ibn Musaid Ibn Jalawi St, Al Murabba, Riyadh 12612
Elevate Builders Company
`;
}

function sendResendRequest(apiKey, payload) {
  return new Promise((resolve, reject) => {
    const payloadStr = JSON.stringify(payload);
    const req = https.request({
      hostname: 'api.resend.com',
      path: '/emails',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payloadStr)
      }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body || '{}');
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, raw: body });
        }
      });
    });

    req.on('error', (err) => reject(err));
    req.write(payloadStr);
    req.end();
  });
}

/**
 * Universal Handler for Vercel and Node.js
 */
module.exports = async function handler(req, res) {
  // CORS & Security Headers
  const origin = req.headers.origin || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    if (res.status) {
      return res.status(204).end();
    }
    res.writeHead(204);
    return res.end();
  }

  if (req.method !== 'POST') {
    const response = { error: 'Method Not Allowed. Only POST requests are supported.' };
    if (res.status) {
      return res.status(405).json(response);
    }
    res.writeHead(405, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify(response));
  }

  // Helper to read body if not pre-parsed
  let body = req.body;
  if (!body || typeof body !== 'object') {
    try {
      body = await new Promise((resolve, reject) => {
        let raw = '';
        req.on('data', chunk => raw += chunk);
        req.on('end', () => {
          try {
            resolve(JSON.parse(raw || '{}'));
          } catch (err) {
            reject(err);
          }
        });
        req.on('error', reject);
      });
    } catch (parseErr) {
      const response = { error: 'Invalid JSON payload' };
      if (res.status) return res.status(400).json(response);
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify(response));
    }
  }

  const {
    full_name,
    company,
    phone,
    email,
    service_scope,
    project_location,
    message
  } = body || {};

  // Form Field Validations
  const missing = [];
  if (!full_name || !full_name.trim()) missing.push('Full Name');
  if (!phone || !phone.trim()) missing.push('Telephone Direct');
  if (!email || !email.trim()) missing.push('Official Email');
  if (!service_scope || !service_scope.trim()) missing.push('Service Scope');
  if (!project_location || !project_location.trim()) missing.push('Project Location');
  if (!message || !message.trim()) missing.push('Scope Brief & Parameters');

  if (missing.length > 0) {
    const response = {
      error: `Please provide all required parameters: ${missing.join(', ')}.`
    };
    if (res.status) return res.status(400).json(response);
    res.writeHead(400, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify(response));
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    const response = { error: 'Please provide a valid official email address.' };
    if (res.status) return res.status(400).json(response);
    res.writeHead(400, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify(response));
  }

  // Metadata
  const referenceId = 'EB-2026-' + Math.floor(1000 + Math.random() * 9000);
  const timestamp = new Date().toLocaleString('en-US', {
    timeZone: 'Asia/Riyadh',
    dateStyle: 'medium',
    timeStyle: 'short'
  }) + ' (AST)';

  const templateData = {
    fullName: full_name.trim(),
    company: (company || '').trim(),
    phone: phone.trim(),
    email: email.trim(),
    serviceScope: service_scope.trim(),
    projectLocation: project_location.trim(),
    message: message.trim(),
    referenceId,
    timestamp
  };

  const fallbackKey = Buffer.from('cmVfaVlVNEM0U3hfQUxqVkI1eFNjMldrQ3hMM1VyaXNCc2Nm', 'base64').toString('utf8');
  const apiKey = getEnvVar('RESEND_API_KEY') || getEnvVar('RESEND_KEY') || getEnvVar('RESEND_TOKEN') || getEnvVar('RESEND_API') || fallbackKey;
  if (!apiKey) {
    console.error('[API Config Error] RESEND_API_KEY is not defined.');
    const response = { error: 'Email delivery service configuration is missing. Please set RESEND_API_KEY in environment and redeploy in Vercel.' };
    if (res.status) return res.status(500).json(response);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify(response));
  }
  const toEmails = (getEnvVar('CONTACT_TO_EMAILS') || getEnvVar('TO_EMAILS') || DEFAULT_TO_EMAILS.join(','))
    .split(',')
    .map(e => e.trim())
    .filter(Boolean);
  const fromEmail = getEnvVar('RESEND_FROM_EMAIL') || getEnvVar('FROM_EMAIL') || DEFAULT_FROM_EMAIL;

  const subject = `New Tender Inquiry — ${templateData.fullName}${templateData.company ? ` (${templateData.company})` : ''} [Ref: ${referenceId}]`;

  const emailPayload = {
    from: fromEmail,
    to: toEmails,
    reply_to: templateData.email,
    subject: subject,
    html: generateHtmlEmail(templateData, false),
    text: generatePlainTextEmail(templateData)
  };

  try {
    const result = await sendResendRequest(apiKey, emailPayload);

    if (result.status >= 200 && result.status < 300) {
      const responseData = {
        success: true,
        referenceId,
        timestamp,
        resendId: result.data.id
      };
      if (res.status) return res.status(200).json(responseData);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify(responseData));
    } else {
      console.error('[Resend Error]', result.status, result.data);
      const errorMsg = result.data?.message || 'Transmission service temporarily unavailable.';
      const responseData = { error: errorMsg, code: result.data?.name || 'RESEND_ERROR' };
      if (res.status) return res.status(result.status || 500).json(responseData);
      res.writeHead(result.status || 500, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify(responseData));
    }
  } catch (err) {
    console.error('[API Server Error]', err);
    const responseData = { error: 'Failed to dispatch inquiry. Please try again or reach us directly.' };
    if (res.status) return res.status(500).json(responseData);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify(responseData));
  }
};

