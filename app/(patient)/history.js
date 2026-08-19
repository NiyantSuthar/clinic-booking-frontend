import React, { useCallback, useContext, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { AuthContext } from '../../src/context/AuthContext';
import { getBookingHistory } from '../../src/api/bookingApi';
import { getBookingStatus } from '../../src/utils/bookingStatus';
import { formatDisplayDate } from '../../src/utils/formatDate';
import StatusBadge from '../../src/components/StatusBadge';
import { colors } from '../../src/theme/colors';

export default function HistoryScreen() {
  const { token } = useContext(AuthContext);

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getBookingHistory(token);
      setBookings(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadHistory();
    }, [token])
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadHistory();
    setRefreshing(false);
  };

  const renderItem = ({ item }) => {
    const status = getBookingStatus(item.date);
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.beneficiaryName}>{item.beneficiaryName}</Text>
          <StatusBadge status={status} />
        </View>
        <Text style={styles.date}>{formatDisplayDate(item.date)}</Text>
        <View style={styles.footerRow}>
          <Text style={styles.queueLabel}>Queue #{item.queueNumber}</Text>
          {item.bookedBy === 'ADMIN' && <Text style={styles.bookedByAdmin}>Booked by clinic</Text>}
        </View>
      </View>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={bookings.length === 0 ? styles.emptyContainer : styles.listContent}
      data={bookings}
      keyExtractor={(item) => String(item.bookingId)}
      renderItem={renderItem}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[colors.primary]} />}
      ListEmptyComponent={
        <Text style={styles.emptyText}>No bookings yet. Book an appointment from the Booking tab.</Text>
      }
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  listContent: { padding: 16 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  emptyText: { color: colors.textDisabled, fontSize: 15, textAlign: 'center' },
  errorText: { color: colors.error, fontSize: 15, textAlign: 'center', paddingHorizontal: 24 },
  card: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  beneficiaryName: { fontSize: 16, fontWeight: '600', color: colors.textPrimary },
  date: { fontSize: 14, color: colors.textSecondary, marginBottom: 8 },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  queueLabel: { fontSize: 14, fontWeight: '600', color: colors.primary },
  bookedByAdmin: { fontSize: 12, color: colors.textDisabled, fontStyle: 'italic' },
});