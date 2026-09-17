const sql = require('../../lib/db');
const bcrypt = require('bcryptjs');
const { cors } = require('../../lib/middleware');

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
        return res.status(201).json({ message: 'User created' });
    } catch (e) {
        if (e.code === '23505') return res.status(400).json({ error: 'Email already exists' });
        return res.status(500).json({ error: 'Internal server error' });
    }
};
