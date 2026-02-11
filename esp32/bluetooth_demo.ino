/**
 * ESP32 BLE Demo Server
 * 
 * This sketch creates a BLE server that exposes:
 * - Custom Service with:
 *   - Counter characteristic (Read + Notify): Auto-increments every 3 seconds
 *   - Message characteristic (Read + Write): Echo - returns what you write
 * 
 * Instructions:
 * 1. Install ESP32 board in Arduino IDE
 * 2. Select your ESP32 board (e.g., "ESP32 Dev Module")
 * 3. Upload this sketch
 * 4. Open Serial Monitor at 115200 baud to see debug messages
 * 5. Use the HMG Demo app to connect and interact
 * 
 * UUIDs used:
 * - Service:     12345678-1234-1234-1234-123456789abc
 * - Counter:     12345678-1234-1234-1234-123456789001
 * - Message:     12345678-1234-1234-1234-123456789002
 */

#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>

// ============================================
// Configuration
// ============================================

#define DEVICE_NAME "ESP32-HMG-Demo"

// Custom Service UUID
#define SERVICE_UUID        "12345678-1234-1234-1234-123456789abc"

// Characteristic UUIDs
#define COUNTER_CHAR_UUID   "12345678-1234-1234-1234-123456789001"  // Read + Notify
#define MESSAGE_CHAR_UUID   "12345678-1234-1234-1234-123456789002"  // Read + Write

// Timing
#define COUNTER_INTERVAL_MS 3000  // Update counter every 3 seconds

// ============================================
// Global Variables
// ============================================

BLEServer* pServer = NULL;
BLECharacteristic* pCounterCharacteristic = NULL;
BLECharacteristic* pMessageCharacteristic = NULL;

bool deviceConnected = false;
bool oldDeviceConnected = false;

uint32_t counter = 0;
unsigned long lastCounterUpdate = 0;

String currentMessage = "Hello from ESP32!";

// ============================================
// Callbacks
// ============================================

// Server connection callbacks
class MyServerCallbacks : public BLEServerCallbacks {
  void onConnect(BLEServer* pServer) {
    deviceConnected = true;
    Serial.println("[BLE] Device connected");
  }

  void onDisconnect(BLEServer* pServer) {
    deviceConnected = false;
    Serial.println("[BLE] Device disconnected");
  }
};

// Message characteristic callbacks (for Write operations)
class MessageCallbacks : public BLECharacteristicCallbacks {
  void onWrite(BLECharacteristic* pCharacteristic) {
    std::string value = pCharacteristic->getValue();
    
    if (value.length() > 0) {
      currentMessage = String(value.c_str());
      
      Serial.print("[BLE] Message received: ");
      Serial.println(currentMessage);
      
      // Echo back - update the characteristic value so it can be read
      pCharacteristic->setValue(currentMessage.c_str());
    }
  }
  
  void onRead(BLECharacteristic* pCharacteristic) {
    Serial.print("[BLE] Message read: ");
    Serial.println(currentMessage);
  }
};

// Counter characteristic callbacks
class CounterCallbacks : public BLECharacteristicCallbacks {
  void onRead(BLECharacteristic* pCharacteristic) {
    Serial.print("[BLE] Counter read: ");
    Serial.println(counter);
  }
};

// ============================================
// Setup
// ============================================

void setup() {
  Serial.begin(115200);
  Serial.println();
  Serial.println("========================================");
  Serial.println("ESP32 BLE Demo Server");
  Serial.println("========================================");
  
  // Initialize BLE
  Serial.println("[BLE] Initializing...");
  BLEDevice::init(DEVICE_NAME);
  
  // Create BLE Server
  pServer = BLEDevice::createServer();
  pServer->setCallbacks(new MyServerCallbacks());
  
  // Create BLE Service
  BLEService* pService = pServer->createService(SERVICE_UUID);
  
  // ----------------------------------------
  // Create Counter Characteristic (Read + Notify)
  // ----------------------------------------
  pCounterCharacteristic = pService->createCharacteristic(
    COUNTER_CHAR_UUID,
    BLECharacteristic::PROPERTY_READ |
    BLECharacteristic::PROPERTY_NOTIFY
  );
  
  // Add descriptor for notifications (required for Notify to work)
  pCounterCharacteristic->addDescriptor(new BLE2902());
  pCounterCharacteristic->setCallbacks(new CounterCallbacks());
  
  // Set initial value
  String counterStr = String(counter);
  pCounterCharacteristic->setValue(counterStr.c_str());
  
  // ----------------------------------------
  // Create Message Characteristic (Read + Write)
  // ----------------------------------------
  pMessageCharacteristic = pService->createCharacteristic(
    MESSAGE_CHAR_UUID,
    BLECharacteristic::PROPERTY_READ |
    BLECharacteristic::PROPERTY_WRITE
  );
  
  pMessageCharacteristic->setCallbacks(new MessageCallbacks());
  pMessageCharacteristic->setValue(currentMessage.c_str());
  
  // ----------------------------------------
  // Start Service
  // ----------------------------------------
  pService->start();
  
  // ----------------------------------------
  // Start Advertising
  // ----------------------------------------
  BLEAdvertising* pAdvertising = BLEDevice::getAdvertising();
  pAdvertising->addServiceUUID(SERVICE_UUID);
  pAdvertising->setScanResponse(true);
  pAdvertising->setMinPreferred(0x06);  // For iPhone compatibility
  pAdvertising->setMinPreferred(0x12);
  BLEDevice::startAdvertising();
  
  Serial.println("[BLE] Server started!");
  Serial.print("[BLE] Device name: ");
  Serial.println(DEVICE_NAME);
  Serial.println("[BLE] Waiting for connections...");
  Serial.println();
  Serial.println("Service UUID: " + String(SERVICE_UUID));
  Serial.println("Counter UUID: " + String(COUNTER_CHAR_UUID));
  Serial.println("Message UUID: " + String(MESSAGE_CHAR_UUID));
  Serial.println();
}

// ============================================
// Main Loop
// ============================================

void loop() {
  // Update counter every COUNTER_INTERVAL_MS
  unsigned long currentMillis = millis();
  
  if (currentMillis - lastCounterUpdate >= COUNTER_INTERVAL_MS) {
    lastCounterUpdate = currentMillis;
    counter++;
    
    // Update characteristic value
    String counterStr = String(counter);
    pCounterCharacteristic->setValue(counterStr.c_str());
    
    // If connected, send notification
    if (deviceConnected) {
      pCounterCharacteristic->notify();
      Serial.print("[BLE] Counter notification sent: ");
      Serial.println(counter);
    }
  }
  
  // Handle reconnection
  // If disconnected, restart advertising
  if (!deviceConnected && oldDeviceConnected) {
    delay(500);  // Give BLE stack time to get ready
    pServer->startAdvertising();
    Serial.println("[BLE] Advertising restarted");
    oldDeviceConnected = deviceConnected;
  }
  
  // Save connection state
  if (deviceConnected && !oldDeviceConnected) {
    oldDeviceConnected = deviceConnected;
  }
  
  delay(10);  // Small delay to prevent watchdog issues
}
