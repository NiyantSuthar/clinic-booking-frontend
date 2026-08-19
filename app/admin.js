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
  createWalkInBooking,
  downloadTodayPdf,
  getTodayBookings,
} from "../src/api/adminApi";
import Logo from "../src/components/Logo";
import { AuthContext } from "../src/context/AuthContext";
import { colors } from "../src/theme/colors";

const PHONE_REGEX = /^[0-9]{10}$/;

export default function AdminHomeScreen() {
  const { token, logout } = useContext(AuthContext);

  const [view, setView] = useState("LIST");

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

  useFocusEffect(
    useCallback(() => {
      if (view === "LIST") loadToday();
    }, [view]),
  );

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

  const [name, setName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [nameError, setNameError] = useState(null);
  const [phoneError, setPhoneError] = useState(null);
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);

  const resetForm = () => {
    setName("");
    setPhoneNumber("");
    setNameError(null);
    setPhoneError(null);
    setFormError(null);
    setSuccessMessage(null);
  };

  const handleSwitchToAdd = () => {
    resetForm();
    setView("ADD");
  };

  const handleSwitchToList = () => {
    resetForm();
    setView("LIST");
  };

  const handleSubmitBooking = async () => {
    setNameError(null);
    setPhoneError(null);
    setFormError(null);
    setSuccessMessage(null);

    const trimmedName = name.trim();
    const trimmedPhone = phoneNumber.trim();

    let hasError = false;
    if (!trimmedName) {
      setNameError("Name is required.");
      hasError = true;
    }
    if (!PHONE_REGEX.test(trimmedPhone)) {
      setPhoneError("Enter a valid 10-digit phone number.");
      hasError = true;
    }
    if (hasError) return;

    setSubmitting(true);
    try {
      const result = await createWalkInBooking(
        token,
        trimmedName,
        trimmedPhone,
      );
      if (result.data.status === "SUCCESS") {
        setSuccessMessage(`Booked - Queue #${result.data.queueNumber}`);
        setName("");
        setPhoneNumber("");
      } else if (result.data.status === "ALREADY_BOOKED") {
        setFormError("This patient already has a booking for today.");
      } else if (result.data.status === "CAP_REACHED") {
        setFormError("Admin cap reached for today - no more slots available.");
      }
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
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
          onPress={handleSwitchToList}
        >
          <Text
            style={[
              styles.segmentText,
              view === "LIST" && styles.segmentTextActive,
            ]}
          >
            Today's List
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.segmentButton,
            view === "ADD" && styles.segmentButtonActive,
          ]}
          onPress={handleSwitchToAdd}
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
      </View>

      {view === "LIST" ? (
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
      ) : (
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
  segmentText: { fontSize: 14, fontWeight: "600", color: colors.textSecondary },
  segmentTextActive: { color: "#fff" },

  pdfButton: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
  },
  pdfButtonText: { color: colors.primary, fontSize: 14, fontWeight: "600" },
  buttonDisabled: { opacity: 0.6 },

  listContent: { paddingHorizontal: 16, paddingBottom: 24 },
  emptyContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyText: { color: colors.textDisabled, fontSize: 15 },
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

  formContainer: { padding: 20 },
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
});
