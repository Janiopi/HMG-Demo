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
