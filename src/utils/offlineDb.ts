/**
 * IndexedDB Local Database Layer for Davetech POS
 * Multi-Tenant Offline-First Production Engine:
 *  - Strict Tenant-Isolated Databases (davetech_pos_tenant_${tenantId})
 *  - Idempotent Offline Transactions (with deviceId, tenantId, syncStatus)
 *  - Product, Category, and Price Catalogs
 *  - Secure Cashier Offline Auth (SHA-256 hashed PINs with tenant salt - NO plaintext passwords)
 *  - Shifts, Tables, Orders, and Config
 *  - Inventory Movement Ledger & Adjustment Queue
 *  - Device Registration & Storage Diagnostics
 */

import {
  ProductItem,
  ProductCategory,
  CashierUser,
  ShiftRecord,
  PaymentMethod,
  SplitPaymentDetail,
  TableInfo,
  PosDeviceRecord,
} from '../types/pos';

export type OfflineSyncStatus = 'PENDING' | 'SYNCING' | 'SYNCED' | 'FAILED';

export interface OfflineTransactionRecord {
  transactionId: string; // e.g. "OFF-20260903-DEV01-0001" (Unique Idempotency Key)
  offlineSaleId: string; // Explicit offline sale identifier
  orderId: string;
  orderNumber: string;
  tenantId: string; // Tenant isolation key
  businessId: string;
  businessName: string;
  deviceId: string;
  deviceName?: string;
  cashierId: string;
  cashierName: string;
  waiterName?: string;
  shiftId: string;
  createdAt: string;
  items: Array<{
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    modifiersSummary?: string;
    notes?: string;
    isInventory: boolean;
  }>;
  orderType: string;
  tableNumber?: string;
  tableId?: string;
  roomNumber?: string;
  guestName?: string;
  customerName?: string;
  customerPhone?: string;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  discountPercent: number;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  paymentReference?: string;
  paymentBreakdown?: SplitPaymentDetail[];
  amountTendered?: number;
  changeGiven?: number;
  mpesaRef?: string;
  cardLast4?: string;
  isOfflineRecord: boolean;
  sessionId: string;
  syncStatus: OfflineSyncStatus;
  syncedAt?: string;
  retryCount: number;
  errorMessage?: string;
}

export interface InventoryAdjustmentRecord {
  id: string; // e.g. "adj-OFF-20260903-0001-prod-1"
  transactionId: string;
  tenantId: string;
  productId: string;
  productName?: string;
  quantityDelta: number; // e.g. -2
  timestamp: string;
  synced: boolean;
}

const DB_VERSION = 3;

const STORES = {
  TRANSACTIONS: 'offline_transactions',
  PRODUCTS: 'products',
  CATEGORIES: 'categories',
  CASHIERS: 'cashiers',
  CONFIG: 'config',
  SHIFTS: 'shifts',
  INVENTORY_ADJUSTMENTS: 'inventory_adjustments',
  TABLES: 'tables',
  ORDERS: 'orders',
  DEVICES: 'devices',
} as const;

// Cache open database connections per tenant
const dbConnectionMap = new Map<string, Promise<IDBDatabase>>();

/**
 * Get active tenant ID fallback
 */
export function getActiveTenantId(tenantId?: string): string {
  if (tenantId && tenantId.trim()) return tenantId.trim();
  try {
    const saved = localStorage.getItem('davetech_current_biz_id');
    if (saved && saved.trim()) return saved.trim();
  } catch {}
  return 'demo-hotel';
}

/**
 * Compute SHA-256 hash of a PIN using tenant salt to avoid storing plaintext PINs
 */
export async function hashPinWithSalt(pin: string, tenantId: string): Promise<string> {
  if (typeof window === 'undefined' || !window.crypto || !window.crypto.subtle) {
    // Basic deterministic hash fallback for legacy environments
    let hash = 0;
    const str = `${tenantId}:${pin}:davetech_secure`;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return `legacy_${Math.abs(hash).toString(16)}`;
  }

  const enc = new TextEncoder();
  const data = enc.encode(`${tenantId}:${pin}:davetech_pos_secure_2026`);
  const hashBuf = await window.crypto.subtle.digest('SHA-256', data);
  const hashArr = Array.from(new Uint8Array(hashBuf));
  return hashArr.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Open and initialize IndexedDB for a specific tenant.
 * Guarantees strict multi-tenant database isolation.
 */
export function getOfflineDb(tenantId?: string): Promise<IDBDatabase> {
  if (typeof window === 'undefined' || !window.indexedDB) {
    return Promise.reject(new Error('IndexedDB is not supported in this environment'));
  }

  const tid = getActiveTenantId(tenantId);
  const dbName = `davetech_pos_tenant_${tid}`;

  if (dbConnectionMap.has(dbName)) {
    return dbConnectionMap.get(dbName)!;
  }

  const promise = new Promise<IDBDatabase>((resolve, reject) => {
    const request = window.indexedDB.open(dbName, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // 1. Transactions Store
      if (!db.objectStoreNames.contains(STORES.TRANSACTIONS)) {
        const transStore = db.createObjectStore(STORES.TRANSACTIONS, { keyPath: 'transactionId' });
        transStore.createIndex('orderNumber', 'orderNumber', { unique: false });
        transStore.createIndex('syncStatus', 'syncStatus', { unique: false });
        transStore.createIndex('createdAt', 'createdAt', { unique: false });
        transStore.createIndex('cashierId', 'cashierId', { unique: false });
        transStore.createIndex('tenantId', 'tenantId', { unique: false });
        transStore.createIndex('deviceId', 'deviceId', { unique: false });
      }

      // 2. Products Store
      if (!db.objectStoreNames.contains(STORES.PRODUCTS)) {
        const prodStore = db.createObjectStore(STORES.PRODUCTS, { keyPath: 'id' });
        prodStore.createIndex('categoryId', 'categoryId', { unique: false });
        prodStore.createIndex('isAvailable', 'isAvailable', { unique: false });
        prodStore.createIndex('barcode', 'barcode', { unique: false });
      }

      // 3. Categories Store
      if (!db.objectStoreNames.contains(STORES.CATEGORIES)) {
        db.createObjectStore(STORES.CATEGORIES, { keyPath: 'id' });
      }

      // 4. Cashiers Store (Contains hashed PINs, NO plaintext passwords)
      if (!db.objectStoreNames.contains(STORES.CASHIERS)) {
        const cashierStore = db.createObjectStore(STORES.CASHIERS, { keyPath: 'id' });
        cashierStore.createIndex('role', 'role', { unique: false });
        cashierStore.createIndex('pinHash', 'pinHash', { unique: false });
      }

      // 5. Config Store
      if (!db.objectStoreNames.contains(STORES.CONFIG)) {
        db.createObjectStore(STORES.CONFIG, { keyPath: 'key' });
      }

      // 6. Shifts Store
      if (!db.objectStoreNames.contains(STORES.SHIFTS)) {
        const shiftStore = db.createObjectStore(STORES.SHIFTS, { keyPath: 'id' });
        shiftStore.createIndex('cashierId', 'cashierId', { unique: false });
        shiftStore.createIndex('status', 'status', { unique: false });
      }

      // 7. Inventory Adjustments Store
      if (!db.objectStoreNames.contains(STORES.INVENTORY_ADJUSTMENTS)) {
        const invStore = db.createObjectStore(STORES.INVENTORY_ADJUSTMENTS, { keyPath: 'id' });
        invStore.createIndex('transactionId', 'transactionId', { unique: false });
        invStore.createIndex('productId', 'productId', { unique: false });
        invStore.createIndex('synced', 'synced', { unique: false });
      }

      // 8. Tables Store
      if (!db.objectStoreNames.contains(STORES.TABLES)) {
        db.createObjectStore(STORES.TABLES, { keyPath: 'id' });
      }

      // 9. Orders Store
      if (!db.objectStoreNames.contains(STORES.ORDERS)) {
        db.createObjectStore(STORES.ORDERS, { keyPath: 'id' });
      }

      // 10. Devices Store
      if (!db.objectStoreNames.contains(STORES.DEVICES)) {
        db.createObjectStore(STORES.DEVICES, { keyPath: 'deviceId' });
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      dbConnectionMap.delete(dbName);
      reject(request.error || new Error(`Failed to open IndexedDB for tenant ${tid}`));
    };
  });

  dbConnectionMap.set(dbName, promise);
  return promise;
}

/**
 * Close connection for a tenant
 */
export function closeTenantDb(tenantId?: string): void {
  const tid = getActiveTenantId(tenantId);
  const dbName = `davetech_pos_tenant_${tid}`;
  if (dbConnectionMap.has(dbName)) {
    dbConnectionMap.get(dbName)!.then((db) => {
      try {
        db.close();
      } catch {}
    });
    dbConnectionMap.delete(dbName);
  }
}

// ----------------------------------------------------
// TRANSACTION OPERATIONS (Idempotent Offline Records)
// ----------------------------------------------------

/**
 * Save an offline sale record into IndexedDB under the tenant's partition
 */
export async function saveOfflineTransaction(
  record: OfflineTransactionRecord,
  tenantId?: string
): Promise<void> {
  const tid = tenantId || record.tenantId || record.businessId;
  try {
    const db = await getOfflineDb(tid);
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.TRANSACTIONS, 'readwrite');
      const store = tx.objectStore(STORES.TRANSACTIONS);
      const request = store.put(record);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('[IndexedDB] saveOfflineTransaction fallback to localStorage:', err);
    try {
      const key = `davetech_${tid}_tx_${record.transactionId}`;
      localStorage.setItem(key, JSON.stringify(record));
    } catch {}
  }
}

/**
 * Get all offline transactions for the specified tenant
 */
export async function getAllOfflineTransactions(
  tenantId?: string
): Promise<OfflineTransactionRecord[]> {
  const tid = getActiveTenantId(tenantId);
  try {
    const db = await getOfflineDb(tid);
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.TRANSACTIONS, 'readonly');
      const store = tx.objectStore(STORES.TRANSACTIONS);
      const request = store.getAll();

      request.onsuccess = () => {
        const records = (request.result || []) as OfflineTransactionRecord[];
        records.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        resolve(records);
      };
      request.onerror = () => reject(request.error);
    });
  } catch {
    return [];
  }
}

/**
 * Get only pending/failed transactions ready for synchronization for a tenant
 */
export async function getPendingOfflineTransactions(
  tenantId?: string
): Promise<OfflineTransactionRecord[]> {
  const all = await getAllOfflineTransactions(tenantId);
  return all.filter((tx) => tx.syncStatus === 'PENDING' || tx.syncStatus === 'FAILED');
}

/**
 * Update transaction sync status (atomic update in tenant DB)
 */
export async function updateTransactionSyncStatus(
  transactionId: string,
  syncStatus: OfflineSyncStatus,
  tenantId?: string,
  errorMessage?: string
): Promise<void> {
  const tid = getActiveTenantId(tenantId);
  try {
    const db = await getOfflineDb(tid);
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.TRANSACTIONS, 'readwrite');
      const store = tx.objectStore(STORES.TRANSACTIONS);
      const getReq = store.get(transactionId);

      getReq.onsuccess = () => {
        const record = getReq.result as OfflineTransactionRecord | undefined;
        if (record) {
          record.syncStatus = syncStatus;
          if (syncStatus === 'SYNCED') {
            record.syncedAt = new Date().toISOString();
            record.errorMessage = undefined;
          } else if (syncStatus === 'FAILED') {
            record.retryCount = (record.retryCount || 0) + 1;
            record.errorMessage = errorMessage || 'Sync network error';
          }
          store.put(record);
        }
        resolve();
      };
      getReq.onerror = () => reject(getReq.error);
    });
  } catch (err) {
    console.warn('[IndexedDB] updateTransactionSyncStatus error:', err);
  }
}

// ----------------------------------------------------
// PRODUCT & CATEGORY CACHING (Tenant Isolated)
// ----------------------------------------------------

export async function cacheProductsToDb(
  products: ProductItem[],
  tenantId?: string
): Promise<void> {
  const tid = getActiveTenantId(tenantId);
  try {
    const db = await getOfflineDb(tid);
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.PRODUCTS, 'readwrite');
      const store = tx.objectStore(STORES.PRODUCTS);
      store.clear();
      products.forEach((p) => store.put(p));
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('[IndexedDB] cacheProductsToDb fallback:', err);
    try {
      localStorage.setItem(`davetech_cached_products_${tid}`, JSON.stringify(products));
    } catch {}
  }
}

export async function getCachedProductsFromDb(tenantId?: string): Promise<ProductItem[]> {
  const tid = getActiveTenantId(tenantId);
  try {
    const db = await getOfflineDb(tid);
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.PRODUCTS, 'readonly');
      const store = tx.objectStore(STORES.PRODUCTS);
      const req = store.getAll();
      req.onsuccess = () => resolve((req.result || []) as ProductItem[]);
      req.onerror = () => reject(req.error);
    });
  } catch {
    try {
      const saved = localStorage.getItem(`davetech_cached_products_${tid}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  }
}

/**
 * Clear offline products for tenant and record clearance to prevent old demo products from returning
 */
export async function clearTenantOfflineProducts(tenantId?: string): Promise<void> {
  const tid = getActiveTenantId(tenantId);
  try {
    const db = await getOfflineDb(tid);
    const tx = db.transaction([STORES.PRODUCTS, STORES.CONFIG], 'readwrite');
    tx.objectStore(STORES.PRODUCTS).clear();
    tx.objectStore(STORES.CONFIG).put({
      key: 'demoProductsRemoved',
      data: true,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.warn('[IndexedDB] clearTenantOfflineProducts error:', err);
  }
  try {
    localStorage.setItem(`davetech_cleared_products_${tid}`, 'true');
    localStorage.removeItem(`davetech_products_${tid}`);
    localStorage.removeItem(`davetech_cached_products_${tid}`);
  } catch {}
}

export async function cacheCategoriesToDb(
  categories: ProductCategory[],
  tenantId?: string
): Promise<void> {
  const tid = getActiveTenantId(tenantId);
  try {
    const db = await getOfflineDb(tid);
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.CATEGORIES, 'readwrite');
      const store = tx.objectStore(STORES.CATEGORIES);
      store.clear();
      categories.forEach((c) => store.put(c));
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('[IndexedDB] cacheCategoriesToDb fallback:', err);
  }
}

export async function getCachedCategoriesFromDb(
  tenantId?: string
): Promise<ProductCategory[]> {
  const tid = getActiveTenantId(tenantId);
  try {
    const db = await getOfflineDb(tid);
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.CATEGORIES, 'readonly');
      const store = tx.objectStore(STORES.CATEGORIES);
      const req = store.getAll();
      req.onsuccess = () => resolve((req.result || []) as ProductCategory[]);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return [];
  }
}

// ----------------------------------------------------
// CASHIER PROFILES & SECURE OFFLINE AUTH
// (NO Plaintext Passwords / Cryptographic PIN Hashes)
// ----------------------------------------------------

export async function cacheCashiersToDb(
  cashiers: CashierUser[],
  tenantId?: string
): Promise<void> {
  const tid = getActiveTenantId(tenantId);
  try {
    // Generate secure hashes for each cashier's PIN using tenant salt
    const sanitizedCashiers: CashierUser[] = await Promise.all(
      cashiers.map(async (c) => {
        const pinHash = await hashPinWithSalt(c.pin, tid);
        return {
          id: c.id,
          name: c.name,
          role: c.role,
          avatarColor: c.avatarColor,
          phone: c.phone,
          email: c.email,
          status: c.status,
          activeShiftId: c.activeShiftId,
          pin: '', // Omit plaintext PIN from IndexedDB
          pinHash,
          isAuthorizedOffline: true,
        };
      })
    );

    const db = await getOfflineDb(tid);
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.CASHIERS, 'readwrite');
      const store = tx.objectStore(STORES.CASHIERS);
      store.clear();
      sanitizedCashiers.forEach((c) => store.put(c));
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('[IndexedDB] cacheCashiersToDb error:', err);
  }
}

export async function getCachedCashiersFromDb(tenantId?: string): Promise<CashierUser[]> {
  const tid = getActiveTenantId(tenantId);
  try {
    const db = await getOfflineDb(tid);
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.CASHIERS, 'readonly');
      const store = tx.objectStore(STORES.CASHIERS);
      const req = store.getAll();
      req.onsuccess = () => resolve((req.result || []) as CashierUser[]);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return [];
  }
}

/**
 * Verify cashier PIN offline using stored SHA-256 hash
 */
export async function verifyCashierPinOffline(
  pin: string,
  tenantId?: string
): Promise<CashierUser | null> {
  const tid = getActiveTenantId(tenantId);
  try {
    const inputHash = await hashPinWithSalt(pin, tid);
    const cachedCashiers = await getCachedCashiersFromDb(tid);
    const matched = cachedCashiers.find((c) => c.pinHash === inputHash);
    return matched || null;
  } catch (err) {
    console.warn('[IndexedDB] verifyCashierPinOffline error:', err);
    return null;
  }
}

// ----------------------------------------------------
// CONFIG & BUSINESS SETTINGS CACHING
// ----------------------------------------------------

export async function cacheConfigToDb(
  key: string,
  data: unknown,
  tenantId?: string
): Promise<void> {
  const tid = getActiveTenantId(tenantId);
  try {
    const db = await getOfflineDb(tid);
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.CONFIG, 'readwrite');
      const store = tx.objectStore(STORES.CONFIG);
      store.put({ key, data, updatedAt: new Date().toISOString() });
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('[IndexedDB] cacheConfigToDb error:', err);
  }
}

export async function getCachedConfigFromDb<T = unknown>(
  key: string,
  tenantId?: string
): Promise<T | null> {
  const tid = getActiveTenantId(tenantId);
  try {
    const db = await getOfflineDb(tid);
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.CONFIG, 'readonly');
      const store = tx.objectStore(STORES.CONFIG);
      const req = store.get(key);
      req.onsuccess = () => {
        const res = req.result;
        resolve(res ? (res.data as T) : null);
      };
      req.onerror = () => reject(req.error);
    });
  } catch {
    return null;
  }
}

// ----------------------------------------------------
// SHIFTS CACHING
// ----------------------------------------------------

export async function saveShiftToDb(shift: ShiftRecord, tenantId?: string): Promise<void> {
  const tid = getActiveTenantId(tenantId || shift.businessId);
  try {
    const db = await getOfflineDb(tid);
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.SHIFTS, 'readwrite');
      const store = tx.objectStore(STORES.SHIFTS);
      store.put(shift);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('[IndexedDB] saveShiftToDb fallback:', err);
  }
}

export async function getCachedShiftsFromDb(tenantId?: string): Promise<ShiftRecord[]> {
  const tid = getActiveTenantId(tenantId);
  try {
    const db = await getOfflineDb(tid);
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.SHIFTS, 'readonly');
      const store = tx.objectStore(STORES.SHIFTS);
      const req = store.getAll();
      req.onsuccess = () => resolve((req.result || []) as ShiftRecord[]);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return [];
  }
}

// ----------------------------------------------------
// INVENTORY ADJUSTMENT QUEUE (Movement Ledger)
// ----------------------------------------------------

export async function queueInventoryAdjustment(
  adj: InventoryAdjustmentRecord,
  tenantId?: string
): Promise<void> {
  const tid = getActiveTenantId(tenantId || adj.tenantId);
  try {
    const db = await getOfflineDb(tid);
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.INVENTORY_ADJUSTMENTS, 'readwrite');
      const store = tx.objectStore(STORES.INVENTORY_ADJUSTMENTS);
      store.put(adj);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('[IndexedDB] queueInventoryAdjustment error:', err);
  }
}

export async function getPendingInventoryAdjustments(
  tenantId?: string
): Promise<InventoryAdjustmentRecord[]> {
  const tid = getActiveTenantId(tenantId);
  try {
    const db = await getOfflineDb(tid);
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.INVENTORY_ADJUSTMENTS, 'readonly');
      const store = tx.objectStore(STORES.INVENTORY_ADJUSTMENTS);
      const req = store.getAll();
      req.onsuccess = () => {
        const results = (req.result || []) as InventoryAdjustmentRecord[];
        resolve(results.filter((a) => !a.synced));
      };
      req.onerror = () => reject(req.error);
    });
  } catch {
    return [];
  }
}

export async function markInventoryAdjustmentsSynced(
  ids: string[],
  tenantId?: string
): Promise<void> {
  if (ids.length === 0) return;
  const tid = getActiveTenantId(tenantId);
  try {
    const db = await getOfflineDb(tid);
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.INVENTORY_ADJUSTMENTS, 'readwrite');
      const store = tx.objectStore(STORES.INVENTORY_ADJUSTMENTS);
      ids.forEach((id) => {
        const getReq = store.get(id);
        getReq.onsuccess = () => {
          const item = getReq.result as InventoryAdjustmentRecord | undefined;
          if (item) {
            item.synced = true;
            store.put(item);
          }
        };
      });
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('[IndexedDB] markInventoryAdjustmentsSynced error:', err);
  }
}

// ----------------------------------------------------
// RESTAURANT / HOTEL TABLES CACHING
// ----------------------------------------------------

export async function cacheTablesToDb(tables: TableInfo[], tenantId?: string): Promise<void> {
  const tid = getActiveTenantId(tenantId);
  try {
    const db = await getOfflineDb(tid);
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.TABLES, 'readwrite');
      const store = tx.objectStore(STORES.TABLES);
      store.clear();
      tables.forEach((t) => store.put(t));
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('[IndexedDB] cacheTablesToDb error:', err);
  }
}

export async function getCachedTablesFromDb(tenantId?: string): Promise<TableInfo[]> {
  const tid = getActiveTenantId(tenantId);
  try {
    const db = await getOfflineDb(tid);
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.TABLES, 'readonly');
      const store = tx.objectStore(STORES.TABLES);
      const req = store.getAll();
      req.onsuccess = () => resolve((req.result || []) as TableInfo[]);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return [];
  }
}

// ----------------------------------------------------
// POS DEVICE REGISTRATION (Device Management)
// ----------------------------------------------------

export async function savePosDeviceToDb(
  device: PosDeviceRecord,
  tenantId?: string
): Promise<void> {
  const tid = getActiveTenantId(tenantId || device.tenantId);
  try {
    const db = await getOfflineDb(tid);
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.DEVICES, 'readwrite');
      const store = tx.objectStore(STORES.DEVICES);
      store.put(device);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('[IndexedDB] savePosDeviceToDb error:', err);
  }
}

export async function getCachedPosDevicesFromDb(
  tenantId?: string
): Promise<PosDeviceRecord[]> {
  const tid = getActiveTenantId(tenantId);
  try {
    const db = await getOfflineDb(tid);
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.DEVICES, 'readonly');
      const store = tx.objectStore(STORES.DEVICES);
      const req = store.getAll();
      req.onsuccess = () => resolve((req.result || []) as PosDeviceRecord[]);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return [];
  }
}

// ----------------------------------------------------
// STORAGE USAGE DIAGNOSTICS
// ----------------------------------------------------

export async function getEstimatedStorageUsage(): Promise<{
  usedBytes: number;
  quotaBytes: number;
  percentage: number;
  usedFormatted: string;
}> {
  try {
    if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.estimate) {
      const estimate = await navigator.storage.estimate();
      const used = estimate.usage || 0;
      const quota = estimate.quota || 1;
      const pct = Math.round((used / quota) * 100);
      const usedFormatted =
        used > 1024 * 1024
          ? `${(used / (1024 * 1024)).toFixed(2)} MB`
          : `${Math.round(used / 1024)} KB`;
      return {
        usedBytes: used,
        quotaBytes: quota,
        percentage: pct,
        usedFormatted,
      };
    }
  } catch {}
  return {
    usedBytes: 1024 * 150,
    quotaBytes: 1024 * 1024 * 50,
    percentage: 1,
    usedFormatted: '150 KB',
  };
}
