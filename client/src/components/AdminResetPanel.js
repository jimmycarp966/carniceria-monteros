import React, { useState, useEffect } from 'react';
import { 
  Trash2, 
  AlertTriangle, 
  Shield, 
  Clock, 
  Calendar,
  BarChart3,
  RefreshCw,
  CheckCircle,
  XCircle,
  Loader
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { 
  nuclearReset, 
  killAllShifts, 
  resetByDateRange, 
  getResetStatistics 
} from '../utils/nuclearReset';

const AdminResetPanel = ({ onClose }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const [resetResults, setResetResults] = useState(null);
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });

  // Cargar estadísticas al montar el componente
  useEffect(() => {
    loadStatistics();
  }, []);

  const loadStatistics = async () => {
    try {
      setIsLoading(true);
      const result = await getResetStatistics();
      if (result.success) {
        setStats(result);
      } else {
        toast.error('Error cargando estadísticas');
      }
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
      toast.error('Error cargando estadísticas');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNuclearReset = async () => {
    try {
      setIsLoading(true);
      const result = await nuclearReset({
        confirmMessage: '🚨 RESET NUCLEAR - ¿Estás 100% seguro?\n\nEsta acción eliminará TODOS los datos históricos:\n• Turnos\n• Días\n• Ventas\n• Gastos\n• Compras\n• Movimientos de inventario\n• Notificaciones\n• Logs de actividad\n• Arqueos de caja\n\nEsta acción es IRREVERSIBLE y NO se puede deshacer.'
      });

      if (result.success) {
        setResetResults(result);
        toast.success(`✅ Reset nuclear completado. ${result.totalDeleted} documentos eliminados`);
        await loadStatistics(); // Recargar estadísticas
      } else {
        toast.error(result.message || 'Error en reset nuclear');
      }
    } catch (error) {
      console.error('Error en reset nuclear:', error);
      toast.error('Error ejecutando reset nuclear');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKillAllShifts = async () => {
    try {
      setIsLoading(true);
      const result = await killAllShifts();

      if (result.success) {
        setResetResults(result);
        toast.success(`✅ Kill All Shifts completado. ${result.totalDeleted} documentos eliminados`);
        await loadStatistics(); // Recargar estadísticas
      } else {
        toast.error(result.message || 'Error en Kill All Shifts');
      }
    } catch (error) {
      console.error('Error en Kill All Shifts:', error);
      toast.error('Error ejecutando Kill All Shifts');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetByDateRange = async () => {
    if (!dateRange.startDate || !dateRange.endDate) {
      toast.error('Por favor selecciona un rango de fechas');
      return;
    }

    try {
      setIsLoading(true);
      const result = await resetByDateRange(dateRange.startDate, dateRange.endDate);

      if (result.success) {
        setResetResults(result);
        toast.success(`✅ Reset por fecha completado. ${result.totalDeleted} documentos eliminados`);
        await loadStatistics(); // Recargar estadísticas
      } else {
        toast.error(result.message || 'Error en reset por fecha');
      }
    } catch (error) {
      console.error('Error en reset por fecha:', error);
      toast.error('Error ejecutando reset por fecha');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content p-8 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-red-100 rounded-full">
              <Shield className="h-8 w-8 text-red-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Panel de Reset Administrativo</h2>
              <p className="text-sm text-gray-600">Operaciones de limpieza de datos - SOLO ADMINISTRADORES</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <XCircle className="h-6 w-6" />
          </button>
        </div>

        {/* Estadísticas actuales */}
        {stats && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <BarChart3 className="h-5 w-5 mr-2" />
              Estadísticas Actuales
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-sm text-blue-600">Turnos</p>
                <p className="text-lg font-bold text-blue-900">{stats.stats.shifts || 0}</p>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <p className="text-sm text-green-600">Días</p>
                <p className="text-lg font-bold text-green-900">{stats.stats.days || 0}</p>
              </div>
              <div className="bg-purple-50 rounded-lg p-4">
                <p className="text-sm text-purple-600">Ventas</p>
                <p className="text-lg font-bold text-purple-900">{stats.stats.sales || 0}</p>
              </div>
              <div className="bg-orange-50 rounded-lg p-4">
                <p className="text-sm text-orange-600">Gastos</p>
                <p className="text-lg font-bold text-orange-900">{stats.stats.expenses || 0}</p>
              </div>
              <div className="bg-yellow-50 rounded-lg p-4">
                <p className="text-sm text-yellow-600">Compras</p>
                <p className="text-lg font-bold text-yellow-900">{stats.stats.purchases || 0}</p>
              </div>
              <div className="bg-indigo-50 rounded-lg p-4">
                <p className="text-sm text-indigo-600">Movimientos</p>
                <p className="text-lg font-bold text-indigo-900">{stats.stats.inventory_movements || 0}</p>
              </div>
              <div className="bg-pink-50 rounded-lg p-4">
                <p className="text-sm text-pink-600">Notificaciones</p>
                <p className="text-lg font-bold text-pink-900">{stats.stats.notifications || 0}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">Total</p>
                <p className="text-lg font-bold text-gray-900">{stats.total || 0}</p>
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <button
                onClick={loadStatistics}
                disabled={isLoading}
                className="flex items-center px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Actualizar
              </button>
            </div>
          </div>
        )}

        {/* Reset por rango de fechas */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Calendar className="h-5 w-5 mr-2" />
            Reset por Rango de Fechas
          </h3>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <div className="flex items-center mb-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2" />
              <p className="text-sm font-medium text-yellow-800">Reset Selectivo</p>
            </div>
            <p className="text-sm text-yellow-700 mb-4">
              Elimina solo los datos dentro del rango de fechas especificado. Útil para limpiar períodos específicos.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Inicio</label>
                <input
                  type="date"
                  value={dateRange.startDate}
                  onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Fin</label>
                <input
                  type="date"
                  value={dateRange.endDate}
                  onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <button
              onClick={handleResetByDateRange}
              disabled={isLoading || !dateRange.startDate || !dateRange.endDate}
              className="w-full px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <Loader className="h-4 w-4 mr-2 animate-spin" />
                  Procesando...
                </>
              ) : (
                <>
                  <Calendar className="h-4 w-4 mr-2" />
                  Reset por Fecha
                </>
              )}
            </button>
          </div>
        </div>

        {/* Kill All Shifts */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Clock className="h-5 w-5 mr-2" />
            Kill All Shifts
          </h3>
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
            <div className="flex items-center mb-2">
              <AlertTriangle className="h-5 w-5 text-orange-600 mr-2" />
              <p className="text-sm font-medium text-orange-800">Eliminación de Turnos</p>
            </div>
            <p className="text-sm text-orange-700 mb-4">
              Elimina TODOS los turnos y sus datos relacionados (ventas, gastos, arqueos). Mantiene productos, clientes y empleados.
            </p>
            <button
              onClick={handleKillAllShifts}
              disabled={isLoading}
              className="w-full px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <Loader className="h-4 w-4 mr-2 animate-spin" />
                  Procesando...
                </>
              ) : (
                <>
                  <Clock className="h-4 w-4 mr-2" />
                  Kill All Shifts
                </>
              )}
            </button>
          </div>
        </div>

        {/* Nuclear Reset */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Trash2 className="h-5 w-5 mr-2" />
            Reset Nuclear
          </h3>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <div className="flex items-center mb-2">
              <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
              <p className="text-sm font-medium text-red-800">⚠️ PELIGRO - Reset Completo</p>
            </div>
            <p className="text-sm text-red-700 mb-4">
              <strong>ELIMINA TODOS LOS DATOS HISTÓRICOS:</strong><br/>
              • Turnos • Días • Ventas • Gastos • Compras • Movimientos • Notificaciones • Logs • Arqueos<br/>
              <strong>Esta acción es IRREVERSIBLE y NO se puede deshacer.</strong>
            </p>
            <button
              onClick={handleNuclearReset}
              disabled={isLoading}
              className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <Loader className="h-4 w-4 mr-2 animate-spin" />
                  Procesando...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  RESET NUCLEAR
                </>
              )}
            </button>
          </div>
        </div>

        {/* Resultados del reset */}
        {resetResults && (
          <div className="mt-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
              Resultados del Reset
            </h3>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                <p className="text-sm font-medium text-green-800">Reset Completado</p>
              </div>
              <p className="text-sm text-green-700 mb-3">
                Total de documentos eliminados: <strong>{resetResults.totalDeleted}</strong>
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                {Object.entries(resetResults.deleted).map(([collection, count]) => (
                  <div key={collection} className="bg-white rounded p-2">
                    <p className="font-medium text-gray-800">{collection}</p>
                    <p className="text-green-600">{count}</p>
                  </div>
                ))}
              </div>
              {resetResults.errors && resetResults.errors.length > 0 && (
                <div className="mt-3 p-2 bg-red-100 rounded">
                  <p className="text-xs text-red-700">
                    <strong>Errores:</strong> {resetResults.errors.length} errores encontrados
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Advertencia final */}
        <div className="mt-8 p-4 bg-gray-100 rounded-lg">
          <div className="flex items-center mb-2">
            <Shield className="h-5 w-5 text-gray-600 mr-2" />
            <p className="text-sm font-medium text-gray-800">Información Importante</p>
          </div>
          <ul className="text-xs text-gray-600 space-y-1">
            <li>• Estas operaciones son IRREVERSIBLES</li>
            <li>• Se recomienda hacer backup antes de ejecutar</li>
            <li>• Solo administradores deben usar estas funciones</li>
            <li>• Los productos, clientes y empleados NO se eliminan</li>
            <li>• El cache local se limpia automáticamente</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AdminResetPanel;
