import React, { useState, useRef } from 'react';
import { View, Dimensions, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { useAuth } from '@/providers/AuthProvider';
import { supabase } from '@/utils/supabase';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import * as ImagePicker from 'expo-image-picker';

export default function CameraScreen() {
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [isRecording, setIsRecording] = useState(false);
  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [playbackStatus, setPlaybackStatus] = useState<AVPlaybackStatus>({ 
    isLoaded: false, 
    isPlaying: false 
  });
  
  const cameraRef = useRef<CameraView>(null);
  const videoRef = useRef<Video>(null);
  const { user } = useAuth();
  const router = useRouter();

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
      await cameraRef.current?.stopRecording();
      return;
    }
    
    setIsRecording(true);
    const video = await cameraRef.current?.recordAsync();
    setVideoUri(video?.uri ?? null);
  };

  const handleSaveVideo = async () => {
    if (!videoUri || !user?.id) return;
    
    try {
      const fileName = `${user.id}-${Date.now()}.mp4`;
      const fileType = `video/mp4`;
      
      const formData = new FormData();
      formData.append('file', {
        uri: videoUri,
        name: fileName,
        type: fileType,
      } as any);

      // Upload video to storage
      const { data, error: uploadError } = await supabase
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
    }
  };

  const handlePickFromLibrary = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
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

  const togglePlayback = async () => {
    if (playbackStatus.isPlaying) {
      await videoRef.current?.pauseAsync();
    } else {
      await videoRef.current?.playAsync();
    }
  };

  if (videoUri) {
    return (
      <View style={styles.fullScreen}>
        <Video
          ref={videoRef}
          style={styles.videoPlayer}
          source={{ uri: videoUri }}
          resizeMode={ResizeMode.COVER}
          isLooping
          onPlaybackStatusUpdate={setPlaybackStatus}
        />
        
        <TouchableOpacity 
          style={styles.saveButton}
          onPress={handleSaveVideo}
        >
          <Ionicons name="checkmark-circle" size={80} color="white" />
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <CameraView 
      mode="video" 
      ref={cameraRef} 
      style={styles.fullScreen} 
      facing={facing}
    >
      <View style={styles.controlsContainer}>
        <View style={styles.controlsRow}>
          <TouchableOpacity onPress={handlePickFromLibrary}>
            <Ionicons name="images" size={40} color="white" />
          </TouchableOpacity>
          
          <TouchableOpacity onPress={handleRecordVideo}>
            <Ionicons 
              name={isRecording ? "pause-circle" : "radio-button-on"} 
              size={80} 
              color={isRecording ? "red" : "white"} 
            />
          </TouchableOpacity>
          
          <TouchableOpacity onPress={toggleCameraFacing}>
            <Ionicons name="camera-reverse" size={40} color="white" />
          </TouchableOpacity>
        </View>
      </View>
    </CameraView>
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
    flex: 1,
    justifyContent: 'flex-end',
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
});