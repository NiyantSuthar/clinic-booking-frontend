import { useFocusEffect } from "expo-router";
import { useCallback, useContext, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  addHoliday,
  createWalkInBooking,
  downloadTodayPdf,
  getHolidays,
  getTodayBookings,
  removeHoliday,
} from "../src/api/adminApi";
import Logo from "../src/components/Logo";
import { AuthContext } from "../src/context/AuthContext";
import { colors } from "../src/theme/colors";
import { MAX_CONTENT_WIDTH } from "../src/theme/layout";

const PHONE_REGEX = /^[0-9]{10}$/;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export default function AdminHomeScreen() {
  const { token, logout } = useContext(AuthContext);

  const [view, setView] = useState("LIST"); // 'LIST' | 'ADD' | 'HOLIDAYS'

  // ---- Today's list ----
  const [bookings, setBookings] = useState([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [pdfDownloading, setPdfDownloading] = useState(false);

  const loadToday = async () => {
    setListLoading(true);
    setListError(null);
    try {
      const data = await getTodayBookings(token);
      setBookings(data);
    } catch (err) {
      setListError(err.message);
    } finally {
      setListLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadToday();
    setRefreshing(false);
  };

  const handleDownloadPdf = async () => {
    setPdfDownloading(true);
    try {
      await downloadTodayPdf(token);
    } catch (err) {
      Alert.alert("Download failed", err.message);
    } finally {
      setPdfDownloading(false);
    }
  };

  // ---- New Booking form ----
  const [name, setName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [village, setVillage] = useState("");
  const [nameError, setNameError] = useState(null);
  const [phoneError, setPhoneError] = useState(null);
  const [villageError, setVillageError] = useState(null);
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);

  const resetBookingForm = () => {
    setName("");
    setPhoneNumber("");
    setVillage("");
    setNameError(null);
    setPhoneError(null);
    setVillageError(null);
    setFormError(null);
    setSuccessMessage(null);
  };

  const handleSubmitBooking = async () => {
    setNameError(null);
    setPhoneError(null);
    setVillageError(null);
    setFormError(null);
    setSuccessMessage(null);

    const trimmedName = name.trim();
    const trimmedPhone = phoneNumber.trim();
    const trimmedVillage = village.trim();

    let hasError = false;
    if (!trimmedName) {
      setNameError("Name is required.");
      hasError = true;
    }
    if (!PHONE_REGEX.test(trimmedPhone)) {
      setPhoneError("Enter a valid 10-digit phone number.");
      hasError = true;
    }
    if (!trimmedVillage) {
      setVillageError("Village is required.");
      hasError = true;
    }
    if (hasError) return;

    setSubmitting(true);
    try {
      const result = await createWalkInBooking(
        token,
        trimmedName,
        trimmedPhone,
        trimmedVillage,
      );
      if (result.data.status === "SUCCESS") {
        setSuccessMessage(`Booked - Queue #${result.data.queueNumber}`);
        setName("");
        setPhoneNumber("");
        setVillage("");
      } else if (result.data.status === "ALREADY_BOOKED") {
        setFormError("This patient already has a booking for today.");
      } else if (result.data.status === "CAP_REACHED") {
        setFormError("Admin cap reached for today - no more slots available.");
      } else if (result.data.status === "INVALID_DATE") {
        setFormError(
          result.data.message || "Today is not available for booking.",
        );
      }
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // ---- Holidays ----
  const [holidays, setHolidays] = useState([]);
  const [holidaysLoading, setHolidaysLoading] = useState(true);
  const [holidaysError, setHolidaysError] = useState(null);
  const [removingHolidayId, setRemovingHolidayId] = useState(null);

  const [newHolidayDate, setNewHolidayDate] = useState("");
  const [newHolidayReason, setNewHolidayReason] = useState("");
  const [holidayDateError, setHolidayDateError] = useState(null);
  const [holidayFormError, setHolidayFormError] = useState(null);
  const [addingHoliday, setAddingHoliday] = useState(false);

  const loadHolidays = async () => {
    setHolidaysLoading(true);
    setHolidaysError(null);
    try {
      const data = await getHolidays(token);
      setHolidays(data);
    } catch (err) {
      setHolidaysError(err.message);
    } finally {
      setHolidaysLoading(false);
    }
  };

  const handleAddHoliday = async () => {
    setHolidayDateError(null);
    setHolidayFormError(null);

    const trimmedDate = newHolidayDate.trim();
    if (!DATE_REGEX.test(trimmedDate)) {
      setHolidayDateError("Enter a date as YYYY-MM-DD, e.g. 2026-08-29.");
      return;
    }

    setAddingHoliday(true);
    try {
      const created = await addHoliday(
        token,
        trimmedDate,
        newHolidayReason.trim(),
      );
      setHolidays((prev) =>
        [...prev, created].sort((a, b) => a.date.localeCompare(b.date)),
      );
      setNewHolidayDate("");
      setNewHolidayReason("");
    } catch (err) {
      setHolidayFormError(err.message);
    } finally {
      setAddingHoliday(false);
    }
  };

  const handleRemoveHoliday = (holiday) => {
    Alert.alert("Remove holiday", `Reopen booking for ${holiday.date}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          setRemovingHolidayId(holiday.id);
          try {
            await removeHoliday(token, holiday.id);
            setHolidays((prev) => prev.filter((h) => h.id !== holiday.id));
          } catch (err) {
            Alert.alert("Could not remove", err.message);
          } finally {
            setRemovingHolidayId(null);
          }
        },
      },
    ]);
  };

  useFocusEffect(
    useCallback(() => {
      if (view === "LIST") loadToday();
      if (view === "HOLIDAYS") loadHolidays();
    }, [view]),
  );

  const handleSwitchView = (target) => {
    resetBookingForm();
    setView(target);
  };

  const renderBookingItem = ({ item }) => (
    <View style={styles.row}>
      <View style={styles.rowQueueBadge}>
        <Text style={styles.rowQueueNumber}>{item.queueNumber}</Text>
      </View>
      <View style={styles.rowDetails}>
        <Text style={styles.rowName}>{item.name}</Text>
        <Text style={styles.rowPhone}>{item.phoneNumber}</Text>
        {!!item.village && (
          <Text style={styles.rowVillage}>{item.village}</Text>
        )}
      </View>
      <View
        style={[
          styles.bookedByTag,
          item.bookedBy === "ADMIN"
            ? styles.bookedByAdminTag
            : styles.bookedBySelfTag,
        ]}
      >
        <Text
          style={[
            styles.bookedByText,
            item.bookedBy === "ADMIN"
              ? styles.bookedByAdminText
              : styles.bookedBySelfText,
          ]}
        >
          {item.bookedBy === "ADMIN" ? "Admin-booked" : "Self-booked"}
        </Text>
      </View>
    </View>
  );

  const renderHolidayItem = ({ item }) => (
    <View style={styles.holidayRow}>
      <View style={styles.holidayInfo}>
        <Text style={styles.holidayDate}>{item.date}</Text>
        {!!item.reason && (
          <Text style={styles.holidayReason}>{item.reason}</Text>
        )}
      </View>
      <TouchableOpacity
        onPress={() => handleRemoveHoliday(item)}
        disabled={removingHolidayId === item.id}
        style={styles.removeHolidayButton}
      >
        {removingHolidayId === item.id ? (
          <ActivityIndicator color={colors.error} size="small" />
        ) : (
          <Text style={styles.removeHolidayText}>Remove</Text>
        )}
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Logo size={40} style={{ marginBottom: 0 }} />
        <Text style={styles.headerTitle}>Admin Dashboard</Text>
        <TouchableOpacity onPress={logout}>
          <Text style={styles.logoutLink}>Log Out</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.segmentRow}>
        <TouchableOpacity
          style={[
            styles.segmentButton,
            view === "LIST" && styles.segmentButtonActive,
          ]}
          onPress={() => handleSwitchView("LIST")}
        >
          <Text
            style={[
              styles.segmentText,
              view === "LIST" && styles.segmentTextActive,
            ]}
          >
            Today
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.segmentButton,
            view === "ADD" && styles.segmentButtonActive,
          ]}
          onPress={() => handleSwitchView("ADD")}
        >
          <Text
            style={[
              styles.segmentText,
              view === "ADD" && styles.segmentTextActive,
            ]}
          >
            New Booking
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.segmentButton,
            view === "HOLIDAYS" && styles.segmentButtonActive,
          ]}
          onPress={() => handleSwitchView("HOLIDAYS")}
        >
          <Text
            style={[
              styles.segmentText,
              view === "HOLIDAYS" && styles.segmentTextActive,
            ]}
          >
            Holidays
          </Text>
        </TouchableOpacity>
      </View>

      {view === "LIST" && (
        <>
          <TouchableOpacity
            style={[styles.pdfButton, pdfDownloading && styles.buttonDisabled]}
            onPress={handleDownloadPdf}
            disabled={pdfDownloading}
          >
            {pdfDownloading ? (
              <ActivityIndicator color={colors.primary} size="small" />
            ) : (
              <Text style={styles.pdfButtonText}>
                Download Today's List (PDF)
              </Text>
            )}
          </TouchableOpacity>

          {listLoading && !refreshing ? (
            <ActivityIndicator
              color={colors.primary}
              size="large"
              style={{ marginTop: 40 }}
            />
          ) : listError ? (
            <Text style={styles.errorText}>{listError}</Text>
          ) : (
            <FlatList
              data={bookings}
              keyExtractor={(item) => String(item.bookingId)}
              renderItem={renderBookingItem}
              contentContainerStyle={
                bookings.length === 0
                  ? styles.emptyContainer
                  : styles.listContent
              }
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={handleRefresh}
                  colors={[colors.primary]}
                />
              }
              ListEmptyComponent={
                <Text style={styles.emptyText}>No bookings yet today.</Text>
              }
            />
          )}
        </>
      )}

      {view === "ADD" && (
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View style={styles.formContainer}>
            <Text style={styles.label}>Patient Name</Text>
            <TextInput
              style={[styles.input, nameError && styles.inputError]}
              placeholder="Full name"
              value={name}
              onChangeText={(text) => {
                setName(text);
                setNameError(null);
              }}
              editable={!submitting}
            />
            {nameError && (
              <Text style={styles.fieldErrorText}>{nameError}</Text>
            )}

            <Text style={styles.label}>Phone Number</Text>
            <TextInput
              style={[styles.input, phoneError && styles.inputError]}
              placeholder="10-digit phone number"
              keyboardType="phone-pad"
              value={phoneNumber}
              onChangeText={(text) => {
                setPhoneNumber(text);
                setPhoneError(null);
              }}
              editable={!submitting}
            />
            {phoneError && (
              <Text style={styles.fieldErrorText}>{phoneError}</Text>
            )}

            <Text style={styles.label}>Village (Gam)</Text>
            <TextInput
              style={[styles.input, villageError && styles.inputError]}
              placeholder="Patient's village"
              value={village}
              onChangeText={(text) => {
                setVillage(text);
                setVillageError(null);
              }}
              editable={!submitting}
            />
            {villageError && (
              <Text style={styles.fieldErrorText}>{villageError}</Text>
            )}

            {formError && <Text style={styles.errorText}>{formError}</Text>}
            {successMessage && (
              <Text style={styles.successText}>{successMessage}</Text>
            )}

            <TouchableOpacity
              style={[styles.submitButton, submitting && styles.buttonDisabled]}
              onPress={handleSubmitBooking}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitButtonText}>Book Walk-In</Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      )}

      {view === "HOLIDAYS" && (
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          {holidaysLoading ? (
            <ActivityIndicator
              color={colors.primary}
              size="large"
              style={{ marginTop: 40 }}
            />
          ) : holidaysError ? (
            <Text style={styles.errorText}>{holidaysError}</Text>
          ) : (
            <FlatList
              data={holidays}
              keyExtractor={(item) => String(item.id)}
              renderItem={renderHolidayItem}
              contentContainerStyle={styles.holidayListContent}
              ListEmptyComponent={
                <Text style={styles.emptyText}>No holidays marked yet.</Text>
              }
              ListFooterComponent={
                <View style={styles.holidayForm}>
                  <Text style={styles.holidayFormTitle}>
                    Mark a new holiday
                  </Text>

                  <Text style={styles.label}>Date</Text>
                  <TextInput
                    style={[
                      styles.input,
                      holidayDateError && styles.inputError,
                    ]}
                    placeholder="YYYY-MM-DD, e.g. 2026-08-29"
                    placeholderTextColor={colors.textSecondary}
                    value={newHolidayDate}
                    onChangeText={(text) => {
                      setNewHolidayDate(text);
                      setHolidayDateError(null);
                    }}
                    editable={!addingHoliday}
                  />
                  {holidayDateError && (
                    <Text style={styles.fieldErrorText}>
                      {holidayDateError}
                    </Text>
                  )}

                  <Text style={styles.label}>Reason (optional)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. Diwali, Doctor unavailable"
                    placeholderTextColor={colors.textSecondary}
                    value={newHolidayReason}
                    onChangeText={setNewHolidayReason}
                    editable={!addingHoliday}
                  />

                  {holidayFormError && (
                    <Text style={styles.errorText}>{holidayFormError}</Text>
                  )}

                  <TouchableOpacity
                    style={[
                      styles.submitButton,
                      addingHoliday && styles.buttonDisabled,
                    ]}
                    onPress={handleAddHoliday}
                    disabled={addingHoliday}
                  >
                    {addingHoliday ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.submitButtonText}>
                        Mark as Holiday
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              }
            />
          )}
        </KeyboardAvoidingView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: colors.primary,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
    flex: 1,
    marginLeft: 12,
  },
  logoutLink: { color: "#fff", fontSize: 14, fontWeight: "600" },
  segmentRow: {
    flexDirection: "row",
    margin: 16,
    maxWidth: MAX_CONTENT_WIDTH,
    width: "100%",
    alignSelf: "center",
    backgroundColor: colors.surfaceMuted,
    borderRadius: 10,
    padding: 4,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 8,
  },
  segmentButtonActive: { backgroundColor: colors.primary },
  segmentText: { fontSize: 13, fontWeight: "600", color: colors.textSecondary },
  segmentTextActive: { color: "#fff" },

  pdfButton: {
    marginHorizontal: 16,
    marginBottom: 12,
    maxWidth: MAX_CONTENT_WIDTH,
    width: "100%",
    alignSelf: "center",
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
  },
  pdfButtonText: { color: colors.primary, fontSize: 14, fontWeight: "600" },
  buttonDisabled: { opacity: 0.6 },

  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    maxWidth: MAX_CONTENT_WIDTH,
    width: "100%",
    alignSelf: "center",
  },
  emptyContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyText: {
    color: colors.textDisabled,
    fontSize: 15,
    textAlign: "center",
    marginVertical: 16,
  },
  errorText: {
    color: colors.error,
    fontSize: 14,
    textAlign: "center",
    marginTop: 24,
    paddingHorizontal: 24,
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surfaceMuted,
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
  },
  rowQueueBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  rowQueueNumber: { color: "#fff", fontWeight: "700", fontSize: 15 },
  rowDetails: { flex: 1 },
  rowName: { fontSize: 15, fontWeight: "600", color: colors.textPrimary },
  rowPhone: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  rowVillage: { fontSize: 12, color: colors.textDisabled, marginTop: 1 },
  bookedByTag: { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 4 },
  bookedBySelfTag: { backgroundColor: "#d1fae5" },
  bookedByAdminTag: { backgroundColor: "#dbeafe" },
  bookedByText: { fontSize: 11, fontWeight: "600" },
  bookedBySelfText: { color: colors.success },
  bookedByAdminText: { color: colors.primaryDark },

  formContainer: {
    padding: 20,
    maxWidth: MAX_CONTENT_WIDTH,
    width: "100%",
    alignSelf: "center",
  },
  label: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  inputError: { borderColor: colors.borderError },
  fieldErrorText: { color: colors.error, fontSize: 13, marginTop: 4 },
  successText: {
    color: colors.success,
    fontSize: 15,
    fontWeight: "600",
    textAlign: "center",
    marginTop: 16,
  },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 24,
  },
  submitButtonText: { color: "#fff", fontSize: 16, fontWeight: "600" },

  holidayListContent: {
    padding: 16,
    maxWidth: MAX_CONTENT_WIDTH,
    width: "100%",
    alignSelf: "center",
  },
  holidayRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.surfaceMuted,
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
  },
  holidayInfo: { flex: 1 },
  holidayDate: { fontSize: 15, fontWeight: "600", color: colors.textPrimary },
  holidayReason: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  removeHolidayButton: { paddingHorizontal: 10, paddingVertical: 6 },
  removeHolidayText: { color: colors.error, fontSize: 14, fontWeight: "600" },
  holidayForm: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: 10,
    padding: 16,
    marginTop: 12,
  },
  holidayFormTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: 4,
  },
});
