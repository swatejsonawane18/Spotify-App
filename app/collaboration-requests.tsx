import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../providers/AuthProvider';
import { supabase } from '../utils/supabase';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { CollaborationRequest } from '../types';
import Header from '../components/header';

export default function CollaborationRequestsScreen() {
  const authContext = useAuth();
  const user = authContext?.user;
  const router = useRouter();
  const [requests, setRequests] = React.useState<CollaborationRequest[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [activeTab, setActiveTab] = React.useState<'received' | 'sent'>('received');

  React.useEffect(() => {
    if (user?.id) {
      fetchRequests();
    }
  }, [user?.id, activeTab]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('CollaborationRequest')
        .select(`
          *,
          Album(*),
          Video(*),
          Requester:requester_id(id, username),
          AlbumOwner:album_owner_id(id, username),
          VideoOwner:video_owner_id(id, username)
        `);

      if (activeTab === 'received') {
        // Show requests where someone wants to add the current user's video to their album
        query = query.eq('video_owner_id', user?.id);
      } else {
        // Show requests where the current user wants to add someone's video to their album
        query = query.eq('requester_id', user?.id);
      }

      const { data, error } = await query
        .order('created_at', { ascending: false });

      if (error) {
        if (error.code === 'PGRST200' || error.message?.includes('relation "CollaborationRequest" does not exist')) {
          console.log('CollaborationRequest table not found');
          setRequests([]);
          return;
        }
        if (error.code === '42703') {
          console.log('Database schema needs to be updated');
          setRequests([]);
          return;
        }
        throw error;
      }

      setRequests(data || []);
    } catch (error) {
      console.error('Error fetching collaboration requests:', error);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestAction = async (requestId: string, action: 'approved' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('CollaborationRequest')
        .update({ status: action })
        .eq('id', requestId);

      if (error) throw error;

      Alert.alert(
        'Success',
        `Request ${action === 'approved' ? 'approved' : 'rejected'} successfully.`,
        [{ text: 'OK', onPress: fetchRequests }]
      );
    } catch (error) {
      console.error('Error updating request:', error);
      Alert.alert('Error', 'Failed to update request');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return '#10B981';
      case 'rejected': return '#EF4444';
      default: return '#F59E0B';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return 'checkmark-circle';
      case 'rejected': return 'close-circle';
      default: return 'time';
    }
  };

  const renderRequest = ({ item }: { item: CollaborationRequest }) => {
    const isReceived = activeTab === 'received';
    const otherUser = isReceived ? item.Requester : item.VideoOwner;

    return (
      <View style={styles.requestCard}>
        <View style={styles.requestHeader}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={20} color="#9CA3AF" />
          </View>
          <View style={styles.requestInfo}>
            <Text style={styles.username}>{otherUser?.username}</Text>
            <Text style={styles.requestText}>
              {isReceived
                ? `wants to add your video to their album "${item.Album?.title}"`
                : `you requested to add their video to "${item.Album?.title}"`
              }
            </Text>
            <Text style={styles.timestamp}>
              {new Date(item.created_at).toLocaleDateString()}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Ionicons name={getStatusIcon(item.status) as any} size={16} color="white" />
          </View>
        </View>

        {item.message && (
          <View style={styles.messageContainer}>
            <Text style={styles.messageLabel}>Message:</Text>
            <Text style={styles.messageText}>{item.message}</Text>
          </View>
        )}

        {isReceived && item.status === 'pending' && (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, styles.rejectButton]}
              onPress={() => handleRequestAction(item.id, 'rejected')}
            >
              <Ionicons name="close" size={16} color="white" />
              <Text style={styles.actionButtonText}>Reject</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.approveButton]}
              onPress={() => handleRequestAction(item.id, 'approved')}
            >
              <Ionicons name="checkmark" size={16} color="white" />
              <Text style={styles.actionButtonText}>Approve</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Collaboration Requests" color="black" goBack />
      
      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'received' && styles.activeTab]}
          onPress={() => setActiveTab('received')}
        >
          <Text style={[styles.tabText, activeTab === 'received' && styles.activeTabText]}>
            Received
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'sent' && styles.activeTab]}
          onPress={() => setActiveTab('sent')}
        >
          <Text style={[styles.tabText, activeTab === 'sent' && styles.activeTabText]}>
            Sent
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {requests.length > 0 ? (
          <FlatList
            data={requests}
            renderItem={renderRequest}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons 
              name={activeTab === 'received' ? 'mail-open-outline' : 'send-outline'} 
              size={64} 
              color="#9CA3AF" 
            />
            <Text style={styles.emptyText}>
              {activeTab === 'received' ? 'No requests received' : 'No requests sent'}
            </Text>
            <Text style={styles.emptySubtext}>
              {activeTab === 'received' 
                ? 'Collaboration requests will appear here'
                : 'Your sent collaboration requests will appear here'
              }
            </Text>
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
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    marginHorizontal: 16,
    borderRadius: 8,
    padding: 4,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  activeTab: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  activeTabText: {
    color: '#111827',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  listContainer: {
    paddingBottom: 20,
  },
  requestCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  requestHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E5E7EB',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  requestInfo: {
    flex: 1,
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  requestText: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 4,
  },
  timestamp: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  statusBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  messageLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 4,
  },
  messageText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 6,
    gap: 4,
  },
  rejectButton: {
    backgroundColor: '#EF4444',
  },
  approveButton: {
    backgroundColor: '#10B981',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
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
