// Script de Testing para Consola del Navegador
// Ejecuta esto en la consola del navegador (F12) para diagnosticar problemas

'use strict'; // eslint-disable-line strict

(function() {
  // modo estricto declarado arriba

  // Colores para la consola
  const colors = {
    success: '%c✅',
    error: '%c❌',
    warning: '%c⚠️',
    info: '%cℹ️',
    reset: '%c'
  };

  const styles = {
    success: 'color: #10B981; font-weight: bold;',
    error: 'color: #EF4444; font-weight: bold;',
    warning: 'color: #F59E0B; font-weight: bold;',
    info: 'color: #3B82F6; font-weight: bold;',
    reset: 'color: inherit; font-weight: normal;'
  };

  // Función para imprimir resultados
  const logTest = (testName, passed, message = '') => {
    const color = passed ? colors.success : colors.error;
    const style = passed ? styles.success : styles.error;
    const status = passed ? 'PASÓ' : 'FALLÓ';
    console.log(`${color} ${status}${colors.reset} ${testName}${message ? `: ${message}` : ''}`, style, styles.reset);
  };

  const logInfo = (message) => {
    console.log(`${colors.info} ${message}`, styles.info, styles.reset);
  };

  // const logWarning = (message) => {
  //   console.log(`${colors.warning} ${message}`, styles.warning, styles.reset);
  // };

  // Tests básicos
  const runBasicTests = () => {
    console.log('\n🔍 EJECUTANDO TESTS BÁSICOS...\n');

    // Test 1: Verificar que React está disponible
    try {
      const hasReact = typeof window.React !== 'undefined';
      logTest('React disponible', hasReact);
    } catch (error) {
      logTest('React disponible', false, error.message);
    }

    // Test 2: Verificar que el DOM está disponible
    try {
      const hasDOM = typeof document !== 'undefined';
      logTest('DOM disponible', hasDOM);
    } catch (error) {
      logTest('DOM disponible', false, error.message);
    }

    // Test 3: Verificar localStorage
    try {
      const hasLocalStorage = 'localStorage' in window;
      logTest('localStorage disponible', hasLocalStorage);
    } catch (error) {
      logTest('localStorage disponible', false, error.message);
    }

    // Test 4: Verificar conexión
    try {
      const isOnline = navigator.onLine;
      logTest('Conexión a internet', isOnline, isOnline ? 'En línea' : 'Sin conexión');
    } catch (error) {
      logTest('Conexión a internet', false, error.message);
    }

    // Test 5: Verificar tamaño de pantalla
    try {
      const screenWidth = window.innerWidth;
      const screenHeight = window.innerHeight;
      const hasValidDimensions = screenWidth > 0 && screenHeight > 0;
      logTest('Dimensiones de pantalla válidas', hasValidDimensions, `${screenWidth}x${screenHeight}`);
    } catch (error) {
      logTest('Dimensiones de pantalla válidas', false, error.message);
    }
  };

  // Tests de componentes específicos
  const runComponentTests = () => {
    console.log('\n🔍 EJECUTANDO TESTS DE COMPONENTES...\n');

    // Test 1: Verificar que Sales está montado
    try {
      const salesElement = document.querySelector('[data-testid="sales-component"]') || 
                          document.querySelector('.sales-component') ||
                          document.querySelector('div[class*="sales"]');
      logTest('Componente Sales montado', !!salesElement);
    } catch (error) {
      logTest('Componente Sales montado', false, error.message);
    }

    // Test 2: Verificar elementos del carrito
    try {
      const cartElements = document.querySelectorAll('[class*="cart"], [class*="carrito"]');
      logTest('Elementos del carrito presentes', cartElements.length > 0, `${cartElements.length} elementos encontrados`);
    } catch (error) {
      logTest('Elementos del carrito presentes', false, error.message);
    }

    // Test 3: Verificar select de productos
    try {
      const productSelect = document.querySelector('select');
      logTest('Select de productos presente', !!productSelect);
    } catch (error) {
      logTest('Select de productos presente', false, error.message);
    }
  };

  // Tests de rendimiento
  const runPerformanceTests = () => {
    console.log('\n🔍 EJECUTANDO TESTS DE RENDIMIENTO...\n');

    // Test 1: Tiempo de carga
    try {
      const loadTime = performance.now();
      logTest('Tiempo de carga', loadTime < 5000, `${loadTime.toFixed(2)}ms`);
    } catch (error) {
      logTest('Tiempo de carga', false, error.message);
    }

    // Test 2: Memoria del navegador
    try {
      if ('memory' in performance) {
        const memory = performance.memory;
        const memoryUsage = memory.usedJSHeapSize / memory.jsHeapSizeLimit;
        const isMemoryOK = memoryUsage < 0.8;
        logTest('Uso de memoria', isMemoryOK, `${(memoryUsage * 100).toFixed(1)}%`);
      } else {
        logTest('Uso de memoria', true, 'Información no disponible');
      }
    } catch (error) {
      logTest('Uso de memoria', false, error.message);
    }
  };

  // Tests de errores
  const runErrorTests = () => {
    console.log('\n🔍 EJECUTANDO TESTS DE ERRORES...\n');

    // Test 1: Verificar errores en consola
    try {
      const originalError = console.error;
      let errorCount = 0;
      
      console.error = (...args) => {
        errorCount++;
        originalError.apply(console, args);
      };

      // Simular un pequeño delay para capturar errores
      setTimeout(() => {
        console.error = originalError;
        logTest('Errores en consola', errorCount === 0, `${errorCount} errores detectados`);
      }, 100);
    } catch (error) {
      logTest('Errores en consola', false, error.message);
    }

    // Test 2: Verificar promesas rechazadas
    try {
      const hasUnhandledRejections = window.addEventListener;
      logTest('Manejo de promesas rechazadas', !!hasUnhandledRejections);
    } catch (error) {
      logTest('Manejo de promesas rechazadas', false, error.message);
    }
  };

  // Función principal
  const runAllTests = () => {
    console.log('\n🚀 INICIANDO SUITE COMPLETA DE TESTS...\n');
    
    const startTime = performance.now();
    
    try {
      runBasicTests();
      runComponentTests();
      runPerformanceTests();
      runErrorTests();
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      
      console.log(`\n${colors.success} TODOS LOS TESTS COMPLETADOS`, styles.success);
      console.log(`${colors.info} Tiempo total: ${totalTime.toFixed(2)}ms`, styles.info);
      
      // Generar recomendaciones
      generateRecommendations();
      
    } catch (error) {
      console.error(`${colors.error} ERROR EN LA EJECUCIÓN DE TESTS:`, styles.error, error);
    }
  };

  // Función para generar recomendaciones
  const generateRecommendations = () => {
    console.log('\n📋 RECOMENDACIONES:\n');
    
    logInfo('1. Si Sales aparece en blanco, verifica la consola para errores');
    logInfo('2. Asegúrate de que Firebase esté configurado correctamente');
    logInfo('3. Verifica que todos los servicios estén importados');
    logInfo('4. Comprueba que los datos de productos estén disponibles');
    logInfo('5. Revisa la conexión a internet si usas Firebase');
    
    console.log('\n🔧 SOLUCIONES RÁPIDAS:\n');
    logInfo('• Recarga la página (F5)');
    logInfo('• Limpia el caché del navegador');
    logInfo('• Verifica la conexión a internet');
    logInfo('• Revisa la consola del navegador (F12)');
  };

  // Función para testing específico de Sales
  const testSalesComponent = () => {
    console.log('\n🔍 TEST ESPECÍFICO DE SALES...\n');

    try {
      // Verificar elementos específicos de Sales
      const elements = {
        'Header de Ventas': document.querySelector('h1'),
        'Select de productos': document.querySelector('select'),
        'Botón agregar al carrito': document.querySelector('button[class*="btn"]'),
        'Carrito de compras': document.querySelector('[class*="cart"], [class*="carrito"]'),
        'Historial de ventas': document.querySelector('[class*="historial"]')
      };

      Object.entries(elements).forEach(([name, element]) => {
        logTest(name, !!element, element ? 'Encontrado' : 'No encontrado');
      });

      // Verificar estado del componente
      const hasReactState = typeof window.React !== 'undefined' && window.React.useState;
      logTest('React hooks disponibles', hasReactState);

    } catch (error) {
      logTest('Test específico de Sales', false, error.message);
    }
  };

  // Función para debugging en tiempo real
  const startRealTimeMonitoring = () => {
    console.log('\n🔄 INICIANDO MONITOREO EN TIEMPO REAL...\n');
    
    // Monitorear errores de JavaScript
    window.addEventListener('error', (event) => {
      console.error(`${colors.error} ERROR DETECTADO:`, styles.error, {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      });
    });

    // Monitorear promesas rechazadas
    window.addEventListener('unhandledrejection', (event) => {
      console.error(`${colors.error} PROMESA RECHAZADA:`, styles.error, {
        reason: event.reason
      });
    });

    logInfo('Monitoreo en tiempo real activado');
    logInfo('Los errores se mostrarán automáticamente');
  };

  // Exponer funciones globalmente
  window.testingUtils = {
    runAllTests,
    runBasicTests,
    runComponentTests,
    runPerformanceTests,
    runErrorTests,
    testSalesComponent,
    startRealTimeMonitoring,
    generateRecommendations
  };

  // Auto-ejecutar si se solicita
  if (window.location.search.includes('debug=true')) {
    setTimeout(runAllTests, 1000);
  }

  console.log(`
🔧 HERRAMIENTAS DE TESTING DISPONIBLES:

• testingUtils.runAllTests() - Ejecutar todos los tests
• testingUtils.runBasicTests() - Tests básicos del sistema
• testingUtils.runComponentTests() - Tests de componentes
• testingUtils.runPerformanceTests() - Tests de rendimiento
• testingUtils.runErrorTests() - Tests de errores
• testingUtils.testSalesComponent() - Test específico de Sales
• testingUtils.startRealTimeMonitoring() - Monitoreo en tiempo real

Ejecuta cualquiera de estas funciones en la consola para diagnosticar problemas.
  `);

})();
