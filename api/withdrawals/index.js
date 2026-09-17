const sql = require('../../lib/db');
const { cors, requireAuth, requireAdmin } = require('../../lib/middleware');
const { sendEmail, emailWrapper } = require('../../lib/email');

module.exports = async (req, res) => {
    cors(res);
    if (req.method === 'OPTIONS') return res.status(200).end();

    const user = requireAuth(req, res);
    if (!user) return;

    // GET - admin only
    if (req.method === 'GET') {
        const admin = requireAdmin(req, res);
        if (!admin) return;
        try {
            const withdrawals = await sql`
                SELECT w.*, u.email, r.item_name, r.amount, r.status as refund_status
                FROM withdrawal_requests w
                JOIN users u ON w.user_id = u.id
                JOIN refund_requests r ON w.refund_id = r.id
                ORDER BY w.created_at DESC`;
            return res.json(withdrawals);
        } catch (e) {
            console.error(e);
            return res.status(500).json({ error: 'Database error' });
        }
    }

    // POST - user notifies admin they are ready to withdraw
    if (req.method === 'POST') {
        const { refund_id } = req.body;
        if (!refund_id) return res.status(400).json({ error: 'Refund ID is required' });

        try {
            const [refund] = await sql`
                SELECT * FROM refund_requests WHERE id = ${refund_id} AND user_id = ${user.id} AND status = 'Approved'`;
            if (!refund) return res.status(404).json({ error: 'Approved refund not found' });

            const [existing] = await sql`SELECT id FROM withdrawal_requests WHERE refund_id = ${refund_id}`;
            if (existing) return res.status(400).json({ error: 'Withdrawal request already submitted' });

            await sql`INSERT INTO withdrawal_requests (refund_id, user_id, payment_method, payment_details, status)
                VALUES (${refund_id}, ${user.id}, '', '', 'Pending')`;

            const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_USER;
            if (adminEmail) {
                const bodyContent = `
                    <h2 style="color:#1e293b;margin:0 0 12px">🔔 Client Ready to Withdraw</h2>
                    <div style="background:white;border:1px solid #e2e8f0;border-radius:8px;padding:18px;margin:20px 0">
                      <table style="width:100%;border-collapse:collapse">
                        <tr><td style="padding:6px 0;color:#64748b;font-size:13px">User</td><td style="font-weight:bold;color:#1e293b">${user.email}</td></tr>
                        <tr><td style="padding:6px 0;color:#64748b;font-size:13px">Item</td><td style="font-weight:bold;color:#1e293b">${refund.item_name}</td></tr>
                        <tr><td style="padding:6px 0;color:#64748b;font-size:13px">Refund Amount</td><td style="font-weight:bold;color:#16a34a;font-size:18px">$${parseFloat(refund.amount).toFixed(2)}</td></tr>
                      </table>
                    </div>
                    <p style="color:#475569">Please send the client a fee consent notice with processing instructions.</p>
                    <a href="${process.env.FRONTEND_URL}/dashboard" style="display:inline-block;background:#6366f1;color:white;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:bold">Open Admin Panel →</a>`;
                const html = emailWrapper('linear-gradient(135deg,#6366f1,#8b5cf6)', 'Action Required', bodyContent);
                await sendEmail(adminEmail, `🔔 [Action Required] Withdrawal Ready – ${user.email}`, html);
            }
            return res.status(201).json({ message: 'Admin has been notified. You will receive further instructions by email.' });
        } catch (e) {
            console.error(e);
            return res.status(500).json({ error: 'Database error' });
        }
    }

    res.status(405).end();
};
