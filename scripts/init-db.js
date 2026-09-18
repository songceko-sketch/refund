// Run once to set up Neon PostgreSQL schema and seed admin user
// Usage: node scripts/init-db.js
require('dotenv').config();
const { neon } = require('@neondatabase/serverless');
const bcrypt = require('bcryptjs');

const sql = neon(process.env.DATABASE_URL);

async function init() {
    await sql`
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            role TEXT DEFAULT 'user'
        )`;

    await sql`
        CREATE TABLE IF NOT EXISTS refund_requests (
            id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(id),
            order_number TEXT NOT NULL,
            item_name TEXT NOT NULL,
            amount NUMERIC NOT NULL,
            reason TEXT,
            phone TEXT,
            contact_email TEXT,
            details TEXT,
            proof_image TEXT,
            fee_accepted INTEGER DEFAULT 0,
            status TEXT DEFAULT 'Pending',
            created_at TIMESTAMPTZ DEFAULT NOW(),
            comment TEXT
        )`;

    // Ensure phone column exists for older installs/migrations
    await sql`ALTER TABLE refund_requests ADD COLUMN IF NOT EXISTS phone TEXT`;
    await sql`ALTER TABLE refund_requests ADD COLUMN IF NOT EXISTS contact_email TEXT`;

    await sql`
        CREATE TABLE IF NOT EXISTS withdrawal_requests (
            id SERIAL PRIMARY KEY,
            refund_id INTEGER UNIQUE REFERENCES refund_requests(id),
            user_id INTEGER REFERENCES users(id),
            payment_method TEXT,
            payment_details TEXT,
            status TEXT DEFAULT 'Pending',
            admin_reply TEXT,
            created_at TIMESTAMPTZ DEFAULT NOW()
        )`;

    const [existing] = await sql`SELECT id FROM users WHERE email = 'info@refglob.com'`;
    if (!existing) {
        const hashed = await bcrypt.hash('admin123', 10);
        await sql`INSERT INTO users (email, password, role) VALUES ('info@refglob.com', ${hashed}, 'superadmin')`;
        console.log('✅ Admin user created');
    } else {
        await sql`UPDATE users SET role = 'superadmin' WHERE email = 'info@refglob.com'`;
        console.log('✅ Admin user updated');
    }
    console.log('✅ Database ready');
}

init().catch(e => { console.error(e); process.exit(1); });
