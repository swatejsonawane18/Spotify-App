import React from 'react';
import { View, Text, TouchableOpacity, Dimensions, Share, StyleSheet } from 'react-native';
import { VideoView, useVideoPlayer } from 'expo-video';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../providers/AuthProvider';
import { supabase } from '../utils/supabase';
import { useRouter } from 'expo-router';
import { Video as VideoType } from '../types';

const { width } = Dimensions.get('window');
const defaultHeight = Dimensions.get('window').height;

interface VideoPlayerProps {
  video: VideoType;
  isViewable: boolean;
  height?: number;
}

export default function VideoPlayer({ video, isViewable, height = defaultHeight }: VideoPlayerProps) {
  const { user, likes, getLikes, following, getFollowing } = useAuth();
  const router = useRouter();
  const [isPlaying, setIsPlaying] = React.useState(false);

  const player = useVideoPlayer(video.signedUrl || '', (player) => {
    player.loop = true;
    player.muted = false;
  });

  React.useEffect(() => {
    const subscription = player.addListener('playingChange', (event) => {
      setIsPlaying(event.isPlaying);
    });

    return () => {
      subscription?.remove();
    };
  }, [player]);

  React.useEffect(() => {
    if (isViewable) {
      player.play();
    } else {
      player.pause();
    }
  }, [isViewable, player]);

  const shareVideo = async () => {
    try {
      await Share.share({
        message: `Check out this video by ${video.User?.username || 'Unknown'}!`,
        url: video.signedUrl || '',
      });
    } catch (error) {
      console.error('Error sharing video:', error);
    }
  };

  const isLiked = likes.some(like => like.video_id === video.id);
  const isFollowing = following.some(follow => follow.follower_user_id === video.user_id);

  const likeVideo = async () => {
    if (!user?.id) return;
    
    try {
      const { error } = await supabase
        .from('Like')
        .insert({
          user_id: user.id,
          video_id: video.id,
          video_user_id: video.user_id
        });
      
      if (!error) {
        await getLikes(user.id);
      }
    } catch (error) {
      console.error('Error liking video:', error);
    }
  };

  const unLikeVideo = async () => {
    if (!user?.id) return;
    
    try {
      const { error } = await supabase
        .from('Like')
        .delete()
        .eq('user_id', user.id)
        .eq('video_id', video.id);
      
      if (!error) {
        await getLikes(user.id);
      }
    } catch (error) {
      console.error('Error unliking video:', error);
    }
  };

  const followUser = async () => {
    if (!user?.id || video.user_id === user.id) return;
    
    try {
      const { error } = await supabase
        .from('Follower')
        .insert({
          user_id: user.id,
          follower_user_id: video.user_id
        });
      
      if (!error) {
        await getFollowing(user.id);
      }
    } catch (error) {
      console.error('Error following user:', error);
    }
  };

  const unFollowUser = async () => {
    if (!user?.id) return;
    
    try {
      const { error } = await supabase
        .from('Follower')
        .delete()
        .eq('user_id', user.id)
        .eq('follower_user_id', video.user_id);
      
      if (!error) {
        await getFollowing(user.id);
      }
    } catch (error) {
      console.error('Error unfollowing user:', error);
    }
  };

  const togglePlayback = () => {
    if (isPlaying) {
      player.pause();
      setIsPlaying(false);
    } else {
      player.play();
      setIsPlaying(true);
    }
  };

  const containerStyle = {
    width,
    height,
    backgroundColor: '#000',
    position: 'relative' as const,
  };

  const videoStyle = {
    width,
    height,
  };

  if (!video.signedUrl) {
    return (
      <View style={[containerStyle, styles.errorContainer]}>
        <Text style={styles.errorText}>Video not available</Text>
      </View>
    );
  }

  return (
    <View style={containerStyle}>
      <TouchableOpacity
        onPress={togglePlayback}
        style={styles.videoTouchable}
        activeOpacity={1}
      >
        <VideoView
          player={player}
          style={videoStyle}
          contentFit="cover"
          nativeControls={false}
        />

        {!isPlaying && (
          <View style={styles.playButton}>
            <Ionicons name="play-circle" size={80} color="white" />
          </View>
        )}
      </TouchableOpacity>

      {/* Right side controls */}
      <View style={styles.rightControls}>
        {/* User Profile */}
        <View style={styles.profileContainer}>
          <TouchableOpacity
            onPress={() => router.push(`/user?user_id=${video.user_id}`)}
            style={styles.profileButton}
          >
            <Ionicons name="person" size={24} color="#333" />
          </TouchableOpacity>

          {user?.id !== video.user_id && (
            <TouchableOpacity
              style={[styles.followButton, { backgroundColor: isFollowing ? '#EF4444' : '#3B82F6' }]}
              onPress={isFollowing ? unFollowUser : followUser}
            >
              <Ionicons
                name={isFollowing ? "remove" : "add"}
                size={16}
                color="white"
              />
            </TouchableOpacity>
          )}
        </View>

        {/* Like Button */}
        <TouchableOpacity
          onPress={isLiked ? unLikeVideo : likeVideo}
          style={styles.actionButton}
        >
          <Ionicons
            name={isLiked ? "heart" : "heart-outline"}
            size={32}
            color={isLiked ? "#EF4444" : "white"}
          />
          <Text style={styles.actionText}>
            {likes.filter(like => like.video_id === video.id).length}
          </Text>
        </TouchableOpacity>

        {/* Comment Button */}
        <TouchableOpacity
          onPress={() => router.push(`/comment?video_id=${video.id}`)}
          style={styles.actionButton}
        >
          <Ionicons name="chatbubble-outline" size={32} color="white" />
          <Text style={styles.actionText}>0</Text>
        </TouchableOpacity>

        {/* Share Button */}
        <TouchableOpacity onPress={shareVideo} style={styles.actionButton}>
          <Ionicons name="share-outline" size={32} color="white" />
        </TouchableOpacity>
      </View>

      {/* Bottom user info */}
      <View style={styles.bottomInfo}>
        <Text style={styles.username}>
          @{video.User?.username || 'Unknown'}
        </Text>
        {video.title && (
          <Text style={styles.videoTitle} numberOfLines={2}>
            {video.title}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  errorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: 'white',
    fontSize: 16,
  },
  videoTouchable: {
    flex: 1,
  },
  playButton: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rightControls: {
    position: 'absolute',
    right: 16,
    bottom: 80,
    alignItems: 'center',
  },
  profileContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  profileButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  followButton: {
    position: 'absolute',
    bottom: -8,
    right: -4,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  actionButton: {
    alignItems: 'center',
    marginBottom: 24,
  },
  actionText: {
    color: 'white',
    fontSize: 12,
    marginTop: 4,
    fontWeight: '600',
  },
  bottomInfo: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 80,
  },
  username: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  videoTitle: {
    color: 'white',
    fontSize: 14,
    lineHeight: 20,
  },
});
