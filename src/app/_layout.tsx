import { Stack } from 'expo-router';
import '../../lib/DutyTracking';

export default function RootLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    />
  );
}