import React, { useCallback, useEffect, useRef, useState } from "react";

import {
  ActivityIndicator,
  Alert,
  Animated,
  AppState,
  Easing,
  FlatList,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter, useFocusEffect } from "expo-router";

import { supabase } from "../../../lib/supabase";
import { registerPushToken } from "../../../lib/RegisterPushToken";

import {
  startDutyTracking,
  stopDutyTracking,
  getDutyState,
  ensureTracking,
} from "../../../lib/DutyTracking";

// Incident type
type IncidentActivity = {
  incident_id: number;
  camera_id: number | string;
  detected_at: string | null;
  verification_status: string;
  landmark: string | null;
  location_street: string | null;
  barangay: string | null;
};

// Format duty duration
const formatElapsed = (ms: number) => {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = String(Math.floor(total / 3600)).padStart(2, "0");
  const m = String(Math.floor((total % 3600) / 60)).padStart(2, "0");
  const s = String(total % 60).padStart(2, "0");

  return `${h}:${m}:${s}`;
};

// Format current date
const formatToday = () =>
  new Date().toLocaleDateString("en-PH", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

// Format current time
const formatTime = () =>
  new Date().toLocaleTimeString("en-PH", {
    hour: "numeric",
    minute: "2-digit",
  });

// Greeting based on current time
const getGreeting = () => {
  const hour = new Date().getHours();

  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";

  return "Good evening";
};

export default function Home() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [firstName, setFirstName] = useState<string>("");
  const [lastName, setLastName] = useState<string>("");

  const [showLogout, setShowLogout] = useState<boolean>(false);

  // Recent incidents
  const [incidents, setIncidents] = useState<IncidentActivity[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(true);
  const [activitiesError, setActivitiesError] = useState("");

  // Duty status
  const [onDuty, setOnDuty] = useState<boolean>(false);
  const [dutyStart, setDutyStart] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState<number>(0);

  const switchAnim = useRef(new Animated.Value(0)).current;
  const [, setTick] = useState(0);

  // Keep greeting and clock updated
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 30000);

    return () => clearInterval(id);
  }, []);

  // Fetch user profile
  useEffect(() => {
    async function fetchUserProfile() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data, error } = await supabase
        .from("profiles")
        .select("first_name, last_name")
        .eq("id", user.id)
        .single();

      if (error) {
        console.error("Failed to fetch user profile:", error);
        return;
      }

      if (data) {
        setFirstName(data.first_name ?? "");
        setLastName(data.last_name ?? "");
      }
    }

    fetchUserProfile();
  }, []);

  // Register push notification token
  useEffect(() => {
    registerPushToken();
  }, []);

  // Fetch today's incidents
  // Fetch today's confirmed incidents
  const fetchTodayIncidents = useCallback(async () => {
    setActivitiesLoading(true);
    setActivitiesError("");

    try {
      const now = new Date();

      const startOfDay = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
      );

      const startOfTomorrow = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + 1,
      );

      const { data: incidentData, error: incidentError } = await supabase
        .from("incident")
        .select("incident_id, camera_id, detected_at, verification_status")
        .eq("verification_status", "confirmed")
        .gte("detected_at", startOfDay.toISOString())
        .lt("detected_at", startOfTomorrow.toISOString())
        .order("detected_at", { ascending: false });

      if (incidentError) throw incidentError;

      if (!incidentData || incidentData.length === 0) {
        setIncidents([]);
        return;
      }

      const cameraIds = [
        ...new Set(incidentData.map((incident) => incident.camera_id)),
      ];

      const { data: cameraData, error: cameraError } = await supabase
        .from("camera")
        .select("id, landmark, location_street, barangay")
        .in("id", cameraIds);

      if (cameraError) throw cameraError;

      const activities: IncidentActivity[] = incidentData.map((incident) => {
        const camera = cameraData?.find(
          (item) => String(item.id) === String(incident.camera_id),
        );

        return {
          ...incident,
          landmark: camera?.landmark ?? null,
          location_street: camera?.location_street ?? null,
          barangay: camera?.barangay ?? null,
        };
      });

      setIncidents(activities);
    } catch (error) {
      console.error("Failed to fetch today's confirmed incidents:", error);
      setActivitiesError("Unable to load today's confirmed incidents.");
    } finally {
      setActivitiesLoading(false);
    }
  }, []);

  // Refresh incidents whenever Home becomes active
  // useFocusEffect(
  //   useCallback(() => {
  //     fetchTodayIncidents();
  //   }, [fetchTodayIncidents]),
  // );

  // Animate duty switch
  useEffect(() => {
    Animated.timing(switchAnim, {
      toValue: onDuty ? 1 : 0,
      duration: 220,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [onDuty, switchAnim]);

  // Duty timer
  useEffect(() => {
    if (!onDuty || dutyStart === null) {
      setElapsed(0);
      return;
    }

    setElapsed(Date.now() - dutyStart);

    const id = setInterval(() => {
      setElapsed(Date.now() - dutyStart);
    }, 1000);

    return () => clearInterval(id);
  }, [onDuty, dutyStart]);

  // Restore duty state
  // useEffect(() => {
  //   (async () => {
  //     const state = await getDutyState();

  //     if (state.onDuty) {
  //       setDutyStart(state.since ?? Date.now());
  //       setOnDuty(true);

  //       ensureTracking().catch(() => {});
  //     }
  //   })();
  // }, []);
  const refreshHome = useCallback(async () => {
    console.log("[CPAT] Refreshing home screen...");

    // Restore duty status from Supabase.
    const state = await getDutyState();

    console.log("[CPAT] Restored duty state:", state);

    setOnDuty(state.onDuty);
    setDutyStart(state.onDuty ? (state.since ?? Date.now()) : null);

    // Resume tracking if the enforcer is still on duty.
    if (state.onDuty) {
      try {
        await ensureTracking();
        console.log("[CPAT] Location tracking checked.");
      } catch (error) {
        console.warn("[CPAT] Could not resume tracking:", error);
      }
    }

    // Reload today's incidents.
    await fetchTodayIncidents();

    console.log("[CPAT] Home screen refresh completed.");
  }, [fetchTodayIncidents]);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      const refresh = () => {
        if (active) {
          refreshHome().catch((error) => {
            console.error("[CPAT] Home refresh failed:", error);
          });
        }
      };

      // Run when Home receives focus.
      refresh();

      // Run again whenever the app returns to the foreground.
      const subscription = AppState.addEventListener("change", (nextState) => {
        if (nextState === "active") {
          console.log("[CPAT] App returned to foreground.");
          refresh();
        }
      });

      return () => {
        active = false;
        subscription.remove();
      };
    }, [refreshHome]),
  );

  // Start duty
  const startDuty = async () => {
    const result = await startDutyTracking();

    if (!result.ok) {
      Alert.alert("Cannot start duty", result.error);
      return;
    }

    setDutyStart(Date.now());
    setOnDuty(true);
  };

  // End duty
  const endDuty = async () => {
    await stopDutyTracking();

    setOnDuty(false);
    setDutyStart(null);
  };

  // Toggle duty status
  // Toggle duty status with confirmation.
  const handleToggleDuty = () => {
    if (!onDuty) {
      Alert.alert(
        "Start your duty?",
        "Are you sure you want to go on duty? Your location will be shared with CPAT while you are on duty.",
        [
          {
            text: "Cancel",
            style: "cancel",
          },
          {
            text: "Go on Duty",
            onPress: startDuty,
          },
        ],
      );

      return;
    }

    Alert.alert(
      "End your duty?",
      `You've been on duty for ${formatElapsed(elapsed)}. Are you sure you want to stop your duty?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "End Duty",
          style: "destructive",
          onPress: endDuty,
        },
      ],
    );
  };

  // Logout
  const confirmLogout = async () => {
    try {
      await stopDutyTracking();

      const { error } = await supabase.auth.signOut();

      if (error) {
        Alert.alert("Logout Failed", error.message);
        return;
      }

      router.replace("/(auth)/" as any);
    } catch (error) {
      console.error("[CPAT] Logout error:", error);

      Alert.alert("Logout Failed", "Unable to log out. Please try again.");
    }
  };

  const handleLogout = () => {
    setShowLogout(false);

    Alert.alert("Log out?", "You will need to sign in again to continue.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log out",
        style: "destructive",
        onPress: confirmLogout,
      },
    ]);
  };

  // Duty switch animation
  const trackColor = switchAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["#CBD5E1", "#10B981"],
  });

  const thumbX = switchAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [3, 33],
  });

  // Open incident details
  const openIncident = (incidentId: number) => {
    router.push({
      pathname: "/(incident-alert)",
      params: {
        incident_id: String(incidentId),
      },
    });
  };

  // Render incident activity
  const renderIncidentItem = ({ item }: { item: IncidentActivity }) => {
    const status = "confirmed";

    const location =
      [item.landmark, item.location_street, item.barangay]
        .filter(Boolean)
        .join(", ") || `Camera ${item.camera_id}`;

    const detectedTime = item.detected_at
      ? new Date(item.detected_at).toLocaleTimeString("en-PH", {
          hour: "numeric",
          minute: "2-digit",
        })
      : "Time unavailable";

    return (
      <Pressable
        style={({ pressed }) => [styles.activityRow, pressed && styles.pressed]}
        onPress={() => openIncident(item.incident_id)}
      >
        <View style={[styles.activityIconWrap, { backgroundColor: "#FEE2E2" }]}>
          <Ionicons name="warning" size={19} color="#DC2626" />
        </View>

        <View style={styles.activityTextWrap}>
          <Text style={styles.activityTitle} numberOfLines={1}>
            {location}
          </Text>

          <Text style={styles.activitySubtitle}>
            Detected {detectedTime} · ID #{item.incident_id}
          </Text>
        </View>

        <View style={[styles.severityPill, { backgroundColor: "#FEE2E2" }]}>
          <Text style={[styles.severityPillText, { color: "#DC2626" }]}>
            Confirmed
          </Text>
        </View>

        <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
      </Pressable>
    );
  };

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTopRow}>
            <View style={styles.brandContainer}>
              <Image
                source={require("@/assets/images/logo/cpat-logo.png")}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>

            <Pressable
              onPress={() => setShowLogout((prev) => !prev)}
              style={({ pressed }) => [
                styles.menuButton,
                pressed && styles.pressed,
              ]}
            >
              <Ionicons name="ellipsis-horizontal" size={21} color="#065F46" />
            </Pressable>
          </View>

          {/* Greeting */}
          <LinearGradient
            colors={["#064E3B", "#047857", "#059669"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 2, y: 2 }}
            style={styles.welcomeCard}
          >
            <View style={styles.welcomeAccent} />

            <Text style={styles.greetingLine}>{getGreeting()} enforcer,</Text>

            <Text style={styles.greetingName}>
              {[firstName, lastName].filter(Boolean).join(" ") || "CPAT App"}
            </Text>

            <View style={styles.headerInfoRow}>
              <View style={styles.headerInfoItem}>
                <Ionicons name="calendar-outline" size={15} color="#A7F3D0" />
                <Text style={styles.infoValue}>{formatToday()}</Text>
              </View>

              <View style={styles.infoSeparator} />

              <View style={styles.headerInfoItem}>
                <Ionicons name="time-outline" size={15} color="#A7F3D0" />
                <Text style={styles.infoValue}>{formatTime()}</Text>
              </View>
            </View>
          </LinearGradient>

          {/* Logout modal */}
          <Modal
            visible={showLogout}
            transparent
            animationType="fade"
            statusBarTranslucent
            onRequestClose={() => setShowLogout(false)}
          >
            <Pressable
              style={styles.menuBackdrop}
              onPress={() => setShowLogout(false)}
            >
              <View style={[styles.menuCard, { top: insets.top + 65 }]}>
                <View style={styles.menuHeader}>
                  <View style={styles.menuAvatar}>
                    <Text style={styles.menuAvatarText}>
                      {(firstName ? firstName[0] : "C").toUpperCase()}
                    </Text>
                  </View>

                  <View style={styles.menuHeaderText}>
                    <Text style={styles.menuLabel}>Signed in as</Text>

                    <Text style={styles.menuName} numberOfLines={1}>
                      {firstName || "CPAT User"}
                    </Text>
                  </View>
                </View>

                <View style={styles.menuDivider} />

                <Pressable
                  onPress={handleLogout}
                  style={({ pressed }) => [
                    styles.menuItem,
                    pressed && styles.menuItemPressed,
                  ]}
                >
                  <Ionicons name="log-out-outline" size={19} color="#DC2626" />

                  <Text style={styles.menuItemText}>Log out</Text>
                </Pressable>
              </View>
            </Pressable>
          </Modal>
        </View>

        {/* Main content */}
        <View style={styles.content}>
          {/* Duty status */}
          <View style={styles.dutySection}>
            <View style={styles.sectionHeading}>
              <Text style={styles.sectionTitle}>Duty Status</Text>

              <View
                style={[
                  styles.statusBadge,
                  onDuty ? styles.statusBadgeOn : styles.statusBadgeOff,
                ]}
              >
                <View
                  style={[
                    styles.statusDot,
                    {
                      backgroundColor: onDuty ? "#059669" : "#94A3B8",
                    },
                  ]}
                />

                <Text
                  style={[
                    styles.statusBadgeText,
                    {
                      color: onDuty ? "#047857" : "#64748B",
                    },
                  ]}
                >
                  {onDuty ? "Active" : "Inactive"}
                </Text>
              </View>
            </View>

            <View style={styles.dutyCard}>
              <View style={styles.dutyInfo}>
                <Text style={styles.dutyStatus}>
                  {onDuty ? "You're on duty" : "You're off duty"}
                </Text>

                <Text style={styles.dutySubtitle}>
                  {onDuty
                    ? `Time on duty · ${formatElapsed(elapsed)}`
                    : "Start your day by going on duty."}
                </Text>
              </View>

              <Pressable
                onPress={handleToggleDuty}
                hitSlop={8}
                accessibilityRole="switch"
                accessibilityState={{ checked: onDuty }}
                accessibilityLabel="Duty status"
              >
                <Animated.View
                  style={[styles.switchTrack, { backgroundColor: trackColor }]}
                >
                  <Animated.View
                    style={[
                      styles.switchThumb,
                      {
                        transform: [{ translateX: thumbX }],
                      },
                    ]}
                  />
                </Animated.View>
              </Pressable>
            </View>
          </View>

          {/* Recent activities */}
          <View style={styles.activitySection}>
            <View style={styles.activityHeader}>
              <View>
                <Text style={styles.sectionTitle}>Recent Activities</Text>

                <Text style={styles.sectionDescription}>
                  Today's detected incidents
                </Text>
              </View>

              <View style={styles.reportCount}>
                <Text style={styles.reportCountText}>
                  {incidents.length}{" "}
                  {incidents.length === 1 ? "incident" : "incidents"}
                </Text>
              </View>
            </View>

            {activitiesLoading ? (
              <View style={styles.activityState}>
                <ActivityIndicator size="small" color="#047857" />

                <Text style={styles.activityStateText}>
                  Loading today's incidents...
                </Text>
              </View>
            ) : activitiesError ? (
              <View style={styles.activityState}>
                <Ionicons
                  name="alert-circle-outline"
                  size={24}
                  color="#DC2626"
                />

                <Text style={styles.activityErrorText}>{activitiesError}</Text>

                <Pressable onPress={fetchTodayIncidents}>
                  <Text style={styles.retryText}>Try again</Text>
                </Pressable>
              </View>
            ) : incidents.length === 0 ? (
              <View style={styles.activityState}>
                <Ionicons name="file-tray-outline" size={30} color="#94A3B8" />

                <Text style={styles.activityEmptyTitle}>
                  No incidents today
                </Text>

                <Text style={styles.activityStateText}>
                  Detected incidents will appear here.
                </Text>
              </View>
            ) : (
              <FlatList
                data={incidents}
                keyExtractor={(item) => String(item.incident_id)}
                renderItem={renderIncidentItem}
                contentContainerStyle={styles.listContainer}
                showsVerticalScrollIndicator={false}
              />
            )}
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#064E3B",
  },
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  pressed: {
    opacity: 0.7,
  },

  // Header
  header: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: 20,
  },
  headerTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  brandContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
  },
  logoImage: {
    width: 110,
    height: 43,
  },
  menuButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#ECFDF5",
    alignItems: "center",
    justifyContent: "center",
  },

  // Welcome card
  welcomeCard: {
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderRadius: 15,
    overflow: "hidden",
    position: "relative",
  },
  welcomeAccent: {
    position: "absolute",
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: "rgba(255,255,255,0.07)",
    right: -45,
    top: -65,
  },
  greetingLine: {
    fontSize: 13,
    fontWeight: "500",
    color: "#A7F3D0",
  },
  greetingName: {
    fontSize: 25,
    fontWeight: "800",
    color: "#FFFFFF",
    marginTop: 4,
  },
  headerInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 19,
    paddingTop: 13,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.18)",
    gap: 12,
  },
  headerInfoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  infoValue: {
    fontSize: 11,
    fontWeight: "500",
    color: "#ECFDF5",
  },
  infoSeparator: {
    width: 1,
    height: 13,
    backgroundColor: "rgba(255,255,255,0.25)",
  },

  // Main content
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 25,
  },
  dutySection: {
    marginBottom: 29,
  },
  sectionHeading: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 13,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#1E293B",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  statusBadgeOn: {
    backgroundColor: "#D1FAE5",
  },
  statusBadgeOff: {
    backgroundColor: "#E2E8F0",
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: "700",
  },
  dutyCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingHorizontal: 17,
    paddingVertical: 19,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  dutyInfo: {
    flex: 1,
    paddingRight: 12,
  },
  dutyStatus: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
  },
  dutySubtitle: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 5,
  },
  switchTrack: {
    width: 62,
    height: 34,
    borderRadius: 18,
    justifyContent: "center",
  },
  switchThumb: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },

  // Recent activities
  activitySection: {
    flex: 1,
  },
  activityHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  sectionDescription: {
    fontSize: 12,
    color: "#94A3B8",
    marginTop: 4,
  },
  reportCount: {
    backgroundColor: "#E2E8F0",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  reportCountText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#475569",
  },
  listContainer: {
    paddingBottom: 24,
  },
  activityRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 13,
    paddingHorizontal: 12,
    paddingVertical: 14,
    marginBottom: 9,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  activityIconWrap: {
    width: 37,
    height: 37,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 11,
  },
  activityTextWrap: {
    flex: 1,
    marginRight: 5,
  },
  activityTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1E293B",
  },
  activitySubtitle: {
    fontSize: 10,
    color: "#94A3B8",
    marginTop: 5,
  },
  severityPill: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    marginLeft: 4,
  },
  severityPillText: {
    fontSize: 10,
    fontWeight: "700",
  },
  activityState: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    paddingVertical: 30,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: 9,
  },
  activityStateText: {
    fontSize: 12,
    color: "#94A3B8",
    textAlign: "center",
  },
  activityEmptyTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#334155",
  },
  activityErrorText: {
    fontSize: 12,
    color: "#DC2626",
    textAlign: "center",
  },
  retryText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#047857",
    marginTop: 3,
  },

  // Logout menu
  menuBackdrop: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.25)",
  },
  menuCard: {
    position: "absolute",
    right: 20,
    width: 225,
    backgroundColor: "#FFFFFF",
    borderRadius: 15,
    padding: 8,
    elevation: 10,
  },
  menuHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    gap: 10,
  },
  menuAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#D1FAE5",
    alignItems: "center",
    justifyContent: "center",
  },
  menuAvatarText: {
    fontSize: 15,
    fontWeight: "800",
    color: "#047857",
  },
  menuHeaderText: {
    flex: 1,
  },
  menuLabel: {
    fontSize: 11,
    color: "#94A3B8",
  },
  menuName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
    marginTop: 2,
  },
  menuDivider: {
    height: 1,
    backgroundColor: "#F1F5F9",
    marginVertical: 4,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 11,
    borderRadius: 10,
    gap: 10,
  },
  menuItemPressed: {
    backgroundColor: "#FEF2F2",
  },
  menuItemText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#DC2626",
  },
});
