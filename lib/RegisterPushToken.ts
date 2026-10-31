
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { supabase } from './supabase';

export async function registerPushToken(): Promise<void> {
  try {
    // Remote push notifications require a supported device.
    if (!Device.isDevice) {
      console.warn('Push notifications require a physical device.');
      return;
    }

    // Configure the Android notification channel.
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#10B981',
      });
    }

    // Ensure the user is signed in.
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      console.warn('Cannot register push token: user is not signed in.');
      return;
    }

    // Request notification permission.
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();

    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('Notification permission was not granted.');
      return;
    }

    // Get the EAS project ID.
    const projectId =
      Constants.easConfig?.projectId ??
      Constants.expoConfig?.extra?.eas?.projectId;

    if (!projectId) {
      console.warn('EAS project ID is missing from app configuration.');
      return;
    }

    // Generate the Expo push token.
    const token = (
      await Notifications.getExpoPushTokenAsync({ projectId })
    ).data;

    // Save the token to the existing enforcer_status row.
    const { error: saveError } = await supabase
      .from('enforcer_status')
      .update({
        expo_push_token: token,
        updated_at: new Date().toISOString(),
      })
      .eq('enforcer_id', user.id);

    if (saveError) {
      console.error('Failed to save Expo push token:', saveError.message);
      return;
    }

    console.log('Expo push token saved successfully.');
  } catch (error) {
    console.error('Push token registration failed:', error);
  }
}
