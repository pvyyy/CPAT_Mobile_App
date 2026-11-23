import { Stack } from "expo-router";
import * as Notifications from "expo-notifications";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { AppState } from "react-native";
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

export default function RootLayout() {
  // Hide the splash shortly after mount, and retry if it fails
  useEffect(() => {
    let tries = 0;
    let timer: ReturnType<typeof setTimeout>;

    const hide = async () => {
      try {
        await SplashScreen.hideAsync();
        console.log("[CPAT] Splash hidden");
      } catch (e) {
        console.warn("[CPAT] Splash hide failed:", e);
        if (tries++ < 5) timer = setTimeout(hide, 500);
      }
    };

    timer = setTimeout(hide, 300);
    return () => clearTimeout(timer);
  }, []);

  // Hide it again when the app becomes active (e.g. after unlocking the phone)
  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        SplashScreen.hideAsync().catch(() => {});
      }
    });
    return () => sub.remove();
  }, []);

  return <Stack screenOptions={{ headerShown: false }} />;
}