# HMG Demo - Aplicación Móvil

Aplicación móvil demo desarrollada con React Native y Expo para HMG.

## Características

- **Autenticación**: Login con usuario y contraseña con validación básica
- **Conectividad Bluetooth**: Búsqueda y selección de dispositivos BLE y Bluetooth clásico
- **Registro de Información**: Formulario con validación de RUC peruano
- **Persistencia Local**: Base de datos SQLite para almacenamiento de registros

## Requisitos Previos

- Node.js 18+
- npm o yarn
- Android Studio (para Android)
- Xcode (para iOS, solo macOS)
- Dispositivo físico (para probar Bluetooth)

## Instalación

1. Instalar dependencias:

```bash
npm install
```

2. Generar el proyecto nativo (requerido para Bluetooth):

```bash
npx expo prebuild
```

## Ejecución

### Development Build (Recomendado para probar Bluetooth)

```bash
# Android
npx expo run:android

# iOS
npx expo run:ios
```

### Expo Go (Sin Bluetooth)

```bash
npx expo start
```

> **Nota**: Bluetooth NO funciona en Expo Go. Se requiere un development build.

## Estructura del Proyecto

```
├── app/                    # Pantallas (Expo Router)
│   ├── _layout.tsx         # Layout raíz
│   ├── index.tsx           # Redirect inicial
│   ├── login.tsx           # Pantalla de login
│   └── (auth)/             # Rutas autenticadas
│       ├── index.tsx       # Home
│       ├── bluetooth.tsx   # Escaneo BT
│       ├── register.tsx    # Registro de clientes
│       └── records.tsx     # Historial
│
├── src/
│   ├── components/ui/      # Componentes UI
│   ├── stores/             # Estado Zustand
│   ├── services/           # Base de datos
│   ├── types/              # TypeScript types
│   └── utils/              # Validadores y constantes
```

## Funcionalidades

### Autenticación

- Login con credenciales locales
- Sesión persistente con SecureStore
- Logout con confirmación

### Bluetooth

- Escaneo de dispositivos BLE
- Escaneo de dispositivos clásicos pareados
- Selección de dispositivo
- Indicador de señal (RSSI)

### Registro de Clientes

- ID autonumérico
- Fecha y hora automática al guardar
- Validación de RUC peruano (algoritmo módulo 11)
- Nombre del cliente

### Historial

- Lista de todos los registros
- Pull-to-refresh
- Eliminar registros

## Validación de RUC

El RUC peruano se valida con las siguientes reglas:

- 11 dígitos exactos
- Prefijos válidos: 10, 15, 17, 20
- Dígito verificador (algoritmo módulo 11)

## Tecnologías

- **React Native** + **Expo SDK 54**
- **Expo Router** - Navegación
- **Zustand** - Estado global
- **expo-sqlite** - Base de datos
- **react-native-ble-plx** - Bluetooth BLE
- **react-native-bluetooth-classic** - Bluetooth clásico
- **TypeScript** - Tipado estático

## Documentación Adicional

Ver [ARCHITECTURE.md](./ARCHITECTURE.md) para detalles de la arquitectura.

## Scripts Disponibles

```bash
npm start          # Iniciar servidor de desarrollo
npm run android    # Ejecutar en Android
npm run ios        # Ejecutar en iOS
npm run lint       # Ejecutar ESLint
```
