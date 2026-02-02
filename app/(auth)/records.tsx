import { Button, Card, Input } from '@/src/components/ui';
import { deleteRecord, getAllRecords, updateRecord } from '@/src/services/database.service';
import type { ClientRecord } from '@/src/types';
import { COLORS, FONT_SIZES, SPACING } from '@/src/utils/constants';
import { getRUCError, getClientNameError } from '@/src/utils/validators';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';

export default function RecordsScreen() {
  const [records, setRecords] = useState<ClientRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Edit modal state
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<ClientRecord | null>(null);
  const [editRuc, setEditRuc] = useState('');
  const [editClientName, setEditClientName] = useState('');
  const [editErrors, setEditErrors] = useState<{ ruc?: string; clientName?: string }>({});
  const [isSaving, setIsSaving] = useState(false);

  const loadRecords = async () => {
    try {
      const data = await getAllRecords();
      setRecords(data);
    } catch (error) {
      console.error('Error loading records:', error);
      Alert.alert('Error', 'No se pudieron cargar los registros');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Reload records when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadRecords();
    }, []),
  );

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadRecords();
  };

  const handleDelete = (record: ClientRecord) => {
    Alert.alert(
      'Eliminar Registro',
      `¿Está seguro de eliminar el registro de ${record.clientName}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteRecord(record.id);
              setRecords((prev) => prev.filter((r) => r.id !== record.id));
              Alert.alert('Eliminado', 'El registro ha sido eliminado');
            } catch (error) {
              console.error('Error deleting record:', error);
              Alert.alert('Error', 'No se pudo eliminar el registro');
            }
          },
        },
      ],
    );
  };

  const handleEdit = (record: ClientRecord) => {
    setEditingRecord(record);
    setEditRuc(record.ruc);
    setEditClientName(record.clientName);
    setEditErrors({});
    setEditModalVisible(true);
  };

  const handleCloseEditModal = () => {
    setEditModalVisible(false);
    setEditingRecord(null);
    setEditRuc('');
    setEditClientName('');
    setEditErrors({});
  };

  const validateEdit = (): boolean => {
    const newErrors: { ruc?: string; clientName?: string } = {};

    const rucError = getRUCError(editRuc);
    if (rucError) {
      newErrors.ruc = rucError;
    }

    const nameError = getClientNameError(editClientName);
    if (nameError) {
      newErrors.clientName = nameError;
    }

    setEditErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveEdit = async () => {
    if (!editingRecord || !validateEdit()) {
      return;
    }

    setIsSaving(true);

    try {
      const updatedRecord = await updateRecord({
        id: editingRecord.id,
        ruc: editRuc.trim(),
        clientName: editClientName.trim(),
      });

      if (updatedRecord) {
        // Update the record in the local state
        setRecords((prev) =>
          prev.map((r) => (r.id === updatedRecord.id ? updatedRecord : r))
        );
        
        handleCloseEditModal();
        Alert.alert('Actualizado', 'El registro ha sido actualizado correctamente');
      } else {
        Alert.alert('Error', 'No se pudo actualizar el registro');
      }
    } catch (error) {
      console.error('Error updating record:', error);
      Alert.alert('Error', 'Ocurrió un error al actualizar el registro');
    } finally {
      setIsSaving(false);
    }
  };

  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString('es-PE', {
        dateStyle: 'medium',
        timeStyle: 'short',
      });
    } catch {
      return dateString;
    }
  };

  const renderItem = ({ item }: { item: ClientRecord }) => (
    <Card style={styles.recordCard}>
      <View style={styles.recordHeader}>
        <View style={styles.idBadge}>
          <Text style={styles.idText}>#{item.id}</Text>
        </View>
        <View style={styles.actionButtons}>
          <TouchableOpacity
            onPress={() => handleEdit(item)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={styles.actionButton}
          >
            <Ionicons name="pencil-outline" size={20} color={COLORS.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleDelete(item)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={styles.actionButton}
          >
            <Ionicons name="trash-outline" size={20} color={COLORS.error} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.recordBody}>
        <View style={styles.recordRow}>
          <Ionicons
            name="business-outline"
            size={16}
            color={COLORS.textSecondary}
          />
          <Text style={styles.recordLabel}>RUC:</Text>
          <Text style={styles.recordValue}>{item.ruc}</Text>
        </View>

        <View style={styles.recordRow}>
          <Ionicons
            name="person-outline"
            size={16}
            color={COLORS.textSecondary}
          />
          <Text style={styles.recordLabel}>Cliente:</Text>
          <Text style={styles.recordValue}>{item.clientName}</Text>
        </View>

        <View style={styles.recordRow}>
          <Ionicons
            name="calendar-outline"
            size={16}
            color={COLORS.textSecondary}
          />
          <Text style={styles.recordLabel}>Fecha:</Text>
          <Text style={styles.recordValue}>{formatDate(item.createdAt)}</Text>
        </View>

        {item.updatedAt !== item.createdAt && (
          <View style={styles.recordRow}>
            <Ionicons
              name="refresh-outline"
              size={16}
              color={COLORS.textSecondary}
            />
            <Text style={styles.recordLabel}>Editado:</Text>
            <Text style={styles.recordValue}>{formatDate(item.updatedAt)}</Text>
          </View>
        )}
      </View>
    </Card>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons
        name="document-text-outline"
        size={64}
        color={COLORS.textLight}
      />
      <Text style={styles.emptyTitle}>Sin Registros</Text>
      <Text style={styles.emptyText}>
        No hay registros guardados.{'\n'}
        Ve a la pestaña Registro para agregar uno.
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header Stats */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Historial de Registros</Text>
        <Text style={styles.headerCount}>
          {records.length} {records.length === 1 ? 'registro' : 'registros'}
        </Text>
      </View>

      {/* Records List */}
      <FlatList
        data={records}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
        ListEmptyComponent={!isLoading ? renderEmpty : null}
        showsVerticalScrollIndicator={false}
      />

      {/* Edit Modal */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={handleCloseEditModal}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Editar Registro</Text>
              <TouchableOpacity onPress={handleCloseEditModal}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              {editingRecord && (
                <View style={styles.modalIdContainer}>
                  <Text style={styles.modalIdLabel}>ID del Registro:</Text>
                  <View style={styles.modalIdBadge}>
                    <Text style={styles.modalIdText}>#{editingRecord.id}</Text>
                  </View>
                </View>
              )}

              <Input
                label="RUC *"
                placeholder="Ingrese el RUC (11 dígitos)"
                value={editRuc}
                onChangeText={(text) => {
                  const numericText = text.replace(/[^0-9]/g, '');
                  setEditRuc(numericText);
                  if (editErrors.ruc) {
                    setEditErrors((prev) => ({ ...prev, ruc: undefined }));
                  }
                }}
                keyboardType="numeric"
                maxLength={11}
                error={editErrors.ruc}
              />

              <Input
                label="Nombre del Cliente *"
                placeholder="Ingrese el nombre del cliente"
                value={editClientName}
                onChangeText={(text) => {
                  setEditClientName(text);
                  if (editErrors.clientName) {
                    setEditErrors((prev) => ({ ...prev, clientName: undefined }));
                  }
                }}
                autoCapitalize="words"
                error={editErrors.clientName}
              />

              <Text style={styles.modalNote}>
                * La fecha de actualización se registrará automáticamente
              </Text>
            </ScrollView>

            <View style={styles.modalActions}>
              <Button
                title="Cancelar"
                onPress={handleCloseEditModal}
                variant="outline"
                style={styles.modalButton}
              />
              <Button
                title="Guardar"
                onPress={handleSaveEdit}
                loading={isSaving}
                style={styles.modalButton}
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text,
  },
  headerCount: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    backgroundColor: COLORS.background,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 12,
  },
  listContent: {
    padding: SPACING.md,
    flexGrow: 1,
  },
  recordCard: {
    marginBottom: SPACING.md,
  },
  recordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
    paddingBottom: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  idBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 8,
  },
  idText: {
    color: COLORS.surface,
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  actionButton: {
    padding: SPACING.xs,
  },
  recordBody: {
    gap: SPACING.sm,
  },
  recordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  recordLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    width: 60,
  },
  recordValue: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
    flex: 1,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.xxl * 2,
  },
  emptyTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginTop: SPACING.md,
  },
  emptyText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textLight,
    textAlign: 'center',
    marginTop: SPACING.sm,
    lineHeight: 20,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '600',
    color: COLORS.text,
  },
  modalContent: {
    padding: SPACING.lg,
  },
  modalIdContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  modalIdLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginRight: SPACING.sm,
  },
  modalIdBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 8,
  },
  modalIdText: {
    color: COLORS.surface,
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
  },
  modalNote: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textLight,
    fontStyle: 'italic',
    marginTop: SPACING.sm,
  },
  modalActions: {
    flexDirection: 'row',
    gap: SPACING.md,
    padding: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  modalButton: {
    flex: 1,
  },
});
