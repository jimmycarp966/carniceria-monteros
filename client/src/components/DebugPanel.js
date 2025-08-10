import React, { useState, useEffect } from 'react';
import { 
  Bug, 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Activity,
  Database,
  Wifi,
  WifiOff
} from 'lucide-react';
import { realtimeService } from '../services/realtimeService';
import { runSystemTests, testRealtimeSync, checkSystemHealth } from '../utils/testing';
import toast from 'react-hot-toast';

const DebugPanel = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [systemHealth, setSystemHealth] = useState({});
  const [testResults, setTestResults] = useState({});
  const [isRunningTests, setIsRunningTests] = useState(false);
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
            <div className="flex gap-2">
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
    </div>
  );
};

export default DebugPanel;
