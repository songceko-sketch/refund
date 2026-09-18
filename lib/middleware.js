const jwt = require('jsonwebtoken');

function authenticate(req) {
    const auth = req.headers['authorization'];
    const token = auth && auth.split(' ')[1];
    if (!token) return null;
    const JWT_SECRET = process.env.JWT_SECRET; // read at runtime to avoid cold-start capture
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch {
        return null;
    }
}

function requireAuth(req, res) {
    const user = authenticate(req);
    if (!user) { res.status(401).json({ error: 'Unauthorized' }); return null; }
    return user;
}

function requireAdmin(req, res) {
    const user = requireAuth(req, res);
    if (!user) return null;
    if (user.role !== 'admin' && user.role !== 'superadmin') {
        res.status(403).json({ error: 'Admin access required' });
        return null;
    }
    return user;
}

function requireSuperAdmin(req, res) {
    const user = requireAuth(req, res);
    if (!user) return null;
    if (user.role !== 'superadmin') {
        res.status(403).json({ error: 'Super Admin access required' });
        return null;
    }
    return user;
}

function cors(res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
}

module.exports = { authenticate, requireAuth, requireAdmin, requireSuperAdmin, cors };
