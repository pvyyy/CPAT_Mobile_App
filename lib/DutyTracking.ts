import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { supabase } from '../lib/supabase';

export const LOCATION_TASK = 'cpat-duty-location';

// Runs in the background while on duty. It must be defined at the top level of a
// module that is imported when the app starts (see app/_layout.tsx).
TaskManager.defineTask(LOCATION_TASK, async ({ data, error }) => {
  if (error) {
    console.warn('Location task error:', error.message);
    return;
  }

  const locations = (data as { locations?: Location.LocationObject[] } | undefined)?.locations;
  const latest = locations?.[locations.length - 1];
  if (!latest) return;

  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return;

  const { error: updateError } = await supabase
    .from('enforcer_status')
    .update({
      latitude: latest.coords.latitude,
      longitude: latest.coords.longitude,
      updated_at: new Date().toISOString(),
    })
    .eq('enforcer_id', session.user.id);

  if (updateError) console.warn('Could not save location:', updateError.message);
});

async function startLocationTask() {
  await Location.startLocationUpdatesAsync(LOCATION_TASK, {
    accuracy: Location.Accuracy.Balanced,
    timeInterval: 30000, // about every 30 s (Android)
    pausesUpdatesAutomatically: false,
    showsBackgroundLocationIndicator: true, // iOS blue bar
    foregroundService: {
      // Android: required so the system keeps tracking while the app is closed
      notificationTitle: 'On duty',
      notificationBody: 'Sharing your location with CPAT dispatch',
      notificationColor: '#065F46',
    },
  });
}

type StartResult = { ok: true } | { ok: false; error: string };

/** Goes on duty: asks permissions, saves status + current location, starts tracking. */
export async function startDutyTracking(): Promise<StartResult> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'You are not signed in.' };

  const fg = await Location.requestForegroundPermissionsAsync();
  if (fg.status !== 'granted') {
    return { ok: false, error: 'Location permission is required to go on duty.' };
  }
  const bg = await Location.requestBackgroundPermissionsAsync();
  if (bg.status !== 'granted') {
    return {
      ok: false,
      error: 'Allow location "all the time" so dispatch can find you when the app is closed.',
    };
  }

  const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });

  const { error } = await supabase.from('enforcer_status').upsert(
    {
      enforcer_id: user.id,
      duty_status: true,
      duty_started_at: new Date().toISOString(),
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'enforcer_id' },
  );
  if (error) return { ok: false, error: error.message };

  if (!(await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK))) {
    await startLocationTask();
  }

  return { ok: true };
}

/** Goes off duty: stops tracking and clears the saved location. */
export async function stopDutyTracking(): Promise<void> {
  try {
    if (await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK)) {
      await Location.stopLocationUpdatesAsync(LOCATION_TASK);
    }
  } catch (e) {
    console.warn('Could not stop location updates:', e);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from('enforcer_status')
    .update({
      duty_status: false,
      duty_started_at: null,
      latitude: null,
      longitude: null,
      updated_at: new Date().toISOString(),
    })
    .eq('enforcer_id', user.id);
}

/** Reads the saved duty state, so the switch is correct after the app restarts. */
export async function getDutyState(): Promise<{ onDuty: boolean; since: number | null }> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { onDuty: false, since: null };

  const { data } = await supabase
    .from('enforcer_status')
    .select('duty_status, duty_started_at')
    .eq('enforcer_id', user.id)
    .maybeSingle();

  return {
    onDuty: !!data?.duty_status,
    since: data?.duty_started_at ? Date.parse(data.duty_started_at) : null,
  };
}

/** If the database says on duty but tracking stopped (app killed, phone restarted), restart it. */
export async function ensureTracking(): Promise<void> {
  if (!(await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK))) {
    await startLocationTask();
  }
}