import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Button, Card } from '@/src/components/ui';
import { useAuthStore } from '@/src/stores/auth.store';
import { useBluetoothStore } from '@/src/stores/bluetooth.store';
import { getRecordsCount } from '@/src/services/database.service';
import { COLORS, SPACING, FONT_SIZES } from '@/src/utils/constants';

export default function HomeScreen() {
  const { user, logout } = useAuthStore();
  const { selectedDevice } = useBluetoothStore();
  const [recordsCount, setRecordsCount] = useState(0);

  useEffect(() => {
    loadRecordsCount();
  }, []);

  const loadRecordsCount = async () => {
    try {
      const count = await getRecordsCount();
      setRecordsCount(count);
    } catch (error) {
      console.error('Error loading records count:', error);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro que deseas cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar Sesión',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/login');
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Welcome Card */}
      <Card variant="elevated" style={styles.welcomeCard}>
        <View style={styles.welcomeHeader}>
          <Ionicons name="person-circle" size={48} color={COLORS.primary} />
          <View style={styles.welcomeText}>
            <Text style={styles.welcomeTitle}>Bienvenido</Text>
            <Text style={styles.username}>{user?.username || 'Usuario'}</Text>
          </View>
        </View>
      </Card>

      {/* Stats Cards */}
      <View style={styles.statsRow}>
        <Card style={styles.statCard}>
          <Ionicons name="document-text" size={32} color={COLORS.primary} />
          <Text style={styles.statNumber}>{recordsCount}</Text>
          <Text style={styles.statLabel}>Registros</Text>
        </Card>

        <Card style={styles.statCard}>
          <Ionicons 
            name={selectedDevice ? 'bluetooth-outline' : 'bluetooth'} 
            size={32} 
            color={selectedDevice ? COLORS.success : COLORS.textSecondary} 
          />
          <Text style={styles.statNumber}>{selectedDevice ? '1' : '0'}</Text>
          <Text style={styles.statLabel}>Dispositivo</Text>
        </Card>
      </View>

      {/* Quick Actions */}
      <Text style={styles.sectionTitle}>Acciones Rápidas</Text>

      <Card style={styles.actionCard}>
        <Button
          title="Buscar Dispositivos"
          onPress={() => router.push('/(auth)/bluetooth')}
          variant="outline"
          style={styles.actionButton}
        />
      </Card>

      <Card style={styles.actionCard}>
        <Button
          title="Nuevo Registro"
          onPress={() => router.push('/(auth)/register')}
          style={styles.actionButton}
        />
      </Card>

      <Card style={styles.actionCard}>
        <Button
          title="Ver Historial"
          onPress={() => router.push('/(auth)/records')}
          variant="secondary"
          style={styles.actionButton}
        />
      </Card>

      {/* Logout */}
      <View style={styles.logoutContainer}>
        <Button
          title="Cerrar Sesión"
          onPress={handleLogout}
          variant="danger"
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: SPACING.md,
  },
  welcomeCard: {
    marginBottom: SPACING.md,
  },
  welcomeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  welcomeText: {
    marginLeft: SPACING.md,
  },
  welcomeTitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  username: {
    fontSize: FONT_SIZES.xl,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  statsRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: SPACING.md,
  },
  statNumber: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: SPACING.sm,
  },
  statLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  actionCard: {
    marginBottom: SPACING.sm,
  },
  actionButton: {
    width: '100%',
  },
  logoutContainer: {
    marginTop: SPACING.xl,
    marginBottom: SPACING.xxl,
  },
});
