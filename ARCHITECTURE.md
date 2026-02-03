# HMG Demo - Arquitectura del Proyecto

## Descripcion General

Aplicación móvil demo para HMG que permite:

- Autenticación de usuarios
- Búsqueda y conexión con dispositivos Bluetooth (BLE y Clásico)
- Registro de información de clientes con validación de RUC peruano
- Persistencia local de datos

## Stack Tecnológico

| Categoría     | Tecnología           | Versión | Justificación                                |
| ------------- | -------------------- | ------- | -------------------------------------------- |
| Framework     | Expo SDK             | 54      | Desarrollo rápido, dev-client para nativo    |
| Navegación    | Expo Router          | 6       | File-based routing integrado                 |
| Bluetooth BLE | react-native-ble-plx | ^3.x    | Soporte BLE robusto y bien documentado       |
| Base de datos | expo-sqlite          | ^15.x   | SQLite nativo, rápido y persistente          |
| Estado global | Zustand              | ^5.x    | Ligero, sin boilerplate, TypeScript friendly |
| Formularios   | React Hook Form      | ^7.x    | Performance optimizada                       |
| Validación    | Zod                  | ^3.x    | Schema validation tipado                     |

## Estructura de Carpetas

```
hmg-pruebatecnica/
├── app/                          # Expo Router - Pantallas
│   ├── _layout.tsx               # Layout raíz con providers
│   ├── index.tsx                 # Redirect inicial
│   ├── login.tsx                 # Pantalla de login
│   └── (auth)/                   # Grupo de rutas autenticadas
│       ├── _layout.tsx           # Layout con tabs
│       ├── index.tsx             # Home/Dashboard
│       ├── bluetooth.tsx         # Escaneo Bluetooth
│       ├── register.tsx          # Registro de clientes
│       └── records.tsx           # Lista de registros
│
├── src/                          # Código fuente
│   ├── components/               # Componentes reutilizables
│   │   ├── ui/                   # Componentes UI base
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Card.tsx
│   │   │   └── index.ts
│   │   └── bluetooth/            # Componentes Bluetooth
│   │       ├── DeviceItem.tsx
│   │       └── ScanButton.tsx
│   │
│   ├── stores/                   # Estado global Zustand
│   │   ├── auth.store.ts         # Estado de autenticación
│   │   └── bluetooth.store.ts    # Estado de Bluetooth
│   │
│   ├── services/                 # Lógica de negocio
│   │   ├── database.service.ts   # Operaciones SQLite
│   │   ├── auth.service.ts       # Lógica de auth
│   │   └── bluetooth.service.ts  # Lógica de Bluetooth
│   │
│   ├── hooks/                    # Custom hooks
│   │   ├── useAuth.ts
│   │   ├── useBluetooth.ts
│   │   └── useDatabase.ts
│   │
│   ├── types/                    # TypeScript types
│   │   └── index.ts
│   │
│   └── utils/                    # Utilidades
│       ├── validators.ts         # Validación RUC
│       └── constants.ts          # Constantes
│
├── constants/                    # Constantes del tema (existente)
│   └── theme.ts
│
├── hooks/                        # Hooks existentes de Expo
│   ├── use-color-scheme.ts
│   └── use-theme-color.ts
│
├── components/                   # Componentes existentes de Expo
│   └── ...
│
└── assets/                       # Assets estáticos
    └── images/
```

## Flujo de Navegación

```
┌─────────────────┐
│     index       │ ─────► Redirect basado en auth
└────────┬────────┘
         │
         ▼
┌─────────────────┐     No autenticado
│     login       │ ◄────────────────────┐
└────────┬────────┘                      │
         │ Login exitoso                 │
         ▼                               │
┌─────────────────────────────────────────┐
│            (auth) - Tabs                │
│  ┌──────┬──────────┬─────────┬───────┐ │
│  │ Home │Bluetooth │Register │Records│ │
│  └──────┴──────────┴─────────┴───────┘ │
└─────────────────────────────────────────┘
```

## Esquema de Base de Datos (SQLite)

```sql
-- Tabla de usuarios (credenciales locales)
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de registros de clientes
CREATE TABLE records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ruc TEXT NOT NULL,
    client_name TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Usuario demo inicial
INSERT INTO users (username, password_hash)
VALUES ('admin', 'hashed_admin123');
```

## Validación de RUC Peruano

El RUC (Registro Único de Contribuyente) peruano tiene las siguientes reglas:

1. **Longitud**: Exactamente 11 dígitos
2. **Prefijos válidos**:
   - `10`: Persona natural
   - `15`: Persona jurídica sin fines de lucro
   - `17`: Entidades del estado
   - `20`: Persona jurídica
3. **Dígito verificador**: Último dígito calculado con algoritmo módulo 11

### Algoritmo de Validación

```typescript
function validateRUC(ruc: string): boolean {
  // 1. Verificar longitud
  if (!/^\d{11}$/.test(ruc)) return false;

  // 2. Verificar prefijo válido
  const validPrefixes = ['10', '15', '17', '20'];
  if (!validPrefixes.some((p) => ruc.startsWith(p))) return false;

  // 3. Calcular dígito verificador
  const factors = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
  const digits = ruc.split('').map(Number);

  let sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += digits[i] * factors[i];
  }

  const remainder = sum % 11;
  const checkDigit = 11 - remainder;
  const expected = checkDigit === 10 ? 0 : checkDigit === 11 ? 1 : checkDigit;

  return digits[10] === expected;
}
```

## Módulo Bluetooth

### BLE (Bluetooth Low Energy)

- Usa `react-native-ble-plx`
- Escaneo de dispositivos cercanos
- Mostrar nombre, ID y RSSI
- Selección de dispositivo

### Bluetooth Clásico

- Usa `react-native-bluetooth-classic`
- Escaneo de dispositivos pareados
- Descubrimiento de nuevos dispositivos
- Selección de dispositivo

### Permisos Requeridos (Android)

```xml
<uses-permission android:name="android.permission.BLUETOOTH" />
<uses-permission android:name="android.permission.BLUETOOTH_ADMIN" />
<uses-permission android:name="android.permission.BLUETOOTH_SCAN" />
<uses-permission android:name="android.permission.BLUETOOTH_CONNECT" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
```

## Estados de la Aplicación (Zustand)

### AuthStore

```typescript
interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}
```

### BluetoothStore

```typescript
interface BluetoothState {
  isScanning: boolean;
  bleDevices: BLEDevice[];
  classicDevices: ClassicDevice[];
  selectedDevice: Device | null;
  startBLEScan: () => Promise<void>;
  stopBLEScan: () => void;
  startClassicScan: () => Promise<void>;
  selectDevice: (device: Device) => void;
}
```

## Configuración para Development Build

Para usar Bluetooth real, se requiere un **Expo Development Build**:

```bash
# Instalar expo-dev-client
npx expo install expo-dev-client

# Generar proyecto nativo
npx expo prebuild

# Compilar para Android
npx expo run:android

# O generar APK con EAS
eas build --profile development --platform android
```

## Comandos Útiles

```bash
# Desarrollo
npm start                 # Iniciar servidor de desarrollo
npm run android           # Ejecutar en Android
npm run ios               # Ejecutar en iOS

# Build
npx expo prebuild         # Generar proyectos nativos
npx expo run:android      # Compilar y ejecutar Android
eas build --platform android  # Build en la nube

# Linting
npm run lint              # Ejecutar ESLint
```

## Notas de Implementación

1. **Expo Go vs Dev Build**: Bluetooth NO funciona en Expo Go. Se requiere development build.
2. **Permisos en runtime**: Android 12+ requiere solicitar permisos BLUETOOTH_SCAN y BLUETOOTH_CONNECT en runtime.
3. **iOS**: Requiere configurar `NSBluetoothAlwaysUsageDescription` en Info.plist.
4. **Base de datos**: SQLite se inicializa al primer uso de la app.
