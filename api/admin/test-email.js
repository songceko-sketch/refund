const { cors, requireAdmin } = require('../../lib/middleware');
const { emailWrapper } = require('../../lib/email');
const nodemailer = require('nodemailer');

module.exports = async (req, res) => {
    cors(res);
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'GET') return res.status(405).end();

    const admin = requireAdmin(req, res);
    if (!admin) return;

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS)
        return res.status(400).json({ error: 'Email credentials not configured' });

    try {
        const transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST || 'smtp.gmail.com',
            port: parseInt(process.env.EMAIL_PORT) || 587,
            secure: process.env.EMAIL_SECURE === 'true',
            auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
        });
        const bodyContent = `<h2 style="color:#1e293b;margin:0 0 12px">🧪 Test Email Successful</h2><p style="color:#475569">Your RefundFlow email system is correctly configured!</p>`;
        const html = emailWrapper('linear-gradient(135deg,#16a34a,#15803d)', 'System Test', bodyContent);
        await transporter.sendMail({ from: `"RefundFlow" <${process.env.EMAIL_USER}>`, to: process.env.EMAIL_USER, subject: '✅ RefundFlow Email Test', html });
        return res.json({ message: `Test email sent to ${process.env.EMAIL_USER}` });
    } catch (e) {
        return res.status(500).json({ error: `SMTP Error: ${e.message}` });
    }
};
