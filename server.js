const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const dotenv = require('dotenv');
const multer = require('multer');
const nodemailer = require('nodemailer');
const fs = require('fs');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'secret_key_123';

const DATA_DIR = process.env.DATA_DIR || __dirname;
const uploadsDir = path.join(DATA_DIR, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadsDir),
    filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(uploadsDir));

let db;

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
    auth: {
        user: process.env.EMAIL_USER || '',
        pass: process.env.EMAIL_PASS || ''
    }
});

async function sendEmail(to, subject, html) {
    if (!process.env.EMAIL_USER) return;
    try {
        await transporter.sendMail({ from: `"RefundFlow" <${process.env.EMAIL_USER}>`, to, subject, html });
        console.log(`Email sent to ${to}`);
    } catch (err) {
        console.error('Email error:', err.message);
    }
}

// ─── Reusable email wrapper ───────────────────────────────────────────────────
function emailWrapper(headerColor, headerText, bodyContent) {
    return `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">
      <div style="background:${headerColor};padding:28px 32px;text-align:center">
        <h1 style="color:white;margin:0;font-size:22px;letter-spacing:-0.5px">RefundFlow</h1>
        <p style="color:rgba(255,255,255,0.85);margin:6px 0 0;font-size:14px">${headerText}</p>
      </div>
      <div style="background:#f8fafc;padding:32px;border:1px solid #e2e8f0;border-top:none">
        ${bodyContent}
        <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0" />
        <p style="color:#94a3b8;font-size:12px;text-align:center;margin:0">This is an automated message from RefundFlow. Please do not reply.</p>
      </div>
    </div>`;
}

async function setupDatabase() {
    db = await open({
        filename: path.join(DATA_DIR, 'database.sqlite'),
        driver: sqlite3.Database
    });

    await db.exec(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            role TEXT DEFAULT 'user'
        );

        CREATE TABLE IF NOT EXISTS refund_requests (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            order_number TEXT NOT NULL,
            item_name TEXT NOT NULL,
            amount REAL NOT NULL,
            reason TEXT,
            details TEXT,
            proof_image TEXT,
            fee_accepted INTEGER DEFAULT 0,
            status TEXT DEFAULT 'Pending',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            comment TEXT,
            FOREIGN KEY (user_id) REFERENCES users (id)
        );

        CREATE TABLE IF NOT EXISTS withdrawal_requests (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            refund_id INTEGER UNIQUE,
            user_id INTEGER,
            payment_method TEXT,
            payment_details TEXT,
            status TEXT DEFAULT 'Pending',
            admin_reply TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (refund_id) REFERENCES refund_requests (id),
            FOREIGN KEY (user_id) REFERENCES users (id)
        );
    `);

    const adminEmail = 'admin@refunds.com';
    const adminUser = await db.get('SELECT * FROM users WHERE email = ?', [adminEmail]);
    if (!adminUser) {
        const hashedPassword = await bcrypt.hash('admin123', 10);
        await db.run('INSERT INTO users (email, password, role) VALUES (?, ?, ?)', [adminEmail, hashedPassword, 'superadmin']);
    } else {
        await db.run('UPDATE users SET role = ? WHERE email = ?', ['superadmin', adminEmail]);
    }
}

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token == null) return res.sendStatus(401);
    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

const requireAdmin = (req, res, next) => {
    if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
        return res.status(403).json({ error: 'Admin access required' });
    }
    next();
};

const requireSuperAdmin = (req, res, next) => {
    if (req.user.role !== 'superadmin') return res.status(403).json({ error: 'Super Admin access required' });
    next();
};

// ─── Auth Routes ──────────────────────────────────────────────────────────────
app.post('/api/auth/register', async (req, res) => {
    const email = (req.body.email || '').trim();
    const password = req.body.password;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        await db.run('INSERT INTO users (email, password, role) VALUES (?, ?, ?)', [email, hashedPassword, 'user']);
        res.status(201).json({ message: 'User created' });
    } catch (error) {
        if (error.code === 'SQLITE_CONSTRAINT') res.status(400).json({ error: 'Email already exists' });
        else res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/auth/admin', authenticateToken, requireSuperAdmin, async (req, res) => {
    const email = (req.body.email || '').trim();
    const password = req.body.password;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        await db.run('INSERT INTO users (email, password, role) VALUES (?, ?, ?)', [email, hashedPassword, 'admin']);
        res.status(201).json({ message: 'New admin activated successfully' });
    } catch (error) {
        if (error.code === 'SQLITE_CONSTRAINT') res.status(400).json({ error: 'Email already exists' });
        else res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/auth/login', async (req, res) => {
    const email = (req.body.email || '').trim();
    const password = req.body.password;
    const user = await db.get('SELECT * FROM users WHERE LOWER(email) = LOWER(?)', [email]);
    if (user && await bcrypt.compare(password, user.password)) {
        const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '8h' });
        res.json({ token, role: user.role, email: user.email });
    } else {
        res.status(401).json({ error: 'Invalid credentials' });
    }
});

// ─── Refund Routes ────────────────────────────────────────────────────────────
app.post('/api/refunds', authenticateToken, upload.single('proof_image'), async (req, res) => {
    const { order_number, item_name, amount, reason, details, fee_accepted } = req.body;
    if (!order_number || !item_name || !amount || !reason) {
        return res.status(400).json({ error: 'Please provide all required fields.' });
    }
    if (!fee_accepted || fee_accepted !== 'true') {
        return res.status(400).json({ error: 'You must accept the $150 processing fee to proceed.' });
    }
    try {
        const proofImage = req.file ? req.file.filename : null;
        await db.run(
            'INSERT INTO refund_requests (user_id, order_number, item_name, amount, reason, details, proof_image, fee_accepted) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [req.user.id, order_number, item_name, parseFloat(amount), reason, details, proofImage, 1]
        );
        res.status(201).json({ message: 'Refund request submitted successfully.' });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Database error' });
    }
});

app.get('/api/refunds', authenticateToken, async (req, res) => {
    try {
        let refunds;
        if (req.user.role === 'admin' || req.user.role === 'superadmin') {
            refunds = await db.all(`
                SELECT r.*, u.email 
                FROM refund_requests r
                JOIN users u ON r.user_id = u.id
                ORDER BY r.created_at DESC
            `);
        } else {
            refunds = await db.all(`
                SELECT * FROM refund_requests 
                WHERE user_id = ?
                ORDER BY created_at DESC
            `, [req.user.id]);
        }

        // Optimize: Fetch all relevant withdrawals in one query to avoid N+1 problem
        const refundIds = refunds.map(r => r.id);
        if (refundIds.length > 0) {
            const placeholders = refundIds.map(() => '?').join(',');
            const withdrawals = await db.all(
                `SELECT * FROM withdrawal_requests WHERE refund_id IN (${placeholders})`,
                refundIds
            );
            const withdrawalMap = Object.fromEntries(withdrawals.map(w => [w.refund_id, w]));
            refunds.forEach(r => {
                r.withdrawal = withdrawalMap[r.id] || null;
            });
        }

        res.json(refunds);
    } catch (e) {
        console.error('Error fetching refunds:', e);
        res.status(500).json({ error: 'Error fetching refunds' });
    }
});

// Admin: approve/reject refund request
app.put('/api/refunds/:id', authenticateToken, requireAdmin, async (req, res) => {
    const { status, comment } = req.body;
    if (!['Approved', 'Rejected'].includes(status)) return res.status(400).json({ error: 'Invalid status' });

    try {
        const refund = await db.get(`
            SELECT r.*, u.email
            FROM refund_requests r
            JOIN users u ON r.user_id = u.id
            WHERE r.id = ?
        `, [req.params.id]);

        await db.run('UPDATE refund_requests SET status = ?, comment = ? WHERE id = ?', [status, comment, req.params.id]);

        if (refund && refund.email) {
            const isApproved = status === 'Approved';
            const subject = isApproved
                ? `✅ Your Refund for "${refund.item_name}" Has Been Approved!`
                : `❌ Refund Update for "${refund.item_name}"`;

            const bodyContent = isApproved
                ? `<h2 style="color:#1e293b;margin:0 0 12px">🎉 Your Refund is Approved!</h2>
                   <p style="color:#475569">Great news! Your refund request for <strong>${refund.item_name}</strong> worth <strong>$${parseFloat(refund.amount).toFixed(2)}</strong> has been <strong style="color:#16a34a">approved</strong>.</p>
                   <div style="background:white;border:1px solid #bfdbfe;border-left:4px solid #3b82f6;border-radius:8px;padding:18px;margin:20px 0">
                     <p style="margin:0;color:#1e40af;font-weight:bold">⚠️ Next Step: Pay Processing Fee &amp; Withdraw</p>
                     <p style="color:#475569;margin:8px 0 0">To withdraw your refund of <strong>$${parseFloat(refund.amount).toFixed(2)}</strong>, log in to your RefundFlow dashboard and click <strong>"Notify Admin – Ready to Withdraw"</strong>. Your admin will then send you payment instructions.</p>
                   </div>
                   ${comment ? `<p style="color:#475569"><strong>Note from admin:</strong> ${comment}</p>` : ''}
                   <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard" style="display:inline-block;background:#3b82f6;color:white;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:bold;margin-top:8px">Go to Dashboard →</a>`
                : `<h2 style="color:#1e293b;margin:0 0 12px">Refund Request Update</h2>
                   <p style="color:#475569">Unfortunately, your refund request for <strong>${refund.item_name}</strong> has been <strong style="color:#dc2626">rejected</strong>.</p>
                   ${comment ? `<p style="color:#475569"><strong>Reason:</strong> ${comment}</p>` : ''}`;

            const html = emailWrapper(
                isApproved ? 'linear-gradient(135deg,#3b82f6,#6366f1)' : 'linear-gradient(135deg,#ef4444,#dc2626)',
                isApproved ? 'Refund Approved' : 'Refund Rejected',
                bodyContent
            );
            await sendEmail(refund.email, subject, html);
        }
        res.json({ message: 'Refund request updated' });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Database error' });
    }
});

// Admin: edit refund amount (with optional user notification email)
app.put('/api/refunds/:id/amount', authenticateToken, requireAdmin, async (req, res) => {
    const { amount, notify_user } = req.body;
    if (amount === undefined || isNaN(amount)) return res.status(400).json({ error: 'Valid amount is required' });

    try {
        const refund = await db.get(`
            SELECT r.*, u.email
            FROM refund_requests r
            JOIN users u ON r.user_id = u.id
            WHERE r.id = ?
        `, [req.params.id]);

        const oldAmount = refund ? parseFloat(refund.amount).toFixed(2) : '0.00';
        await db.run('UPDATE refund_requests SET amount = ? WHERE id = ?', [parseFloat(amount), req.params.id]);

        // Notify user of amount change
        if (refund && refund.email && notify_user !== false) {
            const newAmount = parseFloat(amount).toFixed(2);
            const bodyContent = `
                <h2 style="color:#1e293b;margin:0 0 12px">📝 Your Refund Amount Has Been Updated</h2>
                <p style="color:#475569">Your admin has adjusted the expected refund amount for <strong>${refund.item_name}</strong>.</p>
                <div style="background:white;border:1px solid #e2e8f0;border-radius:8px;padding:18px;margin:20px 0;text-align:center">
                  <p style="margin:0;color:#64748b;font-size:13px">Previous Amount</p>
                  <p style="margin:4px 0 16px;font-size:24px;font-weight:bold;color:#94a3b8;text-decoration:line-through">$${oldAmount}</p>
                  <p style="margin:0;color:#64748b;font-size:13px">New Amount</p>
                  <p style="margin:4px 0 0;font-size:32px;font-weight:bold;color:#16a34a">$${newAmount}</p>
                </div>
                <p style="color:#475569">Log in to your dashboard to see the updated amount reflected on your refund.</p>
                <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard" style="display:inline-block;background:#3b82f6;color:white;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:bold;margin-top:8px">View Dashboard →</a>`;
            const html = emailWrapper('linear-gradient(135deg,#f59e0b,#d97706)', 'Amount Updated', bodyContent);
            await sendEmail(refund.email, `💰 Your Refund Amount Updated – "${refund.item_name}"`, html);
        }

        res.json({ message: 'Amount updated successfully' });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Database error' });
    }
});

// ─── Withdrawal Routes ────────────────────────────────────────────────────────

// User: notify admin they are ready to withdraw (user provides payment choice for fee)
app.post('/api/withdrawals', authenticateToken, async (req, res) => {
    const { refund_id, payment_method, payment_details } = req.body;
    if (!refund_id) return res.status(400).json({ error: 'Refund ID is required' });
    if (!payment_method || !payment_details) return res.status(400).json({ error: 'Payment method and details are required' });

    try {
        const refund = await db.get(
            'SELECT * FROM refund_requests WHERE id = ? AND user_id = ? AND status = ?',
            [refund_id, req.user.id, 'Approved']
        );
        if (!refund) return res.status(404).json({ error: 'Approved refund not found' });

        const existing = await db.get('SELECT * FROM withdrawal_requests WHERE refund_id = ?', [refund_id]);
        if (existing) return res.status(400).json({ error: 'Withdrawal request already submitted' });

        await db.run(
            'INSERT INTO withdrawal_requests (refund_id, user_id, payment_method, payment_details, status) VALUES (?, ?, ?, ?, ?)',
            [refund_id, req.user.id, payment_method, payment_details, 'Pending']
        );

        // Notify all admins by email
        const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_USER;
        if (adminEmail) {
            const bodyContent = `
                <h2 style="color:#1e293b;margin:0 0 12px">🔔 New Withdrawal Request</h2>
                <p style="color:#475569">A user has requested to withdraw their approved refund. They have specified their preferred method for paying the fee.</p>
                <div style="background:white;border:1px solid #e2e8f0;border-radius:8px;padding:18px;margin:20px 0">
                  <table style="width:100%;border-collapse:collapse">
                    <tr><td style="padding:6px 0;color:#64748b;font-size:13px">User Email</td><td style="padding:6px 0;font-weight:bold;color:#1e293b">${req.user.email}</td></tr>
                    <tr><td style="padding:6px 0;color:#64748b;font-size:13px">Item</td><td style="padding:6px 0;font-weight:bold;color:#1e293b">${refund.item_name}</td></tr>
                    <tr><td style="padding:6px 0;color:#64748b;font-size:13px">Refund Amount</td><td style="padding:6px 0;font-weight:bold;color:#16a34a;font-size:18px">$${parseFloat(refund.amount).toFixed(2)}</td></tr>
                    <tr><td style="padding:6px 0;color:#64748b;font-size:13px">Fee Method</td><td style="padding:6px 0;font-weight:bold;color:#3b82f6;text-transform:capitalize">${payment_method}</td></tr>
                    <tr><td style="padding:6px 0;color:#64748b;font-size:13px">Method Details</td><td style="padding:6px 0;color:#1e293b;font-family:monospace">${payment_details}</td></tr>
                  </table>
                </div>
                <p style="color:#475569">Log in to the admin panel to provide specific instructions to the user.</p>
                <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard" style="display:inline-block;background:#6366f1;color:white;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:bold;margin-top:8px">Open Admin Panel →</a>`;
            const html = emailWrapper('linear-gradient(135deg,#6366f1,#8b5cf6)', 'Action Required', bodyContent);
            await sendEmail(adminEmail, `🔔 [Action Required] Withdrawal Request – ${req.user.email}`, html);
        }

        res.status(201).json({ message: 'Withdrawal request submitted. Your admin will send you payment instructions shortly.' });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Database error' });
    }
});

app.get('/api/withdrawals', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const withdrawals = await db.all(`
            SELECT w.*, u.email, r.item_name, r.amount, r.status as refund_status
            FROM withdrawal_requests w
            JOIN users u ON w.user_id = u.id
            JOIN refund_requests r ON w.refund_id = r.id
            ORDER BY w.created_at DESC
        `);
        res.json(withdrawals);
    } catch (e) {
        console.error('Error fetching withdrawals:', e);
        res.status(500).json({ error: 'Database error fetching withdrawals' });
    }
});

// Admin: update withdrawal status + send stylized user email
app.put('/api/withdrawals/:id', authenticateToken, requireAdmin, async (req, res) => {
    const { status, admin_reply } = req.body;
    if (!['Approved', 'Rejected', 'Awaiting Payment'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
    }
    try {
        const withdrawal = await db.get(`
            SELECT w.*, u.email, r.item_name, r.amount
            FROM withdrawal_requests w
            JOIN users u ON w.user_id = u.id
            JOIN refund_requests r ON w.refund_id = r.id
            WHERE w.id = ?
        `, [req.params.id]);

        await db.run(
            'UPDATE withdrawal_requests SET status = ?, admin_reply = ? WHERE id = ?',
            [status, admin_reply, req.params.id]
        );

        if (withdrawal && withdrawal.email) {
            let subject, bodyContent, headerColor, headerLabel;

            if (status === 'Awaiting Payment') {
                subject = `⚠️ Payment Instructions for Your "${withdrawal.item_name}" Withdrawal`;
                headerColor = 'linear-gradient(135deg,#f59e0b,#d97706)';
                headerLabel = 'Payment Instructions';
                bodyContent = `
                    <h2 style="color:#1e293b;margin:0 0 12px">📋 Your Payment Instructions Are Ready</h2>
                    <p style="color:#475569">To finalize your withdrawal of <strong style="color:#16a34a;font-size:18px">$${parseFloat(withdrawal.amount).toFixed(2)}</strong>, please complete the <strong>$150.00 processing fee</strong> using the instructions below:</p>
                    <div style="background:white;border:2px dashed #f59e0b;border-radius:10px;padding:20px;margin:20px 0">
                      <p style="margin:0 0 8px;font-size:12px;text-transform:uppercase;letter-spacing:1px;color:#92400e;font-weight:bold">Payment Instructions from Admin</p>
                      <pre style="margin:0;font-family:monospace;font-size:15px;color:#1e293b;white-space:pre-wrap">${admin_reply || 'No instructions provided.'}</pre>
                    </div>
                    <p style="color:#475569">Once you have sent the payment, your admin will approve the withdrawal and release your funds. You will receive a confirmation email.</p>
                    <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard" style="display:inline-block;background:#f59e0b;color:white;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:bold;margin-top:8px">View My Dashboard →</a>`;
            } else if (status === 'Approved') {
                subject = `🎉 Your Withdrawal for "${withdrawal.item_name}" Has Been Processed!`;
                headerColor = 'linear-gradient(135deg,#16a34a,#15803d)';
                headerLabel = 'Withdrawal Approved';
                bodyContent = `
                    <h2 style="color:#1e293b;margin:0 0 12px">🎉 Funds Released!</h2>
                    <p style="color:#475569">Your withdrawal of <strong style="color:#16a34a;font-size:20px">$${parseFloat(withdrawal.amount).toFixed(2)}</strong> for <strong>${withdrawal.item_name}</strong> has been approved and your funds are being released.</p>
                    ${admin_reply ? `<div style="background:white;border:1px solid #bbf7d0;border-left:4px solid #16a34a;border-radius:8px;padding:16px;margin:20px 0"><p style="margin:0;color:#166534"><strong>Admin Note:</strong> ${admin_reply}</p></div>` : ''}
                    <p style="color:#475569">Thank you for using RefundFlow!</p>`;
            } else if (status === 'Rejected') {
                subject = `❌ Withdrawal Update for "${withdrawal.item_name}"`;
                headerColor = 'linear-gradient(135deg,#ef4444,#dc2626)';
                headerLabel = 'Withdrawal Cancelled';
                bodyContent = `
                    <h2 style="color:#1e293b;margin:0 0 12px">Withdrawal Request Cancelled</h2>
                    <p style="color:#475569">Unfortunately, your withdrawal request for <strong>${withdrawal.item_name}</strong> has been rejected.</p>
                    ${admin_reply ? `<div style="background:white;border:1px solid #fecaca;border-left:4px solid #ef4444;border-radius:8px;padding:16px;margin:20px 0"><p style="margin:0;color:#991b1b"><strong>Reason:</strong> ${admin_reply}</p></div>` : ''}
                    <p style="color:#475569">If you believe this is a mistake, please contact support.</p>`;
            }

            const html = emailWrapper(headerColor, headerLabel, bodyContent);
            await sendEmail(withdrawal.email, subject, html);
        }

        res.json({ message: 'Withdrawal updated' });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Database error' });
    }
});

// Admin: Test email configuration
app.get('/api/admin/test-email', authenticateToken, requireAdmin, async (req, res) => {
    try {
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            return res.status(400).json({ error: 'Email credentials not configured in .env' });
        }

        const bodyContent = `
            <h2 style="color:#1e293b;margin:0 0 12px">🧪 Test Email Successful</h2>
            <p style="color:#475569">If you are reading this, your RefundFlow email system is correctly configured and ready to send notifications!</p>
            <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px;margin:20px 0">
              <p style="margin:0;color:#166534;font-weight:bold">Configuration Details:</p>
              <ul style="margin:8px 0 0;padding-left:20px;color:#166534;font-size:13px">
                <li>Host: ${process.env.EMAIL_HOST}</li>
                <li>Port: ${process.env.EMAIL_PORT}</li>
                <li>User: ${process.env.EMAIL_USER}</li>
              </ul>
            </div>`;
        const html = emailWrapper('linear-gradient(135deg,#16a34a,#15803d)', 'System Test', bodyContent);
        
        await transporter.sendMail({ 
            from: `"RefundFlow" <${process.env.EMAIL_USER}>`, 
            to: process.env.EMAIL_USER, 
            subject: '✅ RefundFlow Email Test', 
            html 
        });

        res.json({ message: `Test email sent to ${process.env.EMAIL_USER}` });
    } catch (e) {
        console.error('Test email failed:', e);
        res.status(500).json({ error: `SMTP Error: ${e.message}` });
    }
});

// ─── Static / SPA Fallback ────────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, 'frontend/dist')));
app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api') && !req.path.startsWith('/uploads')) {
        res.sendFile(path.join(__dirname, 'frontend/dist', 'index.html'));
    } else {
        next();
    }
});

setupDatabase().then(() => {
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
}).catch(console.error);
