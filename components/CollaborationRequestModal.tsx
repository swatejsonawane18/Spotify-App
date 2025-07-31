import React from 'react';
import { View, Text, StyleSheet, Modal, FlatList, TouchableOpacity, Alert, Dimensions, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../utils/supabase';
import { Video, Album } from '../types';
import VideoThumbnail from './VideoThumbnail';
import { useAuth } from '../providers/AuthProvider';

const { width } = Dimensions.get('window');
const videoWidth = (width - 48) / 3;

interface CollaborationRequestModalProps {
  visible: boolean;
  onClose: () => void;
  album: Album;
  onRequestSent: () => void;
}

export default function CollaborationRequestModal({
  visible,
  onClose,
  album,
  onRequestSent
}: CollaborationRequestModalProps) {
  const authContext = useAuth();
  const user = authContext?.user;
  const [videos, setVideos] = React.useState<Video[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [selectedVideo, setSelectedVideo] = React.useState<Video | null>(null);
  const [message, setMessage] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (visible) {
      fetchUserVideos();
    }
  }, [visible]);

  const fetchUserVideos = async () => {
    try {
      setLoading(true);
      
      // Get target user's videos that are not in any album
      const { data: videosData, error } = await supabase
        .from('Video')
        .select('*, User(*)')
        .eq('user_id', album.User?.id || album.user_id) // Show the album owner's videos (target user)
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

  const sendCollaborationRequest = async () => {
    if (!selectedVideo || !user?.id) {
      Alert.alert('Error', 'Please select a video to request collaboration.');
      return;
    }

    try {
      setSubmitting(true);
      
      // Check if request already exists
      const { data: existingRequest, error: checkError } = await supabase
        .from('CollaborationRequest')
        .select('*')
        .eq('album_id', album.id)
        .eq('video_id', selectedVideo.id)
        .single();

      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows found, which is fine
        if (checkError.code === 'PGRST200' || checkError.message?.includes('relation "CollaborationRequest" does not exist')) {
          Alert.alert('Database Setup Required', 'The collaboration system needs to be set up. Please run the database schema first.');
          return;
        }
        console.error('Error checking existing request:', checkError);
      }

      if (existingRequest) {
        Alert.alert('Request Already Sent', 'You have already requested to add this video to this album.');
        return;
      }

      // Create collaboration request
      // Current user (album owner) is requesting to add target user's video to their album
      const { error } = await supabase
        .from('CollaborationRequest')
        .insert({
          album_id: album.id,
          video_id: selectedVideo.id,
          requester_id: user.id, // Current user (album owner)
          album_owner_id: user.id, // Same as requester since it's their album
          video_owner_id: selectedVideo.user_id, // The person whose video we want to add
          message: message.trim() || null,
          status: 'pending'
        });

      if (error) {
        if (error.code === 'PGRST200' || error.message?.includes('relation "CollaborationRequest" does not exist')) {
          Alert.alert('Database Setup Required', 'The collaboration system needs to be set up. Please run the database schema first.');
          return;
        }
        throw error;
      }

      Alert.alert(
        'Request Sent!', 
        `Your collaboration request has been sent to ${album.User?.username || 'the album owner'}.`,
        [{ text: 'OK', onPress: () => {
          onRequestSent();
          onClose();
        }}]
      );
      
      setSelectedVideo(null);
      setMessage('');
    } catch (error) {
      console.error('Error sending collaboration request:', error);
      Alert.alert('Error', 'Failed to send collaboration request');
    } finally {
      setSubmitting(false);
    }
  };

  const renderVideo = ({ item }: { item: Video }) => {
    const isSelected = selectedVideo?.id === item.id;
    
    return (
      <TouchableOpacity 
        style={styles.videoItem}
        onPress={() => setSelectedVideo(isSelected ? null : item)}
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
          <Text style={styles.title}>Request Collaboration</Text>
          <TouchableOpacity 
            onPress={sendCollaborationRequest}
            disabled={!selectedVideo || submitting}
          >
            <Text style={[
              styles.sendButton, 
              (!selectedVideo || submitting) && styles.disabledButton
            ]}>
              {submitting ? 'Sending...' : 'Send'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.albumInfo}>
          <Text style={styles.albumTitle}>Add to "{album.title}"</Text>
          <Text style={styles.albumOwner}>Your collaboration album</Text>
          <Text style={styles.instruction}>
            Select one of {album.User?.username}'s videos to add to your collaboration album.
          </Text>
        </View>

        <View style={styles.content}>
          {selectedVideo && (
            <View style={styles.messageSection}>
              <Text style={styles.messageLabel}>Message (Optional)</Text>
              <TextInput
                style={styles.messageInput}
                value={message}
                onChangeText={setMessage}
                placeholder="Add a message to your collaboration request..."
                multiline
                numberOfLines={3}
                maxLength={300}
              />
            </View>
          )}

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
              <Text style={styles.emptyText}>No available videos</Text>
              <Text style={styles.emptySubtext}>
                {album.User?.username} doesn't have any unassigned videos available for collaboration.
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
  sendButton: {
    color: '#1DB954',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.5,
  },
  albumInfo: {
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  albumTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  albumOwner: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  instruction: {
    fontSize: 14,
    color: '#374151',
    marginTop: 8,
    lineHeight: 20,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  messageSection: {
    marginBottom: 20,
  },
  messageLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  messageInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    backgroundColor: '#F9FAFB',
    textAlignVertical: 'top',
    height: 80,
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
