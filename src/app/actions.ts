'use server';

import { supabaseAdmin } from '@/lib/supabase';
import { redis } from '@/lib/redis';
import { Queue } from 'bullmq';
import { revalidatePath } from 'next/cache';

let videoQueue: Queue | null = null;

function getQueue() {
    if (!videoQueue) {
        videoQueue = new Queue('video-generation', { connection: redis });
    }
    return videoQueue;
}

export async function createProject(formData: FormData) {
    const topic = formData.get('topic') as string;
    const style = formData.get('style') as string;
    const language = formData.get('language') as string || 'en';
    const format = formData.get('format') as string || 'vertical';

    if (!topic) throw new Error('Topic is required');

    // 1. Create Project
    const { data: project, error } = await supabaseAdmin
        .from('projects')
        .insert({
            topic,
            style: style || 'cinematic',
            language,
            format,
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
        language,
        format,
    });

    revalidatePath('/');
    return project;
}

export async function retryProject(projectId: string) {
    // Get the project details
    const { data: project, error: fetchError } = await supabaseAdmin
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();

    if (fetchError) throw fetchError;
    if (!project) throw new Error('Project not found');

    // Reset status to queued (keep existing assets)
    const { error: updateError } = await supabaseAdmin
        .from('projects')
        .update({
            status: 'queued',
            error_message: null
        })
        .eq('id', projectId);

    if (updateError) throw updateError;

    // Re-add to queue
    await getQueue().add('generate-video', {
        projectId: project.id,
        topic: project.topic,
        style: project.style,
        language: project.language || 'en',
        format: project.format || 'vertical',
    });

    revalidatePath('/');
    return project;
}

export async function deleteProject(projectId: string) {
    try {
        // Get project to find files to delete
        const { data: project } = await supabaseAdmin
            .from('projects')
            .select('*')
            .eq('id', projectId)
            .single();

        if (project) {
            // Delete all files in the project folder from storage
            const { data: files } = await supabaseAdmin
                .storage
                .from('assets')
                .list(projectId);

            if (files && files.length > 0) {
                const filePaths = files.map(file => `${projectId}/${file.name}`);
                await supabaseAdmin
                    .storage
                    .from('assets')
                    .remove(filePaths);
            }
        }

        // Delete the project record
        const { error } = await supabaseAdmin
            .from('projects')
            .delete()
            .eq('id', projectId);

        if (error) throw error;

        revalidatePath('/');
        return { success: true };
    } catch (error) {
        console.error('Delete project error:', error);
        throw error;
    }
}

export async function getProjects() {
    const { data, error } = await supabaseAdmin
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
}
