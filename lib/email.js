const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_SECURE === 'true',
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
});

async function sendEmail(to, subject, html) {
    if (!process.env.EMAIL_USER) return;
    try {
        await transporter.sendMail({ from: `"RefundFlow" <${process.env.EMAIL_USER}>`, to, subject, html });
    } catch (err) {
        console.error('Email error:', err.message);
    }
}

function emailWrapper(headerColor, headerText, bodyContent) {
    return `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">
      <div style="background:${headerColor};padding:28px 32px;text-align:center">
        <h1 style="color:white;margin:0;font-size:22px">RefundFlow</h1>
        <p style="color:rgba(255,255,255,0.85);margin:6px 0 0;font-size:14px">${headerText}</p>
      </div>
      <div style="background:#f8fafc;padding:32px;border:1px solid #e2e8f0;border-top:none">
        ${bodyContent}
        <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0" />
        <p style="color:#94a3b8;font-size:12px;text-align:center;margin:0">This is an automated message from RefundFlow. Please do not reply.</p>
      </div>
    </div>`;
}

module.exports = { sendEmail, emailWrapper };
