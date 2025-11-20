import { Client } from 'pg';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function migrate() {
    const dbPassword = process.env.SUPABASE_DB_PASSWORD;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

    if (!dbPassword || !supabaseUrl) {
        console.error('Missing DB credentials');
        process.exit(1);
    }

    // Extract project ref from URL (https://xyz.supabase.co)
    const projectRef = supabaseUrl.split('//')[1].split('.')[0];
    const connectionString = `postgres://postgres:${dbPassword}@db.${projectRef}.supabase.co:5432/postgres`;

    const client = new Client({
        connectionString,
        ssl: { rejectUnauthorized: false } // Supabase requires SSL
    });

    try {
        await client.connect();
        console.log('Connected to Database');

        const sqlPath = path.join(process.cwd(), 'supabase_schema.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        // Split by semicolon to run statements individually (simple parser)
        // Note: This is a naive split, but sufficient for the provided schema
        const statements = sql.split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0);

        for (const statement of statements) {
            try {
                await client.query(statement);
                console.log('Executed:', statement.substring(0, 50) + '...');
            } catch (err: any) {
                // Ignore "relation already exists" or "already exists" errors
                if (err.code === '42P07' || err.code === '42710' || err.message.includes('already exists')) {
                    console.log('Skipping (already exists):', statement.substring(0, 50) + '...');
                } else {
                    console.error('Error executing statement:', err.message);
                    // Don't exit, try next (e.g. bucket creation might fail if not via SQL extension)
                }
            }
        }

        console.log('Migration completed');
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        await client.end();
    }
}

migrate();
