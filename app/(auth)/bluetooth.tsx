import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button, Card } from '@/src/components/ui';
import { useBluetoothStore } from '@/src/stores/bluetooth.store';
import { COLORS, SPACING, FONT_SIZES } from '@/src/utils/constants';
import type { BLEDevice, ClassicDevice, BluetoothDevice } from '@/src/types';

export default function BluetoothScreen() {
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

  useEffect(() => {
    checkBLEState();
  }, []);

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
    Alert.alert(
      'Dispositivo Seleccionado',
      `${device.name || 'Dispositivo sin nombre'}\nID: ${device.id}`,
      [{ text: 'OK' }]
    );
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

      {bleDevices.length > 0 ? (
        <View style={styles.deviceList}>
          {bleDevices.map((device) => (
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
          No se encontraron dispositivos BLE
        </Text>
      )}

      {/* Classic Bluetooth Section */}
      <Text style={[styles.sectionTitle, styles.classicSection]}>
        Bluetooth Clásico
      </Text>

      <Button
        title="Buscar Dispositivos Pareados"
        onPress={handleClassicScan}
        variant="secondary"
        disabled={isScanning}
        style={styles.fullButton}
      />

      {classicDevices.length > 0 ? (
        <View style={styles.deviceList}>
          {classicDevices.map((device) => (
            <DeviceItem
              key={device.id}
              name={device.name}
              id={device.address}
              bonded={device.bonded}
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
          No se encontraron dispositivos clásicos
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
  bonded?: boolean;
  type: 'ble' | 'classic';
  isSelected: boolean;
  onPress: () => void;
}

function DeviceItem({ name, id, rssi, bonded, type, isSelected, onPress }: DeviceItemProps) {
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
        {rssi !== undefined && rssi !== null && (
          <Text style={styles.deviceRssi}>Señal: {rssi} dBm</Text>
        )}
        {bonded !== undefined && (
          <Text style={styles.deviceBonded}>
            {bonded ? 'Pareado' : 'No pareado'}
          </Text>
        )}
      </View>
      {isSelected && (
        <Ionicons name="checkmark-circle" size={24} color={COLORS.primary} />
      )}
    </TouchableOpacity>
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
  deviceBonded: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.success,
    marginTop: 2,
  },
  emptyText: {
    textAlign: 'center',
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.sm,
    paddingVertical: SPACING.lg,
  },
});
