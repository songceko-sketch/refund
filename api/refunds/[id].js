const sql = require('../../lib/db');
const { cors, requireAdmin } = require('../../lib/middleware');
const { sendEmail, emailWrapper } = require('../../lib/email');

module.exports = async (req, res) => {
    cors(res);
    if (req.method === 'OPTIONS') return res.status(200).end();

    const admin = requireAdmin(req, res);
    if (!admin) return;

    const { id } = req.query;

    // PUT /api/refunds/[id] - approve/reject
    if (req.method === 'PUT') {
        const { status, comment } = req.body;
        if (!['Approved', 'Rejected'].includes(status))
            return res.status(400).json({ error: 'Invalid status' });

        try {
            const [refund] = await sql`
                SELECT r.*, u.email FROM refund_requests r
                JOIN users u ON r.user_id = u.id WHERE r.id = ${id}`;
            await sql`UPDATE refund_requests SET status = ${status}, comment = ${comment || null} WHERE id = ${id}`;

            if (refund?.email) {
                const isApproved = status === 'Approved';
                const bodyContent = isApproved
                    ? `<h2 style="color:#1e293b;margin:0 0 12px">🎉 Your Refund is Approved!</h2>
                       <p style="color:#475569">Your refund for <strong>${refund.item_name}</strong> worth <strong>$${parseFloat(refund.amount).toFixed(2)}</strong> has been <strong style="color:#16a34a">approved</strong>.</p>
                       <div style="background:white;border:1px solid #bfdbfe;border-left:4px solid #3b82f6;border-radius:8px;padding:18px;margin:20px 0">
                         <p style="margin:0;color:#1e40af;font-weight:bold">⚠️ Next Step: Withdraw</p>
                         <p style="color:#475569;margin:8px 0 0">Log in and click <strong>"Withdraw Funds"</strong> to receive your refund.</p>
                       </div>
                       ${comment ? `<p style="color:#475569"><strong>Note:</strong> ${comment}</p>` : ''}
                       <a href="${process.env.FRONTEND_URL}/dashboard" style="display:inline-block;background:#3b82f6;color:white;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:bold">Go to Dashboard →</a>`
                    : `<h2 style="color:#1e293b;margin:0 0 12px">Refund Request Update</h2>
                       <p style="color:#475569">Your refund for <strong>${refund.item_name}</strong> has been <strong style="color:#dc2626">rejected</strong>.</p>
                       ${comment ? `<p style="color:#475569"><strong>Reason:</strong> ${comment}</p>` : ''}`;

                const html = emailWrapper(
                    isApproved ? 'linear-gradient(135deg,#3b82f6,#6366f1)' : 'linear-gradient(135deg,#ef4444,#dc2626)',
                    isApproved ? 'Refund Approved' : 'Refund Rejected',
                    bodyContent
                );
                await sendEmail(refund.email, isApproved ? `✅ Refund Approved – "${refund.item_name}"` : `❌ Refund Update – "${refund.item_name}"`, html);
            }
            return res.json({ message: 'Refund request updated' });
        } catch (e) {
            console.error(e);
            return res.status(500).json({ error: 'Database error' });
        }
    }

    res.status(405).end();
};
