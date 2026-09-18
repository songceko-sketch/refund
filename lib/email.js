const { Resend } = require('resend');

async function sendEmail(to, subject, html) {
    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.EMAIL_FROM || `RefundGlobal <info@refglob.com>`;

    if (!apiKey) throw new Error('RESEND_API_KEY is not set');

    console.log(`[email] Sending via Resend from=${from} to=${to} subject=${subject}`);
    const resend = new Resend(apiKey);
    const { data, error } = await resend.emails.send({ from, to, subject, html });
    if (error) throw new Error(JSON.stringify(error));
    console.log(`[email] Sent, id=${data.id}`);
}

function emailWrapper(headerColor, headerText, bodyContent) {
    return `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">
      <div style="background:${headerColor};padding:28px 32px;text-align:center">
        <h1 style="color:white;margin:0;font-size:22px">RefundGlobal</h1>
        <p style="color:rgba(255,255,255,0.85);margin:6px 0 0;font-size:14px">${headerText}</p>
      </div>
      <div style="background:#f8fafc;padding:32px;border:1px solid #e2e8f0;border-top:none">
        ${bodyContent}
        <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0" />
        <p style="color:#94a3b8;font-size:12px;text-align:center;margin:0">This is an automated message from RefundGlobal. Please do not reply.</p>
      </div>
    </div>`;
}

function getFrontendUrl() {
  // Use the canonical production frontend URL to ensure email links always
  // point to the live site.
  return 'https://www.refglob.com';
}

module.exports = { sendEmail, emailWrapper, getFrontendUrl };
