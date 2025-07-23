import React from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

interface HeaderProps {
  title: string;
  color?: string;
  goBack?: boolean;
  search?: boolean;
  backgroundColor?: string;
}

export default function Header({
  title,
  color = 'black',
  goBack = false,
  search = false,
  backgroundColor = 'white'
}: HeaderProps) {
  const router = useRouter();

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor }]}>
      <View style={[styles.container, { backgroundColor }]}>
        <View style={styles.leftSection}>
          {goBack && (
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color={color} />
            </TouchableOpacity>
          )}
          <Text style={[styles.title, { color }]}>
            {title}
          </Text>
        </View>

        {search && (
          <TouchableOpacity
            onPress={() => router.push('/search')}
            style={styles.searchButton}
          >
            <Ionicons name="search" size={24} color={color} />
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: 'white',
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'black',
  },
  searchButton: {
    padding: 8,
    borderRadius: 20,
  },
});
