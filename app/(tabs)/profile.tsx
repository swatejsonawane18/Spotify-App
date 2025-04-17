
import Profile from '@/components/profile';
import { useAuth } from '@/providers/AuthProvider';
import { Text, TouchableOpacity, View, Image} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function () {
  const { user, signOut, following, followers } = useAuth();
  return <Profile user={user} following={following} followers={followers}/>;
}