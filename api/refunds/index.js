const sql = require('../../lib/db');
const { cors, requireAuth, requireAdmin } = require('../../lib/middleware');
const { sendEmail, emailWrapper } = require('../../lib/email');
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
            if (fee_accepted !== 'true')
                return res.status(400).json({ error: 'You must accept the $150 processing fee to proceed.' });

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
