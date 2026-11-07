import React, { useState } from "react";

import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Image,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { supabase } from "../../../lib/supabase";

export default function LoginScreen() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSignIn = async () => {
  if (isLoading) return;

  if (!email.trim() || !password) {
    Alert.alert(
      "Missing Information",
      "Please enter your email and password.",
    );
    return;
  }

  setIsLoading(true);

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      if (error.message.toLowerCase().includes("invalid login credentials")) {
        Alert.alert(
          "Login Failed",
          "Invalid email or password. Please try again.",
        );
      } else {
        Alert.alert("Login Failed", error.message);
      }
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("user_role")
      .eq("id", data.user.id)
      .single();

    if (profileError || !profile || profile.user_role !== "enforcer") {
      await supabase.auth.signOut();

      Alert.alert(
        "Access Denied",
        "This application is exclusively for authorized traffic enforcers.",
      );
      return;
    }

    router.replace("/(home)" as any);
  } catch (error) {
    console.error("[CPAT] Login error:", error);

    Alert.alert(
      "Something Went Wrong",
      "Unable to log in at the moment. Please check your connection and try again.",
    );
  } finally {
    setIsLoading(false);
  }
};

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* MAIN CONTENT */}
          <View style={styles.mainContent}>
            {/* HEADER */}
            <View style={styles.header}>
              <Image
                source={require("@/assets/images/logo/cpat-logo.png")}
                style={styles.headerLogo}
                resizeMode="contain"
              />

              <Text style={styles.subtitle}>Sign In to your Account</Text>
            </View>

            {/* FORM */}
            <View style={styles.form}>
              {/* EMAIL INPUT */}
              <View style={styles.inputContainer}>
                <Ionicons
                  name="mail-outline"
                  size={20}
                  color="#8E9DAE"
                  style={styles.inputIcon}
                />

                <TextInput
                  style={styles.input}
                  placeholder="EMAIL"
                  placeholderTextColor="#8E9DAE"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              {/* PASSWORD INPUT */}
              <View style={styles.inputContainer}>
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color="#8E9DAE"
                  style={styles.inputIcon}
                />

                <TextInput
                  style={styles.input}
                  placeholder="PASSWORD"
                  placeholderTextColor="#8E9DAE"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                />

                <TouchableOpacity
                  onPress={() => setShowPassword((prev) => !prev)}
                  activeOpacity={0.7}
                  style={styles.passwordToggle}
                >
                  <Ionicons
                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                    size={21}
                    color="#8E9DAE"
                  />
                </TouchableOpacity>
              </View>

              {/* SIGN IN BUTTON */}
              <TouchableOpacity
  style={[styles.button, isLoading && styles.buttonDisabled]}
  onPress={handleSignIn}
  activeOpacity={0.8}
  disabled={isLoading}
>
  {isLoading ? (
    <View style={styles.loadingContent}>
      <ActivityIndicator size="small" color="#FFFFFF" />
      <Text style={styles.buttonText}>Signing in...</Text>
    </View>
  ) : (
    <Text style={styles.buttonText}>Continue →</Text>
  )}
</TouchableOpacity>
            </View>
          </View>

          {/* COPYRIGHT FOOTER */}
          <View style={styles.footer}>
            <Text style={styles.copyrightText}>
              © 2026 CPAT. All rights reserved.
            </Text>

            <Text style={styles.copyrightSubtext}>
              Collision Perspective with Alert Technology
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  keyboardView: {
    flex: 1,
  },

  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 16,
  },

  mainContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  header: {
    alignItems: "center",
    marginBottom: 28,
  },

  headerLogo: {
    width: 150,
    height: 64,
    marginBottom: 18,
  },

  subtitle: {
    fontSize: 15,
    color: "#065F46",
    textAlign: "center",
  },

  form: {
    width: "100%",
    maxWidth: 420,
  },

  inputContainer: {
    width: "100%",
    height: 52,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 10,
    paddingHorizontal: 14,
    marginBottom: 16,
    backgroundColor: "#FFFFFF",
  },

  input: {
    flex: 1,
    height: "100%",
    fontSize: 13,
    color: "#1E293B",
    letterSpacing: 0.8,
  },

  button: {
    width: "100%",
    height: 52,
    backgroundColor: "#065F46",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 4,
    marginBottom: 28,
    shadowColor: "#065F46",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },

  buttonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.3,
  },

  footer: {
    width: "100%",
    alignItems: "center",
    paddingTop: 20,
  },

  copyrightText: {
    fontSize: 11,
    color: "#94A3B8",
    fontWeight: "500",
  },

  copyrightSubtext: {
    fontSize: 10,
    color: "#B0BAC5",
    marginTop: 4,
  },
  passwordToggle: {
    padding: 6,
    justifyContent: "center",
    alignItems: "center",
  },
  inputIcon: {
    marginRight: 10,
  },
  buttonDisabled: {
  opacity: 0.8,
},

loadingContent: {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "center",
  gap: 10,
},
});
