import React from 'react';
import { View, Dimensions, FlatList, StyleSheet, ActivityIndicator, Text, RefreshControl, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../../utils/supabase';
import VideoPlayer from '../../components/video';
import Header from '../../components/header';
import SkeletonLoader from '../../components/SkeletonLoader';

type Video = {
  id: string;
  uri: string;
  user_id: string;
  created_at: string;
  title?: string;
  User: Record<string, unknown>;
  signedUrl?: string | null;
};

export default function ForYouFeed() {
  const [videos, setVideos] = React.useState<Video[]>([]);
  const [activeIndex, setActiveIndex] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [isTabFocused, setIsTabFocused] = React.useState(true);
  const insets = useSafeAreaInsets();

  // Calculate the actual video height more precisely
  const screenHeight = Dimensions.get('window').height;
  const TAB_BAR_HEIGHT = Platform.OS === 'ios' ? 85 : 75;
  const HEADER_HEIGHT = 60 + insets.top; // Header + status bar
  const videoHeight = screenHeight - HEADER_HEIGHT - TAB_BAR_HEIGHT;

  const fetchVideos = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const { data, error } = await supabase
        .from('Video')
        .select('*, User(*)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) await getSignedUrls(data);
    } catch (error) {
      console.error('Error fetching videos:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  React.useEffect(() => {
    fetchVideos();
  }, []);

  // Handle tab focus/blur to pause/resume video
  useFocusEffect(
    React.useCallback(() => {
      setIsTabFocused(true);
      return () => {
        setIsTabFocused(false);
      };
    }, [])
  );

  const getSignedUrls = async (videos: Video[]) => {
    try {
      const videoUris = videos
        .map(video => video.uri)
        .filter(Boolean);

      if (!videoUris.length) return;

      const { data, error } = await supabase
        .storage
        .from('videos')
        .createSignedUrls(videoUris, 60 * 60 * 24 * 7); // 7 days expiry

      if (error) throw error;

      const videosWithUrls = videos.map(video => ({
        ...video,
        signedUrl: data?.find(url => url.path === video.uri)?.signedUrl || null
      }));

      setVideos(videosWithUrls);
    } catch (error) {
      console.error('Error getting signed URLs:', error);
    }
  };

  const handleViewableItemsChanged = React.useCallback(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setActiveIndex(viewableItems[0].item.id);
    }
  }, []);

  const onRefresh = () => {
    fetchVideos(true);
  };

  if (loading && videos.length === 0) {
    return (
      <View style={styles.container}>
        <Header title="For You" color="white" search backgroundColor="#000" />
        <SkeletonLoader type="video" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header title="For You" color="white" search backgroundColor="#000" />
      <View style={styles.videoContainer}>
        <FlatList
        data={videos}
        snapToInterval={videoHeight}
        snapToAlignment="start"
        decelerationRate="fast"
        onViewableItemsChanged={handleViewableItemsChanged}
        viewabilityConfig={{
          itemVisiblePercentThreshold: 50,
        }}
        keyExtractor={item => item.id.toString()}
        renderItem={({ item }) => (
          <VideoPlayer
            video={item as any}
            isViewable={activeIndex === item.id && isTabFocused}
            height={videoHeight}
          />
        )}
        showsVerticalScrollIndicator={false}
        pagingEnabled={true}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#3B82F6"
            colors={['#3B82F6']}
          />
        }
        ListEmptyComponent={
          <View style={[styles.emptyContainer, { height: videoHeight }]}>
            <Text style={styles.emptyText}>No videos available</Text>
            <Text style={styles.emptySubtext}>Pull down to refresh</Text>
          </View>
        }
      />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  videoContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  loadingText: {
    color: 'white',
    marginTop: 16,
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    height: Dimensions.get('window').height - 100,
    backgroundColor: '#000',
  },
  emptyText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  emptySubtext: {
    color: '#9CA3AF',
    fontSize: 14,
  },
});