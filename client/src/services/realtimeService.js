import { 
  ref, 
  onValue, 
  set, 
  push, 
  update, 
  off,
  serverTimestamp,
  onDisconnect
} from 'firebase/database';
import { 
  collection, 
  doc, 
  onSnapshot, 
  addDoc, 
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  getDocs
} from 'firebase/firestore';
import { db } from '../firebase';
import { getDatabase } from 'firebase/database';

// Inicializar Realtime Database
const realtimeDb = getDatabase();

// Estado global de sincronización
let syncState = {
  isOnline: navigator.onLine,
  pendingOperations: [],
  listeners: new Map(),
  lastSync: Date.now()
};

// Cola de operaciones offline
const offlineQueue = [];
const MAX_QUEUE_SIZE = 100;

// Eventos de sincronización
const syncEvents = {
  SALE_COMPLETED: 'sale_completed',
  INVENTORY_UPDATED: 'inventory_updated',
  PRODUCT_ADDED: 'product_added',
  CUSTOMER_ADDED: 'customer_added',
  SHIFT_OPENED: 'shift_opened',
  SHIFT_CLOSED: 'shift_closed',
  STOCK_ALERT: 'stock_alert',
  PAYMENT_RECEIVED: 'payment_received'
};

// Callbacks para actualizaciones en tiempo real
const realtimeCallbacks = new Map();

// Configurar listeners de conectividad
window.addEventListener('online', () => {
  syncState.isOnline = true;
  console.log('🌐 Conexión restaurada - Sincronizando...');
  processOfflineQueue();
});

window.addEventListener('offline', () => {
  syncState.isOnline = false;
  console.log('📴 Modo offline activado');
});

// Procesar cola offline
const processOfflineQueue = async () => {
  if (offlineQueue.length === 0) return;
  
  console.log(`🔄 Procesando ${offlineQueue.length} operaciones pendientes...`);
  
  for (const operation of offlineQueue) {
    try {
      await operation();
      console.log('✅ Operación sincronizada:', operation.type);
    } catch (error) {
      console.error('❌ Error sincronizando:', error);
    }
  }
  
  offlineQueue.length = 0;
  syncState.lastSync = Date.now();
  localStorage.removeItem('offlineQueue');
  
  // Notificar a todos los listeners
  notifyListeners('sync_completed', { timestamp: Date.now() });
};

// Agregar operación a la cola offline
const addToOfflineQueue = (operation) => {
  if (offlineQueue.length >= MAX_QUEUE_SIZE) {
    offlineQueue.shift(); // Remover operación más antigua
  }
  
  offlineQueue.push(operation);
  localStorage.setItem('offlineQueue', JSON.stringify(offlineQueue));
  
  if (syncState.isOnline) {
    processOfflineQueue();
  }
};

// Notificar a todos los listeners
const notifyListeners = (event, data) => {
  const listeners = realtimeCallbacks.get(event) || [];
  listeners.forEach(callback => {
    try {
      callback(data);
    } catch (error) {
      console.error('Error en callback:', error);
    }
  });
};

// Servicio principal de tiempo real
export const realtimeService = {
  // Inicializar listeners de tiempo real
  initializeRealtimeListeners() {
    console.log('🚀 Inicializando listeners de tiempo real...');
    
    // Listener para ventas
    this.listenToSales();
    
    // Listener para inventario
    this.listenToInventory();
    
    // Listener para productos
    this.listenToProducts();
    
    // Listener para clientes
    this.listenToCustomers();
    
    // Listener para turnos
    this.listenToShifts();
    
    console.log('✅ Listeners de tiempo real inicializados');
  },

  // Listener para ventas
  listenToSales() {
    const salesRef = collection(db, 'sales');
    const q = query(salesRef, orderBy('createdAt', 'desc'), limit(50));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const sales = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      notifyListeners('sales_updated', { sales, timestamp: Date.now() });
    });
    
    syncState.listeners.set('sales', unsubscribe);
  },

  // Listener para inventario
  listenToInventory() {
    const inventoryRef = collection(db, 'inventory');
    
    const unsubscribe = onSnapshot(inventoryRef, (snapshot) => {
      const inventory = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Verificar alertas de stock bajo
      const lowStockItems = inventory.filter(item => 
        item.stock <= item.minStock
      );
      
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

  // Listener para productos
  listenToProducts() {
    const productsRef = collection(db, 'products');
    
    const unsubscribe = onSnapshot(productsRef, (snapshot) => {
      const products = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      notifyListeners('products_updated', { 
        products, 
        timestamp: Date.now() 
      });
    });
    
    syncState.listeners.set('products', unsubscribe);
  },

  // Listener para clientes
  listenToCustomers() {
    const customersRef = collection(db, 'customers');
    
    const unsubscribe = onSnapshot(customersRef, (snapshot) => {
      const customers = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      notifyListeners('customers_updated', { 
        customers, 
        timestamp: Date.now() 
      });
    });
    
    syncState.listeners.set('customers', unsubscribe);
  },

  // Listener para turnos
  listenToShifts() {
    const shiftsRef = collection(db, 'shifts');
    const q = query(shiftsRef, where('status', '==', 'active'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const shifts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      notifyListeners('shifts_updated', { 
        shifts, 
        timestamp: Date.now() 
      });
    });
    
    syncState.listeners.set('shifts', unsubscribe);
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

  // Limpiar todos los listeners
  cleanup() {
    syncState.listeners.forEach(unsubscribe => unsubscribe());
    syncState.listeners.clear();
    realtimeCallbacks.clear();
  },

  // Obtener estado de sincronización
  getSyncState() {
    return {
      ...syncState,
      offlineQueueSize: offlineQueue.length
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
      timestamp: serverTimestamp(),
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
      timestamp: serverTimestamp(),
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
        const saleDoc = await addDoc(salesRef, {
          ...saleData,
          createdAt: serverTimestamp(),
          synced: true
        });

        // Actualizar inventario
        for (const item of saleData.items) {
          await this.updateInventoryStock(item.productId, -item.quantity);
        }

        // Actualizar estadísticas en tiempo real
        const statsRef = ref(realtimeDb, 'stats');
        await update(statsRef, {
          totalSales: saleData.total,
          lastSale: serverTimestamp(),
          dailySales: saleData.total
        });

        // Notificar a todos los componentes
        notifyListeners('sale_synced', {
          saleId: saleDoc.id,
          saleData,
          timestamp: Date.now()
        });

        return saleDoc.id;
      } catch (error) {
        console.error('Error sincronizando venta:', error);
        throw error;
      }
    };

    if (syncState.isOnline) {
      return await operation();
    } else {
      addToOfflineQueue({
        type: 'sale',
        operation
      });
      return 'pending';
    }
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
            lastUpdated: serverTimestamp()
          });

          // Verificar stock bajo
          if (newStock <= doc.data().minStock) {
            await notificationService.notifyStockAlert({
              productId,
              currentStock: newStock,
              minStock: doc.data().minStock
            });
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
      addToOfflineQueue({
        type: 'inventory',
        operation
      });
    }
  },

  // Sincronizar turno
  async syncShift(shiftData) {
    const operation = async () => {
      try {
        const shiftsRef = collection(db, 'shifts');
        const shiftDoc = await addDoc(shiftsRef, {
          ...shiftData,
          createdAt: serverTimestamp(),
          synced: true
        });

        // Actualizar estado en tiempo real
        const realtimeRef = ref(realtimeDb, 'shifts');
        await update(realtimeRef, {
          [shiftDoc.id]: {
            ...shiftData,
            status: 'active',
            lastUpdated: serverTimestamp()
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
      addToOfflineQueue({
        type: 'shift',
        operation
      });
      return 'pending';
    }
  }
};

export default realtimeService; 