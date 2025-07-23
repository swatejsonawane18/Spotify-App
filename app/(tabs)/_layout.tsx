import { Tabs, useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Platform } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

export default function TabLayout() {
  const router = useRouter();

  const tabOptions = {
    headerShown: false,
    tabBarActiveTintColor: '#3B82F6',
    tabBarInactiveTintColor: '#9CA3AF',
    tabBarStyle: {
      backgroundColor: '#FFFFFF',
      borderTopWidth: 1,
      borderTopColor: '#F3F4F6',
      height: Platform.OS === 'ios' ? 85 : 75,
      paddingBottom: Platform.OS === 'ios' ? 20 : 10,
      paddingTop: 8,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: -2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 8,
    },
    tabBarLabelStyle: {
      fontSize: 12,
      fontWeight: '500' as const,
    },
  };

  const tabIcon = (name: keyof typeof Ionicons.glyphMap, focusedName?: keyof typeof Ionicons.glyphMap) =>
    ({ focused }: { focused: boolean }) => (
      <Ionicons
        name={focused ? (focusedName || name) : `${name}-outline` as keyof typeof Ionicons.glyphMap}
        size={26}
        color={focused ? '#3B82F6' : '#9CA3AF'}
      />
    );

  return (
    <Tabs screenOptions={tabOptions}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: tabIcon('home', 'home'),
        }}
      />

      <Tabs.Screen
        name="friends"
        options={{
          title: 'Friends',
          tabBarIcon: tabIcon('people', 'people'),
        }}
      />

      <Tabs.Screen
        name="empty"
        options={{
          title: '',
          tabBarIcon: () => (
            <Ionicons
              name="add-circle"
              size={36}
              color="#3B82F6"
              style={styles.addButton}
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
  addButton: {
    marginTop: Platform.OS === 'ios' ? -2 : 0,
  },
});

