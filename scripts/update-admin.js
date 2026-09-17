require('dotenv').config();
const { neon } = require('@neondatabase/serverless');
const sql = neon(process.env.DATABASE_URL);
sql`UPDATE users SET email = 'info@refglob.com' WHERE email = 'admin@refunds.com'`
    .then(() => { console.log('✅ Admin email updated to info@refglob.com'); process.exit(); })
    .catch(e => { console.error(e); process.exit(1); });
