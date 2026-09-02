import { useFocusEffect } from "expo-router";
import { useCallback, useContext, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { getBookingHistory } from "../../src/api/bookingApi";
import StatusBadge from "../../src/components/StatusBadge";
import { AuthContext } from "../../src/context/AuthContext";
import { colors } from "../../src/theme/colors";
import { MAX_CONTENT_WIDTH } from "../../src/theme/layout";
import { getBookingStatus } from "../../src/utils/bookingStatus";
import { formatDisplayDate } from "../../src/utils/formatDate";

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
    }, [token]),
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
          {item.bookedBy === "ADMIN" && (
            <Text style={styles.bookedByAdmin}>Booked by clinic</Text>
          )}
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
      contentContainerStyle={
        bookings.length === 0 ? styles.emptyContainer : styles.listContent
      }
      data={bookings}
      keyExtractor={(item) => String(item.bookingId)}
      renderItem={renderItem}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          colors={[colors.primary]}
        />
      }
      ListEmptyComponent={
        <Text style={styles.emptyText}>
          No bookings yet. Book an appointment from the Booking tab.
        </Text>
      }
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  // maxWidth + alignSelf here is the FlatList-specific way to apply the
  // same shared pattern - contentContainerStyle behaves like a normal
  // View's style for centering purposes.
  listContent: {
    padding: 16,
    maxWidth: MAX_CONTENT_WIDTH,
    width: "100%",
    alignSelf: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background,
  },
  emptyText: { color: colors.textDisabled, fontSize: 15, textAlign: "center" },
  errorText: {
    color: colors.error,
    fontSize: 15,
    textAlign: "center",
    paddingHorizontal: 24,
  },
  card: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  beneficiaryName: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  date: { fontSize: 14, color: colors.textSecondary, marginBottom: 8 },
  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  queueLabel: { fontSize: 14, fontWeight: "600", color: colors.primary },
  bookedByAdmin: {
    fontSize: 12,
    color: colors.textDisabled,
    fontStyle: "italic",
  },
});
