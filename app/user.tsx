import React from 'react';
import { useAuth } from '../providers/AuthProvider';
import { Text, TouchableOpacity, View, SafeAreaView, StyleSheet, ActivityIndicator } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import Header from '../components/header';
import Profile from '../components/profile';
import { supabase } from '../utils/supabase';

export default function UserProfile() {
  const [user, setUser] = React.useState<any>(null);
  const [followers, setFollowers] = React.useState<any[]>([]);
  const [following, setFollowing] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const params = useLocalSearchParams();

  const loadUserData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get user data
      const { data: userData, error: userError } = await supabase
        .from('User')
        .select('*')
        .eq('id', params.user_id)
        .single();

      if (userError) {
        throw new Error('User not found');
      }
      setUser(userData);

      // Get following data
      const { data: followingData, error: followingError } = await supabase
        .from('Follower')
        .select('*')
        .eq('user_id', params.user_id);

      if (!followingError) {
        setFollowing(followingData || []);
      }

      // Get followers data
      const { data: followersData, error: followersError } = await supabase
        .from('Follower')
        .select('*')
        .eq('follower_user_id', params.user_id);

      if (!followersError) {
        setFollowers(followersData || []);
      }

    } catch (err: any) {
      setError(err.message || 'Failed to load user profile');
      console.error('Error loading user data:', err);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (params.user_id) {
      loadUserData();
    }
  }, [params.user_id]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Header title="Profile" color="black" goBack />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <Header title="Profile" color="black" goBack />
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadUserData}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header title={user?.username || 'Profile'} color="black" goBack />
      <Profile user={user} following={following} followers={followers} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  loadingText: {
    color: '#6B7280',
    marginTop: 16,
    fontSize: 16,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 18,
    textAlign: 'center',
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
});