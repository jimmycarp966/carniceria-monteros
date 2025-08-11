import { 
  ref, 
  push, 
  update, 
  serverTimestamp as rtdbServerTimestamp
} from 'firebase/database';
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  serverTimestamp as fsServerTimestamp,
  doc,
  increment
} from 'firebase/firestore';
import { db, realtimeDb as appRealtimeDb } from '../firebase';
import { getDatabase } from 'firebase/database';

// Inicializar Realtime Database del app (evita URL incorrecta)
const realtimeDb = appRealtimeDb ?? getDatabase();

// Estado global de sincronización optimizado
let syncState = {
  isOnline: navigator.onLine,
  pendingOperations: [],
  listeners: new Map(),
  lastSync: Date.now(),
  debounceTimers: new Map()
};

// Cola de operaciones offline (descriptores serializables)
let offlineQueue = [];
const MAX_QUEUE_SIZE = 100;
const OFFLINE_QUEUE_KEY = 'offlineQueue_v1';

const saveOfflineQueue = () => {
  try { localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(offlineQueue)); } catch {}
};

const loadOfflineQueue = () => {
  try {
    const raw = localStorage.getItem(OFFLINE_QUEUE_KEY);
    offlineQueue = raw ? JSON.parse(raw) : [];
  } catch { offlineQueue = []; }
};

loadOfflineQueue();

// Cache para datos frecuentemente accedidos
const dataCache = new Map();
const CACHE_DURATION = 2 * 60 * 1000; // 2 minutos

// Callbacks para actualizaciones en tiempo real con debouncing
const realtimeCallbacks = new Map();

// Función de debouncing optimizada
const debounce = (func, wait, key) => {
  if (syncState.debounceTimers.has(key)) {
    clearTimeout(syncState.debounceTimers.get(key));
  }
  
  const timer = setTimeout(() => {
    func();
    syncState.debounceTimers.delete(key);
  }, wait);
  
  syncState.debounceTimers.set(key, timer);
};

// Configurar listeners de conectividad optimizados
window.addEventListener('online', () => {
  syncState.isOnline = true;
  console.log('🌐 Conexión restaurada - Sincronizando...');
  processOfflineQueue();
});

window.addEventListener('offline', () => {
  syncState.isOnline = false;
  console.log('📴 Modo offline activado');
});

// Procesar cola offline optimizada
const processOfflineQueue = async () => {
  if (offlineQueue.length === 0) return;
  
  console.log(`🔄 Procesando ${offlineQueue.length} operaciones pendientes...`);
  const remaining = [];
  for (const op of offlineQueue) {
    try {
      if (op?.type === 'sale' && op.payload) {
        await dataSyncService.syncSale(op.payload);
      } else if (op?.type === 'inventory' && op.payload) {
        await dataSyncService.updateInventoryStock(op.payload.productId, op.payload.quantityChange);
      } else if (op?.type === 'shift' && op.payload) {
        await dataSyncService.syncShift(op.payload);
      }
      console.log('✅ Operación sincronizada:', op?.type);
    } catch (e) {
      console.error('❌ Error sincronizando:', op?.type, e);
      remaining.push(op);
    }
  }
  offlineQueue = remaining;
  saveOfflineQueue();
  syncState.lastSync = Date.now();
  
  // Notificar a todos los listeners
  notifyListeners('sync_completed', { timestamp: Date.now() });
};

// Agregar operación a la cola offline optimizada
const addToOfflineQueue = (descriptor) => {
  if (!descriptor || !descriptor.type) return;
  if (offlineQueue.length >= MAX_QUEUE_SIZE) offlineQueue.shift();
  offlineQueue.push(descriptor);
  saveOfflineQueue();
  if (syncState.isOnline) processOfflineQueue();
};

// Notificar a todos los listeners con debouncing
const notifyListeners = (event, data) => {
  const listeners = realtimeCallbacks.get(event) || [];
  
  // Debouncing para eventos frecuentes
  if (event === 'sales_updated' || event === 'inventory_updated') {
    debounce(() => {
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Error en callback:', error);
        }
      });
    }, 500, event);
  } else {
    // Para eventos menos frecuentes, notificar inmediatamente
    listeners.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error('Error en callback:', error);
      }
    });
  }
};

// Servicio principal de tiempo real optimizado
export const realtimeService = {
  // Inicializar listeners de tiempo real optimizados
  initializeRealtimeListeners() {
    console.log('🚀 Inicializando listeners de tiempo real optimizados...');
    
    // Limpiar listeners existentes
    this.cleanup();
    
    // Listener para ventas optimizado
    this.listenToSales();
    
    // Listener para inventario optimizado
    this.listenToInventory();
    
    // Listener para productos optimizado
    this.listenToProducts();
    
    // Listener para clientes optimizado
    this.listenToCustomers();
    
    // Listener para turnos optimizado
    this.listenToShifts();
    
    console.log('✅ Listeners de tiempo real optimizados inicializados');
  },

  // Listener para ventas optimizado con límites
  listenToSales() {
    const salesRef = collection(db, 'sales');
    const q = query(
      salesRef, 
      orderBy('createdAt', 'desc'), 
      limit(50)
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const sales = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Cachear datos
      dataCache.set('recent_sales', {
        data: sales,
        timestamp: Date.now()
      });
      
      notifyListeners('sales_updated', { sales, timestamp: Date.now() });
    });
    
    syncState.listeners.set('sales', unsubscribe);
  },

  // Listener para inventario optimizado
  listenToInventory() {
    const inventoryRef = collection(db, 'inventory');
    const q = query(inventoryRef, orderBy('productName'), limit(500));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const inventory = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Cachear datos completos
      dataCache.set('inventory', {
        data: inventory,
        timestamp: Date.now()
      });
      
      // Verificar alertas de stock bajo en cliente
      const lowStockItems = inventory.filter(item => {
        const stock = item.stock ?? item.currentStock ?? 0;
        const minStock = item.minStock ?? 0;
        return stock <= minStock;
      });
      
      if (lowStockItems.length > 0) {
        notifyListeners('stock_alert', { 
          items: lowStockItems, 
          timestamp: Date.now() 
        });
      }
      
      notifyListeners('inventory_updated', { 
        inventory, 
        timestamp: Date.now() 
      });
    });
    
    syncState.listeners.set('inventory', unsubscribe);
  },

  // Listener para productos optimizado
  listenToProducts() {
    const productsRef = collection(db, 'products');
    const q = query(productsRef, orderBy('name'), limit(100));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const products = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Cachear datos
      dataCache.set('products', {
        data: products,
        timestamp: Date.now()
      });
      
      notifyListeners('products_updated', { 
        products, 
        timestamp: Date.now() 
      });
    });
    
    syncState.listeners.set('products', unsubscribe);
  },

  // Listener para clientes optimizado
  listenToCustomers() {
    const customersRef = collection(db, 'customers');
    const q = query(customersRef, orderBy('name'), limit(50));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const customers = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Cachear datos
      dataCache.set('customers', {
        data: customers,
        timestamp: Date.now()
      });
      
      notifyListeners('customers_updated', { 
        customers, 
        timestamp: Date.now() 
      });
    });
    
    syncState.listeners.set('customers', unsubscribe);
  },

  // Listener para turnos: escuchar todos los turnos (activos y cerrados)
  listenToShifts() {
    const shiftsRef = collection(db, 'shifts');
    const q = query(
      shiftsRef,
      limit(50)
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      let shifts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      // Ordenar por startTime/createdAt descendente si existe
      shifts = shifts.sort((a, b) => {
        const ta = a.startTime?.toDate?.()?.getTime?.() || a.createdAt?.toDate?.()?.getTime?.() || 0;
        const tb = b.startTime?.toDate?.()?.getTime?.() || b.createdAt?.toDate?.()?.getTime?.() || 0;
        return tb - ta;
      });
      
      dataCache.set('shifts', {
        data: shifts,
        timestamp: Date.now()
      });
      
      notifyListeners('shifts_updated', { 
        shifts, 
        timestamp: Date.now() 
      });
    });
    
    syncState.listeners.set('shifts', unsubscribe);
  },

  // Obtener datos del cache
  getCachedData(key) {
    const cached = dataCache.get(key);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.data;
    }
    return null;
  },

  // Registrar callback para eventos
  on(event, callback) {
    if (!realtimeCallbacks.has(event)) {
      realtimeCallbacks.set(event, []);
    }
    realtimeCallbacks.get(event).push(callback);
  },

  // Remover callback
  off(event, callback) {
    const callbacks = realtimeCallbacks.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  },

  // Limpiar todos los listeners optimizado
  cleanup() {
    // Limpiar timers de debouncing
    syncState.debounceTimers.forEach(timer => clearTimeout(timer));
    syncState.debounceTimers.clear();
    
    // Limpiar listeners
    syncState.listeners.forEach(unsubscribe => unsubscribe());
    syncState.listeners.clear();
    
    // Limpiar callbacks
    realtimeCallbacks.clear();
    
    // Limpiar cache
    dataCache.clear();
  },

  // Obtener estado de sincronización
  getSyncState() {
    return {
      ...syncState,
      offlineQueueSize: offlineQueue.length,
      cacheSize: dataCache.size
    };
  },

  // Forzar sincronización
  async forceSync() {
    if (syncState.isOnline) {
      await processOfflineQueue();
      return true;
    }
    return false;
  }
};

// Servicio de notificaciones push
export const notificationService = {
  // Enviar notificación de venta completada
  async notifySaleCompleted(saleData) {
          const notification = {
      type: 'sale_completed',
      data: saleData,
            timestamp: rtdbServerTimestamp(),
      read: false
    };

    if (syncState.isOnline) {
      try {
        const notificationsRef = collection(db, 'notifications');
        await addDoc(notificationsRef, notification);
        
        // Enviar a Realtime Database para tiempo real
        const realtimeRef = ref(realtimeDb, 'notifications');
        await push(realtimeRef, notification);
        
        notifyListeners('notification_received', notification);
      } catch (error) {
        console.error('Error enviando notificación:', error);
        addToOfflineQueue({
          type: 'notification',
          operation: () => this.notifySaleCompleted(saleData)
        });
      }
    } else {
      addToOfflineQueue({
        type: 'notification',
        operation: () => this.notifySaleCompleted(saleData)
      });
    }
  },

  // Enviar alerta de stock bajo
  async notifyStockAlert(productData) {
          const notification = {
      type: 'stock_alert',
      data: productData,
            timestamp: rtdbServerTimestamp(),
      priority: 'high',
      read: false
    };

    if (syncState.isOnline) {
      try {
        const notificationsRef = collection(db, 'notifications');
        await addDoc(notificationsRef, notification);
        
        const realtimeRef = ref(realtimeDb, 'alerts');
        await push(realtimeRef, notification);
        
        notifyListeners('stock_alert_received', notification);
      } catch (error) {
        console.error('Error enviando alerta:', error);
        addToOfflineQueue({
          type: 'alert',
          operation: () => this.notifyStockAlert(productData)
        });
      }
    } else {
      addToOfflineQueue({
        type: 'alert',
        operation: () => this.notifyStockAlert(productData)
      });
    }
  }
};

// Servicio de sincronización de datos
export const dataSyncService = {
  // Sincronizar venta
  async syncSale(saleData) {
    const operation = async () => {
      try {
        // Agregar a Firestore
        const salesRef = collection(db, 'sales');
        const cleanSale = { ...saleData };
        if (cleanSale.shiftId === undefined) delete cleanSale.shiftId;
        const saleDoc = await addDoc(salesRef, {
          ...cleanSale,
          createdAt: fsServerTimestamp(),
          synced: true
        });

        // Actualizar inventario y también stock en products si existe (no bloquear venta si falla)
        for (const item of saleData.items) {
          try {
            await this.updateInventoryStock(item.productId, -Math.abs(Number(item.quantity) || 0));
          } catch (e) {
            console.warn('No se pudo actualizar inventario para', item.productId, e);
          }
        }

        // Intentar actualizar métricas del turno (si aplica)
        try {
          if (cleanSale.shiftId) {
            const shiftId = String(cleanSale.shiftId);
            const sRef = doc(db, 'shifts', shiftId);
            const amount = Number(cleanSale.finalTotal ?? cleanSale.total) || 0;
            const method = String(cleanSale.paymentMethod || 'cash');
            const updates = {
              salesCount: increment(1),
              updatedAt: fsServerTimestamp(),
              'totals.overall': increment(amount)
            };
            updates[`totals.${method}`] = increment(amount);
            await updateDoc(sRef, updates);
          }
        } catch (e) {
          console.warn('No se actualizaron métricas de turno:', e);
        }

        // Intentar actualizar estadísticas en tiempo real (no bloquear venta si falla RTDB)
        try {
          if (realtimeDb) {
            const statsRef = ref(realtimeDb, 'stats');
            await update(statsRef, {
              totalSales: saleData.total,
              lastSale: rtdbServerTimestamp(),
              dailySales: saleData.total
            });
          }
        } catch (e) {
          console.warn('RTDB no disponible para stats, continúa sin bloquear venta');
        }

        // Notificar a todos los componentes
        notifyListeners('sale_synced', {
          saleId: saleDoc.id,
          saleData,
          timestamp: Date.now()
        });

        return saleDoc.id;
      } catch (error) {
        console.error('Error sincronizando venta (agregar a Firestore falló):', error);
        throw error; // Solo si falló crear la venta en Firestore
      }
    };

    if (syncState.isOnline) {
      return await operation();
    }
    const clientOperationId = saleData.clientOperationId || `${Date.now()}_${Math.random().toString(36).slice(2,8)}`;
    addToOfflineQueue({ type: 'sale', payload: { ...saleData, clientOperationId } });
    return 'pending';
  },

  // Actualizar stock de inventario
  async updateInventoryStock(productId, quantityChange) {
    const operation = async () => {
      try {
        const inventoryRef = collection(db, 'inventory');
        const q = query(inventoryRef, where('productId', '==', productId));
        const snapshot = await getDocs(q);
        
        if (!snapshot.empty) {
          const doc = snapshot.docs[0];
          const currentStock = doc.data().stock || 0;
          const newStock = currentStock + quantityChange;
          
          await updateDoc(doc.ref, {
            stock: Math.max(0, newStock),
            lastUpdated: fsServerTimestamp()
          });

          // Verificar stock bajo
          if (newStock <= doc.data().minStock) {
            await notificationService.notifyStockAlert({
              productId,
              currentStock: newStock,
              minStock: doc.data().minStock
            });
          }

          // Intentar reflejar el stock también en products para mantener la UI consistente
          try {
            const productRef = doc(db, 'products', String(productId));
            await updateDoc(productRef, {
              stock: Math.max(0, newStock),
              updatedAt: fsServerTimestamp()
            });
          } catch (e) {
            console.warn('No se pudo actualizar stock en products para', productId);
          }
        }
      } catch (error) {
        console.error('Error actualizando inventario:', error);
        throw error;
      }
    };

    if (syncState.isOnline) {
      return await operation();
    } else {
      addToOfflineQueue({ type: 'inventory', payload: { productId, quantityChange } });
    }
  },

  // Sincronizar turno
  async syncShift(shiftData) {
    const operation = async () => {
      try {
        const shiftsRef = collection(db, 'shifts');
        const shiftDoc = await addDoc(shiftsRef, {
          ...shiftData,
          createdAt: fsServerTimestamp(),
          synced: true
        });

        // Actualizar estado en tiempo real
        const realtimeRef = ref(realtimeDb, 'shifts');
        await update(realtimeRef, {
          [shiftDoc.id]: {
            ...shiftData,
            status: 'active',
            lastUpdated: rtdbServerTimestamp()
          }
        });

        notifyListeners('shift_synced', {
          shiftId: shiftDoc.id,
          shiftData,
          timestamp: Date.now()
        });

        return shiftDoc.id;
      } catch (error) {
        console.error('Error sincronizando turno:', error);
        throw error;
      }
    };

    if (syncState.isOnline) {
      return await operation();
    } else {
      addToOfflineQueue({ type: 'shift', payload: shiftData });
      return 'pending';
    }
  }
};

export default realtimeService; 