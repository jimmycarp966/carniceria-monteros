// Script de prueba para verificar funcionamiento del sistema
import { realtimeService, dataSyncService, notificationService } from '../services/realtimeService';
import { productService, saleService, shiftService } from '../services/firebaseService';

export const runSystemTests = async () => {
  console.log('🧪 Iniciando pruebas del sistema...');
  
  const results = {
    realtimeService: false,
    dataSync: false,
    notifications: false,
    firebaseConnection: false,
    salesSystem: false,
    inventorySystem: false,
    shiftSystem: false
  };

  try {
    // 1. Probar conexión a Firebase
    console.log('1️⃣ Probando conexión a Firebase...');
    try {
      await productService.getAllProducts(1, 5);
      results.firebaseConnection = true;
      console.log('✅ Conexión a Firebase: OK');
    } catch (error) {
      console.error('❌ Error en conexión a Firebase:', error);
    }

    // 2. Probar servicio de tiempo real
    console.log('2️⃣ Probando servicio de tiempo real...');
    try {
      realtimeService.initializeRealtimeListeners();
      const syncState = realtimeService.getSyncState();
      results.realtimeService = syncState.isOnline !== undefined;
      console.log('✅ Servicio de tiempo real: OK', syncState);
    } catch (error) {
      console.error('❌ Error en servicio de tiempo real:', error);
    }

    // 3. Probar sincronización de datos
    console.log('3️⃣ Probando sincronización de datos...');
    try {
      const testSaleData = {
        items: [{
          productId: 'test-product',
          name: 'Producto de Prueba',
          quantity: 1,
          price: 1000,
          subtotal: 1000
        }],
        total: 1000,
        discount: 0,
        finalTotal: 1000,
        paymentMethod: 'cash',
        cashAmount: 1000,
        change: 0,
        customer: null,
        shiftId: 'test-shift',
        timestamp: new Date().toISOString()
      };

      const saleId = await dataSyncService.syncSale(testSaleData);
      results.dataSync = saleId !== undefined;
      console.log('✅ Sincronización de datos: OK', saleId);
    } catch (error) {
      console.error('❌ Error en sincronización de datos:', error);
    }

    // 4. Probar sistema de notificaciones
    console.log('4️⃣ Probando sistema de notificaciones...');
    try {
      await notificationService.notifySaleCompleted({
        saleId: 'test-sale',
        total: 1000,
        items: 1
      });
      results.notifications = true;
      console.log('✅ Sistema de notificaciones: OK');
    } catch (error) {
      console.error('❌ Error en sistema de notificaciones:', error);
    }

    // 5. Probar sistema de ventas
    console.log('5️⃣ Probando sistema de ventas...');
    try {
      const sales = await saleService.getAllSales(1, 5);
      results.salesSystem = Array.isArray(sales);
      console.log('✅ Sistema de ventas: OK', sales.length, 'ventas encontradas');
    } catch (error) {
      console.error('❌ Error en sistema de ventas:', error);
    }

    // 6. Probar sistema de inventario
    console.log('6️⃣ Probando sistema de inventario...');
    try {
      const inventory = await productService.getAllProducts(1, 5);
      results.inventorySystem = Array.isArray(inventory);
      console.log('✅ Sistema de inventario: OK', inventory.length, 'productos encontrados');
    } catch (error) {
      console.error('❌ Error en sistema de inventario:', error);
    }

    // 7. Probar sistema de turnos
    console.log('7️⃣ Probando sistema de turnos...');
    try {
      const shifts = await shiftService.getAllShifts();
      results.shiftSystem = Array.isArray(shifts);
      console.log('✅ Sistema de turnos: OK', shifts.length, 'turnos encontrados');
    } catch (error) {
      console.error('❌ Error en sistema de turnos:', error);
    }

  } catch (error) {
    console.error('❌ Error general en pruebas:', error);
  }

  // Resumen de resultados
  console.log('\n📊 RESUMEN DE PRUEBAS:');
  console.log('========================');
  Object.entries(results).forEach(([test, passed]) => {
    console.log(`${passed ? '✅' : '❌'} ${test}: ${passed ? 'PASÓ' : 'FALLÓ'}`);
  });

  const passedTests = Object.values(results).filter(Boolean).length;
  const totalTests = Object.keys(results).length;
  const successRate = (passedTests / totalTests) * 100;

  console.log(`\n🎯 Resultado: ${passedTests}/${totalTests} pruebas pasaron (${successRate.toFixed(1)}%)`);

  if (successRate >= 80) {
    console.log('🎉 El sistema está funcionando correctamente!');
  } else if (successRate >= 60) {
    console.log('⚠️ El sistema tiene algunos problemas menores');
  } else {
    console.log('🚨 El sistema tiene problemas críticos que necesitan atención');
  }

  return results;
};

// Función para probar sincronización en tiempo real específicamente
export const testRealtimeSync = () => {
  console.log('🔄 Probando sincronización en tiempo real...');
  
  let testResults = {
    listenersInitialized: false,
    salesListener: false,
    inventoryListener: false,
    notificationsListener: false
  };

  // Verificar si los listeners están inicializados
  const syncState = realtimeService.getSyncState();
  testResults.listenersInitialized = syncState.listeners.size > 0;

  // Escuchar eventos de tiempo real
  realtimeService.on('sales_updated', (data) => {
    console.log('📈 Evento de ventas recibido:', data);
    testResults.salesListener = true;
  });

  realtimeService.on('inventory_updated', (data) => {
    console.log('📦 Evento de inventario recibido:', data);
    testResults.inventoryListener = true;
  });

  realtimeService.on('notification_received', (data) => {
    console.log('🔔 Evento de notificación recibido:', data);
    testResults.notificationsListener = true;
  });

  // Simular una venta para probar la sincronización
  setTimeout(async () => {
    try {
      const testSale = {
        items: [{
          productId: 'test-realtime',
          name: 'Prueba Tiempo Real',
          quantity: 1,
          price: 500,
          subtotal: 500
        }],
        total: 500,
        discount: 0,
        finalTotal: 500,
        paymentMethod: 'cash',
        cashAmount: 500,
        change: 0,
        customer: null,
        shiftId: 'test-realtime-shift',
        timestamp: new Date().toISOString()
      };

      await dataSyncService.syncSale(testSale);
      console.log('✅ Venta de prueba sincronizada');
    } catch (error) {
      console.error('❌ Error en venta de prueba:', error);
    }
  }, 2000);

  // Verificar resultados después de 5 segundos
  setTimeout(() => {
    console.log('\n📊 RESULTADOS DE SINCRONIZACIÓN EN TIEMPO REAL:');
    console.log('===============================================');
    Object.entries(testResults).forEach(([test, passed]) => {
      console.log(`${passed ? '✅' : '❌'} ${test}: ${passed ? 'FUNCIONANDO' : 'NO FUNCIONA'}`);
    });
  }, 5000);

  return testResults;
};

// Función para verificar el estado del sistema
export const checkSystemHealth = () => {
  const health = {
    online: navigator.onLine,
    firebase: false,
    realtime: false,
    cache: false
  };

  // Verificar Firebase
  try {
    const syncState = realtimeService.getSyncState();
    health.firebase = syncState.isOnline;
    health.realtime = syncState.listeners.size > 0;
    health.cache = syncState.cacheSize > 0;
  } catch (error) {
    console.error('Error verificando salud del sistema:', error);
  }

  console.log('🏥 ESTADO DE SALUD DEL SISTEMA:');
  console.log('================================');
  console.log(`🌐 Conexión a internet: ${health.online ? '✅' : '❌'}`);
  console.log(`🔥 Firebase: ${health.firebase ? '✅' : '❌'}`);
  console.log(`⚡ Tiempo real: ${health.realtime ? '✅' : '❌'}`);
  console.log(`💾 Cache: ${health.cache ? '✅' : '❌'}`);

  return health;
};

const testingUtils = {
  runSystemTests,
  testRealtimeSync,
  checkSystemHealth
};

export default testingUtils;
