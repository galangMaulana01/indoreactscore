import { View, Text } from "react-native";

export default function HomeScreen() {
  return (
    <View className="flex-1 bg-black items-center justify-center">
      <Text className="text-white text-2xl font-bold">IndoScore</Text>
      <Text className="text-gray-400 text-sm mt-2">Expo + NativeWind + Tailwind CSS</Text>
    </View>
  );
}
