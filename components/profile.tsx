import { useAuth } from '@/providers/AuthProvider';
import { Text, TouchableOpacity, View, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Profile({
  user,
  following,
  followers
}: {
  user: any;
  following: any;
  followers: any;
}) {
  const { user: authUser, signOut } = useAuth();

  const addProfilePicture = async () => {
    // Profile picture upload logic here
  };

  return (
    <SafeAreaView className="flex-1 items-center">
      <TouchableOpacity onPress={addProfilePicture}>
        <Image
          source={{ uri: 'https://placehold.co/40x40' }}
          className="w-20 h-20 rounded-full bg-black my-3"
        />
      </TouchableOpacity>

      <Text className="text-2xl font-bold my-3">{user?.username}</Text>

      <View className="flex-row items-center justify-around w-full my-3">
        <View className="items-center justify-center">
          <Text className="text-md font-semibold">Following</Text>
          <Text className="text-md">{following.length}</Text>
        </View>

        <View className="items-center justify-center">
          <Text className="text-md font-semibold">Followers</Text>
          <Text className="text-md">{followers.length}</Text>
        </View>

        <View className="items-center justify-center">
          <Text className="text-md font-semibold">Likes</Text>
          <Text className="text-md">1000</Text>
        </View>
      </View>

      {authUser?.id === user?.id && (
        <TouchableOpacity 
          className="bg-black px-4 py-2 rounded-lg" 
          onPress={signOut}
        >
          <Text className="text-white font-bold text-lg">Sign Out</Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}