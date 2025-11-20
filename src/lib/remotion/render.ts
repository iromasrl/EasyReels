import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';
import path from 'path';
import { supabaseAdmin } from '@/lib/supabase';
import { Script } from '../ai/script-generator';
import fs from 'fs';

const FORMAT_DIMENSIONS: Record<string, { width: number; height: number }> = {
    vertical: { width: 1080, height: 1920 },   // 9:16 - TikTok, Reels, Shorts
    horizontal: { width: 1920, height: 1080 }, // 16:9 - YouTube
    square: { width: 1080, height: 1080 },     // 1:1 - Instagram Post
    portrait: { width: 1080, height: 1350 },   // 4:5 - Instagram Feed
};

export async function renderVideo(
    projectId: string,
    script: Script,
    audioUrl: string,
    imageUrls: string[],
    format: string = 'vertical',
    durationInSeconds?: number
): Promise<string> {
    console.log('\n🎥 === REMOTION RENDERING START ===');
    console.log('Starting render for project:', projectId);
    console.log('Format:', format);
    if (durationInSeconds) console.log('Explicit duration:', durationInSeconds);

    const dimensions = FORMAT_DIMENSIONS[format] || FORMAT_DIMENSIONS.vertical;
    console.log('Dimensions:', dimensions);

    try {
        // Log memory usage
        const used = process.memoryUsage();
        console.log(`💾 Memory usage: ${Math.round(used.heapUsed / 1024 / 1024 * 100) / 100} MB`);

        // 1. Bundle the Remotion project
        const entryPoint = path.join(process.cwd(), 'src/remotion/index.ts');
        console.log('📦 Step 1: Bundling Remotion project...');
        console.log('Entry point:', entryPoint);

        // Add a timeout for bundling specifically
        const bundlePromise = bundle({
            entryPoint,
            // If you have specific webpack config, add it here
            webpackOverride: (config) => {
                return {
                    ...config,
                    mode: 'production',
                };
            },
        });

        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Bundling timed out after 60s')), 60000)
        );

        const bundleLocation = await Promise.race([bundlePromise, timeoutPromise]) as string;
        console.log('✅ Bundle created at:', bundleLocation);

        // 2. Select the composition
        const compositionId = 'MyComp';
        console.log('\n🎬 Step 2: Selecting composition...');
        console.log('Composition ID:', compositionId);
        console.log('Input props:', { audioUrl, imageCount: imageUrls.length });

        const composition = await selectComposition({
            serveUrl: bundleLocation,
            id: compositionId,
            inputProps: {
                audioUrl,
                imageUrls,
                captions: [], // TODO: Add captions
            },
        });
        console.log('✅ Composition selected:', {
            id: composition.id,
            width: composition.width,
            height: composition.height,
            fps: composition.fps,
            durationInFrames: composition.durationInFrames,
        });

        // Calculate duration based on explicit duration (preferred) or script estimate
        console.log('\n⏱️  Step 3: Calculating duration...');
        let totalDurationSeconds: number;

        if (durationInSeconds) {
            totalDurationSeconds = durationInSeconds;
            console.log(`Using explicit audio duration: ${totalDurationSeconds}s`);
        } else {
            totalDurationSeconds = script.scenes.reduce((acc, scene) => acc + (scene.duration_estimate || 5), 0);
            console.log(`Using script estimated duration: ${totalDurationSeconds}s`);
        }

        const durationInFrames = Math.ceil(totalDurationSeconds * 30);
        console.log(`Total duration: ${totalDurationSeconds}s = ${durationInFrames} frames @ 30fps`);

        // Override composition dimensions and duration
        // Note: This is a hacky way to override. Better way is calculateMetadata or props.
        // But for server-side rendering, we can just mutate the object or pass it if the API allows.
        // Actually, renderMedia doesn't take durationInFrames as an override directly on the top level options usually,
        // unless we use the specific override options if available.
        // Let's check the type. It seems we can just modify the composition object in memory.
        (composition as any).width = dimensions.width;
        (composition as any).height = dimensions.height;
        (composition as any).durationInFrames = durationInFrames;
        console.log('✅ Duration and dimensions override applied');

        // 3. Render the video
        const outputLocation = path.join(process.cwd(), 'public', `video_${projectId}.mp4`);
        console.log(`\n🎞️  Step 4: Rendering ${durationInFrames} frames to MP4...`);
        console.log('Output location:', outputLocation);

        await renderMedia({
            composition,
            serveUrl: bundleLocation,
            codec: 'h264',
            outputLocation,
            crf: 24, // Increase CRF to reduce file size (default is usually 18-23, higher is smaller/lower quality)
            pixelFormat: 'yuv420p',
            inputProps: {
                audioUrl,
                imageUrls,
                captions: [],
            },
        });
        console.log('✅ Rendering completed!');

        // 4. Upload to Supabase (Optional, since we saved to public folder)
        // But for a real SaaS, we should upload to object storage.
        // Let's read the file and upload.
        console.log('\n☁️  Step 5: Uploading to Supabase...');
        const fileBuffer = fs.readFileSync(outputLocation);
        console.log(`File size: ${(fileBuffer.length / 1024 / 1024).toFixed(2)} MB`);

        const fileName = `${projectId}/final_video.mp4`;
        console.log('Upload path:', fileName);

        const { error } = await supabaseAdmin
            .storage
            .from('assets')
            .upload(fileName, fileBuffer, {
                contentType: 'video/mp4',
                upsert: true
            });

        if (error) {
            console.error('❌ Supabase upload error:', error);
            throw error;
        }
        console.log('✅ Upload successful');

        const { data: { publicUrl } } = supabaseAdmin
            .storage
            .from('assets')
            .getPublicUrl(fileName);
        console.log('✅ Public URL generated:', publicUrl);

        // Cleanup local file
        console.log('\n🧹 Step 6: Cleaning up local file...');
        fs.unlinkSync(outputLocation);
        console.log('✅ Cleanup complete');

        console.log('\n🎉 === REMOTION RENDERING COMPLETE ===\n');
        return publicUrl;

    } catch (error) {
        console.error('\n❌ === REMOTION RENDERING FAILED ===');
        console.error('Error type:', error instanceof Error ? error.constructor.name : typeof error);
        console.error('Error message:', error instanceof Error ? error.message : String(error));
        console.error('Full error:', error);
        if (error instanceof Error && error.stack) {
            console.error('Stack trace:', error.stack);
        }
        console.error('=================================\n');
        throw error;
    }
}
