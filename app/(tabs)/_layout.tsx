import { Tabs, useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

export default function TabLayout() {
  const router = useRouter();

  const tabOptions = {
    headerShown: false,
    tabBarActiveTintColor: '#000',
    tabBarInactiveTintColor: '#666',
    tabBarStyle: {
      backgroundColor: '#fff',
      borderTopWidth: 0,
    },
  };

  const tabIcon = (name: string, focusedName?: string) => 
    ({ focused }: { focused: boolean }) => (
      <Ionicons 
        name={focused ? (focusedName || name) : `${name}-outline`}
        size={24}
        color={focused ? '#000' : '#666'}
      />
    );

  return (
    <Tabs screenOptions={tabOptions}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: tabIcon('home', 'home-sharp'),
        }}
      />

      <Tabs.Screen
        name="friends"
        options={{
          title: 'Friends',
          tabBarIcon: tabIcon('people', 'people-sharp'),
        }}
      />

      <Tabs.Screen
        name="empty"
        options={{
          title: '',
          tabBarIcon: () => (
            <Ionicons 
              name="add-circle" 
              size={48} 
              color="black" 
              style={styles.circleButton}
            />
          ),
          tabBarLabel: () => null,
        }}
        listeners={{
          tabPress: (e) => {
            e.preventDefault();
            router.push('/camera');
          },
        }}
      />

      <Tabs.Screen
        name="inbox"
        options={{
          title: 'Inbox',
          tabBarIcon: tabIcon('mail'),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: tabIcon('person'),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  circleButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});