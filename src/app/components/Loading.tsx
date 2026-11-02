
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

export default function LoadingScreen() {
  return (
    <View style={styles.container}>
      {/* Brand */}
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <View style={styles.logoInner}>
            <Text style={styles.logoText}>C</Text>
          </View>
          <View style={styles.logoAccent} />
        </View>

        <Text style={styles.title}>CPAT</Text>
        <Text style={styles.subtitle}>
          COLLISION PERSPECTIVE{"\n"}WITH ALERT TECHNOLOGY
        </Text>

        {/* Loading indicator */}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#059669" />
          <Text style={styles.loadingText}>
            Preparing your application
          </Text>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.footerLine} />
        <Text style={styles.footerText}>
          REAL-TIME ACCIDENT DETECTION
        </Text>
        <Text style={styles.version}>CPAT MOBILE APPLICATION</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 65,
    paddingHorizontal: 30,
  },

  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
  },

  logoContainer: {
    width: 94,
    height: 94,
    borderRadius: 28,
    backgroundColor: "#ECFDF5",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 25,
    position: "relative",
  },

  logoInner: {
    width: 66,
    height: 66,
    borderRadius: 21,
    backgroundColor: "#065F46",
    justifyContent: "center",
    alignItems: "center",
  },

  logoText: {
    fontSize: 43,
    fontWeight: "900",
    color: "#FFFFFF",
    fontStyle: "italic",
  },

  logoAccent: {
    position: "absolute",
    width: 13,
    height: 13,
    borderRadius: 7,
    backgroundColor: "#10B981",
    right: 5,
    top: 5,
    borderWidth: 3,
    borderColor: "#FFFFFF",
  },

  title: {
    fontSize: 34,
    fontWeight: "900",
    color: "#064E3B",
    letterSpacing: 5,
  },

  subtitle: {
    fontSize: 10,
    fontWeight: "700",
    color: "#94A3B8",
    letterSpacing: 2,
    textAlign: "center",
    lineHeight: 18,
    marginTop: 8,
  },

  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 65,
    gap: 12,
  },

  loadingText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#64748B",
    letterSpacing: 0.2,
  },

  footer: {
    width: "100%",
    alignItems: "center",
  },

  footerLine: {
    width: 38,
    height: 3,
    borderRadius: 2,
    backgroundColor: "#10B981",
    marginBottom: 17,
  },

  footerText: {
    fontSize: 9,
    fontWeight: "800",
    color: "#64748B",
    letterSpacing: 1.8,
  },

  version: {
    fontSize: 9,
    color: "#CBD5E1",
    letterSpacing: 1,
    marginTop: 7,
  },
});
