const sql = require('../../../lib/db');
const { cors, requireAdmin } = require('../../../lib/middleware');
const { sendEmail, emailWrapper } = require('../../../lib/email');

module.exports = async (req, res) => {
    cors(res);
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'PUT') return res.status(405).end();

    const admin = requireAdmin(req, res);
    if (!admin) return;

    const { id } = req.query;
    const { status, admin_reply } = req.body;
    if (!['Approved', 'Rejected', 'Awaiting Payment'].includes(status))
        return res.status(400).json({ error: 'Invalid status' });

    try {
        const [w] = await sql`
            SELECT w.*, u.email, r.item_name, r.amount
            FROM withdrawal_requests w
            JOIN users u ON w.user_id = u.id
            JOIN refund_requests r ON w.refund_id = r.id
            WHERE w.id = ${id}`;

        await sql`UPDATE withdrawal_requests SET status = ${status}, admin_reply = ${admin_reply || null} WHERE id = ${id}`;

        if (w?.email) {
            let subject, bodyContent, headerColor, headerLabel;
            if (status === 'Awaiting Payment') {
                subject = `⚠️ Payment Instructions – "${w.item_name}"`;
                headerColor = 'linear-gradient(135deg,#f59e0b,#d97706)';
                headerLabel = 'Payment Instructions';
                bodyContent = `
                    <h2 style="color:#1e293b;margin:0 0 12px">📋 Payment Instructions Ready</h2>
                    <p style="color:#475569">To finalize your withdrawal of <strong style="color:#16a34a">$${parseFloat(w.amount).toFixed(2)}</strong>, complete the <strong>$150.00 processing fee</strong>:</p>
                    <div style="background:white;border:2px dashed #f59e0b;border-radius:10px;padding:20px;margin:20px 0">
                      <pre style="margin:0;font-family:monospace;font-size:15px;color:#1e293b;white-space:pre-wrap">${admin_reply || 'No instructions provided.'}</pre>
                    </div>
                    <a href="${process.env.FRONTEND_URL}/dashboard" style="display:inline-block;background:#f59e0b;color:white;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:bold">View Dashboard →</a>`;
            } else if (status === 'Approved') {
                subject = `🎉 Withdrawal Processed – "${w.item_name}"`;
                headerColor = 'linear-gradient(135deg,#16a34a,#15803d)';
                headerLabel = 'Withdrawal Approved';
                bodyContent = `
                    <h2 style="color:#1e293b;margin:0 0 12px">🎉 Funds Released!</h2>
                    <p style="color:#475569">Your withdrawal of <strong style="color:#16a34a;font-size:20px">$${parseFloat(w.amount).toFixed(2)}</strong> for <strong>${w.item_name}</strong> has been approved.</p>
                    ${admin_reply ? `<div style="background:white;border:1px solid #bbf7d0;border-left:4px solid #16a34a;border-radius:8px;padding:16px;margin:20px 0"><p style="margin:0;color:#166534"><strong>Note:</strong> ${admin_reply}</p></div>` : ''}`;
            } else {
                subject = `❌ Withdrawal Cancelled – "${w.item_name}"`;
                headerColor = 'linear-gradient(135deg,#ef4444,#dc2626)';
                headerLabel = 'Withdrawal Cancelled';
                bodyContent = `
                    <h2 style="color:#1e293b;margin:0 0 12px">Withdrawal Cancelled</h2>
                    <p style="color:#475569">Your withdrawal for <strong>${w.item_name}</strong> has been rejected.</p>
                    ${admin_reply ? `<div style="background:white;border:1px solid #fecaca;border-left:4px solid #ef4444;border-radius:8px;padding:16px;margin:20px 0"><p style="margin:0;color:#991b1b"><strong>Reason:</strong> ${admin_reply}</p></div>` : ''}`;
            }
            const html = emailWrapper(headerColor, headerLabel, bodyContent);
            await sendEmail(w.email, subject, html);
        }
        return res.json({ message: 'Withdrawal updated' });
    } catch (e) {
        console.error(e);
        return res.status(500).json({ error: 'Database error' });
    }
};
