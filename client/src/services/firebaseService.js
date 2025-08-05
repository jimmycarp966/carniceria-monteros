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
  serverTimestamp
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
// const addPendingOperation = (operation) => {
//   pendingOperations.push(operation);
//   localStorage.setItem('pendingOperations', JSON.stringify(pendingOperations));
// };

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
// const autoBackup = async (data, collectionName) => {
//   try {
//     const backup = {
//       data,
//       timestamp: new Date().toISOString(),
//       collection: collectionName,
//       version: '1.0'
//     };
//     
//     localStorage.setItem(`backup_${collectionName}`, JSON.stringify(backup));
//     console.log(`Backup automático creado para ${collectionName}`);
//   } catch (error) {
//     console.error('Error en backup automático:', error);
//   }
// };

// Función para restaurar desde backup
// const restoreFromBackup = (collectionName) => {
//   try {
//     const backup = localStorage.getItem(`backup_${collectionName}`);
//     if (backup) {
//       return JSON.parse(backup).data;
//     }
//     return null;
//   } catch (error) {
//     console.error('Error restaurando backup:', error);
//     return null;
//   }
// };

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
      console.log('🔄 Intentando cargar productos desde Firebase...');
      const querySnapshot = await getDocs(collection(db, 'products'));
      const products = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      console.log('✅ Productos cargados desde Firebase:', products.length, 'productos');
      return products;
    } catch (error) {
      console.error('❌ Error obteniendo productos:', error);
      console.error('🔍 Detalles del error:', {
        code: error.code,
        message: error.message
      });
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
      console.log('🔄 Intentando agregar producto a Firebase:', productData);
      const docRef = await addDoc(collection(db, 'products'), {
        ...productData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      console.log('✅ Producto agregado exitosamente con ID:', docRef.id);
      toast.success('Producto agregado exitosamente');
      return docRef.id;
    } catch (error) {
      console.error('❌ Error agregando producto:', error);
      console.error('🔍 Detalles del error:', {
        code: error.code,
        message: error.message,
        stack: error.stack
      });
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
      // Validar que el ID sea un string válido
      if (!id || typeof id !== 'string') {
        console.error('ID de producto inválido:', id);
        throw new Error('ID de producto inválido');
      }

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
      console.log('🔄 Intentando agregar venta a Firebase:', saleData);
      const docRef = await addDoc(collection(db, 'sales'), {
        ...saleData,
        date: serverTimestamp(),
        createdAt: serverTimestamp()
      });
      console.log('✅ Venta agregada exitosamente con ID:', docRef.id);
      toast.success('Venta registrada exitosamente');
      return docRef.id;
    } catch (error) {
      console.error('❌ Error agregando venta:', error);
      console.error('🔍 Detalles del error:', {
        code: error.code,
        message: error.message,
        stack: error.stack
      });
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
  async getAllShifts() {
    try {
      const querySnapshot = await getDocs(collection(db, 'shifts'));
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error obteniendo turnos:', error);
      throw error;
    }
  },

  async getActiveShift() {
    try {
      const querySnapshot = await getDocs(
        query(collection(db, 'shifts'), where('endTime', '==', null))
      );
      return querySnapshot.docs.length > 0 ? {
        id: querySnapshot.docs[0].id,
        ...querySnapshot.docs[0].data()
      } : null;
    } catch (error) {
      console.error('Error obteniendo turno activo:', error);
      throw error;
    }
  },

  async getShiftsByDate(date) {
    try {
      console.log('🔄 Obteniendo turnos para la fecha:', date);
      const querySnapshot = await getDocs(
        query(collection(db, 'shifts'), where('date', '==', date))
      );
      const shifts = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      console.log('✅ Turnos obtenidos para la fecha:', shifts.length);
      return shifts;
    } catch (error) {
      console.error('❌ Error obteniendo turnos por fecha:', error);
      throw error;
    }
  },

  async addShift(shiftData) {
    try {
      const docRef = await addDoc(collection(db, 'shifts'), {
        ...shiftData,
        createdAt: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      console.error('Error agregando turno:', error);
      throw error;
    }
  },

  async closeShift(shiftId, closingData) {
    try {
      await updateDoc(doc(db, 'shifts', shiftId), {
        ...closingData,
        endTime: serverTimestamp()
      });
    } catch (error) {
      console.error('Error cerrando turno:', error);
      throw error;
    }
  },

  async updateShiftTotal(shiftId, total) {
    try {
      await updateDoc(doc(db, 'shifts', shiftId), {
        totalSales: total
      });
    } catch (error) {
      console.error('Error actualizando total del turno:', error);
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
    console.log(`�� Inventario sincronizado: ${inventory.length}`);
    
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

// Servicios para clientes
export const customerService = {
  async getAllCustomers() {
    try {
      console.log('🔄 Obteniendo clientes desde Firebase...');
      const querySnapshot = await getDocs(collection(db, 'customers'));
      const customers = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      console.log('✅ Clientes obtenidos:', customers.length);
      return customers;
    } catch (error) {
      console.error('❌ Error obteniendo clientes:', error);
      throw error;
    }
  },

  async addCustomer(customerData) {
    try {
      console.log('🔄 Agregando cliente a Firebase:', customerData);
      const docRef = await addDoc(collection(db, 'customers'), {
        ...customerData,
        createdAt: serverTimestamp()
      });
      console.log('✅ Cliente agregado con ID:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('❌ Error agregando cliente:', error);
      throw error;
    }
  },

  async updateCustomer(customerId, customerData) {
    try {
      console.log('🔄 Actualizando cliente en Firebase:', customerId);
      await updateDoc(doc(db, 'customers', customerId), {
        ...customerData,
        updatedAt: serverTimestamp()
      });
      console.log('✅ Cliente actualizado');
    } catch (error) {
      console.error('❌ Error actualizando cliente:', error);
      throw error;
    }
  },

  async deleteCustomer(customerId) {
    try {
      console.log('🔄 Eliminando cliente de Firebase:', customerId);
      await deleteDoc(doc(db, 'customers', customerId));
      console.log('✅ Cliente eliminado');
    } catch (error) {
      console.error('❌ Error eliminando cliente:', error);
      throw error;
    }
  }
};

// Datos simulados para demostración
const sampleProducts = [
  {
    name: "Asado de Tira",
    description: "Corte premium de carne vacuna",
    category: "carne",
    price: 8500,
    stock: 25,
    unit: "kg",
    origin: "Tucumán",
    image: "🥩",
    minStock: 10
  },
  {
    name: "Pollo Entero",
    description: "Pollo fresco de granja",
    category: "pollo",
    price: 3200,
    stock: 15,
    unit: "kg",
    origin: "Tucumán",
    image: "🍗",
    minStock: 8
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
    minStock: 12
  },
  {
    name: "Bife de Chorizo",
    description: "Corte fino de carne vacuna",
    category: "carne",
    price: 9200,
    stock: 18,
    unit: "kg",
    origin: "Tucumán",
    image: "🥩",
    minStock: 10
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
    minStock: 8
  },
  {
    name: "Salchicha Vienesa",
    description: "Salchicha tradicional",
    category: "embutidos",
    price: 1500,
    stock: 35,
    unit: "kg",
    origin: "Tucumán",
    image: "🌭",
    minStock: 15
  }
];

const sampleCustomers = [
  {
    name: "Juan Pérez",
    email: "juan.perez@email.com",
    phone: "381-123-4567",
    address: "Av. San Martín 123, Monteros",
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

// Función para cargar datos simulados en Firebase
export const loadSampleData = async () => {
  try {
    console.log('🔄 Verificando si Firebase está vacío...');
    const existingProducts = await productService.getAllProducts();
    const existingCustomers = await customerService.getAllCustomers();
    
    if (existingProducts.length === 0) {
      console.log('📦 Firebase está vacío, cargando productos simulados...');
      
      for (const product of sampleProducts) {
        await productService.addProduct(product);
        console.log(`✅ Producto simulado agregado: ${product.name}`);
      }
      
      console.log('🎉 Productos simulados cargados exitosamente');
    } else {
      console.log('📦 Firebase ya tiene productos, no se cargan simulados');
    }

    if (existingCustomers.length === 0) {
      console.log('👥 Cargando clientes simulados...');
      
      for (const customer of sampleCustomers) {
        await customerService.addCustomer(customer);
        console.log(`✅ Cliente simulado agregado: ${customer.name}`);
      }
      
      console.log('🎉 Clientes simulados cargados exitosamente');
    } else {
      console.log('👥 Firebase ya tiene clientes, no se cargan simulados');
    }

    return true;
  } catch (error) {
    console.error('❌ Error cargando datos simulados:', error);
    return false;
  }
}; 