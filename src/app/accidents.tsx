// app/accidents.tsx
import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';

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

export default function AccidentsScreen() {
  const router = useRouter();

  const renderReportItem = ({ item }: { item: typeof ACCIDENT_REPORTS[0] }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.locationText}>{item.location}</Text>
        <View
          style={[
            styles.badge,
            item.severity === 'High'
              ? styles.highBadge
              : item.severity === 'Medium'
              ? styles.mediumBadge
              : styles.lowBadge,
          ]}
        >
          <Text style={styles.badgeText}>{item.severity}</Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.timeContainer}>
        <View style={styles.timeBox}>
          <Text style={styles.timeLabel}>Time of Accident:</Text>
          <Text style={styles.timeValue}>{item.accidentTime}</Text>
        </View>
        <View style={styles.timeBox}>
          <Text style={styles.timeLabel}>Reported Time:</Text>
          <Text style={styles.timeValue}>{item.reportedTime}</Text>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Batangas City Incident Log</Text>
      </View>

      {/* Reports List */}
      <FlatList
        data={ACCIDENT_REPORTS}
        keyExtractor={(item) => item.id}
        renderItem={renderReportItem}
        contentContainerStyle={styles.listContainer}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F7F6',
  },
  header: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 12,
  },
  backButtonText: {
    color: '#004D40',
    fontSize: 16,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#004D40',
  },
  listContainer: {
    padding: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 5,
    borderLeftColor: '#004D40',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  locationText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E293B',
    flex: 1,
    marginRight: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  highBadge: {
    backgroundColor: '#FEE2E2',
  },
  mediumBadge: {
    backgroundColor: '#FEF3C7',
  },
  lowBadge: {
    backgroundColor: '#E0E7FF',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E293B',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 12,
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeBox: {
    flex: 1,
  },
  timeLabel: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 2,
  },
  timeValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
});