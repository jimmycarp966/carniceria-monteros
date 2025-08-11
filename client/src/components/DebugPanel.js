import React, { useState, useEffect } from 'react';
import { 
  Bug, 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  Activity,
  Database,
  Wifi,
  WifiOff,
  Trash2,
  AlertTriangle
} from 'lucide-react';
import realtimeService from '../services/realtimeService';
import { runSystemTests, testRealtimeSync, checkSystemHealth } from '../utils/testing';
import { 
  employeeService
} from '../services/firebaseService';
import toast from 'react-hot-toast';

const DebugPanel = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [systemHealth, setSystemHealth] = useState({});
  const [testResults, setTestResults] = useState({});
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [realtimeEvents, setRealtimeEvents] = useState([]);

  useEffect(() => {
    if (!isVisible) return;

    // Actualizar estado de salud cada 10 segundos
    const healthInterval = setInterval(() => {
      const health = checkSystemHealth();
      setSystemHealth(health);
    }, 10000);

    // Escuchar eventos de tiempo real para debug
    const handleRealtimeEvent = (event, data) => {
      setRealtimeEvents(prev => [{
        event,
        data: JSON.stringify(data).substring(0, 100) + '...',
        timestamp: new Date().toLocaleTimeString()
      }, ...prev.slice(0, 9)]);
    };

    realtimeService.on('sales_updated', (data) => handleRealtimeEvent('sales_updated', data));
    realtimeService.on('inventory_updated', (data) => handleRealtimeEvent('inventory_updated', data));
    realtimeService.on('notification_received', (data) => handleRealtimeEvent('notification_received', data));
    realtimeService.on('stock_alert', (data) => handleRealtimeEvent('stock_alert', data));

    return () => {
      clearInterval(healthInterval);
      realtimeService.off('sales_updated');
      realtimeService.off('inventory_updated');
      realtimeService.off('notification_received');
      realtimeService.off('stock_alert');
    };
  }, [isVisible]);

  const runTests = async () => {
    setIsRunningTests(true);
    try {
      const results = await runSystemTests();
      setTestResults(results);
      toast.success('Pruebas completadas');
    } catch (error) {
      console.error('Error en pruebas:', error);
      toast.error('Error ejecutando pruebas');
    } finally {
      setIsRunningTests(false);
    }
  };

  const runRealtimeTest = () => {
    testRealtimeSync();
    toast.success('Prueba de tiempo real iniciada');
  };

  const resetAllData = async () => {
    setIsResetting(true);
    const resetResults = {
      sales: false,
      shifts: false,
      customers: false,
      products: false,
      inventory: false,
      movements: false,
      expenses: false,
      employees: false,
      suppliers: false
    };

    // Función auxiliar para borrar documentos
    const deleteDocuments = async (collectionName, documents) => {
      const { deleteDoc, doc } = await import('firebase/firestore');
      const { db } = await import('../firebase');
      
      console.log(`🗑️ Borrando ${documents.length} documentos de ${collectionName}...`);
      
      for (const document of documents) {
        try {
          await deleteDoc(doc(db, collectionName, document.id));
          console.log(`✅ Borrado: ${collectionName}/${document.id}`);
        } catch (error) {
          console.error(`❌ Error borrando ${collectionName}/${document.id}:`, error);
        }
      }
    };

    // Función auxiliar para borrar colección completa
    const deleteCollection = async (collectionName) => {
      const { collection, getDocs, deleteDoc, doc } = await import('firebase/firestore');
      const { db } = await import('../firebase');
      
      console.log(`🗑️ Borrando colección completa: ${collectionName}...`);
      
      try {
        const snapshot = await getDocs(collection(db, collectionName));
        const documents = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        for (const document of documents) {
          try {
            await deleteDoc(doc(db, collectionName, document.id));
            console.log(`✅ Borrado: ${collectionName}/${document.id}`);
          } catch (error) {
            console.error(`❌ Error borrando ${collectionName}/${document.id}:`, error);
          }
        }
        
        return documents.length;
      } catch (error) {
        console.error(`❌ Error accediendo a colección ${collectionName}:`, error);
        return 0;
      }
    };

    // Función específica para forzar reset de turnos
    const forceResetShifts = async () => {
      console.log('🔥 FORZANDO RESET DE TURNOS...');
      
      try {
        // 1. Borrar todos los turnos de Firestore
        const deletedCount = await deleteCollection('shifts');
        console.log(`✅ ${deletedCount} turnos borrados de Firestore`);
        
        // 2. Limpiar Realtime Database
        try {
          const { ref, remove } = await import('firebase/database');
          const { realtimeDb } = await import('../firebase');
          
          if (realtimeDb) {
            const shiftsRef = ref(realtimeDb, 'shifts');
            await remove(shiftsRef);
            console.log('✅ Turnos borrados de Realtime Database');
          }
        } catch (error) {
          console.warn('⚠️ No se pudo limpiar Realtime Database:', error);
        }
        
        // 3. Limpiar localStorage
        localStorage.removeItem('currentShift');
        localStorage.removeItem('shiftData');
        localStorage.removeItem('cashRegisterState');
        console.log('✅ Estado local limpiado');
        
        // 4. Forzar recarga de componentes
        window.dispatchEvent(new CustomEvent('forceResetShifts'));
        console.log('✅ Evento de reset disparado');
        
        return deletedCount;
      } catch (error) {
        console.error('❌ Error en forceResetShifts:', error);
        throw error;
      }
    };

    try {
      toast.loading('Iniciando reset completo del sistema...', { id: 'reset' });

      // 1. FORZAR RESET DE TURNOS (PRIORIDAD MÁXIMA)
      try {
        console.log('🔥 INICIANDO RESET FORZADO DE TURNOS...');
        const deletedCount = await forceResetShifts();
        resetResults.shifts = true;
        console.log(`✅ ${deletedCount} turnos borrados completamente (FORZADO)`);
      } catch (error) {
        console.error('❌ Error en reset forzado de turnos:', error);
      }

      // 2. Borrar TODAS las ventas
      try {
        console.log('🗑️ Borrando TODAS las ventas...');
        const deletedCount = await deleteCollection('sales');
        resetResults.sales = true;
        console.log(`✅ ${deletedCount} ventas borradas completamente`);
      } catch (error) {
        console.error('❌ Error borrando ventas:', error);
      }

      // 3. Borrar todos los clientes
      try {
        console.log('🗑️ Borrando clientes...');
        const deletedCount = await deleteCollection('customers');
        resetResults.customers = true;
        console.log(`✅ ${deletedCount} clientes borrados`);
      } catch (error) {
        console.error('❌ Error borrando clientes:', error);
      }

      // 4. Borrar todos los productos e inventario
      try {
        console.log('🗑️ Borrando productos...');
        const deletedCount = await deleteCollection('products');
        resetResults.products = true;
        console.log(`✅ ${deletedCount} productos borrados`);
      } catch (error) {
        console.error('❌ Error borrando productos:', error);
      }

      // 5. Borrar inventario
      try {
        console.log('🗑️ Borrando inventario...');
        const deletedCount = await deleteCollection('inventory');
        resetResults.inventory = true;
        console.log(`✅ ${deletedCount} items de inventario borrados`);
      } catch (error) {
        console.error('❌ Error borrando inventario:', error);
      }

      // 6. Borrar movimientos de inventario
      try {
        console.log('🗑️ Borrando movimientos de inventario...');
        const deletedCount = await deleteCollection('inventory_movements');
        resetResults.movements = true;
        console.log(`✅ ${deletedCount} movimientos borrados`);
      } catch (error) {
        console.error('❌ Error borrando movimientos:', error);
      }

      // 7. Borrar gastos
      try {
        console.log('🗑️ Borrando gastos...');
        const deletedCount = await deleteCollection('expenses');
        resetResults.expenses = true;
        console.log(`✅ ${deletedCount} gastos borrados`);
      } catch (error) {
        console.error('❌ Error borrando gastos:', error);
      }

      // 8. Borrar empleados (excepto admin)
      try {
        console.log('🗑️ Borrando empleados (excepto admin)...');
        const employees = await employeeService.getAllEmployees();
        
        const nonAdminEmployees = employees.filter(employee => 
          employee.email !== 'admin@carniceria.com' && 
          employee.role !== 'admin' && 
          !employee.email?.includes('admin')
        );
        
        await deleteDocuments('employees', nonAdminEmployees);
        resetResults.employees = true;
        console.log(`✅ ${nonAdminEmployees.length} empleados borrados (admin preservado)`);
      } catch (error) {
        console.error('❌ Error borrando empleados:', error);
      }

      // 9. Borrar proveedores
      try {
        console.log('🗑️ Borrando proveedores...');
        const deletedCount = await deleteCollection('suppliers');
        resetResults.suppliers = true;
        console.log(`✅ ${deletedCount} proveedores borrados`);
      } catch (error) {
        console.error('❌ Error borrando proveedores:', error);
      }

      // 10. Limpiar cache y reiniciar listeners
      try {
        console.log('🔄 Limpiando cache y reiniciando sistema...');
        realtimeService.cleanup();
        realtimeService.initializeRealtimeListeners();
        
        // Limpiar localStorage
        localStorage.removeItem('offlineQueue_v1');
        localStorage.removeItem('smartCache');
        
        console.log('✅ Sistema reiniciado');
      } catch (error) {
        console.error('❌ Error reiniciando sistema:', error);
      }

      // Mostrar resultados
      const successful = Object.values(resetResults).filter(Boolean).length;
      const total = Object.keys(resetResults).length;
      
      console.log('\n📊 RESULTADOS DEL RESET:');
      console.log('========================');
      Object.entries(resetResults).forEach(([category, success]) => {
        console.log(`${success ? '✅' : '❌'} ${category}: ${success ? 'BORRADO' : 'ERROR'}`);
      });
      
      if (successful === total) {
        toast.success('🎉 Reset completo exitoso! Todos los datos borrados.', { id: 'reset' });
      } else {
        toast.success(`⚠️ Reset parcial: ${successful}/${total} categorías borradas.`, { id: 'reset' });
      }

      // Recargar la página después de 3 segundos para refrescar todo
      setTimeout(() => {
        console.log('🔄 Recargando página...');
        window.location.reload();
      }, 3000);

    } catch (error) {
      console.error('💥 Error en reset completo:', error);
      toast.error('Error durante el reset del sistema', { id: 'reset' });
    } finally {
      setIsResetting(false);
      setShowResetConfirm(false);
    }
  };

  const getHealthIcon = (status) => {
    return status ? <CheckCircle className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-red-500" />;
  };

  const getHealthColor = (status) => {
    return status ? 'text-green-600' : 'text-red-600';
  };

  if (!isVisible) {
  return (
          <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 bg-gray-800 text-white p-3 rounded-full shadow-lg hover:bg-gray-700 transition-colors z-50"
        title="Panel de Debug"
          >
        <Bug className="h-6 w-6" />
          </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold flex items-center">
            <Bug className="h-6 w-6 mr-2" />
            Panel de Debug - Sistema de Carnicería
          </h2>
              <button
            onClick={() => setIsVisible(false)}
            className="text-gray-500 hover:text-gray-700"
              >
            <XCircle className="h-6 w-6" />
              </button>
            </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Estado de Salud del Sistema */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Activity className="h-5 w-5 mr-2" />
              Estado de Salud del Sistema
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-50 p-4 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Conexión Internet</span>
                  {systemHealth.online ? <Wifi className="h-4 w-4 text-green-500" /> : <WifiOff className="h-4 w-4 text-red-500" />}
                </div>
                <div className={`text-lg font-bold ${getHealthColor(systemHealth.online)}`}>
                  {systemHealth.online ? 'Conectado' : 'Desconectado'}
              </div>
                    </div>

              <div className="bg-gray-50 p-4 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Firebase</span>
                  {getHealthIcon(systemHealth.firebase)}
                  </div>
                <div className={`text-lg font-bold ${getHealthColor(systemHealth.firebase)}`}>
                  {systemHealth.firebase ? 'Conectado' : 'Error'}
              </div>
          </div>

              <div className="bg-gray-50 p-4 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Tiempo Real</span>
                  {getHealthIcon(systemHealth.realtime)}
                </div>
                <div className={`text-lg font-bold ${getHealthColor(systemHealth.realtime)}`}>
                  {systemHealth.realtime ? 'Activo' : 'Inactivo'}
                  </div>
                  </div>

              <div className="bg-gray-50 p-4 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Cache</span>
                  {getHealthIcon(systemHealth.cache)}
                  </div>
                <div className={`text-lg font-bold ${getHealthColor(systemHealth.cache)}`}>
                  {systemHealth.cache ? 'Activo' : 'Vacío'}
                  </div>
                  </div>
                </div>
              </div>

          {/* Resultados de Pruebas */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Database className="h-5 w-5 mr-2" />
              Resultados de Pruebas del Sistema
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {Object.entries(testResults).map(([test, passed]) => (
                <div key={test} className="bg-gray-50 p-4 rounded-xl">
                  <div className="flex items-center justify-between">
                    <span className="font-medium capitalize">{test.replace(/([A-Z])/g, ' $1').trim()}</span>
                    {getHealthIcon(passed)}
                  </div>
                  <div className={`text-sm ${getHealthColor(passed)}`}>
                    {passed ? 'Funcionando' : 'Con problemas'}
                  </div>
                </div>
              ))}
              </div>
                         <div className="flex gap-2 flex-wrap">
               <button
                 onClick={runTests}
                 disabled={isRunningTests}
                 className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"
               >
                 <RefreshCw className={`h-4 w-4 mr-2 ${isRunningTests ? 'animate-spin' : ''}`} />
                 {isRunningTests ? 'Ejecutando...' : 'Ejecutar Pruebas'}
               </button>
               <button
                 onClick={runRealtimeTest}
                 className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center"
               >
                 <Activity className="h-4 w-4 mr-2" />
                 Probar Tiempo Real
               </button>
                  <button
                 onClick={() => setShowResetConfirm(true)}
                 disabled={isResetting}
                 className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center"
                  >
                 <Trash2 className={`h-4 w-4 mr-2 ${isResetting ? 'animate-pulse' : ''}`} />
                 {isResetting ? 'Borrando...' : 'Reset Completo'}
                  </button>
             </div>
                </div>

          {/* Eventos de Tiempo Real */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Activity className="h-5 w-5 mr-2" />
              Eventos de Tiempo Real (Últimos 10)
            </h3>
            <div className="bg-gray-50 rounded-xl p-4 max-h-64 overflow-y-auto">
              {realtimeEvents.length === 0 ? (
                <div className="text-gray-500 text-center py-8">
                  No hay eventos recientes
                  </div>
                ) : (
                <div className="space-y-2">
                  {realtimeEvents.map((event, index) => (
                    <div key={index} className="bg-white p-3 rounded-lg border">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-blue-600">{event.event}</span>
                        <span className="text-xs text-gray-500">{event.timestamp}</span>
                          </div>
                      <div className="text-sm text-gray-600 font-mono">
                        {event.data}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

          {/* Información del Sistema */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Información del Sistema</h3>
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>Navegador:</strong> {navigator.userAgent.split(' ')[0]}
                </div>
                <div>
                  <strong>Online:</strong> {navigator.onLine ? 'Sí' : 'No'}
          </div>
                <div>
                  <strong>Memoria:</strong> {performance.memory ? `${Math.round(performance.memory.usedJSHeapSize / 1024 / 1024)}MB / ${Math.round(performance.memory.totalJSHeapSize / 1024 / 1024)}MB` : 'No disponible'}
        </div>
                <div>
                  <strong>Timestamp:</strong> {new Date().toLocaleString()}
            </div>
            </div>
          </div>
        </div>
      </div>
       </div>

       {/* Modal de Confirmación de Reset */}
       {showResetConfirm && (
         <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
           <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4">
             <div className="p-6">
               <div className="flex items-center mb-4">
                 <AlertTriangle className="h-8 w-8 text-red-600 mr-3" />
                 <h3 className="text-xl font-bold text-gray-900">⚠️ Reset Completo del Sistema</h3>
               </div>
               
               <div className="mb-6">
                 <p className="text-gray-700 mb-4">
                   <strong>¡CUIDADO!</strong> Esta acción eliminará permanentemente:
                 </p>
                 <ul className="text-sm text-gray-600 space-y-1 mb-4">
                   <li>🗑️ Todas las ventas e historial</li>
                   <li>🗑️ Todos los turnos/cajas</li>
                   <li>🗑️ Todos los clientes</li>
                   <li>🗑️ Todos los productos e inventario</li>
                   <li>🗑️ Todos los movimientos de inventario</li>
                   <li>🗑️ Todos los gastos</li>
                   <li>🗑️ Todos los empleados (excepto admin)</li>
                   <li>🗑️ Todos los proveedores</li>
                 </ul>
                 <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                   <p className="text-sm text-green-700">
                     ✅ <strong>Se preservará:</strong> Usuario administrador
                   </p>
                 </div>
               </div>

               <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-6">
                 <p className="text-sm text-red-700">
                   <strong>⚠️ Esta acción NO se puede deshacer.</strong> 
                   Úsala solo para pruebas o para empezar desde cero.
                 </p>
        </div>

               <div className="flex gap-3">
                 <button
                   onClick={() => setShowResetConfirm(false)}
                   className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
                 >
                   ❌ Cancelar
                 </button>
                 <button
                   onClick={resetAllData}
                   disabled={isResetting}
                   className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center justify-center"
                 >
                   {isResetting ? (
                     <>
                       <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                       Borrando...
                     </>
                   ) : (
                     <>
                       <Trash2 className="h-4 w-4 mr-2" />
                       🔥 Confirmar Reset
                     </>
                   )}
                 </button>
            </div>
          </div>
        </div>
      </div>
       )}
    </div>
  );
};

export default DebugPanel;
