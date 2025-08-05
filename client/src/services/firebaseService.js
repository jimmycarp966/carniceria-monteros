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

// Cache para mejorar el rendimiento
const cache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

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

// Función para cargar operaciones pendientes al iniciar
const loadPendingOperations = () => {
  const saved = localStorage.getItem('pendingOperations');
  if (saved) {
    pendingOperations = JSON.parse(saved);
  }
};

// Cargar operaciones pendientes al iniciar la app
loadPendingOperations();

// Función para verificar estado de conexión
export const checkConnectionStatus = () => {
  return {
    isOnline,
    pendingOperations: pendingOperations.length
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

// Servicio de productos optimizado con cache
export const productService = {
  async getAllProducts() {
    try {
      const cacheKey = 'products';
      const cached = cache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        console.log('📦 Usando cache para productos');
        return cached.data;
      }

      console.log('📦 Cargando productos desde Firebase...');
      const productsRef = collection(db, 'products');
      const snapshot = await getDocs(productsRef);
      
      const products = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Guardar en cache
      cache.set(cacheKey, {
        data: products,
        timestamp: Date.now()
      });

      console.log(`📦 ${products.length} productos cargados`);
      return products;
    } catch (error) {
      console.error('❌ Error cargando productos:', error);
      throw error;
    }
  },

  async getProductById(id) {
    try {
      const cacheKey = `product_${id}`;
      const cached = cache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        return cached.data;
      }

      const productRef = doc(db, 'products', id);
      const snapshot = await getDoc(productRef);
      
      if (snapshot.exists()) {
        const product = { id: snapshot.id, ...snapshot.data() };
        
        cache.set(cacheKey, {
          data: product,
          timestamp: Date.now()
        });
        
        return product;
      }
      return null;
    } catch (error) {
      console.error('❌ Error cargando producto:', error);
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

      // Limpiar cache de productos
      cache.delete('products');
      
      console.log('✅ Producto agregado:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('❌ Error agregando producto:', error);
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

      // Limpiar cache
      cache.delete('products');
      cache.delete(`product_${id}`);
      
      console.log('✅ Producto actualizado:', id);
    } catch (error) {
      console.error('❌ Error actualizando producto:', error);
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

      // Limpiar cache
      cache.delete('products');
      cache.delete(`product_${id}`);
      
      console.log('✅ Stock actualizado:', id, newStock);
    } catch (error) {
      console.error('❌ Error actualizando stock:', error);
      throw error;
    }
  },

  async deleteProduct(id) {
    try {
      const productRef = doc(db, 'products', id);
      await deleteDoc(productRef);

      // Limpiar cache
      cache.delete('products');
      cache.delete(`product_${id}`);
      
      console.log('✅ Producto eliminado:', id);
    } catch (error) {
      console.error('❌ Error eliminando producto:', error);
      throw error;
    }
  }
};

// Servicio de ventas optimizado
export const saleService = {
  async getAllSales() {
    try {
      const cacheKey = 'sales';
      const cached = cache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        return cached.data;
      }

      const salesRef = collection(db, 'sales');
      const snapshot = await getDocs(salesRef);
      
      const sales = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      cache.set(cacheKey, {
        data: sales,
        timestamp: Date.now()
      });

      return sales;
    } catch (error) {
      console.error('❌ Error cargando ventas:', error);
      throw error;
    }
  },

  async getSalesByShift(shiftId) {
    try {
      const salesRef = collection(db, 'sales');
      const q = query(salesRef, where('shiftId', '==', shiftId));
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('❌ Error cargando ventas por turno:', error);
      throw error;
    }
  },

  async getSalesByDate(date) {
    try {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      
      const salesRef = collection(db, 'sales');
      const q = query(
        salesRef, 
        where('createdAt', '>=', startOfDay),
        where('createdAt', '<=', endOfDay)
      );
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('❌ Error cargando ventas por fecha:', error);
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

      // Limpiar cache
      cache.delete('sales');
      
      console.log('✅ Venta agregada:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('❌ Error agregando venta:', error);
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

      // Limpiar cache
      cache.delete('sales');
      
      console.log('✅ Venta actualizada:', id);
    } catch (error) {
      console.error('❌ Error actualizando venta:', error);
      throw error;
    }
  }
};

// Servicio de turnos optimizado
export const shiftService = {
  async getAllShifts() {
    try {
      const cacheKey = 'shifts';
      const cached = cache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        return cached.data;
      }

      const shiftsRef = collection(db, 'shifts');
      const snapshot = await getDocs(shiftsRef);
      
      const shifts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      cache.set(cacheKey, {
        data: shifts,
        timestamp: Date.now()
      });

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
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // Limpiar cache
      cache.delete('shifts');
      
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
        status: 'closed',
        endTime: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // Limpiar cache
      cache.delete('shifts');
      
      console.log('✅ Turno cerrado:', shiftId);
    } catch (error) {
      console.error('❌ Error cerrando turno:', error);
      throw error;
    }
  },

  async updateShiftTotal(shiftId, total) {
    try {
      const shiftRef = doc(db, 'shifts', shiftId);
      await updateDoc(shiftRef, {
        total,
        updatedAt: serverTimestamp()
      });

      // Limpiar cache
      cache.delete('shifts');
      
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
      const cached = cache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        return cached.data;
      }

      const inventoryRef = collection(db, 'inventory');
      const snapshot = await getDocs(inventoryRef);
      
      const inventory = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      cache.set(cacheKey, {
        data: inventory,
        timestamp: Date.now()
      });

      return inventory;
    } catch (error) {
      console.error('❌ Error cargando inventario:', error);
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
      cache.delete('inventory');
      
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
      const cached = cache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        return cached.data;
      }

      const customersRef = collection(db, 'customers');
      const snapshot = await getDocs(customersRef);
      
      const customers = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      cache.set(cacheKey, {
        data: customers,
        timestamp: Date.now()
      });

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
      cache.delete('customers');
      
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
      cache.delete('customers');
      
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
      cache.delete('customers');
      
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
      const cached = cache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        return cached.data;
      }

      const employeesRef = collection(db, 'employees');
      const snapshot = await getDocs(employeesRef);
      
      const employees = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      cache.set(cacheKey, {
        data: employees,
        timestamp: Date.now()
      });

      return employees;
    } catch (error) {
      console.error('❌ Error cargando empleados:', error);
      throw error;
    }
  },

  async getEmployeeById(id) {
    try {
      const cacheKey = `employee_${id}`;
      const cached = cache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        return cached.data;
      }

      const employeeRef = doc(db, 'employees', id);
      const snapshot = await getDoc(employeeRef);
      
      if (snapshot.exists()) {
        const employee = { id: snapshot.id, ...snapshot.data() };
        
        cache.set(cacheKey, {
          data: employee,
          timestamp: Date.now()
        });
        
        return employee;
      }
      return null;
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
      cache.delete('employees');
      
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
      cache.delete('employees');
      cache.delete(`employee_${employeeId}`);
      
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
      cache.delete('employees');
      cache.delete(`employee_${employeeId}`);
      
      console.log('✅ Empleado eliminado:', employeeId);
    } catch (error) {
      console.error('❌ Error eliminando empleado:', error);
      throw error;
    }
  }
};

// Datos simulados para demostración - PRODUCTOS MEJORADOS
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

// Datos simulados para clientes
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

// Datos simulados para empleados
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

// Función para cargar datos simulados en Firebase
export const loadSampleData = async () => {
  try {
    console.log('🔄 Verificando si Firebase está vacío...');
    const existingProducts = await productService.getAllProducts();
    const existingCustomers = await customerService.getAllCustomers();
    const existingEmployees = await employeeService.getAllEmployees();
    
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

    if (existingEmployees.length === 0) {
      console.log('👨‍💼 Cargando empleados simulados...');
      
      for (const employee of sampleEmployees) {
        await employeeService.addEmployee(employee);
        console.log(`✅ Empleado simulado agregado: ${employee.name}`);
      }
      
      console.log('🎉 Empleados simulados cargados exitosamente');
    } else {
      console.log('👨‍💼 Firebase ya tiene empleados, no se cargan simulados');
    }

    return true;
  } catch (error) {
    console.error('❌ Error cargando datos simulados:', error);
    return false;
  }
}; 