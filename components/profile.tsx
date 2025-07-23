import React from 'react';
import { useAuth } from '../providers/AuthProvider';
import { Text, TouchableOpacity, View, Image, FlatList, Dimensions, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../utils/supabase';
import { Video } from '../types';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import VideoThumbnail from './VideoThumbnail';
import SkeletonLoader from './SkeletonLoader';

const { width } = Dimensions.get('window');
const videoWidth = (width - 6) / 3;

interface ProfileProps {
  user: any;
  following: any[];
  followers: any[];
}

export default function Profile({ user, following, followers }: ProfileProps) {
  const { user: authUser, signOut, likes } = useAuth();
  const [videos, setVideos] = React.useState<Video[]>([]);
  const [loading, setLoading] = React.useState(false);
  const router = useRouter();

  React.useEffect(() => {
    if (user?.id) {
      fetchUserVideos();
    }
  }, [user?.id]);

  const fetchUserVideos = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('Video')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      if (data?.length) {
        await getSignedUrls(data);
      } else {
        setVideos([]);
      }
    } catch (error) {
      console.error('Error fetching user videos:', error);
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

      const { data, error } = await supabase
        .storage
        .from('videos')
        .createSignedUrls(videoUris, 60 * 60 * 24 * 7);

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

  const addProfilePicture = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets?.[0]?.uri) {
        // Upload profile picture logic here
        console.log('Profile picture selected:', result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error selecting profile picture:', error);
    }
  };

  const handleVideoPress = (video: Video) => {
    // Navigate to a video player page with the specific video
    router.push(`/video-player?video_id=${video.id}`);
  };

  const renderVideoItem = ({ item }: { item: Video }) => (
    <TouchableOpacity
      style={styles.videoItem}
      onPress={() => handleVideoPress(item)}
    >
      <VideoThumbnail
        videoUrl={item.signedUrl || null}
        width={videoWidth}
        height={videoWidth * 1.5}
      />
    </TouchableOpacity>
  );

  const userLikesCount = likes.filter(like => like.video_user_id === user?.id).length;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={addProfilePicture} style={styles.avatarContainer}>
          <Image
            source={{ uri: user?.avatar_url || 'https://placehold.co/100x100' }}
            style={styles.avatar}
          />
          {authUser?.id === user?.id && (
            <View style={styles.cameraButton}>
              <Ionicons name="camera" size={16} color="white" />
            </View>
          )}
        </TouchableOpacity>

        <Text style={styles.username}>{user?.username || 'Unknown'}</Text>

        {user?.email && (
          <Text style={styles.email}>{user.email}</Text>
        )}

        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{following?.length || 0}</Text>
            <Text style={styles.statLabel}>Following</Text>
          </View>

          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{followers?.length || 0}</Text>
            <Text style={styles.statLabel}>Followers</Text>
          </View>

          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{userLikesCount}</Text>
            <Text style={styles.statLabel}>Likes</Text>
          </View>
        </View>

        {authUser?.id === user?.id && (
          <TouchableOpacity
            onPress={signOut}
            style={styles.signOutButton}
          >
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.videosSection}>
        <View style={styles.videosSectionHeader}>
          <Text style={styles.videosSectionTitle}>Videos ({videos.length})</Text>
          <Ionicons name="grid" size={20} color="#9CA3AF" />
        </View>

        {loading ? (
          <SkeletonLoader type="list" />
        ) : videos.length > 0 ? (
          <FlatList
            data={videos}
            renderItem={renderVideoItem}
            keyExtractor={(item) => item.id}
            numColumns={3}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.videosList}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="videocam-outline" size={64} color="#9CA3AF" />
            <Text style={styles.emptyTitle}>
              {authUser?.id === user?.id ? 'No videos yet' : 'No videos to show'}
            </Text>
            {authUser?.id === user?.id && (
              <Text style={styles.emptySubtitle}>
                Tap the + button to create your first video
              </Text>
            )}
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32,
    backgroundColor: '#FFFFFF',
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#F3F4F6',
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    backgroundColor: '#3B82F6',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  username: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 16,
  },
  email: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 32,
    paddingHorizontal: 32,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  statLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  signOutButton: {
    marginTop: 24,
    backgroundColor: '#EF4444',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  signOutText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
  videosSection: {
    flex: 1,
    paddingHorizontal: 8,
  },
  videosSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  videosSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  videoItem: {
    backgroundColor: '#F3F4F6',
    margin: 2,
    borderRadius: 8,
    overflow: 'hidden',
  },

  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#6B7280',
    marginTop: 16,
    fontSize: 16,
  },
  videosList: {
    paddingBottom: 20,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    color: '#6B7280',
    fontSize: 18,
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtitle: {
    color: '#9CA3AF',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
});
