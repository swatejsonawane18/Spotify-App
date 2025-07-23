import { Stack } from 'expo-router';
import { StyleSheet } from 'react-native';

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen 
        name="index" 
        options={{ 
          headerShown: false,
          contentStyle: styles.container
        }} 
      />
      <Stack.Screen 
        name="signup" 
        options={{ 
          headerShown: false, 
          presentation: "modal",
          contentStyle: styles.container
        }} 
      />
    </Stack>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});
