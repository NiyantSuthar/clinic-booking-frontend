import { Ionicons } from "@expo/vector-icons";
import { useContext, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { addBeneficiary } from "../api/beneficiaryApi";
import { AuthContext } from "../context/AuthContext";
import { colors } from "../theme/colors";

/**
 * Now multi-select: tapping a row toggles a checkbox instead of
 * selecting-and-closing immediately. selectedIds is the current
 * selection lifted up from the parent (booking.js) so it persists if
 * the modal is reopened. onConfirm fires once, with the full array of
 * selected beneficiary objects, when "Done" is tapped.
 */
export default function BeneficiaryPickerModal({
  visible,
  onClose,
  beneficiaries,
  selectedIds,
  onConfirm,
  onBeneficiaryAdded,
}) {
  const { token } = useContext(AuthContext);
  const insets = useSafeAreaInsets();

  const [localSelectedIds, setLocalSelectedIds] = useState(selectedIds || []);

  // Sync local selection whenever the modal opens, so re-opening it
  // reflects whatever was already chosen last time, not a stale/empty set.
  useEffect(() => {
    if (visible) setLocalSelectedIds(selectedIds || []);
  }, [visible]);

  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newRelation, setNewRelation] = useState("");
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState(null);

  const resetAddForm = () => {
    setShowAddForm(false);
    setNewName("");
    setNewRelation("");
    setAddError(null);
  };

  const handleClose = () => {
    resetAddForm();
    onClose();
  };

  const toggleSelection = (id) => {
    setLocalSelectedIds((prev) =>
      prev.includes(id)
        ? prev.filter((existingId) => existingId !== id)
        : [...prev, id],
    );
  };

  const handleAdd = async () => {
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
      onBeneficiaryAdded(created);
      // Newly-added beneficiary is auto-checked too, so it's included when "Done" is tapped.
      setLocalSelectedIds((prev) => [...prev, created.id]);
      resetAddForm();
    } catch (err) {
      setAddError(err.message);
    } finally {
      setAdding(false);
    }
  };

  const handleDone = () => {
    const selected = beneficiaries.filter((b) =>
      localSelectedIds.includes(b.id),
    );
    onConfirm(selected);
    handleClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={[styles.sheet, { paddingBottom: 20 + insets.bottom }]}>
          <View style={styles.headerRow}>
            <Text style={styles.title}>Select beneficiaries</Text>
            <TouchableOpacity
              onPress={handleClose}
              style={styles.closeIconButton}
              hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
            >
              <Ionicons name="close" size={26} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <FlatList
            data={beneficiaries}
            keyExtractor={(item) => String(item.id)}
            style={styles.list}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={
              <Text style={styles.emptyText}>
                No beneficiaries yet - add one below.
              </Text>
            }
            renderItem={({ item }) => {
              const checked = localSelectedIds.includes(item.id);
              return (
                <TouchableOpacity
                  style={styles.row}
                  onPress={() => toggleSelection(item.id)}
                >
                  <Ionicons
                    name={checked ? "checkbox" : "square-outline"}
                    size={22}
                    color={checked ? colors.primary : colors.textDisabled}
                    style={styles.checkbox}
                  />
                  <View style={styles.rowTextGroup}>
                    <Text style={styles.rowName}>{item.name}</Text>
                    {!!item.relation && (
                      <Text style={styles.rowRelation}>{item.relation}</Text>
                    )}
                  </View>
                </TouchableOpacity>
              );
            }}
          />

          {!showAddForm ? (
            <TouchableOpacity
              style={styles.addToggle}
              onPress={() => setShowAddForm(true)}
            >
              <Text style={styles.addToggleText}>+ Add new beneficiary</Text>
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
                  style={styles.cancelButton}
                  onPress={resetAddForm}
                  disabled={adding}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={handleAdd}
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

          <TouchableOpacity
            style={[
              styles.doneButton,
              localSelectedIds.length === 0 && styles.doneButtonDisabled,
            ]}
            onPress={handleDone}
            disabled={localSelectedIds.length === 0}
          >
            <Text style={styles.doneButtonText}>
              {localSelectedIds.length === 0
                ? "Select at least one"
                : `Done (${localSelectedIds.length} selected)`}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 20,
    paddingTop: 20,
    maxHeight: "85%",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  title: { fontSize: 18, fontWeight: "700", color: "#111827" },
  closeIconButton: { padding: 4 },
  list: { flexGrow: 0 },
  emptyText: { color: "#9ca3af", paddingVertical: 16, textAlign: "center" },
  row: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
    flexDirection: "row",
    alignItems: "center",
  },
  checkbox: { marginRight: 12 },
  rowTextGroup: { flex: 1 },
  rowName: { fontSize: 16, color: "#111827" },
  rowRelation: { fontSize: 13, color: "#6b7280" },
  addToggle: { paddingVertical: 14, alignItems: "center" },
  addToggleText: { color: "#2563eb", fontSize: 15, fontWeight: "600" },
  addForm: { marginTop: 8 },
  fieldLabel: { fontSize: 13, color: "#6b7280", marginBottom: 4, marginTop: 8 },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    marginBottom: 6,
  },
  errorText: { color: "#dc2626", fontSize: 13, marginBottom: 8, marginTop: 4 },
  addFormButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
    marginTop: 12,
  },
  cancelButton: { paddingVertical: 10, paddingHorizontal: 16 },
  cancelButtonText: { color: "#6b7280", fontSize: 15 },
  saveButton: {
    backgroundColor: "#2563eb",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  saveButtonText: { color: "#fff", fontSize: 15, fontWeight: "600" },
  doneButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 16,
  },
  doneButtonDisabled: { opacity: 0.5 },
  doneButtonText: { color: "#fff", fontSize: 15, fontWeight: "600" },
});
