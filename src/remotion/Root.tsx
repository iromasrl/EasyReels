import { Composition } from 'remotion';
import { MyComposition, myCompSchema } from './Composition';
import './style.css';

export const RemotionRoot: React.FC = () => {
    return (
        <>
            <Composition
                id="MyComp"
                component={MyComposition}
                schema={myCompSchema}
                durationInFrames={30 * 60} // Default 60s at 30fps
                fps={30}
                width={1080}
                height={1920}
                defaultProps={{
                    audioUrl: '',
                    imageUrls: [],
                    captions: [],
                }}
            />
        </>
    );
};
