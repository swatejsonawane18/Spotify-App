import React from 'react';
import { View, StyleSheet, Dimensions, ActivityIndicator, Text, Platform } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { supabase } from '../utils/supabase';
import VideoPlayer from '../components/video';
import Header from '../components/header';

const { width } = Dimensions.get('window');

interface VideoData {
  id: string;
  uri: string;
  user_id: string;
  title?: string;
  User?: any;
  signedUrl?: string;
}

export default function VideoPlayerScreen() {
  const [video, setVideo] = React.useState<VideoData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const params = useLocalSearchParams<{ video_id: string }>();
  const insets = useSafeAreaInsets();

  // Calculate the video height for full screen experience
  const screenHeight = Dimensions.get('window').height;
  const HEADER_HEIGHT = 60 + insets.top; // Header + status bar
  const videoHeight = screenHeight - HEADER_HEIGHT;

  React.useEffect(() => {
    if (params.video_id) {
      fetchVideo();
    }
  }, [params.video_id]);

  const fetchVideo = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch video data
      const { data: videoData, error: videoError } = await supabase
        .from('Video')
        .select('*, User(*)')
        .eq('id', params.video_id)
        .single();

      if (videoError) {
        throw new Error('Video not found');
      }

      // Get signed URL for the video
      const { data: signedUrlData } = await supabase
        .storage
        .from('videos')
        .createSignedUrl(videoData.uri, 3600);

      const videoWithUrl = {
        ...videoData,
        signedUrl: signedUrlData?.signedUrl || null
      };

      setVideo(videoWithUrl);
    } catch (err: any) {
      setError(err.message || 'Failed to load video');
      console.error('Error fetching video:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Header title="Video" color="white" goBack backgroundColor="#000" />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Loading video...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !video) {
    return (
      <SafeAreaView style={styles.container}>
        <Header title="Video" color="white" goBack backgroundColor="#000" />
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>{error || 'Video not found'}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header title={video.User?.username || 'Video'} color="white" goBack backgroundColor="#000" />
      <VideoPlayer
        video={video as any}
        isViewable={true}
        height={videoHeight}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: 'white',
    marginTop: 16,
    fontSize: 16,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 18,
    textAlign: 'center',
  },
});
