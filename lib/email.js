const nodemailer = require('nodemailer');

async function sendEmail(to, subject, html) {
    const host = process.env.EMAIL_HOST;
    const port = parseInt(process.env.EMAIL_PORT) || 465;
    const user = process.env.EMAIL_USER;
    const pass = process.env.EMAIL_PASS;

    console.log(`[email] host=${host} port=${port} user=${user} to=${to}`);

    if (!user || !pass) throw new Error(`Missing credentials: user=${user} pass=${pass ? '***' : 'MISSING'}`);
    if (!host) throw new Error('EMAIL_HOST is not set');

    const transporter = nodemailer.createTransport({
        host, port, secure: port === 465,
        auth: { user, pass },
        logger: true,
        debug: true,
    });

    await transporter.verify();
    console.log('[email] SMTP verified, sending...');
    await transporter.sendMail({ from: `"RefundGlobal" <${user}>`, to, subject, html });
    console.log(`[email] Sent to ${to}`);
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

module.exports = { sendEmail, emailWrapper };
