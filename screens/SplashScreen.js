import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Video, ResizeMode } from 'expo-av';

const { width, height } = Dimensions.get('window');

export default function SplashScreen({ onFinish }) {
  const videoRef = useRef(null);

  useEffect(() => {
    const timeout = setTimeout(() => {
      onFinish();
    }, 8000);
    return () => clearTimeout(timeout);
  }, []);

  const handleLoad = async () => {
    try {
      await videoRef.current?.setVolumeAsync(1.0);
      await videoRef.current?.playAsync();
    } catch (e) {
      onFinish();
    }
  };

  return (
    <View style={styles.container}>
      <Video
        ref={videoRef}
        source={require('../assets/splash.mp4')}
        style={styles.video}
        resizeMode={ResizeMode.COVER}
        shouldPlay={false}
        isLooping={false}
        isMuted={false}
        volume={1.0}
        onLoad={handleLoad}
        onPlaybackStatusUpdate={(status) => {
          if (status.didJustFinish) onFinish();
          if (status.error) onFinish();
        }}
        useNativeControls={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0, left: 0,
    width, height,
    backgroundColor: '#000',
    zIndex: 9999,
  },
  video: {
    width, height,
  },
});
