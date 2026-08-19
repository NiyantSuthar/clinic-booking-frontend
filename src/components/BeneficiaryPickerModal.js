import React, { useContext, useState } from 'react';
import {
  Modal, View, Text, TouchableOpacity, FlatList,
  TextInput, StyleSheet, ActivityIndicator,
} from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { addBeneficiary } from '../api/beneficiaryApi';

/**
 * No native picker library is installed, so this is a plain Modal + FlatList
 * built by hand - avoids adding a new dependency for what's otherwise a
 * simple "pick one from a list" UI. The inline "add new" form lives at the
 * bottom of the same modal rather than a separate screen, per the prompt's
 * "add new beneficiary inline option."
 */
export default function BeneficiaryPickerModal({
  visible, onClose, beneficiaries, onSelect, onBeneficiaryAdded,
}) {
  const { token } = useContext(AuthContext);

  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newRelation, setNewRelation] = useState('');
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState(null);

  const resetAddForm = () => {
    setShowAddForm(false);
    setNewName('');
    setNewRelation('');
    setAddError(null);
  };

  const handleClose = () => {
    resetAddForm();
    onClose();
  };

  const handleAdd = async () => {
    if (!newName.trim()) {
      setAddError('Name is required.');
      return;
    }
    setAdding(true);
    setAddError(null);
    try {
      const created = await addBeneficiary(token, newName.trim(), newRelation.trim());
      onBeneficiaryAdded(created); // parent refreshes its list
      onSelect(created);           // auto-select the one just created
      resetAddForm();
      onClose();
    } catch (err) {
      setAddError(err.message);
    } finally {
      setAdding(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <Text style={styles.title}>Select beneficiary</Text>

          <FlatList
            data={beneficiaries}
            keyExtractor={(item) => String(item.id)}
            style={styles.list}
            ListEmptyComponent={
              <Text style={styles.emptyText}>No beneficiaries yet - add one below.</Text>
            }
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.row}
                onPress={() => { onSelect(item); handleClose(); }}
              >
                <Text style={styles.rowName}>{item.name}</Text>
                {!!item.relation && <Text style={styles.rowRelation}>{item.relation}</Text>}
              </TouchableOpacity>
            )}
          />

          {!showAddForm ? (
            <TouchableOpacity style={styles.addToggle} onPress={() => setShowAddForm(true)}>
              <Text style={styles.addToggleText}>+ Add new beneficiary</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.addForm}>
              <TextInput
                style={styles.input}
                placeholder="Name"
                value={newName}
                onChangeText={setNewName}
                editable={!adding}
              />
              <TextInput
                style={styles.input}
                placeholder="Relation (optional, e.g. Mother)"
                value={newRelation}
                onChangeText={setNewRelation}
                editable={!adding}
              />
              {addError && <Text style={styles.errorText}>{addError}</Text>}

              <View style={styles.addFormButtons}>
                <TouchableOpacity style={styles.cancelButton} onPress={resetAddForm} disabled={adding}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveButton} onPress={handleAdd} disabled={adding}>
                  {adding
                    ? <ActivityIndicator color="#fff" size="small" />
                    : <Text style={styles.saveButtonText}>Save</Text>}
                </TouchableOpacity>
              </View>
            </View>
          )}

          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 20, maxHeight: '75%' },
  title: { fontSize: 18, fontWeight: '700', marginBottom: 12, color: '#111827' },
  list: { flexGrow: 0 },
  emptyText: { color: '#9ca3af', paddingVertical: 16, textAlign: 'center' },
  row: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rowName: { fontSize: 16, color: '#111827' },
  rowRelation: { fontSize: 13, color: '#6b7280' },
  addToggle: { paddingVertical: 14, alignItems: 'center' },
  addToggleText: { color: '#2563eb', fontSize: 15, fontWeight: '600' },
  addForm: { marginTop: 8 },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    marginBottom: 10,
  },
  errorText: { color: '#dc2626', fontSize: 13, marginBottom: 8 },
  addFormButtons: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12 },
  cancelButton: { paddingVertical: 10, paddingHorizontal: 16 },
  cancelButtonText: { color: '#6b7280', fontSize: 15 },
  saveButton: { backgroundColor: '#2563eb', borderRadius: 8, paddingVertical: 10, paddingHorizontal: 20 },
  saveButtonText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  closeButton: { marginTop: 12, alignItems: 'center', paddingVertical: 8 },
  closeButtonText: { color: '#9ca3af', fontSize: 14 },
});