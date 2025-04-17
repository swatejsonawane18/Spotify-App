import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import React from 'react';
import { useAuth } from '@/providers/AuthProvider';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const { signIn } = useAuth();

  return (
    <View className="flex-1 items-center justify-center bg-white">
      <View className="w-full p-4">
        <Text className="text-black font-bold text-3xl text-center mb-4">
          Login
        </Text>
        
        <TextInput
          placeholder="Email"
          className="bg-white p-4 rounded-lg border border-gray-300 w-full mb-4"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        
        <TextInput
          placeholder="Password"
          className="bg-white p-4 rounded-lg border border-gray-300 w-full mb-4"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        
        <TouchableOpacity
          className="bg-black px-4 py-2 rounded-lg"
          onPress={() => signIn(email, password)}
        >
          <Text className="text-white font-bold text-lg text-center">
            Login
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity onPress={() => router.push('/signup')}>
          <Text className="text-black font-semibold text-lg text-center mt-3">
            Don't have an account? Sign Up
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}