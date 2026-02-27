import React, { useEffect } from 'react';
import { StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { useVideoPlayer, VideoView, VideoContentFit } from 'expo-video';

interface UniversalVideoPlayerProps {
    source: { uri: string } | number;
    style?: StyleProp<ViewStyle>;
    resizeMode?: 'cover' | 'contain' | 'stretch' | string;
    shouldPlay?: boolean;
    isLooping?: boolean;
    isMuted?: boolean;
    useNativeControls?: boolean;
    contentFit?: VideoContentFit;
}

const UniversalVideoPlayer: React.FC<UniversalVideoPlayerProps> = ({
    source,
    style,
    resizeMode = 'contain',
    shouldPlay = false,
    isLooping = false,
    isMuted = false,
    useNativeControls = false,
    contentFit,
}) => {
    const videoSource = typeof source === 'number' ? source : source.uri;

    const player = useVideoPlayer(videoSource, (player) => {
        player.loop = isLooping;
        player.muted = isMuted;
        if (shouldPlay) {
            player.play();
        }
    });

    useEffect(() => {
        if (player) {
            player.loop = isLooping;
        }
    }, [isLooping, player]);

    useEffect(() => {
        if (player) {
            player.muted = isMuted;
        }
    }, [isMuted, player]);

    useEffect(() => {
        if (player) {
            if (shouldPlay) {
                player.play();
            } else {
                player.pause();
            }
        }
    }, [shouldPlay, player]);

    // Map resizeMode to contentFit if contentFit is not explicitly provided
    const finalContentFit: VideoContentFit = contentFit || (resizeMode === 'cover' ? 'cover' : (resizeMode === 'stretch' ? 'fill' : 'contain'));

    return (
        <VideoView
            style={[styles.base, style]}
            player={player}
            nativeControls={useNativeControls}
            fullscreenOptions={{ enable: useNativeControls }}
            allowsPictureInPicture={false}
            contentFit={finalContentFit}

        />
    );
};

const styles = StyleSheet.create({
    base: {
        width: '100%',
        height: '100%',
    }
});

export default UniversalVideoPlayer;
