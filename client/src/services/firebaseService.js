import { 
  getFirestore, 
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
  enableNetwork,
  disableNetwork,
  onSnapshot
} from 'firebase/firestore';
import { db } from '../firebase';
import toast from 'react-hot-toast';

// Estado de conexión
let isOnline = navigator.onLine;
let pendingOperations = [];

// Detectar cambios de conectividad
window.addEventListener('online', () => {
  isOnline = true;
  console.log('Conexión restaurada');
  syncPendingOperations();
});

window.addEventListener('offline', () => {
  isOnline = false;
  console.log('Sin conexión - Modo offline activado');
});

// Función para sincronizar operaciones pendientes
const syncPendingOperations = async () => {
  if (pendingOperations.length === 0) return;
  
  console.log(`Sincronizando ${pendingOperations.length} operaciones pendientes...`);
  
  for (const operation of pendingOperations) {
    try {
      await operation();
      console.log('Operación sincronizada exitosamente');
    } catch (error) {
      console.error('Error sincronizando operación:', error);
    }
  }
  
  pendingOperations = [];
  console.log('Sincronización completada');
};

// Función para agregar operación pendiente
const addPendingOperation = (operation) => {
  pendingOperations.push(operation);
  localStorage.setItem('pendingOperations', JSON.stringify(pendingOperations));
};

// Función para cargar operaciones pendientes al iniciar
const loadPendingOperations = () => {
  const saved = localStorage.getItem('pendingOperations');
  if (saved) {
    pendingOperations = JSON.parse(saved);
  }
};

// Cargar operaciones pendientes al iniciar la app
loadPendingOperations();

// Función para backup automático
const autoBackup = async (data, collectionName) => {
  try {
    const backup = {
      data,
      timestamp: new Date().toISOString(),
      collection: collectionName,
      version: '1.0'
    };
    
    localStorage.setItem(`backup_${collectionName}`, JSON.stringify(backup));
    console.log(`Backup automático creado para ${collectionName}`);
  } catch (error) {
    console.error('Error en backup automático:', error);
  }
};

// Función para restaurar desde backup
const restoreFromBackup = (collectionName) => {
  try {
    const backup = localStorage.getItem(`backup_${collectionName}`);
    if (backup) {
      return JSON.parse(backup).data;
    }
    return null;
  } catch (error) {
    console.error('Error restaurando backup:', error);
    return null;
  }
};

// Función para verificar estado de conexión
export const checkConnectionStatus = () => {
  return {
    isOnline,
    pendingOperations: pendingOperations.length
  };
};

// Función para forzar sincronización
export const forceSync = async () => {
  if (isOnline) {
    await syncPendingOperations();
    return true;
  }
  return false;
};

// Servicios para Productos
export const productService = {
  // Obtener todos los productos
  async getAllProducts() {
    try {
      const querySnapshot = await getDocs(collection(db, 'products'));
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error obteniendo productos:', error);
      toast.error('Error al cargar productos');
      return [];
    }
  },

  // Obtener producto por ID
  async getProductById(id) {
    try {
      const docRef = doc(db, 'products', id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
      }
      return null;
    } catch (error) {
      console.error('Error obteniendo producto:', error);
      toast.error('Error al cargar producto');
      return null;
    }
  },

  // Agregar producto
  async addProduct(productData) {
    try {
      const docRef = await addDoc(collection(db, 'products'), {
        ...productData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      toast.success('Producto agregado exitosamente');
      return docRef.id;
    } catch (error) {
      console.error('Error agregando producto:', error);
      toast.error('Error al agregar producto');
      throw error;
    }
  },

  // Actualizar producto
  async updateProduct(id, productData) {
    try {
      const docRef = doc(db, 'products', id);
      await updateDoc(docRef, {
        ...productData,
        updatedAt: serverTimestamp()
      });
      toast.success('Producto actualizado exitosamente');
    } catch (error) {
      console.error('Error actualizando producto:', error);
      toast.error('Error al actualizar producto');
      throw error;
    }
  },

  // Actualizar stock de producto
  async updateProductStock(id, newStock) {
    try {
      const docRef = doc(db, 'products', id);
      await updateDoc(docRef, {
        stock: newStock,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error actualizando stock:', error);
      toast.error('Error al actualizar stock');
      throw error;
    }
  },

  // Eliminar producto
  async deleteProduct(id) {
    try {
      await deleteDoc(doc(db, 'products', id));
      toast.success('Producto eliminado exitosamente');
    } catch (error) {
      console.error('Error eliminando producto:', error);
      toast.error('Error al eliminar producto');
      throw error;
    }
  }
};

// Servicios para Ventas
export const saleService = {
  // Obtener todas las ventas
  async getAllSales() {
    try {
      const querySnapshot = await getDocs(collection(db, 'sales'));
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error obteniendo ventas:', error);
      toast.error('Error al cargar ventas');
      return [];
    }
  },

  // Obtener ventas por turno
  async getSalesByShift(shiftId) {
    try {
      const q = query(
        collection(db, 'sales'),
        where('shiftId', '==', shiftId)
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error obteniendo ventas por turno:', error);
      toast.error('Error al cargar ventas del turno');
      return [];
    }
  },

  // Obtener ventas por fecha
  async getSalesByDate(date) {
    try {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const q = query(
        collection(db, 'sales'),
        where('date', '>=', startOfDay),
        where('date', '<=', endOfDay)
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error obteniendo ventas por fecha:', error);
      toast.error('Error al cargar ventas del día');
      return [];
    }
  },

  // Agregar venta
  async addSale(saleData) {
    try {
      const docRef = await addDoc(collection(db, 'sales'), {
        ...saleData,
        date: serverTimestamp(),
        createdAt: serverTimestamp()
      });
      toast.success('Venta registrada exitosamente');
      return docRef.id;
    } catch (error) {
      console.error('Error agregando venta:', error);
      toast.error('Error al registrar venta');
      throw error;
    }
  },

  // Actualizar venta
  async updateSale(id, saleData) {
    try {
      const docRef = doc(db, 'sales', id);
      await updateDoc(docRef, {
        ...saleData,
        updatedAt: serverTimestamp()
      });
      toast.success('Venta actualizada exitosamente');
    } catch (error) {
      console.error('Error actualizando venta:', error);
      toast.error('Error al actualizar venta');
      throw error;
    }
  }
};

// Servicios para Turnos
export const shiftService = {
  // Obtener todos los turnos
  async getAllShifts() {
    try {
      const querySnapshot = await getDocs(collection(db, 'shifts'));
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error obteniendo turnos:', error);
      toast.error('Error al cargar turnos');
      return [];
    }
  },

  // Obtener turno activo
  async getActiveShift() {
    try {
      const q = query(
        collection(db, 'shifts'),
        where('isActive', '==', true)
      );
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        return { id: doc.id, ...doc.data() };
      }
      return null;
    } catch (error) {
      console.error('Error obteniendo turno activo:', error);
      toast.error('Error al cargar turno activo');
      return null;
    }
  },

  // Agregar turno
  async addShift(shiftData) {
    try {
      const docRef = await addDoc(collection(db, 'shifts'), {
        ...shiftData,
        isActive: true,
        createdAt: serverTimestamp()
      });
      toast.success('Turno iniciado exitosamente');
      return docRef.id;
    } catch (error) {
      console.error('Error agregando turno:', error);
      toast.error('Error al iniciar turno');
      throw error;
    }
  },

  // Cerrar turno
  async closeShift(shiftId, closingData) {
    try {
      const docRef = doc(db, 'shifts', shiftId);
      await updateDoc(docRef, {
        ...closingData,
        isActive: false,
        closedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      toast.success('Turno cerrado exitosamente');
    } catch (error) {
      console.error('Error cerrando turno:', error);
      toast.error('Error al cerrar turno');
      throw error;
    }
  }
};

// Servicios para Inventario
export const inventoryService = {
  // Obtener todo el inventario
  async getAllInventory() {
    try {
      const querySnapshot = await getDocs(collection(db, 'inventory'));
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error obteniendo inventario:', error);
      toast.error('Error al cargar inventario');
      return [];
    }
  },

  // Actualizar item de inventario
  async updateInventoryItem(id, itemData) {
    try {
      const docRef = doc(db, 'inventory', id);
      await updateDoc(docRef, {
        ...itemData,
        updatedAt: serverTimestamp()
      });
      toast.success('Inventario actualizado exitosamente');
    } catch (error) {
      console.error('Error actualizando inventario:', error);
      toast.error('Error al actualizar inventario');
      throw error;
    }
  }
};

// Servicios para Reportes
export const reportService = {
  // Generar reporte de ventas por turno
  async generateShiftReport(shiftId) {
    try {
      const sales = await saleService.getSalesByShift(shiftId);
      const shift = await getDoc(doc(db, 'shifts', shiftId));
      
      if (!shift.exists()) {
        throw new Error('Turno no encontrado');
      }

      const shiftData = shift.data();
      const totalSales = sales.reduce((sum, sale) => sum + sale.total, 0);
      const totalItems = sales.reduce((sum, sale) => sum + sale.items.length, 0);

      return {
        shiftId,
        shiftData,
        sales,
        totalSales,
        totalItems,
        salesCount: sales.length,
        generatedAt: new Date()
      };
    } catch (error) {
      console.error('Error generando reporte de turno:', error);
      toast.error('Error al generar reporte');
      throw error;
    }
  },

  // Generar reporte diario
  async generateDailyReport(date) {
    try {
      const sales = await saleService.getSalesByDate(date);
      const totalSales = sales.reduce((sum, sale) => sum + sale.total, 0);
      const totalItems = sales.reduce((sum, sale) => sum + sale.items.length, 0);

      // Agrupar por turno
      const salesByShift = sales.reduce((acc, sale) => {
        const shiftId = sale.shiftId || 'unknown';
        if (!acc[shiftId]) {
          acc[shiftId] = [];
        }
        acc[shiftId].push(sale);
        return acc;
      }, {});

      return {
        date,
        sales,
        salesByShift,
        totalSales,
        totalItems,
        salesCount: sales.length,
        generatedAt: new Date()
      };
    } catch (error) {
      console.error('Error generando reporte diario:', error);
      toast.error('Error al generar reporte');
      throw error;
    }
  }
};

// Función para sincronizar datos locales con Firebase
export const syncDataWithFirebase = async () => {
  try {
    console.log('🔄 Iniciando sincronización con Firebase...');
    
    // Sincronizar productos
    const products = await productService.getAllProducts();
    console.log(`📦 Productos sincronizados: ${products.length}`);
    
    // Sincronizar ventas
    const sales = await saleService.getAllSales();
    console.log(`💰 Ventas sincronizadas: ${sales.length}`);
    
    // Sincronizar turnos
    const shifts = await shiftService.getAllShifts();
    console.log(`🕐 Turnos sincronizados: ${shifts.length}`);
    
    // Sincronizar inventario
    const inventory = await inventoryService.getAllInventory();
    console.log(`📊 Inventario sincronizado: ${inventory.length}`);
    
    console.log('✅ Sincronización completada');
    toast.success('Datos sincronizados correctamente');
    
    return {
      products,
      sales,
      shifts,
      inventory
    };
  } catch (error) {
    console.error('❌ Error en sincronización:', error);
    toast.error('Error al sincronizar datos');
    throw error;
  }
}; 