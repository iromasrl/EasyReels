import dotenv from 'dotenv';
import path from 'path';
import { supabaseAdmin } from '../src/lib/supabase';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function setupDatabase() {
    console.log('🔧 Setting up Supabase database...\n');

    try {
        // Test connection
        const { data: testData, error: testError } = await supabaseAdmin
            .from('projects')
            .select('count')
            .limit(1);

        if (testError && testError.code === '42P01') {
            console.log('❌ Table "projects" does not exist.');
            console.log('\n📝 Please run the following SQL in Supabase Dashboard:');
            console.log('   https://supabase.com/dashboard/project/mftagtkxzxbeokekjtkf/sql/new\n');
            console.log('Copy and paste the content of: supabase_schema.sql\n');
            process.exit(1);
        } else if (testError) {
            console.error('❌ Database error:', testError.message);
            process.exit(1);
        } else {
            console.log('✅ Database connection successful!');
            console.log('✅ Table "projects" exists');

            // Check storage bucket
            const { data: buckets, error: bucketError } = await supabaseAdmin
                .storage
                .listBuckets();

            if (bucketError) {
                console.log('⚠️  Could not check storage buckets:', bucketError.message);
            } else {
                const assetsBucket = buckets?.find(b => b.name === 'assets');
                if (assetsBucket) {
                    console.log('✅ Storage bucket "assets" exists');
                } else {
                    console.log('⚠️  Storage bucket "assets" not found');
                    console.log('   Please create it in Supabase Dashboard → Storage');
                }
            }

            console.log('\n✅ Database setup verified!');
        }
    } catch (err: any) {
        console.error('❌ Setup failed:', err.message);
        process.exit(1);
    }
}

setupDatabase();
