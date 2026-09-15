// app/index.tsx
import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  SafeAreaView,
  TouchableOpacity,
  Platform,
  StatusBar,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { supabase } from '../../../lib/supabase'; // Ensure this points to your Supabase client setup

// Sample mock data for Batangas City accident reports
const ACCIDENT_REPORTS = [
  {
    id: '1',
    location: 'Kumintang Ibaba (Near Grand Terminal)',
    accidentTime: '08:15 AM',
    reportedTime: '08:22 AM',
    severity: 'High',
  },
  {
    id: '2',
    location: 'P. Burgos St. cor. Rizal Ave, Poblacion',
    accidentTime: '10:30 AM',
    reportedTime: '10:35 AM',
    severity: 'Medium',
  },
  {
    id: '3',
    location: 'Diversion Road, Balagtas',
    accidentTime: '01:45 PM',
    reportedTime: '01:50 PM',
    severity: 'High',
  },
  {
    id: '4',
    location: 'Calicanto (Near Batangas Medical Center)',
    accidentTime: '03:10 PM',
    reportedTime: '03:18 PM',
    severity: 'Low',
  },
  {
    id: '5',
    location: 'Gulod Labac Highway',
    accidentTime: '05:00 PM',
    reportedTime: '05:07 PM',
    severity: 'Medium',
  },
];

const SEVERITY_COLORS: Record<string, { bg: string; dot: string }> = {
  High: { bg: '#FEE2E2', dot: '#EF4444' },
  Medium: { bg: '#FEF3C7', dot: '#F59E0B' },
  Low: { bg: '#E0E7FF', dot: '#6366F1' },
};

export default function Home() {
  const router = useRouter();
  const [firstName, setFirstName] = useState<string>('');
  const [showLogout, setShowLogout] = useState<boolean>(false);

  useEffect(() => {
    async function fetchUserProfile() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('first_name')
          .eq('id', user.id)
          .single();

        if (data?.first_name) {
          setFirstName(data.first_name);
        }
      }
    }

    fetchUserProfile();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace('/(auth)/' as any);
  };

  const renderReportItem = ({ item }: { item: typeof ACCIDENT_REPORTS[0] }) => {
    const colors = SEVERITY_COLORS[item.severity] ?? SEVERITY_COLORS.Low;
    return (
      <View style={styles.activityRow}>
        <View style={[styles.activityIconWrap, { backgroundColor: colors.bg }]}>
          <View style={[styles.activityDot, { backgroundColor: colors.dot }]} />
        </View>

        <View style={styles.activityTextWrap}>
          <Text style={styles.activityTitle} numberOfLines={1}>
            {item.location}
          </Text>
          <Text style={styles.activitySubtitle}>
            Accident {item.accidentTime} · Reported {item.reportedTime}
          </Text>
        </View>

        <View style={[styles.severityPill, { backgroundColor: colors.bg }]}>
          <Text style={[styles.severityPillText, { color: colors.dot }]}>
            {item.severity}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#00A896" />
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <LinearGradient
          colors={['#065F46', '#065F46']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <View style={styles.headerTopRow}>
            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerTitle}>
                {firstName ? `Welcome, ${firstName}` : 'CPAT APP'}
              </Text>
              <View style={styles.logosRow}>
                <Image
                  source={require('../../../assets/images/logo/CPATLOGO1.png')}
                  style={styles.logoImage}
                  resizeMode="contain"
                />
                <Image
                  source={require('../../../assets/images/logo/tdro_logo.png')}
                  style={styles.logoImage}
                  resizeMode="contain"
                />
              </View>
            </View>

            <View style={styles.headerActions}>
              <TouchableOpacity
                onPress={() => setShowLogout((prev) => !prev)}
                activeOpacity={0.8}
                style={styles.toggleButton}
              >
                <Text style={styles.toggleButtonText}>⋮</Text>
              </TouchableOpacity>

              {showLogout && (
                <View style={styles.dropdownMenu}>
                  <TouchableOpacity
                    onPress={handleLogout}
                    activeOpacity={0.8}
                    style={styles.logoutButton}
                  >
                    <Text style={styles.logoutButtonText}>Logout</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>

          {/* Card component — left blank for now */}
          <View style={styles.cardsRow}>
            <View style={styles.placeholderCard} />
          </View>
        </LinearGradient>

        {/* Main content panel */}
        <View style={styles.panel}>
          <View style={styles.panelHeaderRow}>
            <Text style={styles.panelTitle}>Recent Activities</Text>
            
          </View>

          <FlatList
            data={ACCIDENT_REPORTS}
            keyExtractor={(item) => item.id}
            renderItem={renderReportItem}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
          />
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#00A896',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  // Header
  header: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  logosRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 12,
  },
  logoImage: {
    width: 36,
    height: 36,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    position: 'relative',
  },
  dropdownMenu: {
    position: 'absolute',
    top: 42,
    right: 0,
    backgroundColor: '#065F46',
    borderRadius: 12,
    padding: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    zIndex: 10,
  },
  logoutButton: {
    paddingHorizontal: 12,
    height: 34,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  toggleButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },

  // Card component (overlaps the header/panel boundary)
  cardsRow: {
    marginTop: 20,
    marginBottom: -36,
  },
  placeholderCard: {
    height: 72,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },

  // Main panel
  panel: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingTop: 44,
    paddingHorizontal: 20,
  },
  panelHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  panelTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#1E293B',
  },

  // List / activity rows
  listContainer: {
    paddingBottom: 24,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
  },
  activityIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  activityDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  activityTextWrap: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  activitySubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  severityPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginLeft: 8,
  },
  severityPillText: {
    fontSize: 11,
    fontWeight: '600',
  },
});