import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Stack, useRouter } from "expo-router";

// Adjust this path to match where this file lives.
import { supabase } from "../../../lib/supabase";

const MIN_LENGTH = 8;

type FieldProps = {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  autoComplete: "current-password" | "new-password";
  editable: boolean;
};

function PasswordField({
  label,
  value,
  onChangeText,
  autoComplete,
  editable,
}: FieldProps) {
  const [visible, setVisible] = useState(false);

  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>

      <View style={styles.inputWrap}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={!visible}
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete={autoComplete}
          editable={editable}
          style={styles.input}
          placeholderTextColor="#94A3B8"
        />

        <Pressable
          onPress={() => setVisible((v) => !v)}
          hitSlop={8}
          accessibilityLabel={visible ? "Hide password" : "Show password"}
        >
          <Ionicons
            name={visible ? "eye-off-outline" : "eye-outline"}
            size={20}
            color="#94A3B8"
          />
        </Pressable>
      </View>
    </View>
  );
}

export default function ChangePassword() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Load the signed-in user's email (needed to verify the current password).
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setEmail(user?.email ?? "");
    });
  }, []);

  const handleSubmit = async () => {
    setError("");

    if (!email) {
      setError("No account email found. Please sign in again.");
      return;
    }
    if (!currentPassword) {
      setError("Enter your current password.");
      return;
    }
    if (newPassword.length < MIN_LENGTH) {
      setError(`New password must be at least ${MIN_LENGTH} characters.`);
      return;
    }
    if (newPassword === currentPassword) {
      setError("New password must be different from the current one.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      // Verify the current password first.
      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email,
        password: currentPassword,
      });

      if (verifyError) {
        setError("Current password is incorrect.");
        return;
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        setError(updateError.message);
        return;
      }

      Alert.alert(
        "Password updated",
        "Use your new password the next time you sign in.",
        [{ text: "OK", onPress: () => router.back() }],
      );
    } catch (e) {
      console.error("[CPAT] Change password failed:", e);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style="dark" />

      <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            disabled={loading}
            hitSlop={8}
            style={({ pressed }) => [
              styles.backButton,
              pressed && styles.pressed,
            ]}
            accessibilityLabel="Go back"
          >
            <Ionicons name="chevron-back" size={22} color="#065F46" />
          </Pressable>

          <Text style={styles.headerTitle}>Change password</Text>

          <View style={styles.headerSpacer} />
        </View>

        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.subtitle}>
              Enter your current password, then choose a new one.
            </Text>

            <View style={styles.formCard}>
              <PasswordField
                label="Current password"
                value={currentPassword}
                onChangeText={setCurrentPassword}
                autoComplete="current-password"
                editable={!loading}
              />

              <PasswordField
                label="New password"
                value={newPassword}
                onChangeText={setNewPassword}
                autoComplete="new-password"
                editable={!loading}
              />

              <PasswordField
                label="Confirm new password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                autoComplete="new-password"
                editable={!loading}
              />

              <Text style={styles.hint}>
                Use at least {MIN_LENGTH} characters.
              </Text>

              {error ? <Text style={styles.error}>{error}</Text> : null}
            </View>

            <Pressable
              onPress={handleSubmit}
              disabled={loading}
              style={({ pressed }) => [
                styles.submitButton,
                (pressed || loading) && styles.pressed,
              ]}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.submitText}>Update password</Text>
              )}
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
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
  flex: {
    flex: 1,
  },
  pressed: {
    opacity: 0.7,
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 14,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#ECFDF5",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#1E293B",
  },
  headerSpacer: {
    width: 38,
  },

  // Content
  content: {
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 32,
  },
  subtitle: {
    fontSize: 13,
    color: "#64748B",
    marginBottom: 16,
  },
  formCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 17,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  field: {
    marginBottom: 14,
  },
  label: {
    fontSize: 11,
    fontWeight: "700",
    color: "#475569",
    marginBottom: 6,
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 11,
    paddingHorizontal: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 14,
    color: "#0F172A",
  },
  hint: {
    fontSize: 11,
    color: "#94A3B8",
  },
  error: {
    fontSize: 12,
    color: "#DC2626",
    marginTop: 10,
  },
  submitButton: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#047857",
    borderRadius: 13,
    paddingVertical: 15,
    marginTop: 20,
  },
  submitText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});