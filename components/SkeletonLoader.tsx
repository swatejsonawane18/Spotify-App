import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

interface SkeletonLoaderProps {
  type?: 'video' | 'profile' | 'list';
}

export default function SkeletonLoader({ type = 'video' }: SkeletonLoaderProps) {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: false,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: false,
        }),
      ])
    );
    animation.start();

    return () => animation.stop();
  }, [animatedValue]);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  if (type === 'video') {
    return (
      <View style={styles.videoContainer}>
        <Animated.View style={[styles.videoSkeleton, { opacity }]} />
        <View style={styles.videoControls}>
          <Animated.View style={[styles.profileSkeleton, { opacity }]} />
          <View style={styles.actionButtons}>
            <Animated.View style={[styles.actionButton, { opacity }]} />
            <Animated.View style={[styles.actionButton, { opacity }]} />
            <Animated.View style={[styles.actionButton, { opacity }]} />
          </View>
        </View>
        <View style={styles.videoInfo}>
          <Animated.View style={[styles.textLine, styles.textLineShort, { opacity }]} />
          <Animated.View style={[styles.textLine, styles.textLineLong, { opacity }]} />
        </View>
      </View>
    );
  }

  if (type === 'profile') {
    return (
      <View style={styles.profileContainer}>
        <Animated.View style={[styles.avatarSkeleton, { opacity }]} />
        <Animated.View style={[styles.textLine, styles.nameLine, { opacity }]} />
        <Animated.View style={[styles.textLine, styles.emailLine, { opacity }]} />
        <View style={styles.statsContainer}>
          <Animated.View style={[styles.statSkeleton, { opacity }]} />
          <Animated.View style={[styles.statSkeleton, { opacity }]} />
          <Animated.View style={[styles.statSkeleton, { opacity }]} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.listContainer}>
      {[...Array(5)].map((_, index) => (
        <View key={index} style={styles.listItem}>
          <Animated.View style={[styles.listItemImage, { opacity }]} />
          <View style={styles.listItemContent}>
            <Animated.View style={[styles.textLine, styles.listItemTitle, { opacity }]} />
            <Animated.View style={[styles.textLine, styles.listItemSubtitle, { opacity }]} />
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  videoContainer: {
    width,
    height,
    backgroundColor: '#000',
    position: 'relative',
  },
  videoSkeleton: {
    width: '100%',
    height: '100%',
    backgroundColor: '#333',
  },
  videoControls: {
    position: 'absolute',
    right: 16,
    bottom: 80,
    alignItems: 'center',
  },
  profileSkeleton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#666',
    marginBottom: 24,
  },
  actionButtons: {
    alignItems: 'center',
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#666',
    marginBottom: 24,
  },
  videoInfo: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 80,
  },
  textLine: {
    backgroundColor: '#666',
    borderRadius: 4,
    marginBottom: 8,
  },
  textLineShort: {
    width: '40%',
    height: 16,
  },
  textLineLong: {
    width: '80%',
    height: 14,
  },
  profileContainer: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: '#FFFFFF',
  },
  avatarSkeleton: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#E5E7EB',
    marginBottom: 16,
  },
  nameLine: {
    width: 120,
    height: 20,
    marginBottom: 8,
  },
  emailLine: {
    width: 160,
    height: 16,
    marginBottom: 32,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingHorizontal: 32,
  },
  statSkeleton: {
    width: 60,
    height: 40,
    backgroundColor: '#E5E7EB',
    borderRadius: 8,
  },
  listContainer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  listItemImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#E5E7EB',
    marginRight: 16,
  },
  listItemContent: {
    flex: 1,
  },
  listItemTitle: {
    width: '70%',
    height: 16,
    backgroundColor: '#E5E7EB',
  },
  listItemSubtitle: {
    width: '50%',
    height: 14,
    backgroundColor: '#E5E7EB',
  },
});
