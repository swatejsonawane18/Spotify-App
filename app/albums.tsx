import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Modal, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../providers/AuthProvider';
import { supabase } from '../utils/supabase';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Album } from '../types';
import Header from '../components/header';

const ALBUM_TYPES = [
  { key: 'ep_preview', label: 'EP Preview', icon: 'musical-notes', color: '#FF6B6B' },
  { key: 'studio_freestyle', label: 'Studio Freestyle', icon: 'mic', color: '#4ECDC4' },
  { key: 'fan_collab', label: 'Fan Collab', icon: 'people', color: '#45B7D1' },
  { key: 'behind_scenes', label: 'Behind the Scenes', icon: 'camera', color: '#96CEB4' },
  { key: 'covers', label: 'Covers', icon: 'repeat', color: '#FFEAA7' },
  { key: 'originals', label: 'Originals', icon: 'create', color: '#DDA0DD' },
  { key: 'custom', label: 'Custom', icon: 'folder', color: '#A8A8A8' },
];

export default function AlbumsScreen() {
  const authContext = useAuth();
  const user = authContext?.user;
  const router = useRouter();
  const [albums, setAlbums] = React.useState<Album[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [showCreateModal, setShowCreateModal] = React.useState(false);
  const [newAlbumTitle, setNewAlbumTitle] = React.useState('');
  const [newAlbumDescription, setNewAlbumDescription] = React.useState('');
  const [selectedAlbumType, setSelectedAlbumType] = React.useState<Album['album_type']>('custom');
  const [creating, setCreating] = React.useState(false);

  React.useEffect(() => {
    if (user?.id) {
      fetchAlbums();
    }
  }, [user?.id]);

  const fetchAlbums = async () => {
    try {
      setLoading(true);

      // First, try to fetch albums
      const { data: albumsData, error: albumsError } = await supabase
        .from('Album')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (albumsError) {
        // If Album table doesn't exist, just set empty array
        if (albumsError.code === 'PGRST200' || albumsError.message?.includes('relation "Album" does not exist')) {
          console.log('Album table not found. Please run the database schema first.');
          setAlbums([]);
          return;
        }
        throw albumsError;
      }

      // Get video counts for each album
      const albumsWithCount = await Promise.all(
        (albumsData || []).map(async (album) => {
          const { count } = await supabase
            .from('Video')
            .select('*', { count: 'exact', head: true })
            .eq('album_id', album.id);

          return {
            ...album,
            video_count: count || 0
          };
        })
      );

      setAlbums(albumsWithCount);
    } catch (error) {
      console.error('Error fetching albums:', error);
      setAlbums([]); // Set empty array instead of showing error
    } finally {
      setLoading(false);
    }
  };

  const createAlbum = async () => {
    if (!newAlbumTitle.trim() || !user?.id) return;

    try {
      setCreating(true);
      const { error } = await supabase
        .from('Album')
        .insert({
          title: newAlbumTitle.trim(),
          description: newAlbumDescription.trim() || null,
          album_type: selectedAlbumType,
          user_id: user.id,
          is_public: true
        });

      if (error) {
        if (error.code === 'PGRST200' || error.message?.includes('relation "Album" does not exist')) {
          Alert.alert(
            'Database Setup Required',
            'The Album table needs to be created in your database. Please run the database schema first.',
            [{ text: 'OK' }]
          );
          return;
        }
        throw error;
      }

      setShowCreateModal(false);
      setNewAlbumTitle('');
      setNewAlbumDescription('');
      setSelectedAlbumType('custom');
      fetchAlbums();
    } catch (error) {
      console.error('Error creating album:', error);
      Alert.alert('Error', 'Failed to create album. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  const getAlbumTypeInfo = (type: Album['album_type']) => {
    return ALBUM_TYPES.find(t => t.key === type) || ALBUM_TYPES[ALBUM_TYPES.length - 1];
  };

  const renderAlbum = ({ item }: { item: Album }) => {
    const typeInfo = getAlbumTypeInfo(item.album_type);
    
    return (
      <TouchableOpacity 
        style={styles.albumCard}
        onPress={() => router.push(`/album-details?album_id=${item.id}`)}
      >
        <View style={[styles.albumIcon, { backgroundColor: typeInfo.color }]}>
          <Ionicons name={typeInfo.icon as any} size={24} color="white" />
        </View>
        <View style={styles.albumInfo}>
          <Text style={styles.albumTitle}>{item.title}</Text>
          <Text style={styles.albumType}>{typeInfo.label}</Text>
          {item.description && (
            <Text style={styles.albumDescription} numberOfLines={2}>
              {item.description}
            </Text>
          )}
          <Text style={styles.albumStats}>
            {item.video_count || 0} clips
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Header title="My Albums" color="black" goBack />
        <View style={styles.centerContainer}>
          <Text style={styles.loadingText}>Loading albums...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header title="My Albums" color="black" goBack />
      
      <View style={styles.content}>
        <TouchableOpacity 
          style={styles.createButton}
          onPress={() => setShowCreateModal(true)}
        >
          <Ionicons name="add" size={24} color="white" />
          <Text style={styles.createButtonText}>Create New Album</Text>
        </TouchableOpacity>

        <FlatList
          data={albums}
          renderItem={renderAlbum}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="albums" size={64} color="#9CA3AF" />
              <Text style={styles.emptyText}>No albums yet</Text>
              <Text style={styles.emptySubtext}>
                {albums.length === 0 && !loading ?
                  "Create your first album to organize your music clips" :
                  "Create your first album to organize your music clips"
                }
              </Text>
              <TouchableOpacity
                style={styles.setupButton}
                onPress={() => Alert.alert(
                  'Database Setup Required',
                  'To use Albums, please run the database schema in your Supabase project. Check DATABASE_SETUP.md for instructions.',
                  [{ text: 'OK' }]
                )}
              >
                <Ionicons name="information-circle" size={20} color="#3B82F6" />
                <Text style={styles.setupButtonText}>Setup Instructions</Text>
              </TouchableOpacity>
            </View>
          }
        />
      </View>

      {/* Create Album Modal */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowCreateModal(false)}>
              <Text style={styles.cancelButton}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>New Album</Text>
            <TouchableOpacity 
              onPress={createAlbum}
              disabled={!newAlbumTitle.trim() || creating}
            >
              <Text style={[styles.createButton, (!newAlbumTitle.trim() || creating) && styles.disabledButton]}>
                {creating ? 'Creating...' : 'Create'}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            <Text style={styles.label}>Album Title</Text>
            <TextInput
              style={styles.input}
              value={newAlbumTitle}
              onChangeText={setNewAlbumTitle}
              placeholder="Enter album title"
              maxLength={50}
            />

            <Text style={styles.label}>Description (Optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={newAlbumDescription}
              onChangeText={setNewAlbumDescription}
              placeholder="Describe your album..."
              multiline
              numberOfLines={3}
              maxLength={200}
            />

            <Text style={styles.label}>Album Type</Text>
            <View style={styles.typeGrid}>
              {ALBUM_TYPES.map(type => (
                <TouchableOpacity
                  key={type.key}
                  style={[
                    styles.typeOption,
                    selectedAlbumType === type.key && styles.selectedType
                  ]}
                  onPress={() => setSelectedAlbumType(type.key as Album['album_type'])}
                >
                  <View style={[styles.typeIcon, { backgroundColor: type.color }]}>
                    <Ionicons name={type.icon as any} size={20} color="white" />
                  </View>
                  <Text style={styles.typeLabel}>{type.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            {/* Add some bottom padding for better scrolling */}
            <View style={{ height: 50 }} />
          </ScrollView>
        </SafeAreaView>
      </Modal>
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
    padding: 16,
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
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1DB954',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    marginBottom: 20,
  },
  createButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  listContainer: {
    paddingBottom: 20,
  },
  albumCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  albumIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
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
  albumType: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  albumDescription: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 4,
  },
  albumStats: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
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
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  disabledButton: {
    opacity: 0.5,
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: '#F9FAFB',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  typeOption: {
    width: '48%',
    marginRight: '4%',
    marginBottom: 12,
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  selectedType: {
    borderColor: '#1DB954',
    backgroundColor: '#F0FDF4',
  },
  typeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  typeLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#374151',
    textAlign: 'center',
  },
  setupButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EBF4FF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 16,
  },
  setupButtonText: {
    color: '#3B82F6',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
});
