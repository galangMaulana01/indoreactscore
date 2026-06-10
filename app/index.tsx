import { View, Text } from "react-native";
import { StatusBar } from "expo-status-bar";

export default function HomeScreen() {
  return (
    <View className="flex-1 bg-black items-center justify-center">
      <Text className="text-white text-2xl font-bold tracking-widest">
        IndoScore Clean Slate
      </Text>
      <Text className="text-white text-sm mt-2">
        Metro ✓  NativeWind ✓  Expo Router ✓
      </Text>
      <StatusBar style="light" />
    </View>
  );
}
