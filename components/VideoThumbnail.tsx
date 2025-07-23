import React from 'react';
import { View, StyleSheet, Dimensions, Text } from 'react-native';
import { VideoView, useVideoPlayer } from 'expo-video';
import { Ionicons } from '@expo/vector-icons';

interface VideoThumbnailProps {
  videoUrl: string | null;
  width: number;
  height: number;
}

export default function VideoThumbnail({ videoUrl, width, height }: VideoThumbnailProps) {
  const [isLoaded, setIsLoaded] = React.useState(false);
  const [hasError, setHasError] = React.useState(false);

  const player = useVideoPlayer(videoUrl || '', (player) => {
    player.loop = false;
    player.muted = true;
    player.pause(); // Keep paused for thumbnail
  });

  React.useEffect(() => {
    if (videoUrl && player) {
      // Load the video but don't play it
      player.currentTime = 0;
      setIsLoaded(true);
    }
  }, [videoUrl, player]);

  if (!videoUrl || hasError) {
    return (
      <View style={[styles.placeholder, { width, height }]}>
        <Ionicons name="videocam" size={32} color="#6B7280" />
        <Text style={styles.placeholderText}>Video</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { width, height }]}>
      <VideoView
        player={player}
        style={[styles.video, { width, height }]}
        contentFit="cover"
        nativeControls={false}
        onLoadStart={() => setIsLoaded(false)}
        onLoad={() => setIsLoaded(true)}
        onError={() => setHasError(true)}
      />
      {!isLoaded && (
        <View style={[styles.loadingOverlay, { width, height }]}>
          <Ionicons name="videocam" size={24} color="#9CA3AF" />
        </View>
      )}
      <View style={styles.playIconOverlay}>
        <Ionicons name="play-circle" size={40} color="white" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  video: {
    backgroundColor: '#000',
  },
  placeholder: {
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    color: '#6B7280',
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playIconOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
});
