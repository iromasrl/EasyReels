import { Worker, Job } from 'bullmq';
import { redis } from '@/lib/redis';
import { generateScript } from '@/lib/ai/script-generator';
import { generateAudio } from '@/lib/ai/audio-generator';
import { generateImages } from '@/lib/ai/image-generator';
import { renderVideo } from '@/lib/remotion/render';
import { supabaseAdmin } from '@/lib/supabase';
import getAudioDurationInSeconds from 'get-audio-duration';

const WORKER_NAME = 'video-generation';

export const worker = new Worker(
    WORKER_NAME,
    async (job: Job) => {
        const { projectId, topic, style, language = 'en', format = 'vertical' } = job.data;
        console.log(`\n========================================`);
        console.log(`🎬 Processing job ${job.id} for project ${projectId}`);
        console.log(`Topic: ${topic}`);
        console.log(`Style: ${style}`);
        console.log(`Language: ${language}`);
        console.log(`Format: ${format}`);
        console.log(`========================================\n`);

        try {
            // Check what's already completed
            const { data: existingProject } = await supabaseAdmin
                .from('projects')
                .select('*')
                .eq('id', projectId)
                .single();

            let script = existingProject?.script;
            let audioUrl = existingProject?.audio_url;
            let imageUrls = existingProject?.image_urls || [];

            // 1. Generate Script (if not exists)
            if (!script) {
                await updateStatus(projectId, 'processing_script');
                console.log('🤖 Generating script...');
                script = await generateScript(topic, style, language);
                console.log(`✅ Script generated with ${script.scenes.length} scenes`);
                await updateProjectData(projectId, { script });
            } else {
                console.log('♻️  Script already exists, reusing...');
            }

            // 2. Generate Audio (if not exists) - MOVED UP
            // We need audio first to know the exact duration
            if (!audioUrl) {
                await updateStatus(projectId, 'processing_audio');
                console.log('🎵 Generating audio...');
                const fullText = script.scenes.map((s: any) => s.text).join(' ');
                audioUrl = await generateAudio(fullText, projectId, language);
                console.log(`✅ Audio generated: ${audioUrl}`);
                await updateProjectData(projectId, { audio_url: audioUrl });
            } else {
                console.log('♻️  Audio already exists, reusing:', audioUrl);
            }

            // 3. Calculate Audio Duration
            console.log('⏱️  Calculating exact audio duration...');
            const durationInSeconds = await getAudioDurationInSeconds(audioUrl);
            console.log(`✅ Audio duration: ${durationInSeconds} seconds`);

            // 4. Generate Images (if not exists)
            // We calculate how many images we need based on duration (e.g. 1 image every 5-6 seconds)
            // Or we just use the scenes from the script, but we ensure they fit the duration.
            const expectedImageCount = script.scenes.length;

            if (!imageUrls || imageUrls.length === 0) {
                await updateStatus(projectId, 'processing_visuals');
                console.log(`🖼️  Generating ${expectedImageCount} images...`);
                console.log(`Format for images: ${format}`);

                imageUrls = await generateImages(script.scenes, style, projectId, format);
                console.log(`✅ Images generated: ${imageUrls.length} URLs`);
                await updateProjectData(projectId, { image_urls: imageUrls });
            } else {
                console.log('♻️  Images already exist, reusing:', imageUrls.length);
            }

            // 5. Render Video
            await updateStatus(projectId, 'rendering');
            console.log('🎥 Starting video rendering...');
            console.log(`  - Duration: ${durationInSeconds}s`);
            console.log(`  - Images: ${imageUrls.length}`);
            console.log(`  - Format: ${format}`);

            // Pass durationInSeconds to renderVideo
            const videoUrl = await renderVideo(projectId, script, audioUrl, imageUrls, format, durationInSeconds);
            console.log(`✅ Video rendered: ${videoUrl}`);

            // 5. Finish
            await updateStatus(projectId, 'completed', videoUrl);
            console.log(`\n🎉 Job ${job.id} completed successfully!`);
            console.log(`Video URL: ${videoUrl}`);
            console.log(`========================================\n`);

        } catch (error) {
            console.error(`\n❌ Job ${job.id} FAILED`);
            console.error('Error details:', error);
            console.error('Stack trace:', error instanceof Error ? error.stack : 'N/A');
            console.error(`========================================\n`);

            const errorMessage = error instanceof Error ? error.message : String(error);
            const errorStack = error instanceof Error ? error.stack : '';
            const fullErrorLog = `${errorMessage}\n\nStack Trace:\n${errorStack}`;

            await updateStatus(projectId, 'failed');
            await updateProjectData(projectId, { error_message: fullErrorLog });
            throw error;
        }
    },
    {
        connection: redis,
        concurrency: 2, // Process 2 videos at a time

        // Extended settings for long video rendering
        lockDuration: 1800000, // 30 minutes max job time
        maxStalledCount: 1,     // Retry once if stalled

        // Remove default timeout (30s) - let jobs run as long as needed
        removeOnComplete: {
            age: 3600, // Keep completed jobs for 1 hour
        },
        removeOnFail: {
            age: 86400, // Keep failed jobs for 24 hours
        },
    }
);

async function updateStatus(projectId: string, status: string, videoUrl?: string) {
    await supabaseAdmin
        .from('projects')
        .update({ status, video_url: videoUrl })
        .eq('id', projectId);
}

async function updateProjectData(projectId: string, data: any) {
    await supabaseAdmin
        .from('projects')
        .update(data)
        .eq('id', projectId);
}
