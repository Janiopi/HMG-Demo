// ============================================
// User Types
// ============================================

export interface User {
  id: number;
  username: string;
  createdAt: string;
}

export interface UserCredentials {
  username: string;
  password: string;
}

// ============================================
// Record Types (Client Registration)
// ============================================

export interface ClientRecord {
  id: number;
  ruc: string;
  clientName: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRecordInput {
  ruc: string;
  clientName: string;
}

export interface UpdateRecordInput {
  id: number;
  ruc: string;
  clientName: string;
}

// ============================================
// Bluetooth Types
// ============================================

export type BluetoothType = 'ble' | 'classic';

export interface BLEDevice {
  id: string;
  name: string | null;
  rssi: number | null;
  isConnectable: boolean | null;
}

export interface ClassicDevice {
  id: string;
  name: string;
  address: string;
  bonded: boolean;
}

export type BluetoothDevice = {
  type: 'ble';
  device: BLEDevice;
} | {
  type: 'classic';
  device: ClassicDevice;
};

// ============================================
// Auth State Types
// ============================================

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
  isInitialized: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  register: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  initialize: () => Promise<void>;
}

// ============================================
// Bluetooth State Types
// ============================================

export interface BluetoothState {
  // State
  isScanning: boolean;
  isBLEEnabled: boolean;
  bleDevices: BLEDevice[];
  classicDevices: ClassicDevice[];
  selectedDevice: BluetoothDevice | null;
  error: string | null;
  
  // Actions
  startBLEScan: () => Promise<void>;
  stopBLEScan: () => void;
  startClassicScan: () => Promise<void>;
  selectDevice: (device: BluetoothDevice) => void;
  clearDevices: () => void;
  clearError: () => void;
  checkBLEState: () => Promise<void>;
}

// ============================================
// Database Types
// ============================================

export interface DatabaseUser {
  id: number;
  username: string;
  password_hash: string;
  created_at: string;
}

export interface DatabaseRecord {
  id: number;
  ruc: string;
  client_name: string;
  created_at: string;
  updated_at: string;
}

// ============================================
// BLE Connection Types
// ============================================

/**
 * Properties of a BLE characteristic
 */
export interface BLECharacteristicProperties {
  read: boolean;
  write: boolean;
  writeWithoutResponse: boolean;
  notify: boolean;
  indicate: boolean;
}

/**
 * BLE Characteristic with its properties and current value
 */
export interface BLECharacteristicInfo {
  uuid: string;
  serviceUUID: string;
  properties: BLECharacteristicProperties;
  value: string | null;
  isNotifying: boolean;
}

/**
 * BLE Service with its characteristics
 */
export interface BLEServiceInfo {
  uuid: string;
  characteristics: BLECharacteristicInfo[];
  isExpanded: boolean;
}

/**
 * Log entry for BLE communication
 */
export interface BLELogEntry {
  id: string;
  timestamp: Date;
  direction: 'in' | 'out' | 'system';
  type: 'connect' | 'disconnect' | 'discover' | 'read' | 'write' | 'notify' | 'error';
  message: string;
  data?: string;
}

/**
 * BLE Connection state for a device
 */
export interface BLEConnectionState {
  deviceId: string | null;
  deviceName: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  isDiscovering: boolean;
  services: BLEServiceInfo[];
  logs: BLELogEntry[];
  error: string | null;
}

/**
 * Known UUIDs for common BLE services
 */
export const KNOWN_SERVICE_UUIDS: Record<string, string> = {
  '00001800-0000-1000-8000-00805f9b34fb': 'Generic Access',
  '00001801-0000-1000-8000-00805f9b34fb': 'Generic Attribute',
  '0000180a-0000-1000-8000-00805f9b34fb': 'Device Information',
  '0000180f-0000-1000-8000-00805f9b34fb': 'Battery Service',
  '0000181a-0000-1000-8000-00805f9b34fb': 'Environmental Sensing',
  '12345678-1234-1234-1234-123456789abc': 'HMG Custom Service',
};

/**
 * Known UUIDs for common BLE characteristics
 */
export const KNOWN_CHARACTERISTIC_UUIDS: Record<string, string> = {
  '00002a00-0000-1000-8000-00805f9b34fb': 'Device Name',
  '00002a01-0000-1000-8000-00805f9b34fb': 'Appearance',
  '00002a19-0000-1000-8000-00805f9b34fb': 'Battery Level',
  '00002a29-0000-1000-8000-00805f9b34fb': 'Manufacturer Name',
  '00002a24-0000-1000-8000-00805f9b34fb': 'Model Number',
  '00002a26-0000-1000-8000-00805f9b34fb': 'Firmware Revision',
  '12345678-1234-1234-1234-123456789001': 'Counter',
  '12345678-1234-1234-1234-123456789002': 'Message',
};

/**
 * ESP32 Demo UUIDs
 */
export const ESP32_DEMO_UUIDS = {
  SERVICE: '12345678-1234-1234-1234-123456789abc',
  COUNTER: '12345678-1234-1234-1234-123456789001',
  MESSAGE: '12345678-1234-1234-1234-123456789002',
};

