import { useFocusEffect } from "expo-router";
import { useCallback, useContext, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { listBeneficiaries } from "../../src/api/beneficiaryApi";
import { createBooking, getDailyStatus } from "../../src/api/bookingApi";
import BeneficiaryPickerModal from "../../src/components/BeneficiaryPickerModal";
import DatePickerRow from "../../src/components/DatePickerRow";
import QueueScheduleTable from "../../src/components/QueueScheduleTable";
import ResponsiveContainer from "../../src/components/ResponsiveContainer";
import { AuthContext } from "../../src/context/AuthContext";
import { fireLocalBookingConfirmation } from "../../src/notifications/pushNotifications";
import { colors } from "../../src/theme/colors";
import { todayIsoDate } from "../../src/utils/date";
import { formatDisplayDate } from "../../src/utils/formatDate";

const ARRIVAL_WINDOW_TEXT = "9 AM - 12 PM";

export default function BookingScreen() {
  const { token } = useContext(AuthContext);

  const [selectedDate, setSelectedDate] = useState(todayIsoDate());

  const [status, setStatus] = useState(null);
  const [statusLoading, setStatusLoading] = useState(true);
  const [statusError, setStatusError] = useState(null);

  const [beneficiaries, setBeneficiaries] = useState([]);
  const [beneficiariesLoading, setBeneficiariesLoading] = useState(true);
  const [beneficiariesError, setBeneficiariesError] = useState(null);

  // Now an array - multi-select, instead of a single selected beneficiary object.
  const [selectedBeneficiaries, setSelectedBeneficiaries] = useState([]);
  const [pickerVisible, setPickerVisible] = useState(false);

  const [booking, setBooking] = useState(false);
  const [bookingError, setBookingError] = useState(null);
  // Now an array of per-beneficiary outcomes instead of a single result.
  const [bookingResults, setBookingResults] = useState(null);

  const [refreshing, setRefreshing] = useState(false);

  const loadStatus = async (dateToLoad, signal) => {
    setStatusLoading(true);
    setStatusError(null);
    try {
      const data = await getDailyStatus(dateToLoad, signal);
      setStatus(data);
    } catch (err) {
      if (err.name === "AbortError") return;
      setStatusError(err.message);
    } finally {
      if (!signal?.aborted) setStatusLoading(false);
    }
  };

  const loadBeneficiaries = async () => {
    setBeneficiariesLoading(true);
    setBeneficiariesError(null);
    try {
      const data = await listBeneficiaries(token);
      setBeneficiaries(data);
    } catch (err) {
      setBeneficiariesError(err.message);
    } finally {
      setBeneficiariesLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      const controller = new AbortController();
      loadStatus(selectedDate, controller.signal);
      loadBeneficiaries();
      return () => controller.abort();
    }, [selectedDate]),
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadStatus(selectedDate), loadBeneficiaries()]);
    setRefreshing(false);
  };

  const handleSelectDate = (iso) => {
    setSelectedDate(iso);
    setBookingError(null);
  };

  /**
   * Books each selected beneficiary ONE AT A TIME, in order, awaiting
   * each before starting the next - this is what makes their queue
   * numbers land close together (e.g. 5, 6, 7), since each call sees
   * the previous one's already-incremented count. Not a single atomic
   * backend transaction covering all of them - if someone else's
   * booking request happens to land in between two of these calls,
   * the numbers could have a gap. Acceptable given the requirement is
   * "close together," not "guaranteed strictly consecutive."
   */
  const handleBook = async () => {
    if (selectedBeneficiaries.length === 0) {
      setBookingError("Select at least one beneficiary first.");
      return;
    }
    setBooking(true);
    setBookingError(null);

    const results = [];
    for (const beneficiary of selectedBeneficiaries) {
      try {
        const result = await createBooking(token, beneficiary.id, selectedDate);
        if (result.data.status === "SUCCESS") {
          results.push({
            beneficiary,
            status: "SUCCESS",
            queueNumber: result.data.queueNumber,
          });
          fireLocalBookingConfirmation(
            result.data.queueNumber,
            ARRIVAL_WINDOW_TEXT,
          );
        } else if (result.data.status === "ALREADY_BOOKED") {
          results.push({
            beneficiary,
            status: "ALREADY_BOOKED",
            message: `${beneficiary.name} already has a booking for ${formatDisplayDate(selectedDate)}.`,
          });
        } else if (result.data.status === "CAP_REACHED") {
          results.push({
            beneficiary,
            status: "CAP_REACHED",
            message: "Slots became full while booking.",
          });
        } else if (result.data.status === "INVALID_DATE") {
          results.push({
            beneficiary,
            status: "INVALID_DATE",
            message: result.data.message || "That date is not available.",
          });
        } else if (result.data.status === "NOT_FOUND") {
          results.push({
            beneficiary,
            status: "NOT_FOUND",
            message: "Beneficiary could not be found.",
          });
        }
      } catch (err) {
        results.push({ beneficiary, status: "ERROR", message: err.message });
      }
    }

    setBookingResults(results);
    loadStatus(selectedDate);
    setBooking(false);
  };

  const handleBookAnother = () => {
    setBookingResults(null);
    setSelectedBeneficiaries([]);
    setBookingError(null);
  };

  const pickerButtonLabel = () => {
    if (selectedBeneficiaries.length === 0) return "Select beneficiaries";
    if (selectedBeneficiaries.length <= 2)
      return selectedBeneficiaries.map((b) => b.name).join(", ");
    return `${selectedBeneficiaries.length} beneficiaries selected`;
  };

  if (bookingResults) {
    return (
      <ScrollView
        style={styles.resultOuterScroll}
        contentContainerStyle={styles.resultOuter}
      >
        <ResponsiveContainer style={styles.resultContainer}>
          <Text style={styles.resultDate}>
            {formatDisplayDate(selectedDate)}
          </Text>

          {bookingResults.map((r, index) => (
            <View key={index} style={styles.resultRow}>
              <Text style={styles.resultBeneficiaryName}>
                {r.beneficiary.name}
              </Text>
              {r.status === "SUCCESS" ? (
                <>
                  <Text style={styles.resultQueueNumber}>#{r.queueNumber}</Text>
                  <Text style={styles.resultArrival}>
                    Arrive between {ARRIVAL_WINDOW_TEXT}
                  </Text>
                </>
              ) : (
                <Text style={styles.resultErrorText}>{r.message}</Text>
              )}
            </View>
          ))}

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleBookAnother}
          >
            <Text style={styles.primaryButtonText}>
              Book More Beneficiaries
            </Text>
          </TouchableOpacity>
        </ResponsiveContainer>
      </ScrollView>
    );
  }

  return (
    <ScrollView
      style={styles.outerScroll}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          colors={[colors.primary]}
        />
      }
    >
      <ResponsiveContainer style={styles.container}>
        <Text style={styles.title}>Book an Appointment</Text>

        <Text style={styles.label}>Date</Text>
        <DatePickerRow
          selectedDate={selectedDate}
          onSelect={handleSelectDate}
        />

        <QueueScheduleTable date={selectedDate} />

        <View style={styles.statusCard}>
          {statusLoading ? (
            <ActivityIndicator color={colors.primary} />
          ) : statusError ? (
            <Text style={styles.errorText}>{statusError}</Text>
          ) : (
            <>
              <Text style={styles.statusDate}>
                {formatDisplayDate(selectedDate)}
              </Text>
              <Text style={styles.statusCount}>
                {status.patientBookedCount} / {status.patientCap} booked
              </Text>
              {status.patientSlotsFull && (
                <Text style={styles.statusFullText}>
                  Slots full for this date.
                </Text>
              )}
            </>
          )}
        </View>

        <Text style={styles.label}>Beneficiaries</Text>
        {beneficiariesLoading ? (
          <ActivityIndicator
            color={colors.primary}
            style={styles.beneficiaryLoader}
          />
        ) : beneficiariesError ? (
          <Text style={styles.errorText}>{beneficiariesError}</Text>
        ) : (
          <TouchableOpacity
            style={styles.pickerButton}
            onPress={() => setPickerVisible(true)}
          >
            <Text
              style={
                selectedBeneficiaries.length > 0
                  ? styles.pickerButtonText
                  : styles.pickerPlaceholderText
              }
            >
              {pickerButtonLabel()}
            </Text>
          </TouchableOpacity>
        )}

        {bookingError && (
          <Text style={styles.formErrorText}>{bookingError}</Text>
        )}

        <TouchableOpacity
          style={[
            styles.primaryButton,
            (booking || status?.patientSlotsFull) &&
              styles.primaryButtonDisabled,
          ]}
          onPress={handleBook}
          disabled={booking || status?.patientSlotsFull}
        >
          {booking ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.primaryButtonText}>Book</Text>
          )}
        </TouchableOpacity>

        <BeneficiaryPickerModal
          visible={pickerVisible}
          onClose={() => setPickerVisible(false)}
          beneficiaries={beneficiaries}
          selectedIds={selectedBeneficiaries.map((b) => b.id)}
          onConfirm={setSelectedBeneficiaries}
          onBeneficiaryAdded={(created) =>
            setBeneficiaries((prev) => [...prev, created])
          }
        />
      </ResponsiveContainer>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  outerScroll: { flex: 1, backgroundColor: colors.background },
  container: { padding: 24 },
  title: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 16,
    color: colors.textPrimary,
  },
  label: { fontSize: 14, color: colors.textSecondary, marginBottom: 8 },
  statusCard: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: 10,
    padding: 16,
    marginTop: 16,
    marginBottom: 24,
    alignItems: "center",
  },
  statusDate: { fontSize: 13, color: colors.textSecondary, marginBottom: 4 },
  statusCount: { fontSize: 18, fontWeight: "600", color: colors.textPrimary },
  statusFullText: {
    color: colors.error,
    marginTop: 6,
    fontSize: 14,
    fontWeight: "600",
  },
  beneficiaryLoader: { marginVertical: 12 },
  pickerButton: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 8,
  },
  pickerButtonText: { fontSize: 16, color: colors.textPrimary },
  pickerPlaceholderText: { fontSize: 16, color: colors.textDisabled },
  errorText: { color: colors.error, fontSize: 14 },
  formErrorText: {
    color: colors.error,
    fontSize: 14,
    marginTop: 16,
    textAlign: "center",
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: "center",
    marginTop: 24,
    marginBottom: 40,
  },
  primaryButtonDisabled: { opacity: 0.6 },
  primaryButtonText: { color: "#fff", fontSize: 16, fontWeight: "600" },

  resultOuterScroll: { flex: 1, backgroundColor: colors.background },
  resultOuter: { flexGrow: 1, justifyContent: "center", padding: 24 },
  resultContainer: { alignItems: "center" },
  resultDate: { fontSize: 16, color: colors.textSecondary, marginBottom: 20 },
  resultRow: {
    width: "100%",
    backgroundColor: colors.surfaceMuted,
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
    alignItems: "center",
  },
  resultBeneficiaryName: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textPrimary,
    marginBottom: 6,
  },
  resultQueueNumber: { fontSize: 40, fontWeight: "800", color: colors.primary },
  resultArrival: { fontSize: 13, color: colors.textSecondary, marginTop: 4 },
  resultErrorText: { fontSize: 14, color: colors.error, textAlign: "center" },
});
