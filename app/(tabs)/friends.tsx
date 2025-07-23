import React from 'react';
import { useAuth } from '../../providers/AuthProvider';
import { supabase } from '../../utils/supabase';
import { View, Dimensions, FlatList, ActivityIndicator, Text, StyleSheet, TouchableOpacity, RefreshControl, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import VideoPlayer from '../../components/video';
import Header from '../../components/header';
import { Video } from '../../types';
import { Ionicons } from '@expo/vector-icons';

export default function FriendsFeed() {
  const { friends } = useAuth();
  const [videos, setVideos] = React.useState<Video[]>([]);
  const [activeIndex, setActiveIndex] = React.useState<number | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [isTabFocused, setIsTabFocused] = React.useState(true);
  const insets = useSafeAreaInsets();

  // Calculate the actual video height more precisely
  const screenHeight = Dimensions.get('window').height;
  const TAB_BAR_HEIGHT = Platform.OS === 'ios' ? 85 : 75;
  const HEADER_HEIGHT = 60 + insets.top; // Header + status bar
  const videoHeight = screenHeight - HEADER_HEIGHT - TAB_BAR_HEIGHT;

  React.useEffect(() => {
    const fetchVideos = async () => {
      if (!friends?.length) {
        setLoading(false);
        setVideos([]);
        return;
      }
      await getVideos();
    };

    fetchVideos();
  }, [friends]);

  // Handle tab focus/blur to pause/resume video
  useFocusEffect(
    React.useCallback(() => {
      setIsTabFocused(true);
      return () => {
        setIsTabFocused(false);
      };
    }, [])
  );

  const getVideos = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);
      
      const { data, error: videoError } = await supabase
        .from('Video')
        .select('*, User(*)')
        .in('user_id', friends)
        .order('created_at', { ascending: false });

      if (videoError) throw videoError;
      
      if (!data?.length) {
        setVideos([]);
        return;
      }

      await getSignedUrls(data);
    } catch (err) {
      console.error('Error fetching videos:', err);
      setError('Failed to load videos. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getSignedUrls = async (videos: Video[]) => {
    try {
      const videoUris = videos
        .map(video => video.uri)
        .filter(Boolean);

      if (!videoUris.length) {
        setVideos([]);
        return;
      }

      const { data, error: urlError } = await supabase
        .storage
        .from('videos')
        .createSignedUrls(videoUris, 60 * 60 * 24 * 7);

      if (urlError) throw urlError;

      const videosWithUrls = videos.map(video => ({
        ...video,
        signedUrl: data?.find(url => url.path === video.uri)?.signedUrl || null
      }));

      setVideos(videosWithUrls);
    } catch (err) {
      console.error('Error getting signed URLs:', err);
      setError('Failed to load video URLs. Please try again.');
    }
  };

  const handleViewableItemsChanged = React.useCallback(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setActiveIndex(viewableItems[0].index);
    }
  }, []);

  const onRefresh = () => {
    getVideos(true);
  };

  if (loading && videos.length === 0) {
    return (
      <View style={styles.container}>
        <Header title="Friends" color="black" search />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Loading friends' videos...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Header title="Friends" color="black" search />
        <View style={styles.centerContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => getVideos()}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (!videos.length) {
    return (
      <View style={styles.container}>
        <Header title="Friends" color="black" search />
        <View style={styles.centerContainer}>
          <Ionicons
            name={friends.length === 0 ? "people-outline" : "videocam-outline"}
            size={64}
            color="#9CA3AF"
          />
          <Text style={styles.emptyTitle}>
            {friends.length === 0 ? "No Friends Yet" : "No Videos"}
          </Text>
          <Text style={styles.emptySubtitle}>
            {friends.length === 0
              ? "Follow some users to see their videos here!"
              : "No videos found from your friends"
            }
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header title="Friends" color="black" search />
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
        renderItem={({ item, index }) => (
          <VideoPlayer
            video={item}
            isViewable={activeIndex === index && isTabFocused}
            height={videoHeight}
          />
        )}
        showsVerticalScrollIndicator={false}
        pagingEnabled
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#3B82F6"
            colors={['#3B82F6']}
          />
        }
      />
    </View>
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
    paddingHorizontal: 32,
    backgroundColor: '#000',
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
    marginTop: 16,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtitle: {
    color: '#9CA3AF',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 24,
  },
});
