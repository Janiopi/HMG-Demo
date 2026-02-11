import { BleManager, Device, Subscription } from 'react-native-ble-plx';
import { Buffer } from 'buffer';

// ============================================
// ESP32 UUIDs (must match Arduino code)
// ============================================

export const ESP32_SERVICE_UUID = '12345678-1234-1234-1234-123456789abc';
export const ESP32_COUNTER_CHAR_UUID = '12345678-1234-1234-1234-123456789001';
export const ESP32_MESSAGE_CHAR_UUID = '12345678-1234-1234-1234-123456789002';

// ============================================
// BLE Manager Singleton
// ============================================

let bleManager: BleManager | null = null;

function getBleManager(): BleManager {
  if (!bleManager) {
    bleManager = new BleManager();
  }
  return bleManager;
}

// ============================================
// Encoding Helpers
// ============================================

function decodeBase64(base64: string | null): string {
  if (!base64) return '';
  try {
    return Buffer.from(base64, 'base64').toString('utf-8');
  } catch {
    return '';
  }
}

function encodeToBase64(text: string): string {
  try {
    return Buffer.from(text, 'utf-8').toString('base64');
  } catch {
    return '';
  }
}

// ============================================
// BLE Functions
// ============================================

/**
 * Connect to ESP32 device
 */
export async function connectToESP32(deviceId: string): Promise<Device> {
  const manager = getBleManager();
  
  const device = await manager.connectToDevice(deviceId, {
    requestMTU: 512,
  });
  
  // Discover services after connection
  await device.discoverAllServicesAndCharacteristics();
  
  return device;
}

/**
 * Disconnect from device (safe, won't throw)
 */
export async function disconnectFromESP32(deviceId: string): Promise<void> {
  try {
    const manager = getBleManager();
    const isConnected = await manager.isDeviceConnected(deviceId);
    if (isConnected) {
      await manager.cancelDeviceConnection(deviceId);
    }
  } catch (error) {
    // Silently ignore disconnect errors
    console.log('Disconnect cleanup:', error);
  }
}

/**
 * Check if device is connected
 */
export async function isConnected(deviceId: string): Promise<boolean> {
  try {
    const manager = getBleManager();
    return await manager.isDeviceConnected(deviceId);
  } catch {
    return false;
  }
}

/**
 * Read counter value from ESP32
 */
export async function readCounter(deviceId: string): Promise<string> {
  const manager = getBleManager();
  
  const characteristic = await manager.readCharacteristicForDevice(
    deviceId,
    ESP32_SERVICE_UUID,
    ESP32_COUNTER_CHAR_UUID
  );
  
  return decodeBase64(characteristic.value);
}

/**
 * Read message value from ESP32
 */
export async function readMessage(deviceId: string): Promise<string> {
  const manager = getBleManager();
  
  const characteristic = await manager.readCharacteristicForDevice(
    deviceId,
    ESP32_SERVICE_UUID,
    ESP32_MESSAGE_CHAR_UUID
  );
  
  return decodeBase64(characteristic.value);
}

/**
 * Write message to ESP32
 */
export async function writeMessage(deviceId: string, message: string): Promise<void> {
  const manager = getBleManager();
  const base64Value = encodeToBase64(message);
  
  await manager.writeCharacteristicWithResponseForDevice(
    deviceId,
    ESP32_SERVICE_UUID,
    ESP32_MESSAGE_CHAR_UUID,
    base64Value
  );
}

/**
 * Subscribe to counter notifications
 */
export function subscribeToCounter(
  deviceId: string,
  onValue: (value: string) => void,
  onError?: (error: Error) => void
): Subscription {
  const manager = getBleManager();
  
  return manager.monitorCharacteristicForDevice(
    deviceId,
    ESP32_SERVICE_UUID,
    ESP32_COUNTER_CHAR_UUID,
    (error, characteristic) => {
      if (error) {
        onError?.(error);
        return;
      }
      if (characteristic?.value) {
        onValue(decodeBase64(characteristic.value));
      }
    }
  );
}

/**
 * Listen for device disconnection
 */
export function onDisconnected(
  deviceId: string,
  callback: () => void
): Subscription {
  const manager = getBleManager();
  return manager.onDeviceDisconnected(deviceId, () => {
    callback();
  });
}
