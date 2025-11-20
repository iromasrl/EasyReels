// MUST be first - load environment before any imports
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// Now import everything else
import { worker } from './video-processor';

console.log('Worker started...');
console.log('Environment loaded:', {
    hasOpenAI: !!process.env.OPENAI_API_KEY,
    hasReplicate: !!process.env.REPLICATE_API_TOKEN,
    hasSupabase: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
});

worker.on('completed', (job) => {
    if (job) {
        console.log(`Job ${job.id} completed!`);
    }
});

worker.on('failed', (job, err) => {
    if (job) {
        console.error(`❌ Job ${job.id} failed with ${err.message}`);
        console.error(err.stack);
    } else {
        console.error(`❌ Job failed with ${err.message}`);
    }
});

worker.on('error', (err) => {
    console.error('❌ Worker global error:', err);
});
