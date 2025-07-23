import React, { useState, useRef } from 'react';
import { View, Dimensions, StyleSheet, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useAuth } from '../providers/AuthProvider';
import { supabase } from '../utils/supabase';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { VideoView, useVideoPlayer } from 'expo-video';
import * as ImagePicker from 'expo-image-picker';

export default function CameraScreen() {
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [isRecording, setIsRecording] = useState(false);
  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const cameraRef = useRef<CameraView>(null);
  const recordingTimer = useRef<any>(null);
  const { user } = useAuth();
  const router = useRouter();

  const player = useVideoPlayer(videoUri || '', (player) => {
    player.loop = true;
  });

  // All hooks must be called before any early returns
  React.useEffect(() => {
    if (!videoUri) return;

    const subscription = player.addListener('playingChange', (event) => {
      setIsPlaying(event.isPlaying);
    });

    return () => {
      subscription?.remove();
    };
  }, [player, videoUri]);

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>We need your permission to show the camera</Text>
        <TouchableOpacity
          style={styles.permissionButton}
          onPress={requestPermission}
        >
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const toggleCameraFacing = () => {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  };

  const handleRecordVideo = async () => {
    if (isRecording) {
      setIsRecording(false);
      if (recordingTimer.current) {
        clearInterval(recordingTimer.current);
        recordingTimer.current = null;
      }
      await cameraRef.current?.stopRecording();
      return;
    }

    setIsRecording(true);
    setRecordingTime(0);

    // Start recording timer
    recordingTimer.current = setInterval(() => {
      setRecordingTime(prev => prev + 1);
    }, 1000);

    const video = await cameraRef.current?.recordAsync();
    setVideoUri(video?.uri ?? null);

    // Clear timer when recording stops
    if (recordingTimer.current) {
      clearInterval(recordingTimer.current);
      recordingTimer.current = null;
    }
  };

  const handleSaveVideo = async () => {
    if (!videoUri || !user?.id) return;

    try {
      setIsUploading(true);
      const fileName = `${user.id}-${Date.now()}.mp4`;
      const fileType = `video/mp4`;
      
      const formData = new FormData();
      formData.append('file', {
        uri: videoUri,
        name: fileName,
        type: fileType,
      } as any);

      // Upload video to storage
      const { error: uploadError } = await supabase
        .storage
        .from('videos')
        .upload(fileName, formData);

      if (uploadError) throw uploadError;

      // Create video record in database
      const { error: dbError } = await supabase
        .from('Video')
        .insert({
          title: "New Video",
          uri: fileName,
          user_id: user.id
        });

      if (dbError) throw dbError;

      router.back();
    } catch (error) {
      console.error('Error saving video:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handlePickFromLibrary = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['videos'],
        allowsEditing: true,
        aspect: [9, 16],
        quality: 1,
      });

      if (!result.canceled && result.assets?.[0]?.uri) {
        setVideoUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking video:', error);
    }
  };

  const togglePlayback = () => {
    if (isPlaying) {
      player.pause();
    } else {
      player.play();
    }
  };

  if (videoUri) {
    return (
      <View style={styles.fullScreen}>
        <VideoView
          player={player}
          style={styles.videoPlayer}
          contentFit="cover"
          nativeControls={false}
        />

        {/* Upload progress overlay */}
        {isUploading && (
          <View style={styles.uploadOverlay}>
            <ActivityIndicator size="large" color="white" />
            <Text style={styles.uploadText}>Uploading video...</Text>
          </View>
        )}

        {/* Bottom controls for video preview */}
        <View style={styles.previewControls}>
          <TouchableOpacity
            style={styles.previewButton}
            onPress={() => setVideoUri(null)}
            disabled={isUploading}
          >
            <Ionicons name="close" size={24} color="white" />
            <Text style={styles.previewButtonText}>Retake</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.previewButton, styles.saveButtonPreview]}
            onPress={handleSaveVideo}
            disabled={isUploading}
          >
            <Ionicons name="checkmark" size={24} color="white" />
            <Text style={styles.previewButtonText}>Save</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.fullScreen}>
      <CameraView
        mode="video"
        ref={cameraRef}
        style={styles.fullScreen}
        facing={facing}
      />

      {/* Recording indicator and timer */}
      {isRecording && (
        <View style={styles.recordingIndicator}>
          <View style={styles.recordingDot} />
          <Text style={styles.recordingText}>REC {formatTime(recordingTime)}</Text>
        </View>
      )}

      {/* Top controls */}
      <View style={styles.topControls}>
        <TouchableOpacity
          style={styles.topButton}
          onPress={() => router.back()}
        >
          <Ionicons name="close" size={24} color="white" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.topButton}
          onPress={toggleCameraFacing}
        >
          <Ionicons name="camera-reverse" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* Bottom controls */}
      <View style={styles.controlsContainer}>
        <View style={styles.controlsRow}>
          <TouchableOpacity
            style={styles.sideButton}
            onPress={handlePickFromLibrary}
            disabled={isRecording}
          >
            <Ionicons name="images" size={32} color={isRecording ? "#666" : "white"} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.recordButton, isRecording && styles.recordButtonActive]}
            onPress={handleRecordVideo}
          >
            <View style={[styles.recordButtonInner, isRecording && styles.recordButtonInnerActive]} />
          </TouchableOpacity>

          <View style={styles.sideButton} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
  },
  videoPlayer: {
    flex: 1,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  permissionText: {
    textAlign: 'center',
    fontSize: 18,
    marginBottom: 20,
  },
  permissionButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
  },
  permissionButtonText: {
    color: 'white',
    fontSize: 16,
  },
  controlsContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: 40,
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  saveButton: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
  },
  recordingIndicator: {
    position: 'absolute',
    top: 60,
    left: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    marginRight: 8,
  },
  recordingText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  topControls: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  topButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sideButton: {
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'white',
  },
  recordButtonActive: {
    borderColor: '#EF4444',
  },
  recordButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'white',
  },
  recordButtonInnerActive: {
    width: 30,
    height: 30,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },
  uploadOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadText: {
    color: 'white',
    fontSize: 16,
    marginTop: 16,
    fontWeight: '600',
  },
  previewControls: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  previewButton: {
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  saveButtonPreview: {
    backgroundColor: '#3B82F6',
  },
  previewButtonText: {
    color: 'white',
    fontSize: 12,
    marginTop: 4,
    fontWeight: '600',
  },
});