import { RUC_LENGTH, RUC_VALID_PREFIXES, RUC_FACTORS } from './constants';

/**
 * Validates a Peruvian RUC (Registro Único de Contribuyente)
 * 
 * Rules:
 * - Must be exactly 11 digits
 * - Must start with valid prefix (10, 15, 17, or 20)
 * - Last digit must be valid check digit (mod 11 algorithm)
 * 
 * @param ruc - The RUC string to validate
 * @returns true if valid, false otherwise
 */
export function validateRUC(ruc: string): boolean {
  // Remove any whitespace
  const cleanRuc = ruc.trim();
  
  // Check if it's exactly 11 digits
  if (!/^\d{11}$/.test(cleanRuc)) {
    return false;
  }
  
  // Check if it starts with a valid prefix
  const hasValidPrefix = RUC_VALID_PREFIXES.some(prefix => 
    cleanRuc.startsWith(prefix)
  );
  
  if (!hasValidPrefix) {
    return false;
  }
  
  // Calculate check digit using module 11 algorithm
  const digits = cleanRuc.split('').map(Number);
  
  let sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += digits[i] * RUC_FACTORS[i];
  }
  
  const remainder = sum % 11;
  const checkDigit = 11 - remainder;
  
  // Adjust check digit if necessary
  let expectedDigit: number;
  if (checkDigit === 10) {
    expectedDigit = 0;
  } else if (checkDigit === 11) {
    expectedDigit = 1;
  } else {
    expectedDigit = checkDigit;
  }
  
  return digits[10] === expectedDigit;
}

/**
 * Returns a user-friendly error message for RUC validation
 * 
 * @param ruc - The RUC string to validate
 * @returns Error message or null if valid
 */
export function getRUCError(ruc: string): string | null {
  const cleanRuc = ruc.trim();
  
  if (cleanRuc.length === 0) {
    return 'El RUC es requerido';
  }
  
  if (!/^\d+$/.test(cleanRuc)) {
    return 'El RUC solo debe contener números';
  }
  
  if (cleanRuc.length !== RUC_LENGTH) {
    return `El RUC debe tener exactamente ${RUC_LENGTH} dígitos`;
  }
  
  const hasValidPrefix = RUC_VALID_PREFIXES.some(prefix => 
    cleanRuc.startsWith(prefix)
  );
  
  if (!hasValidPrefix) {
    return 'El RUC debe iniciar con 10, 15, 17 o 20';
  }
  
  if (!validateRUC(cleanRuc)) {
    return 'El RUC ingresado no es válido';
  }
  
  return null;
}

/**
 * Validates username format
 * 
 * @param username - The username to validate
 * @returns true if valid, false otherwise
 */
export function validateUsername(username: string): boolean {
  const clean = username.trim();
  return clean.length >= 3 && clean.length <= 50;
}

/**
 * Validates password format
 * 
 * @param password - The password to validate
 * @returns true if valid, false otherwise
 */
export function validatePassword(password: string): boolean {
  return password.length >= 4;
}

/**
 * Validates client name
 * 
 * @param name - The client name to validate
 * @returns true if valid, false otherwise
 */
export function validateClientName(name: string): boolean {
  const clean = name.trim();
  return clean.length >= 2 && clean.length <= 200;
}

/**
 * Returns a user-friendly error message for client name validation
 * 
 * @param name - The client name to validate
 * @returns Error message or null if valid
 */
export function getClientNameError(name: string): string | null {
  const clean = name.trim();
  
  if (clean.length === 0) {
    return 'El nombre del cliente es requerido';
  }
  
  if (clean.length < 2) {
    return 'El nombre debe tener al menos 2 caracteres';
  }
  
  if (clean.length > 200) {
    return 'El nombre no puede exceder 200 caracteres';
  }
  
  return null;
}
