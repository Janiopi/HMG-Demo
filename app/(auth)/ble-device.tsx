import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Subscription } from 'react-native-ble-plx';
import { Button, Card } from '@/src/components/ui';
import { COLORS, SPACING, FONT_SIZES } from '@/src/utils/constants';
import {
  connectToESP32,
  disconnectFromESP32,
  readCounter,
  readMessage,
  writeMessage,
  subscribeToCounter,
  onDisconnected,
} from '@/src/services/ble.service';

type ConnectionStatus = 'disconnected' | 'connecting' | 'connected';

export default function BLEDeviceScreen() {
  const router = useRouter();
  const { deviceId, deviceName } = useLocalSearchParams<{
    deviceId: string;
    deviceName: string;
  }>();

  // State
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [counterValue, setCounterValue] = useState<string>('--');
  const [isNotifying, setIsNotifying] = useState(false);
  const [messageValue, setMessageValue] = useState<string>('--');
  const [inputMessage, setInputMessage] = useState('');
  const [log, setLog] = useState<string>('Presiona Conectar para iniciar');

  // Refs for subscriptions
  const notifySubRef = useRef<Subscription | null>(null);
  const disconnectSubRef = useRef<Subscription | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      notifySubRef.current?.remove();
      disconnectSubRef.current?.remove();
      if (deviceId) {
        disconnectFromESP32(deviceId);
      }
    };
  }, [deviceId]);

  // ============================================
  // Connection
  // ============================================

  const handleConnect = async () => {
    if (!deviceId) return;

    setStatus('connecting');
    setLog('Conectando...');

    try {
      await connectToESP32(deviceId);
      setStatus('connected');
      setLog('Conectado exitosamente');

      // Listen for unexpected disconnection
      disconnectSubRef.current = onDisconnected(deviceId, () => {
        setStatus('disconnected');
        setIsNotifying(false);
        notifySubRef.current?.remove();
        setLog('Dispositivo desconectado');
      });
    } catch (error: any) {
      setStatus('disconnected');
      setLog(`Error: ${error.message || 'No se pudo conectar'}`);
    }
  };

  const handleDisconnect = async () => {
    if (!deviceId) return;

    setLog('Desconectando...');
    
    // Clean up subscriptions first
    notifySubRef.current?.remove();
    notifySubRef.current = null;
    disconnectSubRef.current?.remove();
    disconnectSubRef.current = null;
    setIsNotifying(false);

    await disconnectFromESP32(deviceId);
    setStatus('disconnected');
    setCounterValue('--');
    setMessageValue('--');
    setLog('Desconectado');
  };

  // ============================================
  // Counter Operations
  // ============================================

  const handleReadCounter = async () => {
    if (!deviceId || status !== 'connected') return;

    setLog('Leyendo contador...');
    try {
      const value = await readCounter(deviceId);
      setCounterValue(value);
      setLog(`Contador leído: ${value}`);
    } catch (error: any) {
      setLog(`Error leyendo contador: ${error.message}`);
    }
  };

  const handleToggleNotify = () => {
    if (!deviceId || status !== 'connected') return;

    if (isNotifying) {
      // Stop notifications
      notifySubRef.current?.remove();
      notifySubRef.current = null;
      setIsNotifying(false);
      setLog('Notificaciones desactivadas');
    } else {
      // Start notifications
      setLog('Activando notificaciones...');
      notifySubRef.current = subscribeToCounter(
        deviceId,
        (value) => {
          setCounterValue(value);
          setLog(`Notificación: contador = ${value}`);
        },
        (error) => {
          setLog(`Error notificación: ${error.message}`);
          setIsNotifying(false);
        }
      );
      setIsNotifying(true);
      setLog('Notificaciones activadas');
    }
  };

  // ============================================
  // Message Operations
  // ============================================

  const handleReadMessage = async () => {
    if (!deviceId || status !== 'connected') return;

    setLog('Leyendo mensaje...');
    try {
      const value = await readMessage(deviceId);
      setMessageValue(value || '(vacío)');
      setLog(`Mensaje leído: "${value}"`);
    } catch (error: any) {
      setLog(`Error leyendo mensaje: ${error.message}`);
    }
  };

  const handleSendMessage = async () => {
    if (!deviceId || status !== 'connected' || !inputMessage.trim()) return;

    const msg = inputMessage.trim();
    setLog(`Enviando: "${msg}"...`);
    
    try {
      await writeMessage(deviceId, msg);
      setLog(`Enviado: "${msg}" ✓`);
      setInputMessage('');
      
      // Auto-read to see the echo
      setTimeout(handleReadMessage, 300);
    } catch (error: any) {
      setLog(`Error enviando: ${error.message}`);
    }
  };

  // ============================================
  // Render
  // ============================================

  const isConnected = status === 'connected';
  const isConnecting = status === 'connecting';

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.title} numberOfLines={1}>
          {deviceName || 'ESP32 Demo'}
        </Text>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Connection Status */}
        <Card style={styles.statusCard}>
          <View style={styles.statusRow}>
            <View style={[
              styles.statusDot,
              isConnected ? styles.dotConnected : 
              isConnecting ? styles.dotConnecting : styles.dotDisconnected
            ]} />
            <Text style={styles.statusText}>
              {isConnecting ? 'Conectando...' : isConnected ? 'Conectado' : 'Desconectado'}
            </Text>
          </View>
          
          <Button
            title={isConnected ? 'Desconectar' : isConnecting ? 'Conectando...' : 'Conectar'}
            onPress={isConnected ? handleDisconnect : handleConnect}
            variant={isConnected ? 'danger' : 'primary'}
            disabled={isConnecting}
            style={styles.connectButton}
          />
        </Card>

        {/* Counter Section */}
        {isConnected && (
          <Card style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Contador</Text>
            <Text style={styles.valueText}>{counterValue}</Text>
            
            <View style={styles.buttonRow}>
              <Button
                title="Leer"
                onPress={handleReadCounter}
                variant="outline"
                size="small"
                style={styles.actionButton}
              />
              <Button
                title={isNotifying ? 'Detener' : 'Notificar'}
                onPress={handleToggleNotify}
                variant={isNotifying ? 'danger' : 'secondary'}
                size="small"
                style={styles.actionButton}
              />
            </View>
          </Card>
        )}

        {/* Message Section */}
        {isConnected && (
          <Card style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Mensaje</Text>
            <Text style={styles.valueText}>"{messageValue}"</Text>
            
            <Button
              title="Leer"
              onPress={handleReadMessage}
              variant="outline"
              size="small"
              style={styles.readButton}
            />

            <View style={styles.inputRow}>
              <TextInput
                style={styles.input}
                value={inputMessage}
                onChangeText={setInputMessage}
                placeholder="Escribe un mensaje..."
                placeholderTextColor={COLORS.textLight}
              />
              <Button
                title="Enviar"
                onPress={handleSendMessage}
                size="small"
                disabled={!inputMessage.trim()}
              />
            </View>
          </Card>
        )}

        {/* Log */}
        <View style={styles.logContainer}>
          <Ionicons name="information-circle-outline" size={16} color={COLORS.textSecondary} />
          <Text style={styles.logText}>{log}</Text>
        </View>
      </ScrollView>
    </View>
  );
}

// ============================================
// Styles
// ============================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    padding: SPACING.xs,
    marginRight: SPACING.sm,
  },
  title: {
    flex: 1,
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: SPACING.md,
  },
  statusCard: {
    marginBottom: SPACING.md,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: SPACING.sm,
  },
  dotConnected: {
    backgroundColor: COLORS.success,
  },
  dotConnecting: {
    backgroundColor: COLORS.warning,
  },
  dotDisconnected: {
    backgroundColor: COLORS.error,
  },
  statusText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    fontWeight: '500',
  },
  connectButton: {
    marginTop: SPACING.xs,
  },
  sectionCard: {
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    marginBottom: SPACING.xs,
  },
  valueText: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: SPACING.md,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  actionButton: {
    flex: 1,
  },
  readButton: {
    marginBottom: SPACING.md,
  },
  inputRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    alignItems: 'center',
  },
  input: {
    flex: 1,
    height: 44,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: SPACING.md,
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    backgroundColor: COLORS.background,
  },
  logContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  logText: {
    flex: 1,
    marginLeft: SPACING.sm,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
});
