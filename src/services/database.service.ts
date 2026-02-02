import * as Crypto from 'expo-crypto';
import * as SQLite from 'expo-sqlite';
import type {
  ClientRecord,
  CreateRecordInput,
  UpdateRecordInput,
  DatabaseRecord,
  DatabaseUser,
  User,
} from '../types';
import { DATABASE_NAME, DEMO_USER } from '../utils/constants';

// ============================================
// Database Instance
// ============================================

let db: SQLite.SQLiteDatabase | null = null;

/**
 * Gets or creates the database instance
 */
export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!db) {
    db = await SQLite.openDatabaseAsync(DATABASE_NAME);
    await initializeDatabase(db);
  }
  return db;
}

/**
 * Initialize database tables
 */
async function initializeDatabase(
  database: SQLite.SQLiteDatabase,
): Promise<void> {
  // Create users table
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Create records table
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ruc TEXT NOT NULL,
      client_name TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Create demo user if not exists
  await createDemoUserIfNotExists(database);
}

/**
 * Hash a password using SHA-256
 */
export async function hashPassword(password: string): Promise<string> {
  const hash = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    password,
  );
  return hash;
}

/**
 * Create the demo user if it doesn't exist
 */
async function createDemoUserIfNotExists(
  database: SQLite.SQLiteDatabase,
): Promise<void> {
  const existingUser = await database.getFirstAsync<DatabaseUser>(
    'SELECT * FROM users WHERE username = ?',
    [DEMO_USER.username],
  );

  if (!existingUser) {
    const passwordHash = await hashPassword(DEMO_USER.password);
    await database.runAsync(
      'INSERT INTO users (username, password_hash) VALUES (?, ?)',
      [DEMO_USER.username, passwordHash],
    );
    console.log('Demo user created:', DEMO_USER.username);
  }
}

// ============================================
// User Operations
// ============================================

/**
 * Verify user credentials
 */
export async function verifyCredentials(
  username: string,
  password: string,
): Promise<User | null> {
  const database = await getDatabase();
  const passwordHash = await hashPassword(password);

  const user = await database.getFirstAsync<DatabaseUser>(
    'SELECT * FROM users WHERE username = ? AND password_hash = ?',
    [username, passwordHash],
  );

  if (!user) {
    return null;
  }

  return {
    id: user.id,
    username: user.username,
    createdAt: user.created_at,
  };
}

/**
 * Get user by ID
 */
export async function getUserById(id: number): Promise<User | null> {
  const database = await getDatabase();

  const user = await database.getFirstAsync<DatabaseUser>(
    'SELECT * FROM users WHERE id = ?',
    [id],
  );

  if (!user) {
    return null;
  }

  return {
    id: user.id,
    username: user.username,
    createdAt: user.created_at,
  };
}

/**
 * Create a new user
 * @returns User if created successfully, null if username already exists
 */
export async function createUser(
  username: string,
  password: string,
): Promise<User | null> {
  const database = await getDatabase();

  // Check if a user with same username already exists
  const existingUser = await database.getFirstAsync<DatabaseUser>(
    'SELECT id FROM users WHERE username = ?',
    [username],
  );

  if (existingUser) {
    console.log('User already exists:', username);
    return null;
  }

  // Create the new user
  const passwordHash = await hashPassword(password);
  const result = await database.runAsync(
    'INSERT INTO users (username, password_hash) VALUES (?, ?)',
    [username, passwordHash],
  );

  // Fetch the created user
  const newUser = await database.getFirstAsync<DatabaseUser>(
    'SELECT * FROM users WHERE id = ?',
    [result.lastInsertRowId],
  );

  if (!newUser) {
    console.error('Failed to fetch created user');
    return null;
  }

  console.log('User created:', username);
  
  return {
    id: newUser.id,
    username: newUser.username,
    createdAt: newUser.created_at,
  };
}

// ============================================
// Record Operations
// ============================================

/**
 * Create a new client record
 */
export async function createRecord(
  input: CreateRecordInput,
): Promise<ClientRecord> {
  const database = await getDatabase();

  const result = await database.runAsync(
    'INSERT INTO records (ruc, client_name) VALUES (?, ?)',
    [input.ruc, input.clientName],
  );

  const record = await database.getFirstAsync<DatabaseRecord>(
    'SELECT * FROM records WHERE id = ?',
    [result.lastInsertRowId],
  );

  if (!record) {
    throw new Error('Failed to create record');
  }

  return mapDatabaseRecordToClientRecord(record);
}

/**
 * Get all client records
 */
export async function getAllRecords(): Promise<ClientRecord[]> {
  const database = await getDatabase();

  const records = await database.getAllAsync<DatabaseRecord>(
    'SELECT * FROM records ORDER BY created_at DESC',
  );

  return records.map(mapDatabaseRecordToClientRecord);
}

/**
 * Get a single record by ID
 */
export async function getRecordById(id: number): Promise<ClientRecord | null> {
  const database = await getDatabase();

  const record = await database.getFirstAsync<DatabaseRecord>(
    'SELECT * FROM records WHERE id = ?',
    [id],
  );

  if (!record) {
    return null;
  }

  return mapDatabaseRecordToClientRecord(record);
}

/**
 * Delete a record by ID
 */
export async function deleteRecord(id: number): Promise<boolean> {
  const database = await getDatabase();

  const result = await database.runAsync('DELETE FROM records WHERE id = ?', [
    id,
  ]);

  return result.changes > 0;
}

/**
 * Update an existing client record
 */
export async function updateRecord(
  input: UpdateRecordInput,
): Promise<ClientRecord | null> {
  const database = await getDatabase();

  // Update the record and set updated_at to current timestamp
  const result = await database.runAsync(
    'UPDATE records SET ruc = ?, client_name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [input.ruc, input.clientName, input.id],
  );

  if (result.changes === 0) {
    return null; // Record not found
  }

  // Fetch the updated record
  const record = await database.getFirstAsync<DatabaseRecord>(
    'SELECT * FROM records WHERE id = ?',
    [input.id],
  );

  if (!record) {
    return null;
  }

  return mapDatabaseRecordToClientRecord(record);
}

/**
 * Get the count of all records
 */
export async function getRecordsCount(): Promise<number> {
  const database = await getDatabase();

  const result = await database.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM records',
  );

  return result?.count ?? 0;
}

// ============================================
// Helper Functions
// ============================================

/**
 * Map database record to client record
 */
function mapDatabaseRecordToClientRecord(record: DatabaseRecord): ClientRecord {
  return {
    id: record.id,
    ruc: record.ruc,
    clientName: record.client_name,
    createdAt: record.created_at,
    updatedAt: record.updated_at,
  };
}

/**
 * Close the database connection
 */
export async function closeDatabase(): Promise<void> {
  if (db) {
    await db.closeAsync();
    db = null;
  }
}
