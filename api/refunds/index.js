const sql = require('../../lib/db');
const { cors, requireAuth, requireAdmin } = require('../../lib/middleware');
const { sendEmail, emailWrapper, getFrontendUrl } = require('../../lib/email');
const { uploadImage } = require('../../lib/cloudinary');
const multiparty = require('multiparty');
const fs = require('fs');

module.exports = async (req, res) => {
    cors(res);
    if (req.method === 'OPTIONS') return res.status(200).end();

    const user = requireAuth(req, res);
    if (!user) return;

    // GET - fetch refunds
    if (req.method === 'GET') {
        try {
            let refunds;
            if (user.role === 'admin' || user.role === 'superadmin') {
                refunds = await sql`
                    SELECT r.*, u.email FROM refund_requests r
                    JOIN users u ON r.user_id = u.id
                    ORDER BY r.created_at DESC`;
            } else {
                refunds = await sql`
                    SELECT * FROM refund_requests WHERE user_id = ${user.id}
                    ORDER BY created_at DESC`;
            }
            if (refunds.length > 0) {
                const ids = refunds.map(r => r.id);
                const withdrawals = await sql`SELECT * FROM withdrawal_requests WHERE refund_id = ANY(${ids})`;
                const wMap = Object.fromEntries(withdrawals.map(w => [w.refund_id, w]));
                refunds.forEach(r => { r.withdrawal = wMap[r.id] || null; });
            }
            return res.json(refunds);
        } catch (e) {
            console.error(e);
            return res.status(500).json({ error: 'Error fetching refunds' });
        }
    }

    // POST - submit refund
    if (req.method === 'POST') {
        const form = new multiparty.Form();
        form.parse(req, async (err, fields, files) => {
            if (err) return res.status(400).json({ error: 'Form parse error' });
            const get = k => (fields[k] || [''])[0];
            const order_number = get('order_number');
            const item_name = get('item_name');
            const amount = get('amount');
            const reason = get('reason');
            const details = get('details');
            const fee_accepted = get('fee_accepted');

            if (!order_number || !item_name || !amount || !reason)
                return res.status(400).json({ error: 'Please provide all required fields.' });

            let proof_image = null;
            const file = files.proof_image && files.proof_image[0];
            if (file) {
                try {
                    const buffer = fs.readFileSync(file.path);
                    proof_image = await uploadImage(buffer, `${Date.now()}-${file.originalFilename}`);
                } catch (e) {
                    console.error('Upload error:', e);
                }
            }

            try {
                await sql`INSERT INTO refund_requests (user_id, order_number, item_name, amount, reason, details, proof_image, fee_accepted)
                    VALUES (${user.id}, ${order_number}, ${item_name}, ${parseFloat(amount)}, ${reason}, ${details}, ${proof_image}, 1)`;

                const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_USER;
                if (adminEmail) {
                    const bodyContent = `
                        <h2 style="color:#1e293b;margin:0 0 12px">📥 New Refund Request</h2>
                        <p style="color:#475569">A user has submitted a new refund request that requires your review.</p>
                        <div style="background:white;border:1px solid #e2e8f0;border-radius:8px;padding:18px;margin:20px 0">
                          <table style="width:100%;border-collapse:collapse">
                            <tr><td style="padding:6px 0;color:#64748b;font-size:13px">User</td><td style="font-weight:bold;color:#1e293b">${user.email}</td></tr>
                            <tr><td style="padding:6px 0;color:#64748b;font-size:13px">Order #</td><td style="color:#1e293b">${order_number}</td></tr>
                            <tr><td style="padding:6px 0;color:#64748b;font-size:13px">Item</td><td style="font-weight:bold;color:#1e293b">${item_name}</td></tr>
                            <tr><td style="padding:6px 0;color:#64748b;font-size:13px">Amount</td><td style="font-weight:bold;color:#16a34a;font-size:18px">$${parseFloat(amount).toFixed(2)}</td></tr>
                            <tr><td style="padding:6px 0;color:#64748b;font-size:13px">Reason</td><td style="color:#1e293b">${reason}</td></tr>
                            <tr><td style="padding:6px 0;color:#64748b;font-size:13px">Details</td><td style="color:#475569">${details || 'N/A'}</td></tr>
                          </table>
                        </div>
                        <a href="${getFrontendUrl()}/dashboard" style="display:inline-block;background:#3b82f6;color:white;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:bold">Review Request →</a>`;
                    const html = emailWrapper('linear-gradient(135deg,#3b82f6,#6366f1)', 'New Refund Request', bodyContent);
                    await sendEmail(adminEmail, `📥 New Refund Request – ${user.email}`, html);
                }

                return res.status(201).json({ message: 'Refund request submitted successfully.' });
            } catch (e) {
                console.error(e);
                return res.status(500).json({ error: 'Database error' });
            }
        });
        return;
    }

    res.status(405).end();
};
