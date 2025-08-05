import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  Package, 
  Users, 
  TrendingUp, 
  Activity, 
  Clock, 
  AlertTriangle,
  BarChart3,
  PieChart,
  Target,
  Zap
} from 'lucide-react';
import { checkConnectionStatus, forceSync } from '../services/firebaseService';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const [stats, setStats] = useState({
    ventasHoy: 125000,
    productosVendidos: 45,
    clientesNuevos: 8,
    inventarioBajo: 3
  });

  const [connectionStatus, setConnectionStatus] = useState({
    isOnline: true,
    pendingOperations: 0
  });

  const [realTimeData, setRealTimeData] = useState({
    ventasUltimaHora: 15000,
    productosPopulares: [
      { name: 'Asado de Tira', sales: 12 },
      { name: 'Vacío', sales: 8 },
      { name: 'Pollo Entero', sales: 6 }
    ],
    alertas: [
      { type: 'stock', message: 'Chorizo Parrillero agotado', priority: 'high' },
      { type: 'venta', message: 'Nueva venta de $25,000', priority: 'medium' }
    ]
  });

  const [recentSales] = useState([
    { id: 1, cliente: 'Juan Pérez', monto: 25000, hora: '14:30', productos: 3 },
    { id: 2, cliente: 'María García', monto: 18000, hora: '14:15', productos: 2 },
    { id: 3, cliente: 'Carlos López', monto: 32000, hora: '13:45', productos: 4 }
  ]);

  const [lowStockItems] = useState([
    { id: 1, nombre: 'Carne Molida', stock: 2, minimo: 5, categoria: 'carne' },
    { id: 2, nombre: 'Pollo Entero', stock: 1, minimo: 3, categoria: 'pollo' },
    { id: 3, nombre: 'Chorizo', stock: 0, minimo: 4, categoria: 'embutidos' }
  ]);

  // Verificar estado de conexión cada 30 segundos
  useEffect(() => {
    const checkConnection = () => {
      const status = checkConnectionStatus();
      setConnectionStatus(status);
      
      if (!status.isOnline && status.pendingOperations > 0) {
        toast.error(`Modo offline - ${status.pendingOperations} operaciones pendientes`);
      }
    };

    checkConnection();
    const interval = setInterval(checkConnection, 30000);
    return () => clearInterval(interval);
  }, []);

  // Simular datos en tiempo real
  useEffect(() => {
    const updateRealTimeData = () => {
      setRealTimeData(prev => ({
        ...prev,
        ventasUltimaHora: prev.ventasUltimaHora + Math.floor(Math.random() * 5000),
        alertas: [
          ...prev.alertas.slice(-4),
          { type: 'venta', message: `Nueva venta de $${Math.floor(Math.random() * 20000) + 5000}`, priority: 'medium' }
        ]
      }));
    };

    const interval = setInterval(updateRealTimeData, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleForceSync = async () => {
    try {
      const success = await forceSync();
      if (success) {
        toast.success('Sincronización completada');
        setConnectionStatus(prev => ({ ...prev, pendingOperations: 0 }));
      } else {
        toast.error('No hay conexión para sincronizar');
      }
    } catch (error) {
      toast.error('Error en sincronización');
    }
  };

  return (
    <div className="p-4 lg:p-6">
      {/* Header con Estado de Conexión */}
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">Dashboard en Tiempo Real</h1>
            <p className="text-gray-600 dark:text-gray-400">Monitoreo activo de la carnicería</p>
          </div>
          <div className="mt-4 sm:mt-0 flex items-center space-x-3">
            {/* Indicador de Conexión */}
            <div className={`flex items-center px-3 py-2 rounded-2xl text-sm font-medium ${
              connectionStatus.isOnline 
                ? 'bg-success-100 text-success-800 dark:bg-success-900 dark:text-success-200' 
                : 'bg-warning-100 text-warning-800 dark:bg-warning-900 dark:text-warning-200'
            }`}>
              <div className={`w-2 h-2 rounded-full mr-2 ${
                connectionStatus.isOnline ? 'bg-success-500' : 'bg-warning-500'
              }`} />
              {connectionStatus.isOnline ? 'En línea' : 'Offline'}
            </div>
            
            {connectionStatus.pendingOperations > 0 && (
              <button
                onClick={handleForceSync}
                className="btn btn-primary"
              >
                <Zap className="h-4 w-4 mr-2" />
                Sincronizar ({connectionStatus.pendingOperations})
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Estadísticas Principales Mejoradas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="stats-card group hover:scale-105 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="stats-label">Ventas Hoy</p>
              <p className="stats-value">${stats.ventasHoy.toLocaleString()}</p>
              <p className="text-xs text-success-600 dark:text-success-400 mt-1">
                +{realTimeData.ventasUltimaHora.toLocaleString()} última hora
              </p>
            </div>
            <div className="stats-icon group-hover:scale-110 transition-transform duration-300">
              <DollarSign className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="stats-card group hover:scale-105 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="stats-label">Productos Vendidos</p>
              <p className="stats-value">{stats.productosVendidos}</p>
              <p className="text-xs text-info-600 dark:text-info-400 mt-1">
                +3 este turno
              </p>
            </div>
            <div className="stats-icon group-hover:scale-110 transition-transform duration-300">
              <Package className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="stats-card group hover:scale-105 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="stats-label">Clientes Nuevos</p>
              <p className="stats-value">{stats.clientesNuevos}</p>
              <p className="text-xs text-warning-600 dark:text-warning-400 mt-1">
                +2 esta semana
              </p>
            </div>
            <div className="stats-icon group-hover:scale-110 transition-transform duration-300">
              <Users className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="stats-card group hover:scale-105 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="stats-label">Stock Bajo</p>
              <p className="stats-value">{stats.inventarioBajo}</p>
              <p className="text-xs text-danger-600 dark:text-danger-400 mt-1">
                Requiere atención
              </p>
            </div>
            <div className="stats-icon group-hover:scale-110 transition-transform duration-300">
              <AlertTriangle className="h-6 w-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Analytics en Tiempo Real */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Productos Más Populares */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Productos Populares</h2>
            <div className="flex items-center text-success-600 dark:text-success-400">
              <TrendingUp className="h-4 w-4 mr-1" />
              <span className="text-sm">En tiempo real</span>
            </div>
          </div>
          <div className="space-y-3">
            {realTimeData.productosPopulares.map((product, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-2xl">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center mr-3">
                    <span className="text-sm font-bold text-primary-600 dark:text-primary-400">{index + 1}</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{product.name}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{product.sales} ventas</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="w-16 h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary-500 rounded-full transition-all duration-500"
                      style={{ width: `${(product.sales / 12) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Alertas en Tiempo Real */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Alertas Activas</h2>
            <div className="flex items-center text-warning-600 dark:text-warning-400">
              <Activity className="h-4 w-4 mr-1" />
              <span className="text-sm">Live</span>
            </div>
          </div>
          <div className="space-y-3">
            {realTimeData.alertas.map((alerta, index) => (
              <div key={index} className={`p-3 rounded-2xl border-l-4 ${
                alerta.priority === 'high' 
                  ? 'bg-red-50 dark:bg-red-900/20 border-red-500' 
                  : 'bg-blue-50 dark:bg-blue-900/20 border-blue-500'
              }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{alerta.message}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {alerta.type === 'stock' ? 'Inventario' : 'Venta'} • Hace 2 min
                    </p>
                  </div>
                  <div className={`w-2 h-2 rounded-full ${
                    alerta.priority === 'high' ? 'bg-red-500' : 'bg-blue-500'
                  }`} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Contenido Principal */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ventas Recientes */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Ventas Recientes</h2>
            <button className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-medium">
              Ver todas
            </button>
          </div>
          <div className="space-y-3">
            {recentSales.map((sale) => (
              <div key={sale.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-2xl hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-200">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900 rounded-xl flex items-center justify-center">
                    <span className="text-sm font-bold text-primary-600 dark:text-primary-400">V</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{sale.cliente}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{sale.hora} • {sale.productos} items</p>
                  </div>
                </div>
                <p className="font-bold text-gray-900 dark:text-white">${sale.monto.toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Alertas de Inventario */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Stock Bajo</h2>
            <button className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-medium">
              Ver inventario
            </button>
          </div>
          <div className="space-y-3">
            {lowStockItems.map((item) => (
              <div key={item.id} className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{item.nombre}</p>
                    <p className="text-sm text-red-600 dark:text-red-400">
                      Stock: {item.stock} (Mínimo: {item.minimo})
                    </p>
                  </div>
                  <div className="badge badge-danger">
                    {item.stock === 0 ? 'Agotado' : 'Bajo Stock'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 