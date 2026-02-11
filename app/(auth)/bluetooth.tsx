import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Button, Card } from '@/src/components/ui';
import { useBluetoothStore } from '@/src/stores/bluetooth.store';
import { COLORS, SPACING, FONT_SIZES } from '@/src/utils/constants';
import type { BLEDevice, ClassicDevice, BluetoothDevice } from '@/src/types';

// ============================================
// Helper Functions
// ============================================

/**
 * Convert RSSI value to signal strength (0-4 bars)
 * RSSI typically ranges from -30 (excellent) to -90 (very weak)
 */
function rssiToBars(rssi: number | null | undefined): number {
  if (rssi === null || rssi === undefined) return 0;
  if (rssi > -50) return 4;  // Excellent
  if (rssi > -60) return 3;  // Good
  if (rssi > -70) return 2;  // Fair
  if (rssi > -80) return 1;  // Weak
  return 0;                   // Very weak
}

/**
 * Get signal strength label
 */
function getSignalLabel(bars: number): string {
  switch (bars) {
    case 4: return 'Excelente';
    case 3: return 'Buena';
    case 2: return 'Regular';
    case 1: return 'Débil';
    default: return 'Muy débil';
  }
}

// ============================================
// Main Component
// ============================================

export default function BluetoothScreen() {
  const router = useRouter();
  const {
    isScanning,
    isBLEEnabled,
    bleDevices,
    classicDevices,
    selectedDevice,
    error,
    startBLEScan,
    stopBLEScan,
    startClassicScan,
    selectDevice,
    clearDevices,
    clearError,
    checkBLEState,
  } = useBluetoothStore();

  // Search filter state
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    checkBLEState();
  }, []);

  // Filter and sort BLE devices by signal strength
  const filteredBLEDevices = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    
    // Filter by name or ID
    const filtered = bleDevices.filter(device => {
      if (!query) return true;
      const name = device.name?.toLowerCase() || '';
      const id = device.id.toLowerCase();
      return name.includes(query) || id.includes(query);
    });

    // Sort by RSSI (strongest signal first)
    return [...filtered].sort((a, b) => {
      const rssiA = a.rssi ?? -100;
      const rssiB = b.rssi ?? -100;
      return rssiB - rssiA;
    });
  }, [bleDevices, searchQuery]);

  // Filter and sort Classic devices alphabetically
  const filteredClassicDevices = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    
    // Filter by name or address
    const filtered = classicDevices.filter(device => {
      if (!query) return true;
      const name = device.name?.toLowerCase() || '';
      const address = device.address.toLowerCase();
      return name.includes(query) || address.includes(query);
    });

    // Sort alphabetically by name
    return [...filtered].sort((a, b) => {
      return (a.name || '').localeCompare(b.name || '');
    });
  }, [classicDevices, searchQuery]);

  useEffect(() => {
    if (error) {
      Alert.alert('Bluetooth', error, [
        { text: 'OK', onPress: clearError }
      ]);
    }
  }, [error]);

  const handleBLEScan = async () => {
    if (isScanning) {
      stopBLEScan();
    } else {
      await startBLEScan();
    }
  };

  const handleClassicScan = async () => {
    if (!isScanning) {
      await startClassicScan();
    }
  };

  const handleSelectBLEDevice = (device: BLEDevice) => {
    selectDevice({ type: 'ble', device });
    // Navigate to BLE device explorer screen
    router.push({
      pathname: '/ble-device' as const,
      params: {
        deviceId: device.id,
        deviceName: device.name || 'Dispositivo sin nombre',
      },
    } as any);
  };

  const handleSelectClassicDevice = (device: ClassicDevice) => {
    selectDevice({ type: 'classic', device });
    Alert.alert(
      'Dispositivo Seleccionado',
      `${device.name}\nDirección: ${device.address}`,
      [{ text: 'OK' }]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Status Card */}
      <Card variant="elevated" style={styles.statusCard}>
        <View style={styles.statusRow}>
          <Ionicons 
            name="bluetooth" 
            size={24} 
            color={isBLEEnabled ? COLORS.success : COLORS.error} 
          />
          <Text style={styles.statusText}>
            Bluetooth: {isBLEEnabled ? 'Activado' : 'Desactivado'}
          </Text>
        </View>
        {selectedDevice && (
          <View style={styles.selectedDevice}>
            <Text style={styles.selectedLabel}>Dispositivo seleccionado:</Text>
            <Text style={styles.selectedName}>
              {selectedDevice.type === 'ble' 
                ? (selectedDevice.device.name || selectedDevice.device.id)
                : selectedDevice.device.name
              }
            </Text>
          </View>
        )}
      </Card>

      {/* Search Filter */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={COLORS.textSecondary} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar dispositivo por nombre..."
          placeholderTextColor={COLORS.textLight}
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearSearch}>
            <Ionicons name="close-circle" size={20} color={COLORS.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* BLE Section */}
      <Text style={styles.sectionTitle}>Bluetooth Low Energy (BLE)</Text>
      
      <View style={styles.buttonRow}>
        <Button
          title={isScanning ? 'Detener' : 'Escanear BLE'}
          onPress={handleBLEScan}
          variant={isScanning ? 'danger' : 'primary'}
          style={styles.scanButton}
        />
        <Button
          title="Limpiar"
          onPress={clearDevices}
          variant="outline"
          size="small"
        />
      </View>

      {isScanning && (
        <View style={styles.scanningContainer}>
          <ActivityIndicator size="small" color={COLORS.primary} />
          <Text style={styles.scanningText}>Escaneando dispositivos...</Text>
        </View>
      )}

      {filteredBLEDevices.length > 0 ? (
        <View style={styles.deviceList}>
          {filteredBLEDevices.map((device) => (
            <DeviceItem
              key={device.id}
              name={device.name}
              id={device.id}
              rssi={device.rssi}
              type="ble"
              isSelected={
                selectedDevice?.type === 'ble' && 
                selectedDevice.device.id === device.id
              }
              onPress={() => handleSelectBLEDevice(device)}
            />
          ))}
        </View>
      ) : !isScanning && (
        <Text style={styles.emptyText}>
          {searchQuery ? 'No se encontraron dispositivos con ese nombre' : 'No se encontraron dispositivos BLE'}
        </Text>
      )}

      {/* Classic Bluetooth Section */}
      <Text style={[styles.sectionTitle, styles.classicSection]}>
        Bluetooth Clásico (Pareados)
      </Text>

      <Button
        title="Mostrar Dispositivos Pareados"
        onPress={handleClassicScan}
        variant="secondary"
        disabled={isScanning}
        style={styles.fullButton}
      />

      {filteredClassicDevices.length > 0 ? (
        <View style={styles.deviceList}>
          {filteredClassicDevices.map((device) => (
            <DeviceItem
              key={device.id}
              name={device.name}
              id={device.address}
              type="classic"
              isSelected={
                selectedDevice?.type === 'classic' && 
                selectedDevice.device.id === device.id
              }
              onPress={() => handleSelectClassicDevice(device)}
            />
          ))}
        </View>
      ) : (
        <Text style={styles.emptyText}>
          {searchQuery ? 'No se encontraron dispositivos con ese nombre' : 'No se encontraron dispositivos clásicos'}
        </Text>
      )}
    </ScrollView>
  );
}

// Device Item Component
interface DeviceItemProps {
  name: string | null;
  id: string;
  rssi?: number | null;
  type: 'ble' | 'classic';
  isSelected: boolean;
  onPress: () => void;
}

function DeviceItem({ name, id, rssi, type, isSelected, onPress }: DeviceItemProps) {
  const signalBars = rssiToBars(rssi);
  const signalLabel = getSignalLabel(signalBars);

  return (
    <TouchableOpacity
      style={[styles.deviceItem, isSelected && styles.deviceItemSelected]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.deviceIcon}>
        <Ionicons 
          name={type === 'ble' ? 'bluetooth' : 'radio'} 
          size={24} 
          color={isSelected ? COLORS.primary : COLORS.textSecondary} 
        />
      </View>
      <View style={styles.deviceInfo}>
        <Text style={[styles.deviceName, isSelected && styles.deviceNameSelected]}>
          {name || 'Dispositivo sin nombre'}
        </Text>
        <Text style={styles.deviceId}>{id}</Text>
        {type === 'ble' && rssi !== undefined && rssi !== null && (
          <View style={styles.signalContainer}>
            <SignalBars bars={signalBars} />
            <Text style={styles.signalText}>{signalLabel} ({rssi} dBm)</Text>
          </View>
        )}
      </View>
      {isSelected && (
        <Ionicons name="checkmark-circle" size={24} color={COLORS.primary} />
      )}
    </TouchableOpacity>
  );
}

// Signal Bars Component
interface SignalBarsProps {
  bars: number; // 0-4
}

function SignalBars({ bars }: SignalBarsProps) {
  const barHeights = [6, 10, 14, 18];
  
  return (
    <View style={styles.signalBars}>
      {barHeights.map((height, index) => (
        <View
          key={index}
          style={[
            styles.signalBar,
            { height },
            index < bars ? styles.signalBarActive : styles.signalBarInactive,
          ]}
        />
      ))}
    </View>
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
  statusCard: {
    marginBottom: SPACING.lg,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    marginLeft: SPACING.sm,
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    fontWeight: '500',
  },
  selectedDevice: {
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  selectedLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  selectedName: {
    fontSize: FONT_SIZES.md,
    color: COLORS.primary,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  classicSection: {
    marginTop: SPACING.xl,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  scanButton: {
    flex: 1,
  },
  fullButton: {
    marginBottom: SPACING.md,
  },
  scanningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.md,
  },
  scanningText: {
    marginLeft: SPACING.sm,
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.sm,
  },
  deviceList: {
    gap: SPACING.sm,
  },
  deviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  deviceItemSelected: {
    borderColor: COLORS.primary,
    backgroundColor: '#f0f7ff',
  },
  deviceIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deviceInfo: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  deviceName: {
    fontSize: FONT_SIZES.md,
    fontWeight: '500',
    color: COLORS.text,
  },
  deviceNameSelected: {
    color: COLORS.primary,
  },
  deviceId: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  deviceRssi: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textLight,
    marginTop: 2,
  },
  emptyText: {
    textAlign: 'center',
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.sm,
    paddingVertical: SPACING.lg,
  },
  // Signal indicator styles
  signalContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  signalBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
    marginRight: SPACING.xs,
  },
  signalBar: {
    width: 4,
    borderRadius: 1,
  },
  signalBarActive: {
    backgroundColor: COLORS.success,
  },
  signalBarInactive: {
    backgroundColor: COLORS.border,
  },
  signalText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textLight,
  },
  // Search filter styles
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.lg,
  },
  searchIcon: {
    marginRight: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    height: 44,
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
  },
  clearSearch: {
    padding: SPACING.xs,
  },
});
