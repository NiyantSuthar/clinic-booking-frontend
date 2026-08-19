import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { getQueueSchedule } from "../api/bookingApi";
import { colors } from "../theme/colors";

/**
 * Client change #2. Collapsed by default so it doesn't clutter the main
 * booking flow - patients who want to know "when should I arrive" can
 * tap to expand it, rather than it always taking up screen space.
 */
export default function QueueScheduleTable({ date }) {
  const [expanded, setExpanded] = useState(false);
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!expanded) return;
    setLoading(true);
    setError(null);
    getQueueSchedule(date)
      .then(setSchedule)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [expanded, date]);

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.toggle}
        onPress={() => setExpanded((prev) => !prev)}
      >
        <Text style={styles.toggleText}>
          {expanded ? "Hide" : "When should I arrive?"}
        </Text>
      </TouchableOpacity>

      {expanded && (
        <View style={styles.table}>
          {loading ? (
            <ActivityIndicator
              color={colors.primary}
              style={{ marginVertical: 12 }}
            />
          ) : error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : (
            <>
              <View style={[styles.row, styles.headerRow]}>
                <Text style={[styles.cell, styles.headerCell]}>Queue No</Text>
                <Text style={[styles.cell, styles.headerCell]}>
                  Arrive Around
                </Text>
              </View>
              {schedule.map((entry, index) => (
                <View key={index} style={styles.row}>
                  <Text style={styles.cell}>{entry.queueRangeLabel}</Text>
                  <Text style={styles.cell}>{entry.timeLabel}</Text>
                </View>
              ))}
            </>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: 12, marginBottom: 8 },
  toggle: { paddingVertical: 8 },
  toggleText: { color: colors.primary, fontSize: 14, fontWeight: "600" },
  table: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    overflow: "hidden",
    marginTop: 8,
  },
  row: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerRow: { backgroundColor: colors.surfaceMuted },
  cell: {
    flex: 1,
    padding: 10,
    fontSize: 13,
    color: colors.textPrimary,
    textAlign: "center",
  },
  headerCell: { fontWeight: "700", color: colors.textSecondary },
  errorText: {
    color: colors.error,
    fontSize: 13,
    padding: 12,
    textAlign: "center",
  },
});
