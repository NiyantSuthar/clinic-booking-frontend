// app/(patient)/profile.js - UPDATED WITH PRIVACY & TERMS SECTION

import { useFocusEffect } from "expo-router";
import { useCallback, useContext, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { getProfile, updateProfile } from "../../src/api/accountApi";
import {
  addBeneficiary,
  listBeneficiaries,
  removeBeneficiary,
} from "../../src/api/beneficiaryApi";
import PrivacyAndTermsSection from "../../src/components/PrivacyAndTermsSection";
import ResponsiveContainer from "../../src/components/ResponsiveContainer";
import { AuthContext } from "../../src/context/AuthContext";
import { colors } from "../../src/theme/colors";

export default function ProfileScreen() {
  const { token, logout } = useContext(AuthContext);

  const [phoneNumber, setPhoneNumber] = useState("");
  const [name, setName] = useState("");
  const [village, setVillage] = useState("");
  const [villageError, setVillageError] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState(null);

  const [beneficiaries, setBeneficiaries] = useState([]);
  const [beneficiariesLoading, setBeneficiariesLoading] = useState(true);
  const [beneficiariesError, setBeneficiariesError] = useState(null);
  const [removingId, setRemovingId] = useState(null);

  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newRelation, setNewRelation] = useState("");
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState(null);

  const loadProfile = async () => {
    setProfileLoading(true);
    setProfileError(null);
    try {
      const data = await getProfile(token);
      setPhoneNumber(data.phoneNumber || "");
      setName(data.name || "");
      setVillage(data.village || "");
    } catch (err) {
      setProfileError(err.message);
    } finally {
      setProfileLoading(false);
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
      loadProfile();
      loadBeneficiaries();
    }, []),
  );

  const handleSaveProfile = async () => {
    setVillageError(null);
    if (!village.trim()) {
      setVillageError("Village is required.");
      return;
    }
    setSaving(true);
    setProfileError(null);
    setSaveMessage(null);
    try {
      await updateProfile(token, {
        name: name.trim(),
        village: village.trim(),
      });
      setSaveMessage("Saved.");
      setTimeout(() => setSaveMessage(null), 2000);
    } catch (err) {
      setProfileError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAddBeneficiary = async () => {
    if (!newName.trim()) {
      setAddError("Name is required.");
      return;
    }
    setAdding(true);
    setAddError(null);
    try {
      const created = await addBeneficiary(
        token,
        newName.trim(),
        newRelation.trim(),
      );
      setBeneficiaries((prev) => [...prev, created]);
      setNewName("");
      setNewRelation("");
      setShowAddForm(false);
    } catch (err) {
      setAddError(err.message);
    } finally {
      setAdding(false);
    }
  };

  const handleRemoveBeneficiary = (beneficiary) => {
    Alert.alert(
      "Remove beneficiary",
      `Remove ${beneficiary.name}? This can't be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            setRemovingId(beneficiary.id);
            try {
              await removeBeneficiary(token, beneficiary.id);
              setBeneficiaries((prev) =>
                prev.filter((b) => b.id !== beneficiary.id),
              );
            } catch (err) {
              Alert.alert("Could not remove", err.message);
            } finally {
              setRemovingId(null);
            }
          },
        },
      ],
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        style={styles.outerScroll}
        keyboardShouldPersistTaps="handled"
      >
        <ResponsiveContainer style={styles.content}>
          <Text style={styles.sectionTitle}>Account</Text>

          <View style={styles.card}>
            <Text style={styles.label}>Phone Number</Text>
            {profileLoading ? (
              <ActivityIndicator
                color={colors.primary}
                style={{ marginTop: 4 }}
              />
            ) : (
              <Text style={styles.readOnlyValue}>{phoneNumber || "N/A"}</Text>
            )}

            {!profileLoading && (
              <>
                <Text style={styles.label}>Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Your name"
                  value={name}
                  onChangeText={setName}
                  editable={!saving}
                />

                <Text style={styles.label}>Village (Gam)</Text>
                <TextInput
                  style={[styles.input, villageError && styles.inputError]}
                  placeholder="Your village"
                  value={village}
                  onChangeText={(text) => {
                    setVillage(text);
                    setVillageError(null);
                  }}
                  editable={!saving}
                />
                {villageError && (
                  <Text style={styles.errorText}>{villageError}</Text>
                )}

                {profileError && (
                  <Text style={styles.errorText}>{profileError}</Text>
                )}
                {saveMessage && (
                  <Text style={styles.successText}>{saveMessage}</Text>
                )}

                <TouchableOpacity
                  style={[styles.saveButton, saving && styles.buttonDisabled]}
                  onPress={handleSaveProfile}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.saveButtonText}>Save</Text>
                  )}
                </TouchableOpacity>
              </>
            )}
          </View>

          <Text style={styles.sectionTitle}>Beneficiaries</Text>

          {beneficiariesLoading ? (
            <ActivityIndicator
              color={colors.primary}
              style={{ marginVertical: 12 }}
            />
          ) : beneficiariesError ? (
            <Text style={styles.errorText}>{beneficiariesError}</Text>
          ) : beneficiaries.length === 0 ? (
            <Text style={styles.emptyText}>No beneficiaries added yet.</Text>
          ) : (
            beneficiaries.map((b) => (
              <View key={b.id} style={styles.beneficiaryCard}>
                <View>
                  <Text style={styles.beneficiaryName}>{b.name}</Text>
                  {!!b.relation && (
                    <Text style={styles.beneficiaryRelation}>{b.relation}</Text>
                  )}
                </View>
                <TouchableOpacity
                  onPress={() => handleRemoveBeneficiary(b)}
                  disabled={removingId === b.id}
                  style={styles.removeButton}
                >
                  {removingId === b.id ? (
                    <ActivityIndicator color={colors.error} size="small" />
                  ) : (
                    <Text style={styles.removeButtonText}>Remove</Text>
                  )}
                </TouchableOpacity>
              </View>
            ))
          )}

          {!showAddForm ? (
            <TouchableOpacity
              style={styles.addToggle}
              onPress={() => setShowAddForm(true)}
            >
              <Text style={styles.addToggleText}>+ Add beneficiary</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.addForm}>
              <Text style={styles.fieldLabel}>Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Beneficiary's name"
                value={newName}
                onChangeText={setNewName}
                editable={!adding}
              />

              <Text style={styles.fieldLabel}>Relation (optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Mother, Friend"
                value={newRelation}
                onChangeText={setNewRelation}
                editable={!adding}
              />

              {addError && <Text style={styles.errorText}>{addError}</Text>}

              <View style={styles.addFormButtons}>
                <TouchableOpacity
                  onPress={() => {
                    setShowAddForm(false);
                    setNewName("");
                    setNewRelation("");
                    setAddError(null);
                  }}
                  disabled={adding}
                >
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.addSaveButton}
                  onPress={handleAddBeneficiary}
                  disabled={adding}
                >
                  {adding ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.saveButtonText}>Save</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* NEW: PRIVACY & TERMS SECTION */}
          <PrivacyAndTermsSection />

          <TouchableOpacity style={styles.logoutButton} onPress={logout}>
            <Text style={styles.logoutText}>Log Out</Text>
          </TouchableOpacity>
        </ResponsiveContainer>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  outerScroll: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, paddingBottom: 48 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.textPrimary,
    marginTop: 20,
    marginBottom: 10,
  },
  card: { backgroundColor: colors.surfaceMuted, borderRadius: 10, padding: 16 },
  label: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 6,
    marginTop: 12,
  },
  readOnlyValue: { fontSize: 16, color: colors.textPrimary, fontWeight: "600" },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    backgroundColor: "#fff",
    color: colors.textPrimary,
  },
  inputError: { borderColor: colors.borderError },
  errorText: { color: colors.error, fontSize: 13, marginTop: 8 },
  successText: { color: colors.success, fontSize: 13, marginTop: 8 },
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 16,
  },
  buttonDisabled: { opacity: 0.6 },
  saveButtonText: { color: "#fff", fontSize: 15, fontWeight: "600" },
  emptyText: { color: colors.textDisabled, fontSize: 14, marginBottom: 8 },
  beneficiaryCard: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  beneficiaryName: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  beneficiaryRelation: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  removeButton: { paddingHorizontal: 10, paddingVertical: 6 },
  removeButtonText: { color: colors.error, fontSize: 14, fontWeight: "600" },
  addToggle: { paddingVertical: 12, alignItems: "center" },
  addToggleText: { color: colors.primary, fontSize: 15, fontWeight: "600" },
  addForm: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: 10,
    padding: 16,
    marginTop: 4,
  },
  fieldLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 4,
    marginTop: 4,
  },
  addFormButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: 16,
    marginTop: 12,
  },
  cancelText: { color: colors.textSecondary, fontSize: 14 },
  addSaveButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 20,
  },
  logoutButton: {
    marginTop: 32,
    backgroundColor: colors.error,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
  },
  logoutText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
