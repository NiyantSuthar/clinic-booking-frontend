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

  const [selectedBeneficiary, setSelectedBeneficiary] = useState(null);
  const [pickerVisible, setPickerVisible] = useState(false);

  const [booking, setBooking] = useState(false);
  const [bookingError, setBookingError] = useState(null);
  const [bookingResult, setBookingResult] = useState(null);

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

  const handleBook = async () => {
    if (!selectedBeneficiary) {
      setBookingError("Select a beneficiary first.");
      return;
    }
    setBooking(true);
    setBookingError(null);
    try {
      const result = await createBooking(
        token,
        selectedBeneficiary.id,
        selectedDate,
      );
      if (result.data.status === "SUCCESS") {
        setBookingResult({ queueNumber: result.data.queueNumber });
        loadStatus(selectedDate);
        fireLocalBookingConfirmation(
          result.data.queueNumber,
          ARRIVAL_WINDOW_TEXT,
        );
      } else if (result.data.status === "ALREADY_BOOKED") {
        setBookingError(
          `${selectedBeneficiary.name} already has a booking for ${formatDisplayDate(selectedDate)}.`,
        );
      } else if (result.data.status === "CAP_REACHED") {
        setBookingError("All slots for that date are full.");
        loadStatus(selectedDate);
      } else if (result.data.status === "INVALID_DATE") {
        setBookingError(
          result.data.message || "That date is not available for booking.",
        );
      } else if (result.data.status === "NOT_FOUND") {
        setBookingError(
          "That beneficiary could not be found. Please try again.",
        );
      }
    } catch (err) {
      setBookingError(err.message);
    } finally {
      setBooking(false);
    }
  };

  const handleBookAnother = () => {
    setBookingResult(null);
    setSelectedBeneficiary(null);
    setBookingError(null);
  };

  if (bookingResult) {
    return (
      <View style={styles.resultContainer}>
        <Text style={styles.resultQueueLabel}>You're</Text>
        <Text style={styles.resultQueueNumber}>
          #{bookingResult.queueNumber}
        </Text>
        <Text style={styles.resultArrival}>
          Arrive between {ARRIVAL_WINDOW_TEXT}
        </Text>
        <Text style={styles.resultDate}>{formatDisplayDate(selectedDate)}</Text>
        <Text style={styles.resultBeneficiaryName}>
          Booked for: {selectedBeneficiary?.name}
        </Text>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={handleBookAnother}
        >
          <Text style={styles.primaryButtonText}>Book Another Beneficiary</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          colors={[colors.primary]}
        />
      }
    >
      <Text style={styles.title}>Book an Appointment</Text>

      <Text style={styles.label}>Date</Text>
      <DatePickerRow selectedDate={selectedDate} onSelect={handleSelectDate} />

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

      <Text style={styles.label}>Beneficiary</Text>
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
              selectedBeneficiary
                ? styles.pickerButtonText
                : styles.pickerPlaceholderText
            }
          >
            {selectedBeneficiary
              ? selectedBeneficiary.name
              : "Select a beneficiary"}
          </Text>
        </TouchableOpacity>
      )}

      {bookingError && <Text style={styles.formErrorText}>{bookingError}</Text>}

      <TouchableOpacity
        style={[
          styles.primaryButton,
          (booking || status?.patientSlotsFull) && styles.primaryButtonDisabled,
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
        onSelect={setSelectedBeneficiary}
        onBeneficiaryAdded={(created) =>
          setBeneficiaries((prev) => [...prev, created])
        }
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: 24 },
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

  resultContainer: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  resultQueueLabel: { fontSize: 20, color: colors.textSecondary },
  resultQueueNumber: {
    fontSize: 72,
    fontWeight: "800",
    color: colors.primary,
    marginVertical: 8,
  },
  resultArrival: { fontSize: 18, color: colors.textPrimary, marginBottom: 4 },
  resultDate: { fontSize: 14, color: colors.textSecondary, marginBottom: 4 },
  resultBeneficiaryName: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 32,
  },
});
