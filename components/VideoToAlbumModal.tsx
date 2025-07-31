import React from 'react';
import { View, Text, StyleSheet, Modal, FlatList, TouchableOpacity, Alert, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../utils/supabase';
import { Video } from '../types';
import VideoThumbnail from './VideoThumbnail';
import { useAuth } from '../providers/AuthProvider';

const { width } = Dimensions.get('window');
const videoWidth = (width - 48) / 3;

interface VideoToAlbumModalProps {
  visible: boolean;
  onClose: () => void;
  albumId: string;
  albumTitle: string;
  onVideoAdded: () => void;
}

export default function VideoToAlbumModal({
  visible,
  onClose,
  albumId,
  albumTitle,
  onVideoAdded
}: VideoToAlbumModalProps) {
  const authContext = useAuth();
  const user = authContext?.user;
  const [videos, setVideos] = React.useState<Video[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [selectedVideos, setSelectedVideos] = React.useState<Set<string>>(new Set());

  React.useEffect(() => {
    if (visible) {
      fetchUnassignedVideos();
    }
  }, [visible]);

  const fetchUnassignedVideos = async () => {
    try {
      setLoading(true);

      // Get current user's videos that are not in any album
      const { data: videosData, error } = await supabase
        .from('Video')
        .select('*, User(*)')
        .eq('user_id', user?.id) // Only show current user's videos
        .is('album_id', null)
        .order('created_at', { ascending: false });

      if (error) throw error;

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
      console.error('Error fetching videos:', error);
      Alert.alert('Error', 'Failed to load videos');
    } finally {
      setLoading(false);
    }
  };

  const toggleVideoSelection = (videoId: string) => {
    const newSelection = new Set(selectedVideos);
    if (newSelection.has(videoId)) {
      newSelection.delete(videoId);
    } else {
      newSelection.add(videoId);
    }
    setSelectedVideos(newSelection);
  };

  const addVideosToAlbum = async () => {
    if (selectedVideos.size === 0) {
      Alert.alert('No Selection', 'Please select at least one video to add to the album.');
      return;
    }

    try {
      setLoading(true);
      
      // Update selected videos to include album_id
      const { error } = await supabase
        .from('Video')
        .update({ album_id: albumId })
        .in('id', Array.from(selectedVideos));

      if (error) throw error;

      Alert.alert(
        'Success', 
        `Added ${selectedVideos.size} video(s) to "${albumTitle}"`,
        [{ text: 'OK', onPress: () => {
          onVideoAdded();
          onClose();
        }}]
      );
      
      setSelectedVideos(new Set());
    } catch (error) {
      console.error('Error adding videos to album:', error);
      Alert.alert('Error', 'Failed to add videos to album');
    } finally {
      setLoading(false);
    }
  };

  const renderVideo = ({ item }: { item: Video }) => {
    const isSelected = selectedVideos.has(item.id);
    
    return (
      <TouchableOpacity 
        style={styles.videoItem}
        onPress={() => toggleVideoSelection(item.id)}
      >
        <View style={styles.videoContainer}>
          <VideoThumbnail
            videoUrl={item.signedUrl || null}
            width={videoWidth}
            height={videoWidth * 1.5}
          />
          <View style={[styles.selectionOverlay, isSelected && styles.selectedOverlay]}>
            {isSelected && (
              <Ionicons name="checkmark-circle" size={24} color="#1DB954" />
            )}
          </View>
        </View>
        {item.title && (
          <Text style={styles.videoTitle} numberOfLines={2}>
            {item.title}
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.cancelButton}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Add to "{albumTitle}"</Text>
          <TouchableOpacity 
            onPress={addVideosToAlbum}
            disabled={selectedVideos.size === 0 || loading}
          >
            <Text style={[
              styles.addButton, 
              (selectedVideos.size === 0 || loading) && styles.disabledButton
            ]}>
              Add ({selectedVideos.size})
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          {videos.length > 0 ? (
            <FlatList
              data={videos}
              renderItem={renderVideo}
              keyExtractor={item => item.id}
              numColumns={3}
              columnWrapperStyle={styles.videoRow}
              contentContainerStyle={styles.videosList}
              showsVerticalScrollIndicator={false}
            />
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="videocam-outline" size={64} color="#9CA3AF" />
              <Text style={styles.emptyText}>No unassigned videos</Text>
              <Text style={styles.emptySubtext}>
                All your videos are already in albums or you haven't created any videos yet.
              </Text>
            </View>
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  cancelButton: {
    color: '#6B7280',
    fontSize: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
    textAlign: 'center',
  },
  addButton: {
    color: '#1DB954',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.5,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  videosList: {
    paddingBottom: 20,
  },
  videoRow: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  videoItem: {
    width: videoWidth,
  },
  videoContainer: {
    position: 'relative',
  },
  selectionOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedOverlay: {
    backgroundColor: 'rgba(29, 185, 84, 0.9)',
  },
  videoTitle: {
    fontSize: 12,
    color: '#374151',
    marginTop: 4,
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
});
