import React from 'react';
import { View, Dimensions, FlatList } from 'react-native';
import { supabase } from '@/utils/supabase';
import VideoPlayer from '@/components/video';
import Header from '@/components/header';

type Video = {
  id: number;
  uri: string;
  created_at: string;
  User: Record<string, unknown>;
  signedUrl?: string | null;
};

export default function ForYouFeed() {
  const [videos, setVideos] = React.useState<Video[]>([]);
  const [activeIndex, setActiveIndex] = React.useState<number | null>(null);

  React.useEffect(() => {
    const fetchVideos = async () => {
      try {
        const { data, error } = await supabase
          .from('Video')
          .select('*, User(*)')
          .order('created_at', { ascending: false });

        if (error) throw error;
        if (data) await getSignedUrls(data);
      } catch (error) {
        console.error('Error fetching videos:', error);
      }
    };

    fetchVideos();
  }, []);

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

  const handleViewableItemsChanged = React.useCallback(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      setActiveIndex(viewableItems[0].index);
    }
  }, []);

  return (
    <View className="flex-1 bg-white">
      <Header title="For You" color="white" search />
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