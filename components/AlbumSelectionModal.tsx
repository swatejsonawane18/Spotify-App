import React from 'react';
import { View, Text, StyleSheet, Modal, FlatList, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../utils/supabase';
import { Album } from '../types';
import { useAuth } from '../providers/AuthProvider';

interface AlbumSelectionModalProps {
  visible: boolean;
  onClose: () => void;
  targetUser: any; // The user whose video we want to add to our album
  onAlbumSelected: (album: Album) => void;
}

const ALBUM_TYPE_ICONS = {
  ep_preview: 'musical-notes',
  studio_freestyle: 'mic',
  fan_collab: 'people',
  behind_scenes: 'camera',
  covers: 'repeat',
  originals: 'star',
  custom: 'folder',
};

const ALBUM_TYPE_COLORS = {
  ep_preview: '#FF6B6B',
  studio_freestyle: '#4ECDC4',
  fan_collab: '#45B7D1',
  behind_scenes: '#96CEB4',
  covers: '#FECA57',
  originals: '#FF9FF3',
  custom: '#A8A8A8',
};

export default function AlbumSelectionModal({
  visible,
  onClose,
  targetUser,
  onAlbumSelected
}: AlbumSelectionModalProps) {
  const authContext = useAuth();
  const currentUser = authContext?.user;
  const [albums, setAlbums] = React.useState<Album[]>([]);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (visible && currentUser?.id) {
      fetchCollaborationAlbums();
    }
  }, [visible, currentUser?.id]);

  const fetchCollaborationAlbums = async () => {
    try {
      setLoading(true);

      // Get current user's collaboration albums (fan_collab type)
      const { data, error } = await supabase
        .from('Album')
        .select('*')
        .eq('user_id', currentUser?.id)
        .eq('album_type', 'fan_collab')
        .eq('is_public', true)
        .order('created_at', { ascending: false });

      if (error) {
        if (error.code === 'PGRST200' || error.message?.includes('relation "Album" does not exist')) {
          console.log('Album table not found');
          setAlbums([]);
          return;
        }
        throw error;
      }

      setAlbums(data || []);
    } catch (error) {
      console.error('Error fetching collaboration albums:', error);
      Alert.alert('Error', 'Failed to load collaboration albums');
      setAlbums([]);
    } finally {
      setLoading(false);
    }
  };

  const renderAlbum = ({ item }: { item: Album }) => {
    const iconName = ALBUM_TYPE_ICONS[item.album_type] || 'folder';
    const iconColor = ALBUM_TYPE_COLORS[item.album_type] || '#A8A8A8';
    
    return (
      <TouchableOpacity 
        style={styles.albumItem}
        onPress={() => {
          onAlbumSelected(item);
          onClose();
        }}
      >
        <View style={[styles.albumIcon, { backgroundColor: iconColor }]}>
          <Ionicons name={iconName as any} size={24} color="white" />
        </View>
        <View style={styles.albumInfo}>
          <Text style={styles.albumTitle}>{item.title}</Text>
          <Text style={styles.albumDescription} numberOfLines={2}>
            {item.description || 'No description'}
          </Text>
          <Text style={styles.albumDate}>
            Created {new Date(item.created_at).toLocaleDateString()}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
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
          <Text style={styles.title}>Select Your Album</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.content}>
          <Text style={styles.instruction}>
            Choose which of your collaboration albums you'd like to add {targetUser?.username}'s video to:
          </Text>

          {albums.length > 0 ? (
            <FlatList
              data={albums}
              renderItem={renderAlbum}
              keyExtractor={item => item.id}
              contentContainerStyle={styles.albumsList}
              showsVerticalScrollIndicator={false}
            />
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="albums-outline" size={64} color="#9CA3AF" />
              <Text style={styles.emptyText}>No collaboration albums</Text>
              <Text style={styles.emptySubtext}>
                You need to create collaboration albums (Fan Collab type) to invite others to add their videos.
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
  placeholder: {
    width: 60, // Same width as cancel button for centering
  },
  content: {
    flex: 1,
    padding: 16,
  },
  instruction: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 20,
    lineHeight: 20,
  },
  albumsList: {
    paddingBottom: 20,
  },
  albumItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  albumIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  albumInfo: {
    flex: 1,
  },
  albumTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  albumDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  albumDate: {
    fontSize: 12,
    color: '#9CA3AF',
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
