import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '../providers/AuthProvider';
import { supabase } from '../utils/supabase';
import { Ionicons } from '@expo/vector-icons';
import { Album, Video } from '../types';
import Header from '../components/header';
import VideoThumbnail from '../components/VideoThumbnail';
import VideoToAlbumModal from '../components/VideoToAlbumModal';
import CollaborationRequestModal from '../components/CollaborationRequestModal';

const { width } = Dimensions.get('window');
const videoWidth = (width - 48) / 3; // 3 videos per row with padding

const ALBUM_TYPES = [
  { key: 'ep_preview', label: 'EP Preview', icon: 'musical-notes', color: '#FF6B6B' },
  { key: 'studio_freestyle', label: 'Studio Freestyle', icon: 'mic', color: '#4ECDC4' },
  { key: 'fan_collab', label: 'Fan Collab', icon: 'people', color: '#45B7D1' },
  { key: 'behind_scenes', label: 'Behind the Scenes', icon: 'camera', color: '#96CEB4' },
  { key: 'covers', label: 'Covers', icon: 'repeat', color: '#FFEAA7' },
  { key: 'originals', label: 'Originals', icon: 'create', color: '#DDA0DD' },
  { key: 'custom', label: 'Custom', icon: 'folder', color: '#A8A8A8' },
];

export default function AlbumDetailsScreen() {
  const { album_id } = useLocalSearchParams<{ album_id: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const [album, setAlbum] = React.useState<Album | null>(null);
  const [videos, setVideos] = React.useState<Video[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [showAddVideosModal, setShowAddVideosModal] = React.useState(false);
  const [showCollaborationModal, setShowCollaborationModal] = React.useState(false);

  React.useEffect(() => {
    if (album_id) {
      fetchAlbumDetails();
    }
  }, [album_id]);

  const fetchAlbumDetails = async () => {
    try {
      setLoading(true);

      // Fetch album details
      const { data: albumData, error: albumError } = await supabase
        .from('Album')
        .select('*, User(*)')
        .eq('id', album_id)
        .single();

      if (albumError) {
        if (albumError.code === 'PGRST200' || albumError.message?.includes('relation "Album" does not exist')) {
          Alert.alert(
            'Database Setup Required',
            'The Album table needs to be created in your database. Please run the database schema first.',
            [{ text: 'OK', onPress: () => router.back() }]
          );
          return;
        }
        throw albumError;
      }

      setAlbum(albumData);

      // Fetch videos in this album
      const { data: videosData, error: videosError } = await supabase
        .from('Video')
        .select('*, User(*)')
        .eq('album_id', album_id)
        .order('created_at', { ascending: false });

      if (videosError && !videosError.message?.includes('album_id')) {
        throw videosError;
      }

      // Get signed URLs for videos
      if (videosData?.length) {
        const { data: signedUrls } = await supabase
          .storage
          .from('videos')
          .createSignedUrls(videosData.map(v => v.uri), 3600);

        const videosWithUrls = videosData.map(video => ({
          ...video,
          signedUrl: signedUrls?.find(url => url.path === video.uri)?.signedUrl || null
        }));

        setVideos(videosWithUrls);
      } else {
        setVideos([]);
      }
    } catch (error) {
      console.error('Error fetching album details:', error);
      Alert.alert('Error', 'Failed to load album details');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const getAlbumTypeInfo = (type: Album['album_type']) => {
    return ALBUM_TYPES.find(t => t.key === type) || ALBUM_TYPES[ALBUM_TYPES.length - 1];
  };

  const handleVideoPress = (video: Video) => {
    router.push(`/video-player?video_id=${video.id}`);
  };

  const renderVideo = ({ item }: { item: Video }) => (
    <TouchableOpacity 
      style={styles.videoItem}
      onPress={() => handleVideoPress(item)}
    >
      <VideoThumbnail
        videoUrl={item.signedUrl || null}
        width={videoWidth}
        height={videoWidth * 1.5}
      />
      {item.title && (
        <Text style={styles.videoTitle} numberOfLines={2}>
          {item.title}
        </Text>
      )}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Header title="Album" color="black" goBack />
        <View style={styles.centerContainer}>
          <Text style={styles.loadingText}>Loading album...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!album) {
    return (
      <SafeAreaView style={styles.container}>
        <Header title="Album" color="black" goBack />
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>Album not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const typeInfo = getAlbumTypeInfo(album.album_type);

  return (
    <SafeAreaView style={styles.container}>
      <Header title={album.title} color="black" goBack />
      
      <View style={styles.content}>
        {/* Album Header */}
        <View style={styles.albumHeader}>
          <View style={[styles.albumIcon, { backgroundColor: typeInfo.color }]}>
            <Ionicons name={typeInfo.icon as any} size={32} color="white" />
          </View>
          <View style={styles.albumInfo}>
            <Text style={styles.albumTitle}>{album.title}</Text>
            <Text style={styles.albumType}>{typeInfo.label}</Text>
            {album.description && (
              <Text style={styles.albumDescription}>{album.description}</Text>
            )}
            <Text style={styles.albumStats}>
              {videos.length} clips • Created {new Date(album.created_at).toLocaleDateString()}
            </Text>
          </View>
        </View>

        {/* Videos Grid */}
        <View style={styles.videosSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Clips</Text>
            {user?.id === album.user_id ? (
              // Album owner can add their own videos
              <TouchableOpacity
                style={styles.addVideosButton}
                onPress={() => setShowAddVideosModal(true)}
              >
                <Ionicons name="add" size={20} color="#1DB954" />
                <Text style={styles.addVideosText}>Add Videos</Text>
              </TouchableOpacity>
            ) : album.album_type === 'fan_collab' ? (
              // Non-owners can request collaboration for fan_collab albums
              <TouchableOpacity
                style={styles.collaborateButton}
                onPress={() => setShowCollaborationModal(true)}
              >
                <Ionicons name="people" size={20} color="#3B82F6" />
                <Text style={styles.collaborateText}>Request Collaboration</Text>
              </TouchableOpacity>
            ) : null}
          </View>

          {videos.length > 0 ? (
            <FlatList
              data={videos}
              renderItem={renderVideo}
              keyExtractor={item => item.id}
              numColumns={3}
              columnWrapperStyle={styles.videoRow}
              contentContainerStyle={styles.videosGrid}
              showsVerticalScrollIndicator={false}
            />
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="videocam-outline" size={48} color="#9CA3AF" />
              <Text style={styles.emptyText}>No clips yet</Text>
              <Text style={styles.emptySubtext}>
                {user?.id === album.user_id
                  ? "Tap 'Add Videos' to add existing clips or start recording new ones"
                  : "This album doesn't have any clips yet"
                }
              </Text>
            </View>
          )}
        </View>

        {/* Add Videos Modal */}
        {album && (
          <VideoToAlbumModal
            visible={showAddVideosModal}
            onClose={() => setShowAddVideosModal(false)}
            albumId={album.id}
            albumTitle={album.title}
            onVideoAdded={() => {
              fetchAlbumDetails(); // Refresh the album details
            }}
          />
        )}

        {/* Collaboration Request Modal */}
        {album && (
          <CollaborationRequestModal
            visible={showCollaborationModal}
            onClose={() => setShowCollaborationModal(false)}
            album={album}
            onRequestSent={() => {
              // Could show a success message or navigate somewhere
            }}
          />
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
  content: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#6B7280',
    fontSize: 16,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 16,
  },
  albumHeader: {
    flexDirection: 'row',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  albumIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  albumInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  albumTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  albumType: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  albumDescription: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 8,
    lineHeight: 20,
  },
  albumStats: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  videosSection: {
    flex: 1,
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  addVideosButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1DB954',
  },
  addVideosText: {
    color: '#1DB954',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
  collaborateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EBF4FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  collaborateText: {
    color: '#3B82F6',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
  videosGrid: {
    paddingBottom: 20,
  },
  videoRow: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  videoItem: {
    width: videoWidth,
  },
  videoTitle: {
    fontSize: 12,
    color: '#374151',
    marginTop: 4,
    textAlign: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 4,
    paddingHorizontal: 32,
  },
});
