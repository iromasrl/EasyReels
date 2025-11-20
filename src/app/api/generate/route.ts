import { NextResponse } from 'next/server';
import { Queue } from 'bullmq';
import { redis } from '@/lib/redis';
import { supabaseAdmin } from '@/lib/supabase';

let videoQueue: Queue | null = null;

function getQueue() {
    if (!videoQueue) {
        videoQueue = new Queue('video-generation', { connection: redis });
    }
    return videoQueue;
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { topic, style } = body;

        if (!topic) {
            return NextResponse.json({ error: 'Topic is required' }, { status: 400 });
        }

        // 1. Create Project in DB
        const { data: project, error } = await supabaseAdmin
            .from('projects')
            .insert({
                topic,
                style: style || 'cinematic',
                status: 'queued',
            })
            .select()
            .single();

        if (error) throw error;

        // 2. Add to Queue
        await getQueue().add('generate-video', {
            projectId: project.id,
            topic,
            style: style || 'cinematic',
        });

        return NextResponse.json({ success: true, projectId: project.id });
    } catch (error) {
        console.error('Error queuing job:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
