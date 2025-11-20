import { openai } from '@/lib/openai';
import { supabaseAdmin } from '@/lib/supabase';

export async function generateAudio(text: string, projectId: string, language: string = 'en'): Promise<string> {
    // Use 'alloy' voice which works well with multiple languages
    // OpenAI TTS automatically detects the language from the text
    const mp3 = await openai.audio.speech.create({
        model: 'tts-1',
        voice: 'alloy', // Multilingual voice that works with Italian, Spanish, etc.
        input: text,
        // OpenAI TTS automatically detects language, but we can pass it for better results
        // Note: OpenAI TTS supports the languages we're using
    });

    const buffer = Buffer.from(await mp3.arrayBuffer());

    // Upload to Supabase Storage
    const fileName = `${projectId}/audio.mp3`;
    const { data, error } = await supabaseAdmin
        .storage
        .from('assets')
        .upload(fileName, buffer, {
            contentType: 'audio/mpeg',
            upsert: true
        });

    if (error) throw error;

    const { data: { publicUrl } } = supabaseAdmin
        .storage
        .from('assets')
        .getPublicUrl(fileName);

    return publicUrl;
}
