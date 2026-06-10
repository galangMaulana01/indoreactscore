import { Stack } from "expo-router";
import "../global.css"; // Wajib buat NativeWind v4

export default function RootLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
