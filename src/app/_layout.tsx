// app/_layout.tsx
import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack initialRouteName="(auth)/login">
      <Stack.Screen name="(auth)/login" options={{ headerShown: false }} />
      <Stack.Screen name="(app)/index" options={{ title: "Home" }} />
    </Stack>
  );
}