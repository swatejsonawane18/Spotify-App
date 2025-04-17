import React from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { supabase } from '@/utils/supabase';
import { View, Dimensions, FlatList, ActivityIndicator, Text } from 'react-native';
import VideoPlayer from '@/components/video';
import Header from '@/components/header';

export default function FriendsFeed() {
  const { friends } = useAuth();
  const [videos, setVideos] = React.useState<Video[]>([]);
  const [activeIndex, setActiveIndex] = React.useState<number | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

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

  const getVideos = async () => {
    try {
      setLoading(true);
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
        .createSignedUrls(videoUris, 60 * 60 * 24 * 7); // 7 days expiry

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

  const handleViewableItemsChanged = React.useCallback(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      setActiveIndex(viewableItems[0].index);
    }
  }, []);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <Text className="text-red-500 text-lg">{error}</Text>
      </View>
    );
  }

  if (!videos.length) {
    return (
      <View className="flex-1 bg-white">
        <Header title="Friends" color="black" search />
        <View className="flex-1 items-center justify-center">
          <Text className="text-lg text-gray-600">
            No videos found from your friends
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <Header title="Friends" color="black" search />
      <FlatList
        data={videos}
        snapToInterval={Dimensions.get('window').height}
        snapToStart
        decelerationRate="fast"
        onViewableItemsChanged={handleViewableItemsChanged}
        keyExtractor={item => item.id.toString()}
        renderItem={({ item }) => (
          <VideoPlayer 
            video={item} 
            isViewable={activeIndex === item.id} 
          />
        )}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

type Video = {
  id: number;
  uri: string;
  created_at: string;
  User: any;
  signedUrl?: string | null;
};