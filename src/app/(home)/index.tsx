// app/index.tsx
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Easing,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
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

const formatElapsed = (ms: number) => {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = String(Math.floor(total / 3600)).padStart(2, '0');
  const m = String(Math.floor((total % 3600) / 60)).padStart(2, '0');
  const s = String(total % 60).padStart(2, '0');
  return `${h}:${m}:${s}`;
};

const formatToday = () =>
  new Date().toLocaleDateString('en-PH', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

const formatTime = () =>
  new Date().toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit' });

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
};

export default function Home() {
  const router = useRouter();
  const [firstName, setFirstName] = useState<string>('');
  const [showLogout, setShowLogout] = useState<boolean>(false);

  // Duty status
  const [onDuty, setOnDuty] = useState<boolean>(false);
  const [dutyStart, setDutyStart] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState<number>(0);
  const switchAnim = useRef(new Animated.Value(0)).current;
  const [, setTick] = useState(0);

  // Keep the greeting / clock chip fresh
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 30000);
    return () => clearInterval(id);
  }, []);

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

  // Animate the switch
  useEffect(() => {
    Animated.timing(switchAnim, {
      toValue: onDuty ? 1 : 0,
      duration: 220,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false, // color interpolation needs the JS driver
    }).start();
  }, [onDuty, switchAnim]);

  // Duty timer
  useEffect(() => {
    if (!onDuty || dutyStart === null) {
      setElapsed(0);
      return;
    }
    setElapsed(Date.now() - dutyStart);
    const id = setInterval(() => setElapsed(Date.now() - dutyStart), 1000);
    return () => clearInterval(id);
  }, [onDuty, dutyStart]);

  const startDuty = () => {
    setDutyStart(Date.now());
    setOnDuty(true);
    // TODO: save duty status to Supabase (e.g. update profiles.on_duty = true)
  };

  const endDuty = () => {
    setOnDuty(false);
    setDutyStart(null);
    // TODO: save duty status to Supabase (e.g. update profiles.on_duty = false)
  };

  const handleToggleDuty = () => {
    if (!onDuty) {
      startDuty();
      return;
    }
    Alert.alert('End your duty?', `You've been on duty for ${formatElapsed(elapsed)}.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'End Duty', style: 'destructive', onPress: endDuty },
    ]);
  };

  const insets = useSafeAreaInsets();

  const confirmLogout = async () => {
    await supabase.auth.signOut();
    router.replace('/(auth)/' as any);
  };

  const handleLogout = () => {
    setShowLogout(false);
    Alert.alert('Log out?', 'You will need to sign in again to continue.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log out', style: 'destructive', onPress: confirmLogout },
    ]);
  };

  const trackColor = switchAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#CBD5E1', '#10B981'],
  });
  const thumbX = switchAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [3, 33],
  });

  const renderReportItem = ({ item }: { item: (typeof ACCIDENT_REPORTS)[0] }) => {
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
      <StatusBar style="light" />
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        {/* Header */}
        <LinearGradient
          colors={['#022C22', '#065F46', '#059669']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          {/* Decorative circles */}
          <View style={styles.circleLarge} />
          <View style={styles.circleSmall} />

          {/* Header Logo inside green header with white background */}
          <View style={styles.logoHeaderContainer}>
            <Image
              source={require('@/assets/images/logo/cpat-logo.png')}
              style={styles.headerLogo}
              resizeMode="contain"
            />
          </View>

          {/* Top row: greeting on the left, menu on the right */}
          <View style={styles.headerTopRow}>
            <View style={styles.greetingWrap}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {(firstName ? firstName[0] : 'C').toUpperCase()}
                </Text>
              </View>
              <View style={styles.greetingTextWrap}>
                <Text style={styles.greetingLine} numberOfLines={1}>
                  {getGreeting()},{' '}
                  <Text style={styles.greetingName}>{firstName ? firstName : 'CPAT App'}</Text>
                </Text>
              </View>
            </View>

            <View style={styles.headerActions}>
              <Pressable
                onPress={() => setShowLogout((prev) => !prev)}
                style={({ pressed }) => [styles.toggleButton, pressed && styles.pressed]}
              >
                <Ionicons name="ellipsis-vertical" size={20} color="#FFFFFF" />
              </Pressable>

              <Modal
                visible={showLogout}
                transparent
                animationType="fade"
                statusBarTranslucent
                onRequestClose={() => setShowLogout(false)}
              >
                {/* Tap anywhere outside the menu to dismiss */}
                <Pressable style={styles.menuBackdrop} onPress={() => setShowLogout(false)}>
                  <View style={[styles.menuCard, { top: insets.top + 100 }]}>
                    <View style={styles.menuHeader}>
                      <View style={styles.menuAvatar}>
                        <Text style={styles.menuAvatarText}>
                          {(firstName ? firstName[0] : 'C').toUpperCase()}
                        </Text>
                      </View>
                      <View style={styles.menuHeaderText}>
                        <Text style={styles.menuLabel}>Signed in as</Text>
                        <Text style={styles.menuName} numberOfLines={1}>
                          {firstName || 'CPAT User'}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.menuDivider} />

                    <Pressable
                      onPress={handleLogout}
                      style={({ pressed }) => [styles.menuItem, pressed && styles.menuItemPressed]}
                    >
                      <View style={styles.menuItemIcon}>
                        <Ionicons name="log-out-outline" size={18} color="#DC2626" />
                      </View>
                      <Text style={styles.menuItemText}>Log out</Text>
                    </Pressable>
                  </View>
                </Pressable>
              </Modal>
            </View>
          </View>

          {/* Info chips */}
          <View style={styles.chipsRow}>
            <View style={styles.chip}>
              <Ionicons name="calendar-outline" size={14} color="#FFFFFF" />
              <Text style={styles.chipText}>{formatToday()}</Text>
            </View>
            <View style={styles.chip}>
              <Ionicons name="time-outline" size={14} color="#FFFFFF" />
              <Text style={styles.chipText}>{formatTime()}</Text>
            </View>
          </View>

          {/* Duty status card (overlaps the header/panel boundary) */}
          <View style={styles.cardsRow}>
            <View style={styles.dutyCard}>
              <View style={styles.dutyInfo}>
                <View style={styles.dutyStatusRow}>
                  <View
                    style={[
                      styles.statusDot,
                      { backgroundColor: onDuty ? '#10B981' : '#94A3B8' },
                    ]}
                  />
                  <Text style={[styles.dutyStatus, onDuty && styles.dutyStatusOn]}>
                    {onDuty ? 'On Duty' : 'Off Duty'}
                  </Text>
                </View>
                <Text style={styles.dutySubtitle}>
                  {onDuty
                    ? `Time on duty · ${formatElapsed(elapsed)}`
                    : 'Turn on to start your day'}
                </Text>
              </View>

              <Pressable
                onPress={handleToggleDuty}
                hitSlop={8}
                accessibilityRole="switch"
                accessibilityState={{ checked: onDuty }}
                accessibilityLabel="Duty status"
              >
                <Animated.View style={[styles.switchTrack, { backgroundColor: trackColor }]}>
                  <Animated.View
                    style={[styles.switchThumb, { transform: [{ translateX: thumbX }] }]}
                  />
                </Animated.View>
              </Pressable>
            </View>
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
    backgroundColor: '#022C22', // fills the status bar / notch area behind the header
  },
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  pressed: {
    opacity: 0.8,
  },

  // Header
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 40,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    overflow: 'visible',
    zIndex: 2, // keep the overlapping card above the panel
  },
  logoHeaderContainer: {
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 12,
  },
  headerLogo: {
    width: 120,
    height: 38,
  },
  circleLarge: {
    position: 'absolute',
    top: -60,
    right: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  circleSmall: {
    position: 'absolute',
    top: 70,
    right: 60,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    position: 'relative',
  },
  // Popover menu
  menuBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(2,44,34,0.35)',
  },
  menuCard: {
    position: 'absolute',
    right: 20,
    width: 230,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 12,
  },
  menuHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    gap: 10,
  },
  menuAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuAvatarText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#047857',
  },
  menuHeaderText: {
    flex: 1,
  },
  menuLabel: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
  },
  menuName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 1,
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 4,
    marginHorizontal: 6,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 14,
    gap: 10,
  },
  menuItemPressed: {
    backgroundColor: '#FEF2F2',
  },
  menuItemIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuItemText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#DC2626',
  },
  toggleButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  greetingWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingRight: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  greetingTextWrap: {
    flex: 1,
  },
  greetingLine: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
  },
  greetingName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 16,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Duty card (overlaps the header/panel boundary)
  cardsRow: {
    marginTop: 16,
    marginBottom: -84, // = card height, so the card overhangs by (84 - header paddingBottom)
  },
  dutyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    height: 84,
    paddingHorizontal: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
  dutyInfo: {
    flex: 1,
    paddingRight: 12,
  },
  dutyStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  dutyStatus: {
    fontSize: 18,
    fontWeight: '800',
    color: '#475569',
  },
  dutyStatusOn: {
    color: '#047857',
  },
  dutySubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
  },
  switchTrack: {
    width: 66,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
  },
  switchThumb: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },

  // Main panel
  panel: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingTop: 64, // card overhang (44) + 20 breathing room
    paddingHorizontal: 20,
    zIndex: 1,
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