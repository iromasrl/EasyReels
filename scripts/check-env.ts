import dotenv from 'dotenv';
import path from 'path';
import dns from 'dns';
import { promisify } from 'util';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const lookup = promisify(dns.lookup);

async function checkEnv() {
    console.log('🔍 Checking Environment...');

    const required = [
        'NEXT_PUBLIC_SUPABASE_URL',
        'NEXT_PUBLIC_SUPABASE_ANON_KEY',
        'SUPABASE_SERVICE_ROLE_KEY',
        'OPENAI_API_KEY',
        'REPLICATE_API_TOKEN',
        'REDIS_URL'
    ];

    let hasError = false;

    for (const key of required) {
        if (!process.env[key]) {
            console.error(`❌ Missing ${key}`);
            hasError = true;
        } else {
            console.log(`✅ ${key} is set`);
        }
    }

    // Check Supabase DNS
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (supabaseUrl) {
        try {
            const hostname = new URL(supabaseUrl).hostname;
            console.log(`Testing DNS for ${hostname}...`);
            await lookup(hostname);
            console.log(`✅ DNS resolved for ${hostname}`);
        } catch (err: any) {
            console.error(`❌ DNS resolution failed for Supabase URL: ${err.message}`);
            console.error(`   Please verify NEXT_PUBLIC_SUPABASE_URL in .env.local`);
            hasError = true;
        }
    }

    if (hasError) {
        console.log('\n⚠️  Please fix the errors above in .env.local');
        process.exit(1);
    } else {
        console.log('\n✅ Environment looks good!');
    }
}

checkEnv();
