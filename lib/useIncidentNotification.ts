import { useEffect, useRef } from "react";
import { useRouter } from "expo-router";
import * as Notifications from "expo-notifications";

export function useIncidentNotifications() {
  const router = useRouter();
  const handled = useRef<Set<string>>(new Set());

  useEffect(() => {
    const open = (response: Notifications.NotificationResponse | null) => {
      if (!response) return;

      const key = `${response.notification.request.identifier}:${response.actionIdentifier}`;
      if (handled.current.has(key)) return;

      const data = response.notification.request.content.data as Record<string, unknown>;
      if (data?.type !== "incident_alert" || data?.incident_id == null) return;

      handled.current.add(key);

      router.push({
        pathname: "/(incident-alert)",
        params: { incident_id: String(data.incident_id) },
      });
    };

    // Launched from a notification (app was killed)
    const last = Notifications.getLastNotificationResponse();
    if (last) {
      open(last);
      Notifications.clearLastNotificationResponse();
    }

    // Tapped while the app is running
    const sub = Notifications.addNotificationResponseReceivedListener(open);
    return () => sub.remove();
  }, [router]);
}