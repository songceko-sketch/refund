const sql = require('../../lib/db');
const { cors, requireAdmin } = require('../../lib/middleware');
const { sendEmail, emailWrapper } = require('../../lib/email');

module.exports = async (req, res) => {
    cors(res);
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'PUT') return res.status(405).end();

    const admin = requireAdmin(req, res);
    if (!admin) return;

    const { id } = req.query;
    const { amount, notify_user } = req.body;
    if (amount === undefined || isNaN(amount))
        return res.status(400).json({ error: 'Valid amount is required' });

    try {
        const [refund] = await sql`
            SELECT r.*, u.email FROM refund_requests r
            JOIN users u ON r.user_id = u.id WHERE r.id = ${id}`;
        const oldAmount = refund ? parseFloat(refund.amount).toFixed(2) : '0.00';
        await sql`UPDATE refund_requests SET amount = ${parseFloat(amount)} WHERE id = ${id}`;

        if (refund?.email && notify_user !== false) {
            const newAmount = parseFloat(amount).toFixed(2);
            const bodyContent = `
                <h2 style="color:#1e293b;margin:0 0 12px">📝 Refund Amount Updated</h2>
                <p style="color:#475569">Your refund amount for <strong>${refund.item_name}</strong> has been adjusted.</p>
                <div style="background:white;border:1px solid #e2e8f0;border-radius:8px;padding:18px;margin:20px 0;text-align:center">
                  <p style="margin:0;color:#64748b;font-size:13px">Previous</p>
                  <p style="margin:4px 0 16px;font-size:24px;font-weight:bold;color:#94a3b8;text-decoration:line-through">$${oldAmount}</p>
                  <p style="margin:0;color:#64748b;font-size:13px">New Amount</p>
                  <p style="margin:4px 0 0;font-size:32px;font-weight:bold;color:#16a34a">$${newAmount}</p>
                </div>
                <a href="${process.env.FRONTEND_URL}/dashboard" style="display:inline-block;background:#3b82f6;color:white;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:bold">View Dashboard →</a>`;
            const html = emailWrapper('linear-gradient(135deg,#f59e0b,#d97706)', 'Amount Updated', bodyContent);
            await sendEmail(refund.email, `💰 Refund Amount Updated – "${refund.item_name}"`, html);
        }
        return res.json({ message: 'Amount updated successfully' });
    } catch (e) {
        console.error(e);
        return res.status(500).json({ error: 'Database error' });
    }
};
