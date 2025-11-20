import { replicate } from '@/lib/replicate';
import { supabaseAdmin } from '@/lib/supabase';
import { Scene } from './script-generator';

const FORMAT_TO_ASPECT_RATIO: Record<string, string> = {
    vertical: '9:16',    // TikTok, Reels, Shorts
    horizontal: '16:9',  // YouTube
    square: '1:1',       // Instagram Post
    portrait: '4:5',     // Instagram Feed
};

export async function generateImages(
    scenes: Scene[],
    style: string,
    projectId: string,
    format: string = 'vertical'
): Promise<string[]> {
    const imageUrls: string[] = [];
    const aspectRatio = FORMAT_TO_ASPECT_RATIO[format] || '9:16';

    // Generate images in parallel (with concurrency limit if needed, but Replicate handles it well)
    const promises = scenes.map(async (scene) => {
        const output = await replicate.run(
            "black-forest-labs/flux-schnell", // Fast, high quality
            {
                input: {
                    prompt: `${scene.visual_prompt}, ${style} style, high quality, cinematic lighting`,
                    aspect_ratio: aspectRatio,
                    output_format: "jpg"
                }
            }
        );

        // Replicate returns an array of output URLs (usually 1)
        const replicateUrl = (output as string[])[0];

        // Download and re-upload to Supabase to persist
        const response = await fetch(replicateUrl);
        const blob = await response.blob();
        const buffer = await blob.arrayBuffer();

        const fileName = `${projectId}/scene_${scene.id}.jpg`;
        const { error } = await supabaseAdmin
            .storage
            .from('assets')
            .upload(fileName, buffer, {
                contentType: 'image/jpeg',
                upsert: true
            });

        if (error) throw error;

        const { data: { publicUrl } } = supabaseAdmin
            .storage
            .from('assets')
            .getPublicUrl(fileName);

        return publicUrl;
    });

    return Promise.all(promises);
}
