import React, { useState } from 'react';

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
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { supabase } from '../../../lib/supabase';

export default function LoginScreen() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSignIn = async () => {
    if (!email || !password) {
      alert('Please enter your email and password.');
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      alert(error.message);
      return;
    }

    router.replace('/(home)' as any);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >

          {/* =========================
              HEADER
          ========================= */}
          <View style={styles.header}>

            {/* New CPAT Header Logo */}
            <Image
              source={require('@/assets/images/logo/cpat-logo.png')} 
              style={styles.headerLogo}
              resizeMode="contain"
            />

            {/* Title */}
            <Text style={styles.title}>
              SIGN IN
            </Text>

            {/* Subtitle */}
            <Text style={styles.subtitle}>
              Access your team workspace.
            </Text>

          </View>

          {/* =========================
              FORM
          ========================= */}
          <View style={styles.form}>

            {/* EMAIL INPUT */}
            <View style={styles.inputContainer}>

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

              <TextInput
                style={styles.input}
                placeholder="PASSWORD"
                placeholderTextColor="#8E9DAE"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={true}
                autoCapitalize="none"
                autoCorrect={false}
              />

            </View>

            {/* SIGN IN BUTTON */}
            <TouchableOpacity
              style={styles.button}
              onPress={handleSignIn}
              activeOpacity={0.8}
            >
              <Text style={styles.buttonText}>
                Sign In
              </Text>
            </TouchableOpacity>

          </View>

          {/* =========================
              FOOTER
          ========================= */}
          <View style={styles.footer}>

            {/* Divider */}
            <View style={styles.divider} />

            {/* Logos */}
            <View style={styles.logoContainer}>

              {/* TDRO LOGO */}
              <Image
                source={require('@/assets/images/logo/tdro_logo.png')}
                style={styles.tdroLogo}
                resizeMode="contain"
              />

              {/* BATANGAS LOGO */}
              <Image
                source={require('@/assets/images/logo/batangas_logo.png')}
                style={styles.batangasLogo}
                resizeMode="contain"
              />

            </View>

            {/* Authorized Personnel */}
            <Text style={styles.footerText}>
              AUTHORIZED PERSONNEL ONLY
            </Text>

          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}


/* =========================================================
   STYLES
========================================================= */

const styles = StyleSheet.create({

  /* =========================
      SCREEN
  ========================= */

  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },

  keyboardView: {
    flex: 1,
  },

  scrollContent: {
    flexGrow: 1,

    justifyContent: 'center',
    alignItems: 'center',

    paddingHorizontal: 24,
    paddingVertical: 30,
  },


  /* =========================
      HEADER
  ========================= */

  header: {
    alignItems: 'center',
    marginBottom: 28,
  },

  // New style for the provided logo
  headerLogo: {
    width: 150, 
    height: 64, // Matched height of original iconContainer
    marginBottom: 18,
  },

  title: {
    fontSize: 28,

    fontWeight: '800',

    color: '#047857',

    letterSpacing: 1.2,

    marginBottom: 8,
  },

  subtitle: {
    fontSize: 14,

    color: '#64748B',

    textAlign: 'center',
  },


  /* =========================
      FORM
  ========================= */

  form: {
    width: '100%',
    maxWidth: 420,
  },

  inputContainer: {
    width: '100%',
    height: 52,

    flexDirection: 'row',
    alignItems: 'center',

    borderWidth: 1,
    borderColor: '#CBD5E1',

    borderRadius: 10,

    paddingHorizontal: 14,

    marginBottom: 16,

    backgroundColor: '#FFFFFF',
  },

  input: {
    flex: 1,

    height: '100%',

    fontSize: 13,

    color: '#1E293B',

    letterSpacing: 0.8,
  },


  /* =========================
      SIGN IN BUTTON
  ========================= */

  button: {
    width: '100%',
    height: 52,

    backgroundColor: '#065F46',

    borderRadius: 10,

    justifyContent: 'center',
    alignItems: 'center',

    marginTop: 4,
    marginBottom: 28,

    shadowColor: '#065F46',

    shadowOffset: {
      width: 0,
      height: 4,
    },

    shadowOpacity: 0.2,
    shadowRadius: 6,

    elevation: 3,
  },

  buttonText: {
    color: '#FFFFFF',

    fontSize: 15,

    fontWeight: '700',

    letterSpacing: 0.3,
  },


  /* =========================
      FOOTER
  ========================= */

  footer: {
    width: '100%',
    maxWidth: 420,

    alignItems: 'center',
  },

  divider: {
    width: '100%',
    height: 1,

    backgroundColor: '#E2E8F0',

    marginBottom: 18,
  },


  /* =========================
      LOGOS
  ========================= */

  logoContainer: {
    flexDirection: 'row',

    justifyContent: 'center',
    alignItems: 'center',

    height: 70,

    marginTop: 0,
    marginBottom: 14,
  },

  tdroLogo: {
    width: 70,
    height: 50,

    marginTop: 7,
    marginRight: 0,
  },

  batangasLogo: {
    width: 70,
    height: 50,

    marginLeft: 0,
  },


  /* =========================
      FOOTER TEXT
  ========================= */

  footerText: {
    fontSize: 14,

    color: '#94A3B8',

    letterSpacing: 2,

    fontWeight: '600',

    textAlign: 'center',
  },

});