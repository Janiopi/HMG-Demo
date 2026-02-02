import { Card } from '@/src/components/ui';
import { deleteRecord, getAllRecords } from '@/src/services/database.service';
import type { ClientRecord } from '@/src/types';
import { COLORS, FONT_SIZES, SPACING } from '@/src/utils/constants';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function RecordsScreen() {
  const [records, setRecords] = useState<ClientRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

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
        <TouchableOpacity
          onPress={() => handleDelete(item)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="trash-outline" size={20} color={COLORS.error} />
        </TouchableOpacity>
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
});
