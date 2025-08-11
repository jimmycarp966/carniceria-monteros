import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  serverTimestamp,
  orderBy,
  limit
} from 'firebase/firestore';
import { db, auth } from '../firebase';

// Cache inteligente optimizado
const cache = new Map();
const CACHE_DURATION = 3 * 60 * 1000; // 3 minutos
const MAX_CACHE_SIZE = 100;

// Estado de conexión optimizado
let isOnline = navigator.onLine;
let pendingOperations = [];

// Detectar cambios de conectividad optimizado
window.addEventListener('online', () => {
  isOnline = true;
  console.log('Conexión restaurada');
  syncPendingOperations();
});

window.addEventListener('offline', () => {
  isOnline = false;
  console.log('Sin conexión - Modo offline activado');
});

// Función para sincronizar operaciones pendientes optimizada
const syncPendingOperations = async () => {
  if (pendingOperations.length === 0) return;
  
  console.log(`Sincronizando ${pendingOperations.length} operaciones pendientes...`);
  
  const batchSize = 5; // Procesar en lotes más pequeños
  for (let i = 0; i < pendingOperations.length; i += batchSize) {
    const batch = pendingOperations.slice(i, i + batchSize);
    
    await Promise.allSettled(
      batch.map(async (operation) => {
        try {
          await operation();
          console.log('Operación sincronizada exitosamente');
        } catch (error) {
          console.error('Error sincronizando operación:', error);
        }
      })
    );
  }
  
  pendingOperations = [];
  console.log('Sincronización completada');
};

// Función para cargar operaciones pendientes al iniciar
const loadPendingOperations = () => {
  const saved = localStorage.getItem('pendingOperations');
  if (saved) {
    pendingOperations = JSON.parse(saved);
  }
};

// Servicio de gastos
export const expensesService = {
  async addExpense(expenseData) {
    try {
      const expensesRef = collection(db, 'expenses');
      const docRef = await addDoc(expensesRef, {
        ...expenseData,
        createdByEmail: auth?.currentUser?.email || null,
        createdByUid: auth?.currentUser?.uid || null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      smartCache.invalidate('expenses');
      return docRef.id;
    } catch (error) {
      console.error('❌ Error agregando gasto:', error);
      throw error;
    }
  },

  async getExpensesByShift(shiftId) {
    try {
      const expensesRef = collection(db, 'expenses');
      const q = query(expensesRef, where('shiftId', '==', shiftId));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (error) {
      console.error('❌ Error cargando gastos por turno:', error);
      throw error;
    }
  },

  async getExpensesByDateRange(startDate, endDate) {
    try {
      const expensesRef = collection(db, 'expenses');
      const q = query(
        expensesRef,
        where('createdAt', '>=', startDate),
        where('createdAt', '<=', endDate)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (error) {
      console.error('❌ Error cargando gastos por rango:', error);
      throw error;
    }
  },

  async updateExpense(expenseId, updateData) {
    try {
      const expenseRef = doc(db, 'expenses', expenseId);
      await updateDoc(expenseRef, {
        ...updateData,
        updatedAt: serverTimestamp()
      });
      smartCache.invalidate('expenses');
      console.log('✅ Gasto actualizado:', expenseId);
      return expenseId;
    } catch (error) {
      console.error('❌ Error actualizando gasto:', error);
      throw error;
    }
  }
};

// Servicio de compras
export const purchasesService = {
  async addPurchase(purchaseData) {
    try {
      const purchasesRef = collection(db, 'purchases');
      const docRef = await addDoc(purchasesRef, {
        ...purchaseData,
        createdByEmail: auth?.currentUser?.email || null,
        createdByUid: auth?.currentUser?.uid || null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      // Ajustar inventario por cada ítem comprado
      if (Array.isArray(purchaseData.items)) {
        for (const item of purchaseData.items) {
          try {
            await inventoryService.adjustInventory(item.productId, item.quantity);
          } catch (e) {
            console.warn('No se pudo ajustar inventario para', item.productId);
          }
        }
      }
      return docRef.id;
    } catch (error) {
      console.error('❌ Error registrando compra:', error);
      throw error;
    }
  },

  async getPurchasesByDateRange(startDate, endDate) {
    try {
      const purchasesRef = collection(db, 'purchases');
      const q = query(
        purchasesRef,
        where('createdAt', '>=', startDate),
        where('createdAt', '<=', endDate)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (error) {
      console.error('❌ Error cargando compras:', error);
      throw error;
    }
  }
};

// Servicio de movimientos de inventario
export const inventoryMovementsService = {
  async addMovement(movement) {
    try {
      const movementsRef = collection(db, 'inventory_movements');
      const docRef = await addDoc(movementsRef, {
        ...movement,
        createdByEmail: auth?.currentUser?.email || null,
        createdByUid: auth?.currentUser?.uid || null,
        timestamp: serverTimestamp()
      });
      // Ajustar inventario según tipo de movimiento
      const type = movement.type;
      const quantity = Number(movement.quantity) || 0;
      const delta = type === 'entrada' ? quantity : type === 'salida' || type === 'merma' ? -quantity : 0;
      if (delta !== 0 && movement.productId) {
        try {
          await inventoryService.adjustInventory(movement.productId, delta);
        } catch (e) {
          console.warn('No se pudo ajustar inventario para movimiento', movement.productId);
        }
      }
      return docRef.id;
    } catch (error) {
      console.error('❌ Error registrando movimiento de inventario:', error);
      throw error;
    }
  },

  async getRecentMovements(limitCount = 50) {
    try {
      const movementsRef = collection(db, 'inventory_movements');
      // orderBy importado arriba no soporta dynamic limit easily; simple get all and slice
      const snapshot = await getDocs(movementsRef);
      const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      return list.slice(0, limitCount);
    } catch (error) {
      console.error('❌ Error cargando movimientos:', error);
      throw error;
    }
  }
};

// Servicio de proveedores (Firestore)
export const suppliersService = {
  async getAllSuppliers() {
    try {
      const cacheKey = 'suppliers';
      const cached = smartCache.get(cacheKey);
      if (cached) return cached;
      const suppliersRef = collection(db, 'suppliers');
      const snapshot = await getDocs(suppliersRef);
      const suppliers = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      smartCache.set(cacheKey, suppliers);
      return suppliers;
    } catch (error) {
      console.error('❌ Error cargando proveedores:', error);
      throw error;
    }
  },

  async addSupplier(data) {
    try {
      const suppliersRef = collection(db, 'suppliers');
      const docRef = await addDoc(suppliersRef, {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      smartCache.invalidate('suppliers');
      return docRef.id;
    } catch (error) {
      console.error('❌ Error agregando proveedor:', error);
      throw error;
    }
  },

  async updateSupplier(id, data) {
    try {
      const refDoc = doc(db, 'suppliers', id);
      await updateDoc(refDoc, { ...data, updatedAt: serverTimestamp() });
      smartCache.invalidate('suppliers');
      return id;
    } catch (error) {
      console.error('❌ Error actualizando proveedor:', error);
      throw error;
    }
  },

  async deleteSupplier(id) {
    try {
      const refDoc = doc(db, 'suppliers', id);
      await deleteDoc(refDoc);
      smartCache.invalidate('suppliers');
      return id;
    } catch (error) {
      console.error('❌ Error eliminando proveedor:', error);
      throw error;
    }
  }
};

// Cargar operaciones pendientes al iniciar la app
loadPendingOperations();

// Cache inteligente con invalidación automática
const smartCache = {
  get(key) {
    const cached = cache.get(key);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.data;
    }
    return null;
  },
  
  set(key, data) {
    // Limpiar cache si está lleno
    if (cache.size >= MAX_CACHE_SIZE) {
      const oldestKey = cache.keys().next().value;
      cache.delete(oldestKey);
    }
    
    cache.set(key, { data, timestamp: Date.now() });
  },
  
  invalidate(pattern) {
    for (const key of cache.keys()) {
      if (key.includes(pattern)) {
        cache.delete(key);
      }
    }
  },
  
  clear() {
    cache.clear();
  }
};

// Función para verificar estado de conexión
export const checkConnectionStatus = () => {
  return {
    isOnline,
    pendingOperations: pendingOperations.length,
    cacheSize: cache.size
  };
};

// Función para forzar sincronización
export const forceSync = async () => {
  if (isOnline && pendingOperations.length > 0) {
    await syncPendingOperations();
    return true;
  }
  return false;
};

// Servicio de productos optimizado con cache y paginación
export const productService = {
  async getAllProducts(page = 1, pageSize = 20) {
    try {
      const cacheKey = `products_page_${page}`;
      const cached = smartCache.get(cacheKey);
      
      if (cached) {
        console.log('📦 Usando cache para productos');
        return cached;
      }

      console.log('📦 Cargando productos desde Firebase...');
      const productsRef = collection(db, 'products');
      
      let q = query(
        productsRef, 
        orderBy('name'), 
        limit(pageSize)
      );
      
      // Si no es la primera página, usar startAfter
      if (page > 1) {
        // Aquí necesitarías el último documento de la página anterior
        // Por simplicidad, cargamos todos y paginamos en memoria
        q = query(productsRef, orderBy('name'));
      }
      
      const snapshot = await getDocs(q);
      
      const products = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Paginación en memoria para simplificar
      const startIndex = (page - 1) * pageSize;
      const paginatedProducts = products.slice(startIndex, startIndex + pageSize);
      
      smartCache.set(cacheKey, paginatedProducts);
      return paginatedProducts;
    } catch (error) {
      console.error('Error cargando productos:', error);
      throw error;
    }
  },

  async getProductById(id) {
    try {
      const cacheKey = `product_${id}`;
      const cached = smartCache.get(cacheKey);
      
      if (cached) {
        return cached;
      }

      const productRef = doc(db, 'products', id);
      const productSnap = await getDoc(productRef);
      
      if (productSnap.exists()) {
        const product = { id: productSnap.id, ...productSnap.data() };
        smartCache.set(cacheKey, product);
        return product;
      } else {
        throw new Error('Producto no encontrado');
      }
    } catch (error) {
      console.error('Error obteniendo producto:', error);
      throw error;
    }
  },

  async addProduct(productData) {
    try {
      const productsRef = collection(db, 'products');
      const docRef = await addDoc(productsRef, {
        ...productData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      // Invalidar cache de productos
      smartCache.invalidate('products');
      
      // Crear item en inventario con stock inicial 0 para reflejarse en Inventario
      try {
        const inventoryRef = collection(db, 'inventory');
        await addDoc(inventoryRef, {
          productId: docRef.id,
          productName: productData.name || 'Producto',
          category: productData.category || 'Sin categoría',
          stock: Number(productData.stock) || 0,
          minStock: Number(productData.minStock) || 10,
          cost: Number(productData.cost) || 0,
          price: Number(productData.price) || 0,
          unit: productData.unit || 'unidad',
          location: 'Almacén',
          supplier: '',
          lastUpdated: serverTimestamp(),
          createdAt: serverTimestamp()
        });
        smartCache.invalidate('inventory');
      } catch (e) {
        console.warn('No se pudo crear item de inventario para el producto', e);
      }
      
      return docRef.id;
    } catch (error) {
      console.error('Error agregando producto:', error);
      throw error;
    }
  },

  async updateProduct(id, productData) {
    try {
      const productRef = doc(db, 'products', id);
      await updateDoc(productRef, {
        ...productData,
        updatedAt: serverTimestamp()
      });
      
      // Invalidar cache específico
      smartCache.invalidate(`product_${id}`);
      smartCache.invalidate('products');
      
      return id;
    } catch (error) {
      console.error('Error actualizando producto:', error);
      throw error;
    }
  },

  async updateProductStock(id, newStock) {
    try {
      const productRef = doc(db, 'products', id);
      await updateDoc(productRef, {
        stock: newStock,
        updatedAt: serverTimestamp()
      });
      
      // Invalidar cache
      smartCache.invalidate(`product_${id}`);
      smartCache.invalidate('products');

      // Sincronizar inventario correspondiente
      try {
        const inventoryRef = collection(db, 'inventory');
        const qInv = query(inventoryRef, where('productId', '==', id));
        const snap = await getDocs(qInv);
        if (!snap.empty) {
          await updateDoc(snap.docs[0].ref, { stock: Number(newStock) || 0, lastUpdated: serverTimestamp() });
        }
        smartCache.invalidate('inventory');
      } catch (e) {
        console.warn('No se pudo sincronizar inventario para producto', id);
      }
      
      return id;
    } catch (error) {
      console.error('Error actualizando stock:', error);
      throw error;
    }
  },

  async deleteProduct(id) {
    try {
      const productRef = doc(db, 'products', id);
      await deleteDoc(productRef);
      
      // Invalidar cache
      smartCache.invalidate(`product_${id}`);
      smartCache.invalidate('products');
      
      return id;
    } catch (error) {
      console.error('Error eliminando producto:', error);
      throw error;
    }
  }
};

// Servicio de ventas optimizado
export const saleService = {
  async getAllSales(page = 1, pageSize = 20) {
    try {
      const cacheKey = `sales_page_${page}`;
      const cached = smartCache.get(cacheKey);
      
      if (cached) {
        return cached;
      }

      const salesRef = collection(db, 'sales');
      const q = query(
        salesRef, 
        orderBy('createdAt', 'desc'), 
        limit(pageSize)
      );
      
      const snapshot = await getDocs(q);
      const sales = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      smartCache.set(cacheKey, sales);
      return sales;
    } catch (error) {
      console.error('Error cargando ventas:', error);
      throw error;
    }
  },

  async getSalesByShift(shiftId, forceRefresh = false) {
    try {
      const cacheKey = `sales_shift_${shiftId}`;
      
      // Si no se fuerza refresh, intentar usar cache
      if (!forceRefresh) {
        const cached = smartCache.get(cacheKey);
        if (cached) {
          console.log(`📋 Usando cache para ventas del turno ${shiftId}: ${cached.length} ventas`);
          return cached;
        }
      }

      console.log(`🔄 Cargando ventas del turno ${shiftId} desde Firebase...`);
      
      const salesRef = collection(db, 'sales');
      // Evitar índice compuesto: filtrar por shiftId y ordenar en memoria
      const q = query(
        salesRef, 
        where('shiftId', '==', shiftId)
      );
      
      const snapshot = await getDocs(q);
      let sales = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Ordenar por createdAt desc en cliente
      sales = sales.sort((a, b) => {
        const ta = a.createdAt?.toDate?.()?.getTime?.() || new Date(a.createdAt || 0).getTime();
        const tb = b.createdAt?.toDate?.()?.getTime?.() || new Date(b.createdAt || 0).getTime();
        return tb - ta;
      });
      
      // Calcular total de ventas
      const totalAmount = sales.reduce((sum, sale) => sum + (sale.total || 0), 0);
      console.log(`✅ Ventas cargadas del turno ${shiftId}: ${sales.length} ventas por $${totalAmount.toLocaleString()}`);
      
      smartCache.set(cacheKey, sales);
      return sales;
    } catch (error) {
      console.error('Error cargando ventas del turno:', error);
      throw error;
    }
  },

  async getSalesByDate(date) {
    try {
      const cacheKey = `sales_date_${date.toISOString().split('T')[0]}`;
      const cached = smartCache.get(cacheKey);
      
      if (cached) {
        return cached;
      }

      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      
      const salesRef = collection(db, 'sales');
      const q = query(
        salesRef, 
        where('createdAt', '>=', startOfDay),
        where('createdAt', '<=', endOfDay),
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await getDocs(q);
      const sales = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      smartCache.set(cacheKey, sales);
      return sales;
    } catch (error) {
      console.error('Error cargando ventas por fecha:', error);
      throw error;
    }
  },

  async addSale(saleData) {
    try {
      const salesRef = collection(db, 'sales');
      const docRef = await addDoc(salesRef, {
        ...saleData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      // Invalidar cache de ventas
      smartCache.invalidate('sales');
      
      return docRef.id;
    } catch (error) {
      console.error('Error agregando venta:', error);
      throw error;
    }
  },

  async updateSale(id, saleData) {
    try {
      const saleRef = doc(db, 'sales', id);
      await updateDoc(saleRef, {
        ...saleData,
        updatedAt: serverTimestamp()
      });
      
      // Invalidar cache
      smartCache.invalidate('sales');
      
      return id;
    } catch (error) {
      console.error('Error actualizando venta:', error);
      throw error;
    }
  }
};

// Servicio de turnos optimizado
export const shiftService = {
  async getAllShifts() {
    try {
      const cacheKey = 'shifts';
      const cached = smartCache.get(cacheKey);
      
      if (cached) {
        return cached;
      }

      const shiftsRef = collection(db, 'shifts');
      const snapshot = await getDocs(shiftsRef);
      
      let shifts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      // Ordenar por startTime/createdAt desc en cliente
      shifts = shifts.sort((a, b) => {
        const ta = a.startTime?.toDate?.()?.getTime?.() || a.createdAt?.toDate?.()?.getTime?.() || 0;
        const tb = b.startTime?.toDate?.()?.getTime?.() || b.createdAt?.toDate?.()?.getTime?.() || 0;
        return tb - ta;
      });

      smartCache.set(cacheKey, shifts);
      return shifts;
    } catch (error) {
      console.error('❌ Error cargando turnos:', error);
      throw error;
    }
  },

  async getActiveShift() {
    try {
      const shiftsRef = collection(db, 'shifts');
      const q = query(shiftsRef, where('status', '==', 'active'));
      const snapshot = await getDocs(q);
      
      if (snapshot.docs.length > 0) {
        const doc = snapshot.docs[0];
        return { id: doc.id, ...doc.data() };
      }
      return null;
    } catch (error) {
      console.error('❌ Error cargando turno activo:', error);
      throw error;
    }
  },

  async getShiftsByDate(date) {
    try {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      
      const shiftsRef = collection(db, 'shifts');
      const q = query(
        shiftsRef, 
        where('startTime', '>=', startOfDay),
        where('startTime', '<=', endOfDay)
      );
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('❌ Error cargando turnos por fecha:', error);
      throw error;
    }
  },

  async addShift(shiftData) {
    try {
      const shiftsRef = collection(db, 'shifts');
      const docRef = await addDoc(shiftsRef, {
        ...shiftData,
        // Guardar fecha adicional para filtros/orden sin índices compuestos
        date: shiftData.date || new Date().toISOString().split('T')[0],
        startTime: shiftData.startTime || serverTimestamp(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // Limpiar cache
      smartCache.invalidate('shifts');
      
      console.log('✅ Turno agregado:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('❌ Error agregando turno:', error);
      throw error;
    }
  },

  async closeShift(shiftId, closingData) {
    try {
      const shiftRef = doc(db, 'shifts', shiftId);
      await updateDoc(shiftRef, {
        ...closingData,
        endTime: serverTimestamp(),
        status: 'closed',
        updatedAt: serverTimestamp()
      });

      // Limpiar cache
      smartCache.invalidate('shifts');
      
      console.log('✅ Turno cerrado:', shiftId);
      return shiftId;
    } catch (error) {
      console.error('❌ Error cerrando turno:', error);
      throw error;
    }
  },

  async finalizarDia(daySummary) {
    try {
      console.log('🚀 Iniciando finalización del día:', daySummary.date);
      
      // Verificar que ambos turnos estén cerrados
      const openShifts = daySummary.shifts.filter(shift => shift.status === 'active');
      if (openShifts.length > 0) {
        throw new Error(`No se puede finalizar el día: ${openShifts.length} turno(s) aún abierto(s)`);
      }

      // Cerrar todos los turnos activos del día (por si acaso)
      const activeShifts = daySummary.shifts.filter(shift => shift.status === 'active');
      
      for (const shift of activeShifts) {
        const shiftRef = doc(db, 'shifts', shift.id);
        await updateDoc(shiftRef, {
          endTime: serverTimestamp(),
          status: 'closed',
          dayClosed: true,
          updatedAt: serverTimestamp()
        });
        console.log(`✅ Turno cerrado: ${shift.id}`);
      }

      // Crear registro del día cerrado con información completa
      const dayData = {
        date: daySummary.date,
        totalShifts: daySummary.totalShifts,
        totalSales: daySummary.totalSales,
        totalRevenue: daySummary.totalRevenue,
        shifts: daySummary.shifts.map(shift => ({
          id: shift.id,
          type: shift.type,
          employeeName: shift.employeeName,
          totalSales: shift.totalSales,
          totalRevenue: shift.totalRevenue,
          startTime: shift.startTime,
          endTime: shift.endTime,
          status: shift.status
        })),
        // Agregar estadísticas de métodos de pago si existen
        salesByPaymentMethod: daySummary.salesByPaymentMethod || {},
        closedAt: serverTimestamp(),
        status: 'closed',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const dayId = await dayService.createDay(dayData);
      console.log(`✅ Día registrado en base de datos: ${dayId}`);

      // Limpiar cache
      smartCache.invalidate('shifts');
      smartCache.invalidate('days');
      smartCache.invalidate('sales');
      
      console.log('✅ Día finalizado exitosamente:', daySummary.date);
      return { success: true, dayId };
    } catch (error) {
      console.error('❌ Error finalizando día:', error);
      throw error;
    }
  },

  async updateShift(shiftId, shiftData) {
    try {
      const shiftRef = doc(db, 'shifts', shiftId);
      await updateDoc(shiftRef, {
        ...shiftData,
        updatedAt: serverTimestamp()
      });

      // Limpiar cache
      smartCache.invalidate('shifts');
      
      console.log('✅ Turno actualizado:', shiftId);
      return shiftId;
    } catch (error) {
      console.error('❌ Error actualizando turno:', error);
      throw error;
    }
  },

  async updateShiftTotal(shiftId, total) {
    try {
      const shiftRef = doc(db, 'shifts', shiftId);
      await updateDoc(shiftRef, {
        total: Number(total) || 0,
        updatedAt: serverTimestamp()
      });

      // Limpiar cache
      smartCache.invalidate('shifts');
      
      console.log('✅ Total del turno actualizado:', shiftId, total);
    } catch (error) {
      console.error('❌ Error actualizando total del turno:', error);
      throw error;
    }
  }
};



// Servicio de inventario optimizado
export const inventoryService = {
  async getAllInventory() {
    try {
      const cacheKey = 'inventory';
      const cached = smartCache.get(cacheKey);
      
      if (cached) {
        return cached;
      }

      const inventoryRef = collection(db, 'inventory');
      const snapshot = await getDocs(inventoryRef);
      
      const inventory = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      smartCache.set(cacheKey, inventory);
      return inventory;
    } catch (error) {
      console.error('❌ Error cargando inventario:', error);
      throw error;
    }
  },

  async adjustInventory(productId, quantityChange) {
    try {
      const inventoryRef = collection(db, 'inventory');
      const q = query(inventoryRef, where('productId', '==', productId));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const docRef = snapshot.docs[0].ref;
        const data = snapshot.docs[0].data();
        const newStock = Math.max(0, (data.stock ?? 0) + quantityChange);
        await updateDoc(docRef, { stock: newStock, lastUpdated: serverTimestamp() });
        smartCache.invalidate('inventory');
        return newStock;
      }
      return null;
    } catch (error) {
      console.error('❌ Error ajustando inventario:', error);
      throw error;
    }
  },

  async updateInventoryItem(id, itemData) {
    try {
      const itemRef = doc(db, 'inventory', id);
      await updateDoc(itemRef, {
        ...itemData,
        updatedAt: serverTimestamp()
      });

      // Limpiar cache
      smartCache.invalidate('inventory');
      
      console.log('✅ Item de inventario actualizado:', id);
    } catch (error) {
      console.error('❌ Error actualizando item de inventario:', error);
      throw error;
    }
  }
};

// Funciones de reportes optimizadas
export const generateShiftReport = async (shiftId) => {
  try {
    const shift = await shiftService.getActiveShift();
    const sales = await saleService.getSalesByShift(shiftId);
    
    const totalSales = sales.reduce((sum, sale) => sum + sale.total, 0);
    const totalItems = sales.reduce((sum, sale) => sum + sale.items.length, 0);
    
    return {
      shiftId,
      shift,
      sales,
      totalSales,
      totalItems,
      salesCount: sales.length,
      averageTicket: sales.length > 0 ? totalSales / sales.length : 0
    };
  } catch (error) {
    console.error('❌ Error generando reporte de turno:', error);
    throw error;
  }
};

export const generateDailyReport = async (date) => {
  try {
    const sales = await saleService.getSalesByDate(date);
    const shifts = await shiftService.getShiftsByDate(date);
    
    const totalSales = sales.reduce((sum, sale) => sum + sale.total, 0);
    const totalItems = sales.reduce((sum, sale) => sum + sale.items.length, 0);
    
    return {
      date,
      sales,
      shifts,
      totalSales,
      totalItems,
      salesCount: sales.length,
      shiftsCount: shifts.length,
      averageTicket: sales.length > 0 ? totalSales / sales.length : 0
    };
  } catch (error) {
    console.error('❌ Error generando reporte diario:', error);
    throw error;
  }
};

// Función para sincronizar datos con Firebase
export const syncDataWithFirebase = async () => {
  try {
    console.log('🔄 Iniciando sincronización con Firebase...');
    
    // Sincronizar productos
    await productService.getAllProducts();
    
    // Sincronizar ventas
    await saleService.getAllSales();
    
    // Sincronizar turnos
    await shiftService.getAllShifts();
    
    // Sincronizar inventario
    await inventoryService.getAllInventory();
    
    console.log('✅ Sincronización completada');
    return true;
  } catch (error) {
    console.error('❌ Error en sincronización:', error);
    return false;
  }
};

// Servicio de clientes optimizado
export const customerService = {
  async getAllCustomers() {
    try {
      const cacheKey = 'customers';
      const cached = smartCache.get(cacheKey);
      
      if (cached) {
        return cached;
      }

      const customersRef = collection(db, 'customers');
      const snapshot = await getDocs(customersRef);
      
      const customers = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      smartCache.set(cacheKey, customers);
      return customers;
    } catch (error) {
      console.error('❌ Error cargando clientes:', error);
      throw error;
    }
  },

  async addCustomer(customerData) {
    try {
      const customersRef = collection(db, 'customers');
      const docRef = await addDoc(customersRef, {
        ...customerData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // Limpiar cache
      smartCache.invalidate('customers');
      
      console.log('✅ Cliente agregado:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('❌ Error agregando cliente:', error);
      throw error;
    }
  },

  async updateCustomer(customerId, customerData) {
    try {
      const customerRef = doc(db, 'customers', customerId);
      await updateDoc(customerRef, {
        ...customerData,
        updatedAt: serverTimestamp()
      });

      // Limpiar cache
      smartCache.invalidate(`customer_${customerId}`);
      smartCache.invalidate('customers');
      
      console.log('✅ Cliente actualizado:', customerId);
    } catch (error) {
      console.error('❌ Error actualizando cliente:', error);
      throw error;
    }
  },

  async deleteCustomer(customerId) {
    try {
      const customerRef = doc(db, 'customers', customerId);
      await deleteDoc(customerRef);

      // Limpiar cache
      smartCache.invalidate(`customer_${customerId}`);
      smartCache.invalidate('customers');
      
      console.log('✅ Cliente eliminado:', customerId);
    } catch (error) {
      console.error('❌ Error eliminando cliente:', error);
      throw error;
    }
  }
};

// Servicio de empleados optimizado
export const employeeService = {
  async getAllEmployees() {
    try {
      const cacheKey = 'employees';
      const cached = smartCache.get(cacheKey);
      
      if (cached) {
        return cached;
      }

      const employeesRef = collection(db, 'employees');
      const snapshot = await getDocs(employeesRef);
      
      const employees = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      smartCache.set(cacheKey, employees);
      return employees;
    } catch (error) {
      console.error('❌ Error cargando empleados:', error);
      throw error;
    }
  },

  async getEmployeeById(id) {
    try {
      const cacheKey = `employee_${id}`;
      const cached = smartCache.get(cacheKey);
      
      if (cached) {
        return cached;
      }

      const employeeRef = doc(db, 'employees', id);
      const snapshot = await getDoc(employeeRef);
      
      if (snapshot.exists()) {
        const employee = { id: snapshot.id, ...snapshot.data() };
        smartCache.set(cacheKey, employee);
        return employee;
      } else {
        throw new Error('Empleado no encontrado');
      }
    } catch (error) {
      console.error('❌ Error cargando empleado:', error);
      throw error;
    }
  },

  async addEmployee(employeeData) {
    try {
      const employeesRef = collection(db, 'employees');
      const docRef = await addDoc(employeesRef, {
        ...employeeData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // Limpiar cache
      smartCache.invalidate('employees');
      
      console.log('✅ Empleado agregado:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('❌ Error agregando empleado:', error);
      throw error;
    }
  },

  async updateEmployee(employeeId, employeeData) {
    try {
      const employeeRef = doc(db, 'employees', employeeId);
      await updateDoc(employeeRef, {
        ...employeeData,
        updatedAt: serverTimestamp()
      });

      // Limpiar cache
      smartCache.invalidate(`employee_${employeeId}`);
      smartCache.invalidate('employees');
      
      console.log('✅ Empleado actualizado:', employeeId);
    } catch (error) {
      console.error('❌ Error actualizando empleado:', error);
      throw error;
    }
  },

  async deleteEmployee(employeeId) {
    try {
      const employeeRef = doc(db, 'employees', employeeId);
      await deleteDoc(employeeRef);

      // Limpiar cache
      smartCache.invalidate(`employee_${employeeId}`);
      smartCache.invalidate('employees');
      
      console.log('✅ Empleado eliminado:', employeeId);
    } catch (error) {
      console.error('❌ Error eliminando empleado:', error);
      throw error;
    }
  }
};

// Servicio de autorización (permisos por email)
export const authzService = {
  async getUserPermissionsByEmail(email) {
    try {
      const employeesRef = collection(db, 'employees');
      const q = query(employeesRef, where('email', '==', email));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const data = snapshot.docs[0].data();
        const permissions = Array.isArray(data.permissions) ? data.permissions : [];
        // Si es admin, otorgar todos
        if (permissions.includes('admin')) {
          return ['admin', 'sales', 'inventory', 'purchases', 'expenses', 'reports', 'customers', 'suppliers', 'products'];
        }
        return permissions;
      }
      // Si no hay registro en empleados, permisos básicos de lectura
      return [];
    } catch (error) {
      console.error('❌ Error obteniendo permisos:', error);
      return [];
    }
  }
};

// Servicio de días (nuevo)
export const dayService = {
  async getCurrentDay() {
    try {
      const today = new Date().toISOString().split('T')[0];
      const daysRef = collection(db, 'days');
      const q = query(daysRef, where('date', '==', today));
      const snapshot = await getDocs(q);
      
      if (snapshot.docs.length > 0) {
        const doc = snapshot.docs[0];
        return { id: doc.id, ...doc.data() };
      }
      return null;
    } catch (error) {
      console.error('❌ Error cargando día actual:', error);
      throw error;
    }
  },

  async createDay(dayData) {
    try {
      const daysRef = collection(db, 'days');
      const docRef = await addDoc(daysRef, {
        ...dayData,
        date: dayData.date || new Date().toISOString().split('T')[0],
        status: 'active',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      smartCache.invalidate('days');
      return docRef.id;
    } catch (error) {
      console.error('❌ Error creando día:', error);
      throw error;
    }
  },

  async closeDay(dayId, closingData) {
    try {
      const dayRef = doc(db, 'days', dayId);
      await updateDoc(dayRef, {
        ...closingData,
        status: 'closed',
        closedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      smartCache.invalidate('days');
      return dayId;
    } catch (error) {
      console.error('❌ Error cerrando día:', error);
      throw error;
    }
  },

  async getShiftsForDay(date) {
    try {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      
      const shiftsRef = collection(db, 'shifts');
      const q = query(
        shiftsRef, 
        where('startTime', '>=', startOfDay),
        where('startTime', '<=', endOfDay)
      );
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('❌ Error cargando turnos del día:', error);
      throw error;
    }
  }
};

/* Datos simulados deshabilitados
const sampleProducts = [
  {
    name: "Asado de Tira",
    description: "Corte premium de carne vacuna para parrilla",
    category: "carne",
    price: 8500,
    stock: 25,
    unit: "kg",
    origin: "Tucumán",
    image: "🥩",
    minStock: 10,
    salesCount: 15
  },
  {
    name: "Pollo Entero",
    description: "Pollo fresco de granja local",
    category: "pollo",
    price: 3200,
    stock: 15,
    unit: "kg",
    origin: "Tucumán",
    image: "🍗",
    minStock: 8,
    salesCount: 22
  },
  {
    name: "Chorizo Parrillero",
    description: "Chorizo artesanal para parrilla",
    category: "embutidos",
    price: 1800,
    stock: 30,
    unit: "kg",
    origin: "Tucumán",
    image: "🥓",
    minStock: 12,
    salesCount: 18
  },
  {
    name: "Bife de Chorizo",
    description: "Corte fino de carne vacuna premium",
    category: "carne",
    price: 9200,
    stock: 18,
    unit: "kg",
    origin: "Tucumán",
    image: "🥩",
    minStock: 10,
    salesCount: 12
  },
  {
    name: "Pechuga de Pollo",
    description: "Pechuga sin hueso y sin piel",
    category: "pollo",
    price: 3800,
    stock: 22,
    unit: "kg",
    origin: "Tucumán",
    image: "🍗",
    minStock: 8,
    salesCount: 28
  },
  {
    name: "Salchicha Vienesa",
    description: "Salchicha tradicional alemana",
    category: "embutidos",
    price: 1500,
    stock: 35,
    unit: "kg",
    origin: "Tucumán",
    image: "🌭",
    minStock: 15,
    salesCount: 25
  },
  {
    name: "Vacío",
    description: "Corte de carne vacuna para asado",
    category: "carne",
    price: 7800,
    stock: 12,
    unit: "kg",
    origin: "Tucumán",
    image: "🥩",
    minStock: 8,
    salesCount: 8
  },
  {
    name: "Alitas de Pollo",
    description: "Alitas de pollo marinadas",
    category: "pollo",
    price: 2800,
    stock: 20,
    unit: "kg",
    origin: "Tucumán",
    image: "🍗",
    minStock: 10,
    salesCount: 16
  },
  {
    name: "Morcilla",
    description: "Morcilla tradicional argentina",
    category: "embutidos",
    price: 1200,
    stock: 18,
    unit: "kg",
    origin: "Tucumán",
    image: "🥓",
    minStock: 8,
    salesCount: 14
  },
  {
    name: "Lomo",
    description: "Lomo de cerdo fresco",
    category: "cerdo",
    price: 4500,
    stock: 14,
    unit: "kg",
    origin: "Tucumán",
    image: "🥩",
    minStock: 6,
    salesCount: 9
  },
  {
    name: "Costilla de Cerdo",
    description: "Costilla de cerdo para parrilla",
    category: "cerdo",
    price: 3800,
    stock: 16,
    unit: "kg",
    origin: "Tucumán",
    image: "🥩",
    minStock: 8,
    salesCount: 11
  },
  {
    name: "Panceta",
    description: "Panceta ahumada",
    category: "embutidos",
    price: 2200,
    stock: 12,
    unit: "kg",
    origin: "Tucumán",
    image: "🥓",
    minStock: 6,
    salesCount: 7
  },
  {
    name: "Matambre",
    description: "Matambre de ternera",
    category: "carne",
    price: 6800,
    stock: 8,
    unit: "kg",
    origin: "Tucumán",
    image: "🥩",
    minStock: 5,
    salesCount: 6
  },
  {
    name: "Pata y Muslo",
    description: "Pata y muslo de pollo",
    category: "pollo",
    price: 2500,
    stock: 25,
    unit: "kg",
    origin: "Tucumán",
    image: "🍗",
    minStock: 10,
    salesCount: 19
  },
  {
    name: "Jamón Cocido",
    description: "Jamón cocido premium",
    category: "embutidos",
    price: 3200,
    stock: 20,
    unit: "kg",
    origin: "Tucumán",
    image: "🥓",
    minStock: 8,
    salesCount: 13
  },
  {
    name: "Bife Ancho",
    description: "Bife ancho de carne vacuna",
    category: "carne",
    price: 9500,
    stock: 10,
    unit: "kg",
    origin: "Tucumán",
    image: "🥩",
    minStock: 6,
    salesCount: 5
  },
  {
    name: "Pollo Deshuesado",
    description: "Pollo deshuesado y fileteado",
    category: "pollo",
    price: 4200,
    stock: 18,
    unit: "kg",
    origin: "Tucumán",
    image: "🍗",
    minStock: 8,
    salesCount: 15
  },
  {
    name: "Chorizo Criollo",
    description: "Chorizo criollo tradicional",
    category: "embutidos",
    price: 1600,
    stock: 28,
    unit: "kg",
    origin: "Tucumán",
    image: "🥓",
    minStock: 10,
    salesCount: 20
  },
  {
    name: "Entraña",
    description: "Entraña premium para parrilla",
    category: "carne",
    price: 12000,
    stock: 6,
    unit: "kg",
    origin: "Tucumán",
    image: "🥩",
    minStock: 4,
    salesCount: 3
  },
  {
    name: "Pechuga Ahumada",
    description: "Pechuga de pollo ahumada",
    category: "embutidos",
    price: 2800,
    stock: 15,
    unit: "kg",
    origin: "Tucumán",
    image: "🍗",
    minStock: 6,
    salesCount: 12
  }
];

const sampleCustomers = [
  {
    name: "Juan Pérez",
    email: "juan.perez@email.com",
    phone: "381-123-4567",
    address: "San Martín 123, Monteros",
    status: "active",
    currentBalance: 0,
    creditLimit: 50000,
    lastPurchase: "2025-08-01"
  },
  {
    name: "María González",
    email: "maria.gonzalez@email.com",
    phone: "381-234-5678",
    address: "Belgrano 456, Monteros",
    status: "overdue",
    currentBalance: 15000,
    creditLimit: 30000,
    lastPurchase: "2025-07-25"
  },
  {
    name: "Carlos Rodríguez",
    email: "carlos.rodriguez@email.com",
    phone: "381-345-6789",
    address: "Sarmiento 789, Monteros",
    status: "active",
    currentBalance: 0,
    creditLimit: 75000,
    lastPurchase: "2025-08-03"
  },
  {
    name: "Ana López",
    email: "ana.lopez@email.com",
    phone: "381-456-7890",
    address: "Mitre 321, Monteros",
    status: "overdue",
    currentBalance: 25000,
    creditLimit: 40000,
    lastPurchase: "2025-07-20"
  },
  {
    name: "Roberto Silva",
    email: "roberto.silva@email.com",
    phone: "381-567-8901",
    address: "Independencia 654, Monteros",
    status: "active",
    currentBalance: 0,
    creditLimit: 60000,
    lastPurchase: "2025-08-02"
  }
];

const sampleShifts = [
  {
    type: "morning",
    date: "2025-01-15",
    openingAmount: 50000,
    employeeName: "Pedro Martínez",
    notes: "Turno mañana - Apertura normal",
    status: "closed",
    startTime: new Date("2025-01-15T08:00:00"),
    endTime: new Date("2025-01-15T14:00:00"),
    total: 125000,
    salesCount: 15,
    closingAmount: 175000,
    closingNotes: "Cierre normal - Todo en orden"
  },
  {
    type: "afternoon",
    date: "2025-01-15",
    openingAmount: 175000,
    employeeName: "Laura Fernández",
    notes: "Turno tarde - Continuación del día",
    status: "closed",
    startTime: new Date("2025-01-15T14:00:00"),
    endTime: new Date("2025-01-15T20:00:00"),
    total: 89000,
    salesCount: 12,
    closingAmount: 264000,
    closingNotes: "Cierre tarde - Ventas moderadas"
  },
  {
    type: "morning",
    date: "2025-01-16",
    openingAmount: 50000,
    employeeName: "Carlos Rodríguez",
    notes: "Turno mañana - Día siguiente",
    status: "closed",
    startTime: new Date("2025-01-16T08:00:00"),
    endTime: new Date("2025-01-16T14:00:00"),
    total: 98000,
    salesCount: 18,
    closingAmount: 148000,
    closingNotes: "Buen día de ventas"
  },
  {
    type: "afternoon",
    date: "2025-01-16",
    openingAmount: 148000,
    employeeName: "Ana López",
    notes: "Turno tarde - Continuación",
    status: "closed",
    startTime: new Date("2025-01-16T14:00:00"),
    endTime: new Date("2025-01-16T20:00:00"),
    total: 75000,
    salesCount: 10,
    closingAmount: 223000,
    closingNotes: "Cierre tarde - Ventas regulares"
  }
];

const sampleEmployees = [
  {
    name: "Pedro Martínez",
    email: "pedro.martinez@carniceria.com",
    phone: "381-111-2222",
    position: "Carnicero",
    salary: 45000,
    status: "active",
    hireDate: "2024-01-15",
    address: "Av. San Martín 100, Monteros"
  },
  {
    name: "Laura Fernández",
    email: "laura.fernandez@carniceria.com",
    phone: "381-222-3333",
    position: "Cajera",
    salary: 38000,
    status: "active",
    hireDate: "2024-03-20",
    address: "Belgrano 200, Monteros"
  },
  {
    name: "Miguel Torres",
    email: "miguel.torres@carniceria.com",
    phone: "381-333-4444",
    position: "Ayudante",
    salary: 32000,
    status: "active",
    hireDate: "2024-06-10",
    address: "Sarmiento 300, Monteros"
  },
  {
    name: "Carmen Ruiz",
    email: "carmen.ruiz@carniceria.com",
    phone: "381-444-5555",
    position: "Carnicero",
    salary: 42000,
    status: "active",
    hireDate: "2024-02-05",
    address: "Mitre 400, Monteros"
  },
  {
    name: "Diego Morales",
    email: "diego.morales@carniceria.com",
    phone: "381-555-6666",
    position: "Ayudante",
    salary: 30000,
    status: "inactive",
    hireDate: "2024-01-10",
    address: "Independencia 500, Monteros"
  }
];
*/

// Función para cargar datos simulados en Firebase
export const loadSampleData = async () => {
  // Deshabilitado: no cargar datos simulados
  console.log('ℹ️ Carga de datos simulados deshabilitada');
  return false;
};