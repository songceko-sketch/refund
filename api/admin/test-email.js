const { cors, requireAdmin } = require('../../lib/middleware');
const { sendEmail, emailWrapper } = require('../../lib/email');

module.exports = async (req, res) => {
    cors(res);
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'GET') return res.status(405).end();

    const admin = requireAdmin(req, res);
    if (!admin) return;

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS)
        return res.status(400).json({ error: 'EMAIL_USER or EMAIL_PASS not set in environment variables' });

    try {
        const bodyContent = `<h2 style="color:#1e293b;margin:0 0 12px">🧪 Test Email Successful</h2><p style="color:#475569">Your RefundGlobal email system is correctly configured and sending.</p>`;
        const html = emailWrapper('linear-gradient(135deg,#16a34a,#15803d)', 'System Test', bodyContent);
        await sendEmail(process.env.EMAIL_USER, '✅ RefundGlobal Email Test', html);
        return res.json({ message: `Test email sent to ${process.env.EMAIL_USER}` });
    } catch (e) {
        return res.status(500).json({ error: `SMTP Error: ${e.message}` });
    }
};
