// ============================================
// App Constants
// ============================================

export const APP_NAME = 'HMG Demo';

// Default demo credentials
export const DEMO_USER = {
  username: 'admin',
  password: 'admin123',
};

// ============================================
// Database Constants
// ============================================

export const DATABASE_NAME = 'hmg_demo.db';

// ============================================
// Bluetooth Constants
// ============================================

export const BLE_SCAN_DURATION_MS = 10000; // 10 seconds
export const CLASSIC_SCAN_DURATION_MS = 12000; // 12 seconds

// ============================================
// RUC Validation Constants
// ============================================

export const RUC_LENGTH = 11;
export const RUC_VALID_PREFIXES = ['10', '15', '17', '20'];

// RUC verification factors for module 11 algorithm
export const RUC_FACTORS = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];

// ============================================
// UI Constants
// ============================================

export const COLORS = {
  primary: '#2563eb',
  primaryDark: '#1d4ed8',
  secondary: '#64748b',
  success: '#22c55e',
  error: '#ef4444',
  warning: '#f59e0b',
  background: '#f8fafc',
  surface: '#ffffff',
  text: '#1e293b',
  textSecondary: '#64748b',
  textLight: '#94a3b8',
  border: '#e2e8f0',
  disabled: '#cbd5e1',
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const FONT_SIZES = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 24,
  xxl: 32,
};

export const BORDER_RADIUS = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
};
