import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useLocalSearchParams, router, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../../../lib/supabase";
import ImageViewing from "react-native-image-viewing";

const SNAPSHOT_BUCKET = "incident-snapshots";

type Incident = {
  incident_id: number;
  camera_id: number | string;
  snapshot_path: string | null;
  detected_at: string | null;
  confidence_percentage: number | null;
  verification_status: string;
};

type Camera = {
  id: number | string;
  landmark: string | null;
  location_street: string | null;
  barangay: string | null;
  latitude: number | null;
  longitude: number | null;
};

export default function IncidentAlertScreen() {
  const { incident_id } = useLocalSearchParams<{
    incident_id: string;
  }>();

  const [incident, setIncident] = useState<Incident | null>(null);
  const [camera, setCamera] = useState<Camera | null>(null);
  const [snapshotUrl, setSnapshotUrl] = useState<string | null>(null);
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useFocusEffect(
    useCallback(() => {
      let active = true;

      
async function loadIncident() {
  setLoading(true);
  setError("");
  setIncident(null);
  setCamera(null);
  setSnapshotUrl(null);

  try {
    if (!incident_id) {
      throw new Error("No incident ID was provided.");
    }

    // 1. Fetch incident
    const { data: incidentData, error: incidentError } =
      await supabase
        .from("incident")
        .select(
          "incident_id, camera_id, snapshot_path, detected_at, confidence_percentage, verification_status"
        )
        .eq("incident_id", incident_id)
        .maybeSingle();

    if (incidentError) {
      console.error("Incident query failed:", incidentError);
      throw new Error(`Incident query failed: ${incidentError.message}`);
    }

    if (!incidentData) {
      throw new Error(`Incident ${incident_id} was not found or is not accessible.`);
    }

    if (!active) return;

    setIncident(incidentData as Incident);

    // 2. Fetch camera independently
    const { data: cameraData, error: cameraError } =
      await supabase
        .from("camera")
        .select(
          "id, landmark, location_street, barangay, latitude, longitude"
        )
        .eq("id", incidentData.camera_id)
        .maybeSingle();

    if (cameraError) {
      console.error("Camera query failed:", cameraError);
      if (active) {
        setError(`Camera query failed: ${cameraError.message}`);
      }
    } else if (!cameraData) {
      console.warn(
        "No camera matched incident camera_id:",
        incidentData.camera_id
      );
      if (active) {
        setError("No matching camera record was found.");
      }
    } else if (active) {
      console.log("Camera loaded:", cameraData);
      setCamera(cameraData as Camera);
    }

    // 3. Fetch snapshot independently
    if (!incidentData.snapshot_path) {
      console.warn("The incident has no snapshot_path.");
      if (active) {
        setError((previous) =>
          [previous, "No snapshot path is stored for this incident."]
            .filter(Boolean)
            .join(" ")
        );
      }
    } else {
      console.log("Snapshot path:", incidentData.snapshot_path);

      const { data: signedData, error: signedError } =
        await supabase.storage
          .from("incident-snapshots")
          .createSignedUrl(incidentData.snapshot_path, 3600);

      if (signedError) {
        console.error("Snapshot signing failed:", signedError);

        if (active) {
          setError((previous) =>
            [previous, `Snapshot error: ${signedError.message}`]
              .filter(Boolean)
              .join(" ")
          );
        }
      } else if (signedData?.signedUrl && active) {
        console.log("Snapshot signed URL created successfully.");
        setSnapshotUrl(signedData.signedUrl);
      } else {
        console.error("No signed URL was returned:", signedData);
      }
    }
  } catch (e) {
    console.error("Incident page loading failed:", e);

    if (active) {
      setError(
        e instanceof Error ? e.message : "Unable to load incident."
      );
    }
  } finally {
    if (active) setLoading(false);
  }
}


      loadIncident();

      return () => {
        active = false;
      };
    }, [incident_id]),
  );

  const openGoogleMaps = async () => {
    if (camera?.latitude == null || camera?.longitude == null) {
      return;
    }

    const url =
      `https://www.google.com/maps/search/?api=1&query=` +
      `${camera.latitude},${camera.longitude}`;

    try {
      await Linking.openURL(url);
    } catch {
      setError("Could not open Google Maps on this device.");
    }
  };

  const formattedDate = incident?.detected_at
    ? new Date(incident.detected_at).toLocaleString("en-PH", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "Not available";

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#047857" />
        <Text style={styles.loadingText}>Loading incident details...</Text>
      </View>
    );
  }

  if (error && !incident) {
    return (
      <View style={styles.center}>
        <Ionicons name="alert-circle-outline" size={48} color="#DC2626" />
        <Text style={styles.errorTitle}>Unable to load incident</Text>
        <Text style={styles.errorText}>{error}</Text>
        <Pressable style={styles.primaryButton} onPress={() => router.back()}>
          <Text style={styles.primaryButtonText}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  const hasCoordinates = camera?.latitude != null && camera?.longitude != null;

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.topRow}>
        <Pressable
          onPress={() => router.back()}
          style={styles.backButton}
          hitSlop={8}
        >
          <Ionicons name="arrow-back" size={22} color="#0F172A" />
        </Pressable>

        <View style={styles.topTitleWrap}>
          <Text style={styles.topTitle}>Incident Details</Text>
          <Text style={styles.topSubtitle}>CPAT Enforcer Alert</Text>
        </View>

        <View style={styles.alertIcon}>
          <Ionicons name="warning" size={22} color="#DC2626" />
        </View>
      </View>

      <Text style={styles.sectionTitle}>Accident Snapshot</Text>

      <View style={styles.snapshotCard}>
        {snapshotUrl ? (
  <Pressable onPress={() => setImageViewerVisible(true)}>
    <Image
      source={{ uri: snapshotUrl }}
      style={styles.snapshot}
      resizeMode="contain"
      onError={(event) => {
        console.error(
          "Snapshot image failed to load:",
          event.nativeEvent.error
        );
        setSnapshotUrl(null);
        setError("The snapshot image could not be loaded.");
      }}
    />

    <View style={styles.zoomHint}>
      <Ionicons name="expand-outline" size={15} color="#FFFFFF" />
      <Text style={styles.zoomHintText}>Tap to enlarge</Text>
    </View>
  </Pressable>
) : (
          <View style={styles.noSnapshot}>
            <Ionicons name="image-outline" size={42} color="#94A3B8" />
            <Text style={styles.noSnapshotText}>No snapshot available</Text>
          </View>
        )}
        <View style={styles.snapshotFooter}>
          <Ionicons name="time-outline" size={16} color="#64748B" />
          <Text style={styles.snapshotDate}>Detected {formattedDate}</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Incident Location</Text>

      <View style={styles.locationCard}>
        <View style={styles.locationIcon}>
          <Ionicons name="location" size={22} color="#047857" />
        </View>
        <View style={styles.locationInfo}>
          <Text style={styles.locationName}>
            {camera?.landmark || "Camera location"}
          </Text>
          <Text style={styles.address}>
            {[
  camera?.location_street,
  camera?.barangay,
]
  .filter(Boolean)
  .join(", ") || "Address not available"}
          </Text>

          {hasCoordinates ? (
            <Text style={styles.coordinates}>
              {camera.latitude}, {camera.longitude}
            </Text>
          ) : (
            <Text style={styles.missingCoordinates}>
              Coordinates unavailable
            </Text>
          )}
        </View>
      </View>

      <Pressable
        style={[styles.mapsButton, !hasCoordinates && styles.disabledButton]}
        onPress={openGoogleMaps}
        disabled={!hasCoordinates}
      >
        <Ionicons name="map-outline" size={20} color="#FFFFFF" />
        <Text style={styles.mapsButtonText}>Open in Google Maps</Text>
        <Ionicons name="open-outline" size={17} color="#FFFFFF" />
      </Pressable>

      <Text style={styles.sectionTitle}>Detection Information</Text>

      <View style={styles.detailsCard}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Incident ID</Text>
          <Text style={styles.detailValue}>#{incident?.incident_id}</Text>
        </View>
        <View style={styles.detailDivider} />
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Camera ID</Text>
          <Text style={styles.detailValue}>{incident?.camera_id}</Text>
        </View>
        <View style={styles.detailDivider} />
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Confidence</Text>
          <Text style={styles.detailValue}>
            {incident?.confidence_percentage != null
              ? `${incident.confidence_percentage}%`
              : "Not available"}
          </Text>
        </View>
      </View>

      {error ? <Text style={styles.inlineError}>{error}</Text> : null}


      <Pressable style={styles.primaryButton} onPress={() => router.back()}>
        <Ionicons name="checkmark-circle-outline" size={20} color="#FFFFFF" />
        <Text style={styles.primaryButtonText}>Acknowledge Incident</Text>
      </Pressable>
<ImageViewing
  images={snapshotUrl ? [{ uri: snapshotUrl }] : []}
  imageIndex={0}
  visible={imageViewerVisible}
  onRequestClose={() => setImageViewerVisible(false)}
  swipeToCloseEnabled
  doubleTapToZoomEnabled
  backgroundColor="#000000"
  presentationStyle="fullScreen"
/>
      
    </ScrollView>
    
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  content: {
    padding: 20,
    paddingTop: 52,
    paddingBottom: 36,
  },
  center: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    justifyContent: "center",
    alignItems: "center",
    padding: 28,
  },
  loadingText: {
    marginTop: 12,
    color: "#64748B",
    fontSize: 14,
  },
  errorTitle: {
    marginTop: 12,
    color: "#0F172A",
    fontSize: 20,
    fontWeight: "800",
  },
  errorText: {
    marginTop: 8,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 21,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
    gap: 12,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
  },
  topTitleWrap: {
    flex: 1,
  },
  topTitle: {
    fontSize: 21,
    fontWeight: "800",
    color: "#0F172A",
  },
  topSubtitle: {
    marginTop: 3,
    fontSize: 12,
    color: "#64748B",
  },
  alertIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "#FEE2E2",
    alignItems: "center",
    justifyContent: "center",
  },
  statusBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#FECACA",
    borderRadius: 18,
    padding: 16,
    marginBottom: 24,
    gap: 10,
  },
  statusDot: {
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: "#DC2626",
  },
  statusTextWrap: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#991B1B",
  },
  statusSubtitle: {
    marginTop: 3,
    fontSize: 12,
    color: "#64748B",
  },
  statusPill: {
    backgroundColor: "#FEE2E2",
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#B91C1C",
    textTransform: "capitalize",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 12,
  },
  snapshotCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 24,
  },
  snapshot: {
    width: "100%",
    height: 220,
    backgroundColor: "#0F172A",
  },
  noSnapshot: {
    height: 180,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F1F5F9",
    gap: 8,
  },
  noSnapshotText: {
    fontSize: 13,
    color: "#64748B",
  },
  snapshotFooter: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    gap: 7,
  },
  snapshotDate: {
    fontSize: 12,
    color: "#64748B",
  },
  locationCard: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 16,
    gap: 12,
    marginBottom: 12,
  },
  locationIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: "#D1FAE5",
    alignItems: "center",
    justifyContent: "center",
  },
  locationInfo: {
    flex: 1,
  },
  locationName: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0F172A",
  },
  address: {
    marginTop: 5,
    fontSize: 13,
    lineHeight: 19,
    color: "#64748B",
  },
  coordinates: {
    marginTop: 9,
    fontSize: 12,
    fontWeight: "700",
    color: "#047857",
  },
  missingCoordinates: {
    marginTop: 9,
    fontSize: 12,
    color: "#DC2626",
  },
  mapsButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#047857",
    borderRadius: 14,
    paddingVertical: 15,
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 24,
  },
  mapsButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
    flex: 1,
  },
  disabledButton: {
    opacity: 0.45,
  },
  detailsCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingHorizontal: 16,
    marginBottom: 18,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 15,
    gap: 12,
  },
  detailLabel: {
    fontSize: 13,
    color: "#64748B",
  },
  detailValue: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0F172A",
    textAlign: "right",
    flexShrink: 1,
  },
  detailDivider: {
    height: 1,
    backgroundColor: "#F1F5F9",
  },
  notice: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#ECFDF5",
    borderRadius: 14,
    padding: 13,
    gap: 10,
    marginBottom: 20,
  },
  noticeText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 19,
    color: "#065F46",
  },
  inlineError: {
    color: "#B91C1C",
    fontSize: 12,
    marginBottom: 12,
  },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#047857",
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 20,
    gap: 9,
    width: "100%",
    marginTop: 4,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },
  zoomHint: {
  position: "absolute",
  bottom: 12,
  right: 12,
  flexDirection: "row",
  alignItems: "center",
  backgroundColor: "rgba(15, 23, 42, 0.75)",
  paddingHorizontal: 10,
  paddingVertical: 7,
  borderRadius: 20,
  gap: 5,
},

zoomHintText: {
  color: "#FFFFFF",
  fontSize: 11,
  fontWeight: "600",
},
});
