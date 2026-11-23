import * as IntentLauncher from 'expo-intent-launcher';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

export async function requestBatteryExemption() {
  if (Platform.OS !== 'android') return;

  try {
    await IntentLauncher.startActivityAsync(
      'android.settings.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS',
      { data: `package:${Constants.expoConfig?.android?.package}` },
    );
  } catch (e) {
    console.warn('[DUTY] Could not open battery exemption prompt:', e);
  }
}