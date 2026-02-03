import { create } from 'zustand';
import { BleManager, Device, State } from 'react-native-ble-plx';
import { Platform, PermissionsAndroid } from 'react-native';
import type { BluetoothState, BLEDevice, ClassicDevice, BluetoothDevice } from '../types';
import { BLE_SCAN_DURATION_MS } from '../utils/constants';

// BLE Manager singleton
let bleManager: BleManager | null = null;

function getBleManager(): BleManager {
  if (!bleManager) {
    bleManager = new BleManager();
  }
  return bleManager;
}

// ============================================
// Permission Helpers
// ============================================

async function requestBluetoothPermissions(): Promise<boolean> {
  if (Platform.OS === 'ios') {
    // iOS permissions are handled automatically via Info.plist
    return true;
  }

  if (Platform.OS === 'android') {
    const apiLevel = Platform.Version;

    if (apiLevel >= 31) {
      // Android 12+ requires BLUETOOTH_SCAN and BLUETOOTH_CONNECT
      const results = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      ]);

      return (
        results[PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN] === 'granted' &&
        results[PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT] === 'granted' &&
        results[PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION] === 'granted'
      );
    } else {
      // Android 11 and below
      const result = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
      );
      return result === 'granted';
    }
  }

  return false;
}

// ============================================
// Bluetooth Store
// ============================================

export const useBluetoothStore = create<BluetoothState>((set, get) => ({
  isScanning: false,
  isBLEEnabled: false,
  bleDevices: [],
  classicDevices: [],
  selectedDevice: null,
  error: null,

  /**
   * Check if BLE is enabled
   */
  checkBLEState: async () => {
    try {
      const manager = getBleManager();
      const state = await manager.state();
      set({ isBLEEnabled: state === State.PoweredOn });

      // Listen for state changes
      manager.onStateChange((newState) => {
        set({ isBLEEnabled: newState === State.PoweredOn });
      }, true);
    } catch (error) {
      console.error('Error checking BLE state:', error);
      set({ isBLEEnabled: false });
    }
  },

  /**
   * Start BLE device scan
   */
  startBLEScan: async () => {
    const { isScanning } = get();
    
    if (isScanning) {
      return;
    }

    try {
      // Request permissions
      const hasPermission = await requestBluetoothPermissions();
      
      if (!hasPermission) {
        set({ error: 'Se requieren permisos de Bluetooth y ubicación' });
        return;
      }

      const manager = getBleManager();
      
      // Check BLE state
      const state = await manager.state();
      if (state !== State.PoweredOn) {
        set({ error: 'Bluetooth no está activado' });
        return;
      }

      set({ 
        isScanning: true, 
        bleDevices: [],
        error: null,
      });

      // Track discovered devices to avoid duplicates
      const discoveredIds = new Set<string>();

      // Start scanning
      manager.startDeviceScan(
        null, // Scan for all services
        { allowDuplicates: false },
        (error, device) => {
          if (error) {
            console.error('BLE scan error:', error);
            set({ 
              isScanning: false, 
              error: 'Error durante el escaneo BLE' 
            });
            return;
          }

          if (device && !discoveredIds.has(device.id)) {
            discoveredIds.add(device.id);
            
            const newDevice: BLEDevice = {
              id: device.id,
              name: device.name || device.localName || null,
              rssi: device.rssi,
              isConnectable: device.isConnectable,
            };

            set((state) => ({
              bleDevices: [...state.bleDevices, newDevice],
            }));
          }
        }
      );

      // Auto-stop after duration
      setTimeout(() => {
        get().stopBLEScan();
      }, BLE_SCAN_DURATION_MS);
      
    } catch (error) {
      console.error('BLE scan error:', error);
      set({ 
        isScanning: false, 
        error: 'Error al iniciar el escaneo BLE' 
      });
    }
  },

  /**
   * Stop BLE device scan
   */
  stopBLEScan: () => {
    try {
      const manager = getBleManager();
      manager.stopDeviceScan();
      set({ isScanning: false });
    } catch (error) {
      console.error('Error stopping BLE scan:', error);
    }
  },

  /**
   * Start classic Bluetooth scan
   * Note: This requires react-native-bluetooth-classic which has limited support
   * For demo purposes, we'll show a message or use mock data
   */
  startClassicScan: async () => {
    const { isScanning } = get();
    
    if (isScanning) {
      return;
    }

    try {
      // Request permissions
      const hasPermission = await requestBluetoothPermissions();
      
      if (!hasPermission) {
        set({ error: 'Se requieren permisos de Bluetooth' });
        return;
      }

      set({ 
        isScanning: true, 
        classicDevices: [],
        error: null,
      });

      // Try to use react-native-bluetooth-classic
      try {
        const RNBluetoothClassic = require('react-native-bluetooth-classic').default;
        
        // Check if Bluetooth is enabled
        const isEnabled = await RNBluetoothClassic.isBluetoothEnabled();
        
        if (!isEnabled) {
          set({ 
            isScanning: false,
            error: 'Bluetooth no está activado' 
          });
          return;
        }

        // Get paired/bonded devices
        const pairedDevices = await RNBluetoothClassic.getBondedDevices();
        
        const classicDevices: ClassicDevice[] = pairedDevices.map((device: any) => ({
          id: device.id || device.address,
          name: device.name || 'Dispositivo desconocido',
          address: device.address,
          bonded: true,
        }));

        set({ classicDevices });

        // Try to discover new devices (may not work on all devices)
        try {
          const discoveredDevices = await RNBluetoothClassic.startDiscovery();
          
          const newDevices: ClassicDevice[] = discoveredDevices
            .filter((device: any) => !classicDevices.some(d => d.address === device.address))
            .map((device: any) => ({
              id: device.id || device.address,
              name: device.name || 'Dispositivo desconocido',
              address: device.address,
              bonded: false,
            }));

          set((state) => ({
            classicDevices: [...state.classicDevices, ...newDevices],
          }));
        } catch (discoveryError) {
          console.log('Discovery not supported or failed:', discoveryError);
        }

      } catch (classicError) {
        console.log('Bluetooth Classic not available, showing paired devices only');
        // Fallback: Just show that classic BT is not fully supported
        set({ 
          error: 'Bluetooth clásico: solo dispositivos pareados disponibles' 
        });
      }

      set({ isScanning: false });
      
    } catch (error) {
      console.error('Classic BT scan error:', error);
      set({ 
        isScanning: false, 
        error: 'Error al escanear Bluetooth clásico' 
      });
    }
  },

  /**
   * Select a device
   */
  selectDevice: (device: BluetoothDevice) => {
    set({ selectedDevice: device });
  },

  /**
   * Clear all discovered devices
   */
  clearDevices: () => {
    set({ 
      bleDevices: [], 
      classicDevices: [],
      selectedDevice: null,
    });
  },

  /**
   * Clear error
   */
  clearError: () => {
    set({ error: null });
  },
}));

// Cleanup on app termination
export function destroyBleManager(): void {
  if (bleManager) {
    bleManager.destroy();
    bleManager = null;
  }
}
