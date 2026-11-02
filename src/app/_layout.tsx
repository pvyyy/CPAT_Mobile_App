
import { Stack, useRouter, useRootNavigationState } from "expo-router";
import * as Notifications from "expo-notifications";
import { useCallback, useEffect, useRef } from "react";
import "../../lib/DutyTracking";

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
  const navigationState = useRootNavigationState();

  const navigationReady = useRef(false);
  const pendingIncidentId = useRef<string | null>(null);
  const handledResponses = useRef<Set<string>>(new Set());

  const navigateToIncident = useCallback(
    (incidentId: string) => {
      console.log("[CPAT] Opening incident:", incidentId);

      if (!navigationReady.current) {
        console.log("[CPAT] Navigation not ready. Saving incident.");
        pendingIncidentId.current = incidentId;
        return;
      }

      pendingIncidentId.current = null;

      router.push({
        pathname: "/(incident-alert)",
        params: {
          incident_id: incidentId,
        },
      });
    },
    [router],
  );

  const handleNotificationResponse = useCallback(
    (response: Notifications.NotificationResponse | null) => {
      if (!response) return;

      const responseKey =
        `${response.notification.request.identifier}:${response.actionIdentifier}`;

      if (handledResponses.current.has(responseKey)) {
        console.log("[CPAT] Duplicate notification ignored.");
        return;
      }

      const data = response.notification.request.content
        .data as Record<string, unknown>;

      console.log("[CPAT] Notification tapped:", data);

      if (
        data?.type !== "incident_alert" ||
        data?.incident_id == null
      ) {
        console.log("[CPAT] Not an incident notification.");
        return;
      }

      handledResponses.current.add(responseKey);

      navigateToIncident(String(data.incident_id));
    },
    [navigateToIncident],
  );

  // Check whether Expo Router is ready.
  useEffect(() => {
    navigationReady.current = Boolean(navigationState?.key);

    if (navigationReady.current && pendingIncidentId.current) {
      const incidentId = pendingIncidentId.current;

      console.log("[CPAT] Navigation ready. Opening pending incident.");

      navigateToIncident(incidentId);
    }
  }, [navigationState?.key, navigateToIncident]);

  // Listen for notification taps while the app is running.
  useEffect(() => {
    const subscription =
      Notifications.addNotificationResponseReceivedListener(
        handleNotificationResponse,
      );

    // Handle notification taps that launched the app.
    const checkLastResponse = async () => {
      const response =
        await Notifications.getLastNotificationResponseAsync();

      if (response) {
        handleNotificationResponse(response);

        await Notifications.clearLastNotificationResponseAsync();
      }
    };

    checkLastResponse();

    return () => {
      subscription.remove();
    };
  }, [handleNotificationResponse]);

  return null;
}

export default function RootLayout() {
  return (
    <>
      <Stack screenOptions={{ headerShown: false }} />
      <AccidentNotificationListener />
    </>
  );
}
