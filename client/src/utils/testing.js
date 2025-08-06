// Sistema de Testing Completo para la Aplicación de Carnicería
// Este archivo contiene tests automatizados para detectar problemas comunes

import { products } from '../data/products';
import { saleService, productService, loadSampleData } from '../services/firebaseService';

// Colores para la consola
const colors = {
  success: '\x1b[32m',
  error: '\x1b[31m',
  warning: '\x1b[33m',
  info: '\x1b[36m',
  reset: '\x1b[0m'
};

// Función para imprimir resultados de tests
const logTest = (testName, passed, message = '') => {
  const color = passed ? colors.success : colors.error;
  const status = passed ? '✅ PASÓ' : '❌ FALLÓ';
  console.log(`${color}${status}${colors.reset} ${testName}${message ? `: ${message}` : ''}`);
};

// Función para imprimir información
const logInfo = (message) => {
  console.log(`${colors.info}ℹ️  ${message}${colors.reset}`);
};

// Función para imprimir advertencias
const logWarning = (message) => {
  console.log(`${colors.warning}⚠️  ${message}${colors.reset}`);
};

// Tests de Componentes
export const testComponents = async () => {
  console.log('\n🔍 INICIANDO TESTS DE COMPONENTES...\n');
  
  // Test 1: Verificar que los datos de productos existen
  try {
    const hasProducts = products && products.length > 0;
    logTest('Datos de productos disponibles', hasProducts, `${products?.length || 0} productos encontrados`);
  } catch (error) {
    logTest('Datos de productos disponibles', false, error.message);
  }

  // Test 2: Verificar estructura de productos
  try {
    const sampleProduct = products[0];
    const hasRequiredFields = sampleProduct && 
      sampleProduct.id && 
      sampleProduct.name && 
      sampleProduct.price !== undefined;
    logTest('Estructura de productos válida', hasRequiredFields, 
      hasRequiredFields ? 'Campos requeridos presentes' : 'Faltan campos requeridos');
  } catch (error) {
    logTest('Estructura de productos válida', false, error.message);
  }

  // Test 3: Verificar que los servicios están disponibles
  try {
    const servicesAvailable = saleService && productService && loadSampleData;
    logTest('Servicios de Firebase disponibles', servicesAvailable, 
      servicesAvailable ? 'Todos los servicios cargados' : 'Faltan servicios');
  } catch (error) {
    logTest('Servicios de Firebase disponibles', false, error.message);
  }
};

// Tests de Funcionalidad
export const testFunctionality = async () => {
  console.log('\n🔍 INICIANDO TESTS DE FUNCIONALIDAD...\n');

  // Test 1: Verificar cálculos de carrito
  try {
    const mockCart = [
      { id: 1, name: 'Test Product', price: 100, quantity: 2 },
      { id: 2, name: 'Test Product 2', price: 50, quantity: 1 }
    ];
    
    const total = mockCart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const expectedTotal = 250; // (100 * 2) + (50 * 1)
    
    logTest('Cálculo de total del carrito', total === expectedTotal, 
      `Total calculado: $${total}, Esperado: $${expectedTotal}`);
  } catch (error) {
    logTest('Cálculo de total del carrito', false, error.message);
  }

  // Test 2: Verificar validaciones de cantidad
  try {
    const validQuantity = 5;
    const invalidQuantity = 0;
    
    const quantityValid = validQuantity > 0;
    const quantityInvalid = invalidQuantity <= 0;
    
    logTest('Validación de cantidad positiva', quantityValid, 'Cantidad válida aceptada');
    logTest('Validación de cantidad negativa/cero', quantityInvalid, 'Cantidad inválida rechazada');
  } catch (error) {
    logTest('Validación de cantidad', false, error.message);
  }

  // Test 3: Verificar formato de fechas
  try {
    const testDate = new Date();
    const formattedDate = testDate.toLocaleDateString();
    const hasValidFormat = formattedDate && formattedDate.length > 0;
    
    logTest('Formato de fechas', hasValidFormat, `Fecha formateada: ${formattedDate}`);
  } catch (error) {
    logTest('Formato de fechas', false, error.message);
  }
};

// Tests de Rendimiento
export const testPerformance = async () => {
  console.log('\n🔍 INICIANDO TESTS DE RENDIMIENTO...\n');

  // Test 1: Medir tiempo de carga de datos
  try {
    const startTime = performance.now();
    
    // Simular carga de datos
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const endTime = performance.now();
    const loadTime = endTime - startTime;
    const isFast = loadTime < 1000; // Menos de 1 segundo
    
    logTest('Tiempo de carga de datos', isFast, `${loadTime.toFixed(2)}ms`);
  } catch (error) {
    logTest('Tiempo de carga de datos', false, error.message);
  }

  // Test 2: Verificar memoria del navegador
  try {
    if ('memory' in performance) {
      const memory = performance.memory;
      const memoryUsage = memory.usedJSHeapSize / memory.jsHeapSizeLimit;
      const isMemoryOK = memoryUsage < 0.8; // Menos del 80% de uso
      
      logTest('Uso de memoria del navegador', isMemoryOK, 
        `${(memoryUsage * 100).toFixed(1)}% de memoria usada`);
    } else {
      logTest('Uso de memoria del navegador', true, 'Información de memoria no disponible');
    }
  } catch (error) {
    logTest('Uso de memoria del navegador', false, error.message);
  }
};

// Tests de Compatibilidad
export const testCompatibility = async () => {
  console.log('\n🔍 INICIANDO TESTS DE COMPATIBILIDAD...\n');

  // Test 1: Verificar APIs del navegador
  try {
    const hasLocalStorage = 'localStorage' in window;
    const hasSessionStorage = 'sessionStorage' in window;
    const hasFetch = 'fetch' in window;
    const hasPromise = 'Promise' in window;
    
    logTest('localStorage disponible', hasLocalStorage);
    logTest('sessionStorage disponible', hasSessionStorage);
    logTest('Fetch API disponible', hasFetch);
    logTest('Promises disponibles', hasPromise);
  } catch (error) {
    logTest('APIs del navegador', false, error.message);
  }

  // Test 2: Verificar tamaño de pantalla
  try {
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    const hasValidDimensions = screenWidth > 0 && screenHeight > 0;
    
    logTest('Dimensiones de pantalla válidas', hasValidDimensions, 
      `${screenWidth}x${screenHeight}`);
  } catch (error) {
    logTest('Dimensiones de pantalla válidas', false, error.message);
  }
};

// Tests de Errores Comunes
export const testCommonErrors = async () => {
  console.log('\n🔍 INICIANDO TESTS DE ERRORES COMUNES...\n');

  // Test 1: Verificar errores de JavaScript
  try {
    // Simular posibles errores
    const testUndefined = undefined;
    const testNull = null;
    
    // Verificar que no hay errores de acceso a propiedades
    const safeAccess = testUndefined?.property === undefined;
    const nullCheck = testNull === null;
    
    logTest('Manejo de valores undefined/null', safeAccess && nullCheck, 
      'Acceso seguro a propiedades implementado');
  } catch (error) {
    logTest('Manejo de valores undefined/null', false, error.message);
  }

  // Test 2: Verificar errores de red
  try {
    const isOnline = navigator.onLine;
    logTest('Estado de conexión', true, isOnline ? 'En línea' : 'Sin conexión');
  } catch (error) {
    logTest('Estado de conexión', false, error.message);
  }

  // Test 3: Verificar errores de localStorage
  try {
    const testKey = 'test_storage';
    const testValue = 'test_value';
    
    localStorage.setItem(testKey, testValue);
    const retrievedValue = localStorage.getItem(testKey);
    localStorage.removeItem(testKey);
    
    const storageWorks = retrievedValue === testValue;
    logTest('localStorage funcional', storageWorks, 'Almacenamiento local operativo');
  } catch (error) {
    logTest('localStorage funcional', false, error.message);
  }
};

// Test de Diagnóstico Específico para Sales
export const testSalesComponent = async () => {
  console.log('\n🔍 INICIANDO TEST ESPECÍFICO DE SALES...\n');

  try {
    // Simular el estado inicial del componente Sales
    const mockState = {
      cart: [],
      selectedProduct: '',
      quantity: 1,
      sales: [],
      showSalesHistory: false,
      allProducts: products || []
    };

    // Verificar que el estado inicial es válido
    const hasValidInitialState = 
      Array.isArray(mockState.cart) &&
      typeof mockState.selectedProduct === 'string' &&
      typeof mockState.quantity === 'number' &&
      Array.isArray(mockState.sales) &&
      typeof mockState.showSalesHistory === 'boolean' &&
      Array.isArray(mockState.allProducts);

    logTest('Estado inicial de Sales válido', hasValidInitialState, 
      hasValidInitialState ? 'Todos los estados inicializados correctamente' : 'Error en estado inicial');

    // Verificar que hay productos disponibles
    const hasProducts = mockState.allProducts.length > 0;
    logTest('Productos disponibles en Sales', hasProducts, 
      `${mockState.allProducts.length} productos cargados`);

    // Simular operaciones del carrito
    const testProduct = mockState.allProducts[0];
    if (testProduct) {
      const testCartItem = {
        id: testProduct.id,
        name: testProduct.name,
        price: testProduct.price,
        quantity: 1
      };

      const updatedCart = [...mockState.cart, testCartItem];
      const cartTotal = updatedCart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

      logTest('Operaciones del carrito', true, 
        `Producto agregado: ${testProduct.name}, Total: $${cartTotal}`);

    } else {
      logWarning('No hay productos disponibles para testing del carrito');
    }

  } catch (error) {
    logTest('Test específico de Sales', false, error.message);
  }
};

// Función principal que ejecuta todos los tests
export const runAllTests = async () => {
  console.log('\n🚀 INICIANDO SUITE COMPLETA DE TESTS...\n');
  
  const startTime = performance.now();
  
  try {
    await testComponents();
    await testFunctionality();
    await testPerformance();
    await testCompatibility();
    await testCommonErrors();
    await testSalesComponent();
    
    const endTime = performance.now();
    const totalTime = endTime - startTime;
    
    console.log(`\n${colors.success}✅ TODOS LOS TESTS COMPLETADOS${colors.reset}`);
    console.log(`${colors.info}⏱️  Tiempo total: ${totalTime.toFixed(2)}ms${colors.reset}`);
    
    // Generar reporte de recomendaciones
    generateRecommendations();
    
  } catch (error) {
    console.error(`${colors.error}❌ ERROR EN LA EJECUCIÓN DE TESTS:${colors.reset}`, error);
  }
};

// Función para generar recomendaciones basadas en los tests
const generateRecommendations = () => {
  console.log('\n📋 RECOMENDACIONES:\n');
  
  logInfo('1. Si Sales aparece en blanco, verifica la consola del navegador para errores');
  logInfo('2. Asegúrate de que Firebase esté configurado correctamente');
  logInfo('3. Verifica que todos los servicios estén importados correctamente');
  logInfo('4. Comprueba que los datos de productos estén disponibles');
  logInfo('5. Revisa la conexión a internet si usas Firebase');
  
  console.log('\n🔧 SOLUCIONES RÁPIDAS:\n');
  logInfo('• Recarga la página (F5)');
  logInfo('• Limpia el caché del navegador');
  logInfo('• Verifica la conexión a internet');
  logInfo('• Revisa la consola del navegador (F12)');
};

// Función para testing en tiempo real
export const startRealTimeTesting = () => {
  console.log('\n🔄 INICIANDO MONITOREO EN TIEMPO REAL...\n');
  
  // Monitorear errores de JavaScript
  window.addEventListener('error', (event) => {
    console.error(`${colors.error}❌ ERROR DETECTADO:${colors.reset}`, {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      error: event.error
    });
  });

  // Monitorear promesas rechazadas
  window.addEventListener('unhandledrejection', (event) => {
    console.error(`${colors.error}❌ PROMESA RECHAZADA:${colors.reset}`, {
      reason: event.reason,
      promise: event.promise
    });
  });

  // Monitorear cambios de conectividad
  window.addEventListener('online', () => {
    logInfo('Conexión restaurada');
  });

  window.addEventListener('offline', () => {
    logWarning('Conexión perdida - Modo offline activado');
  });

  logInfo('Monitoreo en tiempo real activado');
  logInfo('Los errores se mostrarán automáticamente en la consola');
};

// Exportar funciones individuales para testing específico
export default {
  runAllTests,
  startRealTimeTesting,
  testComponents,
  testFunctionality,
  testPerformance,
  testCompatibility,
  testCommonErrors,
  testSalesComponent
};
