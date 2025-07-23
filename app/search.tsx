import React from 'react';
import Header from '../components/header';
import { Text, View, TextInput, TouchableOpacity, Image, FlatList, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../utils/supabase';
import { useRouter } from 'expo-router';
import { User } from '../types';

export default function SearchScreen() {
  const router = useRouter();
  const [text, setText] = React.useState('');
  const [results, setResults] = React.useState<User[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [hasSearched, setHasSearched] = React.useState(false);

  const search = async (searchText: string) => {
    if (!searchText.trim()) {
      setResults([]);
      setHasSearched(false);
      return;
    }
    
    setLoading(true);
    setHasSearched(true);
    
    try {
      const { data, error } = await supabase
        .from('User')
        .select('*')
        .ilike('username', `%${searchText}%`)
        .limit(20);
      
      if (error) throw error;
      setResults(data || []);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    const timeoutId = setTimeout(() => {
      search(text);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [text]);

  const renderUser = ({ item }: { item: User }) => (
    <TouchableOpacity 
      onPress={() => router.push(`/user?user_id=${item.id}`)}
      className="flex-row items-center p-4 border-b border-gray-100"
    >
      <Image
        source={{ uri: item.avatar_url || 'https://placehold.co/50x50' }}
        className="w-12 h-12 rounded-full bg-gray-200 mr-3"
      />
      <View className="flex-1">
        <Text className="font-bold text-lg">{item.username}</Text>
        <Text className="text-gray-600">{item.email}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="gray" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className="flex-1 bg-white">
      <Header title="Search" color="black" goBack />
      
      <View className="p-4">
        <View className="flex-row items-center bg-gray-100 rounded-full px-4 py-3">
          <Ionicons name="search" size={20} color="gray" />
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="Search users..."
            className="flex-1 ml-2 text-base"
            autoCapitalize="none"
            autoCorrect={false}
          />
          {text.length > 0 && (
            <TouchableOpacity onPress={() => setText('')}>
              <Ionicons name="close-circle" size={20} color="gray" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View className="flex-1">
        {loading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#0000ff" />
            <Text className="mt-2 text-gray-600">Searching...</Text>
          </View>
        ) : (
          <FlatList
            data={results}
            keyExtractor={(item) => item.id}
            renderItem={renderUser}
            ListEmptyComponent={
              hasSearched ? (
                <View className="flex-1 items-center justify-center p-8">
                  <Ionicons name="search" size={64} color="gray" />
                  <Text className="text-center text-gray-500 text-lg mt-4">
                    {text.length > 0 ? 'No users found' : 'Start typing to search'}
                  </Text>
                </View>
              ) : (
                <View className="flex-1 items-center justify-center p-8">
                  <Ionicons name="search" size={64} color="gray" />
                  <Text className="text-center text-gray-500 text-lg mt-4">
                    Search for users by username
                  </Text>
                </View>
              )
            }
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </SafeAreaView>
  );
}
