import React from 'react';
import { 
  SafeAreaView, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  View, 
  Image, 
  FlatList, 
  KeyboardAvoidingView, 
  Platform, 
  TouchableWithoutFeedback, 
  Keyboard 
} from 'react-native';
import { useAuth } from '@/providers/AuthProvider';
import { useLocalSearchParams } from 'expo-router';
import { supabase } from '@/utils/supabase';
import { Ionicons } from '@expo/vector-icons';

type Comment = {
  id: string;
  text: string;
  created_at: string;
  User: {
    id: string;
    username: string;
    avatar_url?: string;
  };
};

export default function CommentsScreen() {
  const { user } = useAuth();
  const [comments, setComments] = React.useState<Comment[]>([]);
  const [commentText, setCommentText] = React.useState('');
  const params = useLocalSearchParams<{ video_id: string }>();

  const fetchComments = async () => {
    try {
      const { data, error } = await supabase
        .from('Comment')
        .select('*, User(*)')
        .eq('video_id', params.video_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setComments(data || []);
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  React.useEffect(() => {
    fetchComments();
  }, []);

  const handleAddComment = async () => {
    if (!commentText.trim() || !user?.id) return;

    try {
      const { error } = await supabase
        .from('Comment')
        .insert({
          user_id: user.id,
          video_id: params.video_id,
          text: commentText.trim(),
        });

      if (error) throw error;

      setCommentText('');
      Keyboard.dismiss();
      await fetchComments();
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const renderComment = ({ item }: { item: Comment }) => (
    <View className="flex-row items-start gap-3 w-full p-3 border-b border-gray-100">
      <Image
        source={{ uri: item.User.avatar_url || 'https://placehold.co/40x40' }}
        className="w-10 h-10 rounded-full bg-gray-200"
      />
      <View className="flex-1">
        <Text className="font-bold text-base">{item.User.username}</Text>
        <Text className="text-sm text-gray-800">{item.text}</Text>
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 70 : 0}
      className="flex-1 bg-white"
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <SafeAreaView className="flex-1">
          <View className="p-4 border-b border-gray-200">
            <Text className="text-black font-bold text-xl text-center">
              Comments
            </Text>
          </View>

          <FlatList
            data={comments}
            renderItem={renderComment}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingBottom: 80 }}
            className="flex-1 w-full"
          />

          <View className="absolute bottom-0 left-0 right-0 bg-white p-3 border-t border-gray-200">
            <View className="flex-row items-center gap-2">
              <TextInput
                className="flex-1 bg-gray-100 p-3 rounded-full"
                placeholder="Add a comment..."
                value={commentText}
                onChangeText={setCommentText}
                onSubmitEditing={handleAddComment}
                returnKeyType="send"
              />
              <TouchableOpacity 
                onPress={handleAddComment}
                disabled={!commentText.trim()}
              >
                <Ionicons 
                  name="arrow-forward-circle" 
                  size={40} 
                  color={commentText.trim() ? "red" : "gray"} 
                />
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}