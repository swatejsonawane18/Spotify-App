
import React from 'react';
import { useAuth } from '../../providers/AuthProvider';
import Profile from '../../components/profile';
import { View, ActivityIndicator } from 'react-native';

export default function ProfileScreen() {
  const { user, following, followers, loading } = useAuth();

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return <Profile user={user} following={following} followers={followers} />;
}
