import React, { useState } from 'react';
import { View, Text, SafeAreaView, StyleSheet } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { StatusBar } from 'expo-status-bar';

export default function App() {
  const [isShowSplash, setIsShowSplash] = useState(true);

  // ==================== TAHAP 1: RENDER VIDEO SPLASH ====================
  if (isShowSplash) {
    return (
      <View className="flex-1 bg-black justify-center items-center z-[10000]">
        <StatusBar hidden />
        <Video
          source={require('../assets/splash.mp4')} // Path menyesuaikan struktur baru lu
          style={StyleSheet.absoluteFill}
          resizeMode={ResizeMode.COVER}
          shouldPlay={true}
          isMuted={false} // SUARA AKTIF!
          onPlaybackStatusUpdate={(status) => {
            if (status.isLoaded && status.didJustFinish) {
              setIsShowSplash(false);
            }
          }}
          onError={() => setIsShowSplash(false)} // Bypass kalau video gagal
        />
      </View>
    );
  }

  // ==================== TAHAP 1: RENDER BASE LAYOUT ====================
  return (
    <SafeAreaView className="flex-1 bg-latar overflow-hidden relative">
      <StatusBar style="light" backgroundColor="#121212" />
      
      {/* Efek Blur Glow */}
      <View className="absolute -top-40 -left-32 w-[500px] h-[400px] bg-merah/30 rounded-full opacity-40" />
      <View className="absolute -top-32 -right-24 w-[400px] h-[300px] bg-kuning/30 rounded-full opacity-40" />

      {/* Konten Sementara */}
      <View className="flex-1 items-center justify-center z-10">
        <Text className="text-white text-3xl font-black text-merah mb-2">IndoScore</Text>
        <Text className="text-gray-300 font-medium">Video Splash Berhasil & Suara Nyala!</Text>
      </View>

    </SafeAreaView>
  );
}
