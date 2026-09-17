const sql = require('../../lib/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { cors } = require('../../lib/middleware');

module.exports = async (req, res) => {
    cors(res);
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).end();

    const email = (req.body.email || '').trim();
    const password = req.body.password;
    const [user] = await sql`SELECT * FROM users WHERE LOWER(email) = LOWER(${email})`;
    if (user && await bcrypt.compare(password, user.password)) {
        const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: '8h' });
        return res.json({ token, role: user.role, email: user.email });
    }
    return res.status(401).json({ error: 'Invalid credentials' });
};
