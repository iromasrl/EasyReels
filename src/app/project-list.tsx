'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Play, Clock, AlertCircle, CheckCircle, RotateCcw, Trash2 } from 'lucide-react';
import { retryProject, deleteProject } from './actions';

export function ProjectList({ projects }: { projects: any[] }) {
    const router = useRouter();
    const [retrying, setRetrying] = useState<string | null>(null);
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

    // Auto-refresh every 5 seconds to check status (but pause when deleting)
    useEffect(() => {
        // Don't refresh when showing delete confirmation
        if (deleteConfirmId) return;

        const interval = setInterval(() => {
            router.refresh();
        }, 5000);
        return () => clearInterval(interval);
    }, [router, deleteConfirmId]);

    const handleRetry = async (projectId: string) => {
        setRetrying(projectId);
        try {
            await retryProject(projectId);
            router.refresh();
        } catch (error) {
            console.error('Retry failed:', error);
            alert('Failed to retry project');
        } finally {
            setRetrying(null);
        }
    };

    const handleDelete = async (projectId: string) => {
        try {
            await deleteProject(projectId);
            setDeleteConfirmId(null);
            router.refresh();
        } catch (error) {
            console.error('Delete failed:', error);
            alert('Failed to delete project');
        }
    };

    return (
        <div className="grid gap-4">
            {projects.map((project) => (
                <div
                    key={project.id}
                    className="bg-gray-800 p-4 rounded-lg border border-gray-700 hover:bg-gray-750 transition"
                >
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <h3 className="font-semibold text-lg">{project.topic}</h3>
                            <div className="flex items-center gap-2 text-sm text-gray-400 mt-1 flex-wrap">
                                <span className="capitalize">{project.style}</span>
                                {project.language && project.language !== 'en' && (
                                    <>
                                        <span>•</span>
                                        <span className="uppercase">{project.language}</span>
                                    </>
                                )}
                                {project.format && (
                                    <>
                                        <span>•</span>
                                        <span className="capitalize">{project.format}</span>
                                    </>
                                )}
                                <span>•</span>
                                <span suppressHydrationWarning>
                                    {new Date(project.created_at).toLocaleDateString('en-US', {
                                        year: 'numeric',
                                        month: '2-digit',
                                        day: '2-digit'
                                    })}
                                </span>
                            </div>

                            {/* Show error message if failed */}
                            {project.status === 'failed' && (
                                <div className="mt-3 p-3 bg-red-900/20 border border-red-700 rounded text-xs text-red-200">
                                    <div className="font-semibold mb-1 flex items-center gap-2">
                                        <AlertCircle size={14} />
                                        Error Log:
                                    </div>
                                    {project.error_message ? (
                                        <pre className="whitespace-pre-wrap font-mono overflow-x-auto max-h-40 overflow-y-auto">
                                            {project.error_message}
                                        </pre>
                                    ) : (
                                        <p className="text-red-300">No error details available. Check worker logs.</p>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="flex items-center gap-4 ml-4">
                            <StatusBadge status={project.status} />

                            {project.status === 'failed' && (
                                <button
                                    onClick={() => handleRetry(project.id)}
                                    disabled={retrying === project.id}
                                    className="flex items-center gap-2 bg-orange-600 hover:bg-orange-500 disabled:bg-orange-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
                                >
                                    <RotateCcw size={16} className={retrying === project.id ? 'animate-spin' : ''} />
                                    {retrying === project.id ? 'Retrying...' : 'Retry'}
                                </button>
                            )}

                            {project.video_url && (
                                <a
                                    href={project.video_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
                                >
                                    <Play size={16} />
                                    Watch
                                </a>
                            )}

                            {/* Delete button - Two step confirmation */}
                            {deleteConfirmId === project.id ? (
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handleDelete(project.id)}
                                        className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
                                    >
                                        <Trash2 size={16} />
                                        Confirm Delete
                                    </button>
                                    <button
                                        onClick={() => setDeleteConfirmId(null)}
                                        className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={() => setDeleteConfirmId(project.id)}
                                    className="flex items-center gap-2 bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white px-3 py-2 rounded-lg text-sm font-medium transition border border-red-600/50"
                                    title="Delete project and all assets"
                                >
                                    <Trash2 size={16} />
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            ))}

            {projects.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                    No projects yet. Create one above!
                </div>
            )}
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    const styles = {
        queued: 'bg-gray-700 text-gray-300',
        processing_script: 'bg-blue-900 text-blue-200',
        processing_audio: 'bg-indigo-900 text-indigo-200',
        processing_visuals: 'bg-purple-900 text-purple-200',
        rendering: 'bg-orange-900 text-orange-200',
        completed: 'bg-green-900 text-green-200',
        failed: 'bg-red-900 text-red-200',
    };

    const icons = {
        queued: Clock,
        processing_script: Clock,
        processing_audio: Clock,
        processing_visuals: Clock,
        rendering: Clock,
        completed: CheckCircle,
        failed: AlertCircle,
    };

    const Icon = icons[status as keyof typeof icons] || Clock;
    const style = styles[status as keyof typeof styles] || styles.queued;

    return (
        <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${style}`}>
            <Icon size={12} />
            <span className="uppercase tracking-wider">{status.replace('_', ' ')}</span>
        </div>
    );
}
