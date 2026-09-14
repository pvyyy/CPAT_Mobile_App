// app/_layout.tsx
import { Stack } from "expo-router";

export default function RootLayout() {
  return <Stack
      screenOptions={{
        headerShown: false, // Hides the header for all screens in this layout
      }}
    />
  
}