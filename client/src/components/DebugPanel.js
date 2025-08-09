import React, { useState, useEffect } from 'react';
import { Bug, X, RefreshCw, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { runAllTests } from '../utils/testing';

const DebugPanel = ({ isVisible, onClose }) => {
  const [testResults, setTestResults] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [realTimeErrors, setRealTimeErrors] = useState([]);
  const [systemInfo, setSystemInfo] = useState({});

  useEffect(() => {
    if (isVisible) {
      // Inicializar información del sistema
      setSystemInfo({
        userAgent: navigator.userAgent,
        screenSize: `${window.innerWidth}x${window.innerHeight}`,
        online: navigator.onLine,
        localStorage: 'localStorage' in window,
        sessionStorage: 'sessionStorage' in window,
        cookies: navigator.cookieEnabled,
        language: navigator.language,
        platform: navigator.platform
      });

      // Iniciar monitoreo en tiempo real
      startRealTimeMonitoring();
    }
  }, [isVisible]);

  const startRealTimeMonitoring = () => {
    // Interceptar console.error para capturar errores
    const originalError = console.error;
    console.error = (...args) => {
      setRealTimeErrors(prev => [...prev, {
        type: 'error',
        message: args.join(' '),
        timestamp: new Date().toISOString()
      }]);
      originalError.apply(console, args);
    };

    // Interceptar console.warn
    const originalWarn = console.warn;
    console.warn = (...args) => {
      setRealTimeErrors(prev => [...prev, {
        type: 'warning',
        message: args.join(' '),
        timestamp: new Date().toISOString()
      }]);
      originalWarn.apply(console, args);
    };
  };

  const runTests = async () => {
    setIsRunning(true);
    setTestResults([]);

    try {
      // Ejecutar tests y capturar resultados
      const originalLog = console.log;
      const logs = [];
      
      console.log = (...args) => {
        logs.push(args.join(' '));
        originalLog.apply(console, args);
      };

      await runAllTests();

      // Restaurar console.log
      console.log = originalLog;

      // Procesar logs para extraer resultados
      const results = logs
        .filter(log => log.includes('✅') || log.includes('❌'))
        .map(log => ({
          passed: log.includes('✅'),
          message: log.replace(/✅|❌/, '').trim(),
          timestamp: new Date().toISOString()
        }));

      setTestResults(results);
    } catch (error) {
      setTestResults([{
        passed: false,
        message: `Error ejecutando tests: ${error.message}`,
        timestamp: new Date().toISOString()
      }]);
    } finally {
      setIsRunning(false);
    }
  };

  const clearErrors = () => {
    setRealTimeErrors([]);
  };

  const getStatusColor = (passed) => {
    return passed ? 'text-green-600' : 'text-red-600';
  };

  const getStatusIcon = (passed) => {
    return passed ? <CheckCircle className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />;
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Bug className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-900">Panel de Debugging</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex h-[calc(90vh-120px)]">
          {/* Panel izquierdo - Tests */}
          <div className="w-1/2 border-r border-gray-200 p-6 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Tests Automatizados</h3>
              <button
                onClick={runTests}
                disabled={isRunning}
                className="btn btn-primary flex items-center space-x-2"
              >
                <RefreshCw className={`h-4 w-4 ${isRunning ? 'animate-spin' : ''}`} />
                <span>{isRunning ? 'Ejecutando...' : 'Ejecutar Tests'}</span>
              </button>
            </div>

            {testResults.length === 0 ? (
              <div className="text-center py-8">
                <Info className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Haz clic en "Ejecutar Tests" para comenzar</p>
              </div>
            ) : (
              <div className="space-y-3">
                {testResults.map((result, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg border ${
                      result.passed ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(result.passed)}
                      <span className={`font-medium ${getStatusColor(result.passed)}`}>
                        {result.message}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(result.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Panel derecho - Errores en tiempo real y info del sistema */}
          <div className="w-1/2 p-6 overflow-y-auto">
            <div className="space-y-6">
              {/* Información del Sistema */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Información del Sistema</h3>
                <div className="grid grid-cols-1 gap-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Navegador:</span>
                    <span className="text-sm font-medium">{systemInfo.userAgent?.split(' ')[0]}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Tamaño de pantalla:</span>
                    <span className="text-sm font-medium">{systemInfo.screenSize}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Conexión:</span>
                    <span className={`text-sm font-medium ${systemInfo.online ? 'text-green-600' : 'text-red-600'}`}>
                      {systemInfo.online ? 'En línea' : 'Sin conexión'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">localStorage:</span>
                    <span className={`text-sm font-medium ${systemInfo.localStorage ? 'text-green-600' : 'text-red-600'}`}>
                      {systemInfo.localStorage ? 'Disponible' : 'No disponible'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Cookies:</span>
                    <span className={`text-sm font-medium ${systemInfo.cookies ? 'text-green-600' : 'text-red-600'}`}>
                      {systemInfo.cookies ? 'Habilitadas' : 'Deshabilitadas'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Errores en Tiempo Real */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Errores en Tiempo Real</h3>
                  <button
                    onClick={clearErrors}
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    Limpiar
                  </button>
                </div>

                {realTimeErrors.length === 0 ? (
                  <div className="text-center py-4">
                    <CheckCircle className="h-8 w-8 text-green-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">No hay errores detectados</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {realTimeErrors.slice(-10).map((error, index) => (
                      <div
                        key={index}
                        className={`p-3 rounded-lg border text-sm ${
                          error.type === 'error' 
                            ? 'border-red-200 bg-red-50' 
                            : 'border-yellow-200 bg-yellow-50'
                        }`}
                      >
                        <div className="flex items-start space-x-2">
                          {error.type === 'error' ? (
                            <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5" />
                          ) : (
                            <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                          )}
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{error.message}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {new Date(error.timestamp).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {testResults.length > 0 && (
                <span>
                  Tests: {testResults.filter(r => r.passed).length}/{testResults.length} pasaron
                </span>
              )}
            </div>
            <div className="text-sm text-gray-600">
              Errores en tiempo real: {realTimeErrors.length}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DebugPanel;
