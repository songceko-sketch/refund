const sql = require('../../lib/db');
const bcrypt = require('bcryptjs');
const { cors } = require('../../lib/middleware');
const { sendEmail, emailWrapper, getFrontendUrl } = require('../../lib/email');

module.exports = async (req, res) => {
    cors(res);
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).end();

    const email = (req.body.email || '').trim();
    const password = req.body.password;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
    try {
        const hashed = await bcrypt.hash(password, 10);
        await sql`INSERT INTO users (email, password, role) VALUES (${email}, ${hashed}, 'user')`;

        const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_USER;
        if (adminEmail) {
            const bodyContent = `
                <h2 style="color:#1e293b;margin:0 0 12px">👤 New User Registered</h2>
                <p style="color:#475569">A new user has just created an account on RefundFlow.</p>
                <div style="background:white;border:1px solid #e2e8f0;border-radius:8px;padding:18px;margin:20px 0">
                  <table style="width:100%;border-collapse:collapse">
                    <tr><td style="padding:6px 0;color:#64748b;font-size:13px">Email</td><td style="font-weight:bold;color:#1e293b">${email}</td></tr>
                    <tr><td style="padding:6px 0;color:#64748b;font-size:13px">Registered At</td><td style="color:#1e293b">${new Date().toUTCString()}</td></tr>
                  </table>
                </div>
                <a href="${getFrontendUrl()}/dashboard" style="display:inline-block;background:#6366f1;color:white;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:bold">View Admin Panel →</a>`;
            const html = emailWrapper('linear-gradient(135deg,#6366f1,#8b5cf6)', 'New Registration', bodyContent);
            await sendEmail(adminEmail, `👤 New User Registered – ${email}`, html);
        }

        return res.status(201).json({ message: 'User created' });
    } catch (e) {
        if (e.code === '23505') return res.status(400).json({ error: 'Email already exists' });
        return res.status(500).json({ error: 'Internal server error' });
    }
};
