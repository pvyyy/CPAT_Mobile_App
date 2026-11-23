import { Stack, useRouter, useSegments } from "expo-router";
import * as Notifications from "expo-notifications";
import * as SplashScreen from "expo-splash-screen";
import { useCallback, useEffect, useRef } from "react";
import "../../lib/DutyTracking";

SplashScreen.preventAutoHideAsync();

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

function AccidentNotificationListener() {
  const router = useRouter();
  const segments = useSegments();

  // True only after Index has redirected into the signed-in area
  const appReady = segments[0] === "(home)";

  const appReadyRef = useRef(false);
  const pendingIncidentId = useRef<string | null>(null);
  const handledResponses = useRef<Set<string>>(new Set());

  const navigateToIncident = useCallback(
    (incidentId: string) => {
      if (!appReadyRef.current) {
        console.log("[CPAT] App not ready. Saving incident.");
        pendingIncidentId.current = incidentId;
        return;
      }

      pendingIncidentId.current = null;

      router.push({
        pathname: "/(incident-alert)",
        params: { incident_id: incidentId },
      });
    },
    [router],
  );

  // Open the saved incident once Home is mounted
  useEffect(() => {
    appReadyRef.current = appReady;

    if (appReady && pendingIncidentId.current) {
      const id = pendingIncidentId.current;
      const t = setTimeout(() => navigateToIncident(id), 300);
      return () => clearTimeout(t);
    }
  }, [appReady, navigateToIncident]);

  const handleNotificationResponse = useCallback(
    (response: Notifications.NotificationResponse | null) => {
      if (!response) return;

      const responseKey = `${response.notification.request.identifier}:${response.actionIdentifier}`;

      if (handledResponses.current.has(responseKey)) {
        console.log("[CPAT] Duplicate notification ignored.");
        return;
      }

      const data = response.notification.request.content.data as Record<
        string,
        unknown
      >;

      console.log("[CPAT] Notification tapped:", data);

      if (data?.type !== "incident_alert" || data?.incident_id == null) {
        console.log("[CPAT] Not an incident notification.");
        return;
      }

      handledResponses.current.add(responseKey);

      navigateToIncident(String(data.incident_id));
    },
    [navigateToIncident],
  );

  // Listen for notification taps while the app is running.
  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(
      handleNotificationResponse,
    );

    // Handle notification taps that launched the app.
    const response = Notifications.getLastNotificationResponse();
    if (response) {
      handleNotificationResponse(response);
      Notifications.clearLastNotificationResponse();
    }

    return () => {
      subscription.remove();
    };
  }, [handleNotificationResponse]);

  return null;
}

export default function RootLayout() {
  useEffect(() => {
    // Safety net: never leave the splash stuck
    const t = setTimeout(() => {
      SplashScreen.hideAsync().catch(() => {});
    }, 4000);
    return () => clearTimeout(t);
  }, []);

  return (
    <>
      <Stack screenOptions={{ headerShown: false }} />
      <AccidentNotificationListener />
    </>
  );
}