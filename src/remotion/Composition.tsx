import { AbsoluteFill, Audio, Img, useCurrentFrame, useVideoConfig, interpolate, Sequence } from 'remotion';
import React from 'react';
import { z } from 'zod';

export const myCompSchema = z.object({
    audioUrl: z.string(),
    imageUrls: z.array(z.string()),
    captions: z.array(z.object({
        text: z.string(),
        start: z.number(),
        end: z.number(),
    })),
});

type Props = z.infer<typeof myCompSchema>;

export const MyComposition: React.FC<Props> = ({ audioUrl, imageUrls, captions }) => {
    const { fps } = useVideoConfig();

    const { durationInFrames } = useVideoConfig();

    // Distribute images evenly across the video duration
    const durationPerImage = Math.ceil(durationInFrames / (imageUrls.length || 1));

    return (
        <AbsoluteFill className="bg-black">
            {/* Audio Track */}
            {audioUrl && <Audio src={audioUrl} />}

            {/* Visual Track */}
            {imageUrls.map((url, index) => {
                const startFrame = index * durationPerImage;
                return (
                    <Sequence key={index} from={startFrame} durationInFrames={durationPerImage}>
                        <KenBurnsImage src={url} />
                    </Sequence>
                );
            })}

            {/* Subtitles Overlay - TODO: Implement real captions */}
            {/* 
            <AbsoluteFill className="justify-center items-center">
                <h1 className="text-white text-4xl font-bold text-center px-10">
                    {captions.length > 0 ? "Captions active" : ""}
                </h1>
            </AbsoluteFill> 
            */}
        </AbsoluteFill>
    );
};

const KenBurnsImage: React.FC<{ src: string }> = ({ src }) => {
    const frame = useCurrentFrame();
    const { durationInFrames } = useVideoConfig();

    const scale = interpolate(frame, [0, durationInFrames], [1.1, 1.3]);
    const x = interpolate(frame, [0, durationInFrames], [0, -50]); // Slight pan

    return (
        <AbsoluteFill style={{ overflow: 'hidden' }}>
            <Img
                src={src}
                style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    transform: `scale(${scale}) translateX(${x}px)`,
                }}
            />
        </AbsoluteFill>
    );
};
