import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  Package, 
  Users, 
  TrendingUp, 
  Activity, 
  AlertTriangle,
  Zap,
  Bell,
  RefreshCw,
  ShoppingCart
} from 'lucide-react';
import { realtimeService } from '../services/realtimeService';
import { productService, saleService } from '../services/firebaseService';
import toast from 'react-hot-toast';

const Dashboard = () => {
  // Estados para datos en tiempo real
  const [realtimeStats, setRealtimeStats] = useState({
    ventasHoy: 0,
    productosVendidos: 0,
    clientesNuevos: 0,
    inventarioBajo: 0,
    ventasUltimaHora: 0,
    promedioTicket: 0,
    productosPopulares: [],
    ventasRecientes: []
  });

  const [connectionStatus, setConnectionStatus] = useState({
    isOnline: true,
    pendingOperations: 0,
    lastSync: Date.now()
  });

  const [stockAlerts, setStockAlerts] = useState([]);
  const [recentNotifications, setRecentNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Estados para gráficos y análisis
  const [salesChart, setSalesChart] = useState([]);
  const [productPerformance, setProductPerformance] = useState([]);


  // Inicializar listeners de tiempo real
  useEffect(() => {
    console.log('🚀 Inicializando Dashboard con tiempo real...');
    
    // Escuchar actualizaciones de ventas
    realtimeService.on('sales_updated', (data) => {
      updateSalesStats(data.sales);
      updateRecentSales(data.sales);
    });
    
    // Escuchar alertas de stock
    realtimeService.on('stock_alert', (data) => {
      setStockAlerts(data.items);
      if (data.items.length > 0) {
        toast.error(`¡Alerta! ${data.items.length} productos con stock bajo`);
      }
    });
    
    // Escuchar notificaciones
    realtimeService.on('notification_received', (notification) => {
      setRecentNotifications(prev => [notification, ...prev.slice(0, 9)]);
      toast.success(notification.data?.message || 'Nueva notificación');
    });
    
    // Escuchar sincronización completada
    realtimeService.on('sync_completed', (data) => {
      setConnectionStatus(prev => ({
        ...prev,
        lastSync: data.timestamp,
        pendingOperations: 0
      }));
      toast.success('Sincronización completada');
    });
    
    // Cargar datos iniciales
    const loadData = async () => {
      await loadInitialData();
    };
    loadData();
    
    // Actualizar estado de conexión cada 30 segundos
    const connectionInterval = setInterval(() => {
      const syncState = realtimeService.getSyncState();
      setConnectionStatus({
        isOnline: syncState.isOnline,
        pendingOperations: syncState.offlineQueueSize,
        lastSync: syncState.lastSync
      });
    }, 30000);
    
    return () => {
      clearInterval(connectionInterval);
      realtimeService.off('sales_updated');
      realtimeService.off('stock_alert');
      realtimeService.off('notification_received');
      realtimeService.off('sync_completed');
    };
  }, []);

  const loadInitialData = async () => {
    try {
      setIsLoading(true);
      
      // Cargar estadísticas básicas
      const [products, sales] = await Promise.all([
        productService.getAllProducts(),
        saleService.getAllSales()
      ]);
      
      updateSalesStats(sales);
      updateProductStats(products);
      
      // Generar datos de gráficos
      generateChartData(sales);
      
    } catch (error) {
      console.error('Error cargando datos iniciales:', error);
      toast.error('Error cargando datos del dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  const updateSalesStats = (sales) => {
    const today = new Date().toDateString();
    const todaySales = sales.filter(sale => 
      new Date(sale.createdAt?.toDate?.() || sale.createdAt).toDateString() === today
    );
    
    const lastHour = new Date(Date.now() - 60 * 60 * 1000);
    const lastHourSales = sales.filter(sale => 
      new Date(sale.createdAt?.toDate?.() || sale.createdAt) > lastHour
    );
    
    const totalToday = todaySales.reduce((sum, sale) => sum + (sale.total || 0), 0);
    const totalLastHour = lastHourSales.reduce((sum, sale) => sum + (sale.total || 0), 0);
    const avgTicket = todaySales.length > 0 ? totalToday / todaySales.length : 0;
    
    setRealtimeStats(prev => ({
      ...prev,
      ventasHoy: totalToday,
      ventasUltimaHora: totalLastHour,
      promedioTicket: avgTicket,
      productosVendidos: todaySales.reduce((sum, sale) => 
        sum + (sale.items?.length || 0), 0
      )
    }));
  };

  const updateRecentSales = (sales) => {
    const recent = sales
      .slice(0, 5)
      .map(sale => ({
        id: sale.id,
        cliente: sale.customer?.name || 'Cliente',
        monto: sale.total || 0,
        hora: new Date(sale.createdAt?.toDate?.() || sale.createdAt).toLocaleTimeString(),
        productos: sale.items?.length || 0,
        metodo: sale.paymentMethod || 'efectivo'
      }));
    
    setRealtimeStats(prev => ({
      ...prev,
      ventasRecientes: recent
    }));
  };

  const updateProductStats = (products) => {
    const lowStock = products.filter(p => (p.stock || 0) <= (p.minStock || 5));
    
    setRealtimeStats(prev => ({
      ...prev,
      inventarioBajo: lowStock.length
    }));
  };

  const generateChartData = (sales) => {
    // Datos para gráfico de ventas por hora
    const hourlyData = Array.from({ length: 24 }, (_, hour) => {
      const hourSales = sales.filter(sale => {
        const saleHour = new Date(sale.createdAt?.toDate?.() || sale.createdAt).getHours();
        return saleHour === hour;
      });
      return {
        hora: `${hour}:00`,
        ventas: hourSales.reduce((sum, sale) => sum + (sale.total || 0), 0)
      };
    });
    
    setSalesChart(hourlyData);
    
    // Datos para rendimiento de productos
    const productSales = {};
    sales.forEach(sale => {
      sale.items?.forEach(item => {
        if (!productSales[item.name]) {
          productSales[item.name] = { name: item.name, ventas: 0, cantidad: 0 };
        }
        productSales[item.name].ventas += item.subtotal || 0;
        productSales[item.name].cantidad += item.quantity || 0;
      });
    });
    
    const topProducts = Object.values(productSales)
      .sort((a, b) => b.ventas - a.ventas)
      .slice(0, 5);
    
    setProductPerformance(topProducts);
    
    // Datos para tendencia de ingresos (comentado porque se removió el estado)
    // const last7Days = Array.from({ length: 7 }, (_, i) => {
    //   const date = new Date();
    //   date.setDate(date.getDate() - i);
    //   const daySales = sales.filter(sale => {
    //     const saleDate = new Date(sale.createdAt?.toDate?.() || sale.createdAt);
    //     return saleDate.toDateString() === date.toDateString();
    //   });
    //   return {
    //     fecha: date.toLocaleDateString('es-ES', { weekday: 'short' }),
    //     ingresos: daySales.reduce((sum, sale) => sum + (sale.total || 0), 0)
    //   };
    // }).reverse();
    
    // setRevenueTrend(last7Days); // This state was removed
  };

  const handleForceSync = async () => {
    try {
      const success = await realtimeService.forceSync();
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

  const handleRefresh = () => {
    loadInitialData();
    toast.success('Datos actualizados');
  };

  if (isLoading) {
    return (
      <div className="p-4 lg:p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="relative inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-orange-100 to-red-100 rounded-3xl mb-6 shadow-lg">
              <RefreshCw className="h-10 w-10 text-orange-600 animate-spin" />
            </div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mb-2">
              Cargando Dashboard...
            </h2>
            <p className="text-gray-600">Sincronizando datos en tiempo real</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6">
      {/* Header con controles */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
          <p className="text-gray-600">Vista general del negocio en tiempo real</p>
        </div>
        
        <div className="flex items-center space-x-3">
          {/* Estado de conexión */}
          <div className={`px-3 py-2 rounded-xl text-sm font-medium flex items-center ${
            connectionStatus.isOnline 
              ? 'bg-green-100 text-green-700' 
              : 'bg-red-100 text-red-700'
          }`}>
            {connectionStatus.isOnline ? '🟢' : '🔴'} 
            {connectionStatus.isOnline ? 'En línea' : 'Offline'}
            {connectionStatus.pendingOperations > 0 && (
              <span className="ml-2 bg-yellow-500 text-white px-2 py-1 rounded-full text-xs">
                {connectionStatus.pendingOperations}
              </span>
            )}
          </div>
          
          {/* Botón de sincronización */}
          <button
            onClick={handleForceSync}
            disabled={connectionStatus.pendingOperations === 0}
            className="p-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            title="Sincronizar datos"
          >
            <RefreshCw className="h-5 w-5" />
          </button>
          
          {/* Botón de notificaciones */}
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-colors relative"
          >
            <Bell className="h-5 w-5" />
            {recentNotifications.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                {recentNotifications.length}
              </span>
            )}
          </button>
          
          {/* Botón de actualizar */}
          <button
            onClick={handleRefresh}
            className="p-2 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors"
            title="Actualizar datos"
          >
            <Zap className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Panel de notificaciones */}
      {showNotifications && (
        <div className="mb-6 bg-white rounded-2xl p-6 shadow-lg">
          <h3 className="text-lg font-semibold mb-4">Notificaciones Recientes</h3>
          {recentNotifications.length === 0 ? (
            <p className="text-gray-500">No hay notificaciones recientes</p>
          ) : (
            <div className="space-y-3">
              {recentNotifications.map((notification, index) => (
                <div key={index} className="flex items-center p-3 bg-gray-50 rounded-xl">
                  <div className="flex-1">
                    <div className="font-medium">{notification.type}</div>
                    <div className="text-sm text-gray-600">
                      {notification.data?.message || 'Nueva notificación'}
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(notification.timestamp?.toDate?.() || notification.timestamp).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Estadísticas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Ventas Hoy</p>
              <p className="text-3xl font-bold text-green-600">
                ${realtimeStats.ventasHoy.toLocaleString()}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-xl">
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
            <span className="text-green-600">+{realtimeStats.ventasUltimaHora.toLocaleString()} última hora</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Productos Vendidos</p>
              <p className="text-3xl font-bold text-blue-600">
                {realtimeStats.productosVendidos}
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-xl">
              <Package className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <ShoppingCart className="h-4 w-4 text-blue-500 mr-1" />
            <span className="text-blue-600">Promedio: ${realtimeStats.promedioTicket.toLocaleString()}</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Clientes Nuevos</p>
              <p className="text-3xl font-bold text-purple-600">
                {realtimeStats.clientesNuevos}
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-xl">
              <Users className="h-8 w-8 text-purple-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <Activity className="h-4 w-4 text-purple-500 mr-1" />
            <span className="text-purple-600">Este mes</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Stock Bajo</p>
              <p className="text-3xl font-bold text-red-600">
                {realtimeStats.inventarioBajo}
              </p>
            </div>
            <div className="p-3 bg-red-100 rounded-xl">
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <AlertTriangle className="h-4 w-4 text-red-500 mr-1" />
            <span className="text-red-600">Requieren atención</span>
          </div>
        </div>
      </div>

      {/* Gráficos y análisis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Ventas por hora */}
        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <h3 className="text-lg font-semibold mb-4">Ventas por Hora</h3>
          <div className="h-64 flex items-end justify-between space-x-1">
            {salesChart.map((data, index) => (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div 
                  className="w-full bg-gradient-to-t from-orange-500 to-red-500 rounded-t"
                  style={{ height: `${(data.ventas / Math.max(...salesChart.map(d => d.ventas))) * 200}px` }}
                ></div>
                <span className="text-xs text-gray-600 mt-1">{data.hora}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Productos más vendidos */}
        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <h3 className="text-lg font-semibold mb-4">Productos Más Vendidos</h3>
          <div className="space-y-3">
            {productPerformance.map((product, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center mr-3">
                    <span className="text-sm font-bold text-orange-600">{index + 1}</span>
                  </div>
                  <div>
                    <div className="font-medium">{product.name}</div>
                    <div className="text-sm text-gray-600">{product.cantidad} unidades</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-green-600">${product.ventas.toLocaleString()}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Ventas recientes y alertas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ventas recientes */}
        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <h3 className="text-lg font-semibold mb-4">Ventas Recientes</h3>
          <div className="space-y-3">
            {realtimeStats.ventasRecientes.map((sale, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-3">
                    <DollarSign className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <div className="font-medium">{sale.cliente}</div>
                    <div className="text-sm text-gray-600">{sale.productos} productos</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-green-600">${sale.monto.toLocaleString()}</div>
                  <div className="text-xs text-gray-500">{sale.hora}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Alertas de stock */}
        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <h3 className="text-lg font-semibold mb-4">Alertas de Stock</h3>
          {stockAlerts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Package className="h-12 w-12 mx-auto mb-2 text-gray-300" />
              <p>No hay alertas de stock</p>
            </div>
          ) : (
            <div className="space-y-3">
              {stockAlerts.slice(0, 5).map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-red-50 rounded-xl border border-red-200">
                  <div className="flex items-center">
                    <AlertTriangle className="h-5 w-5 text-red-500 mr-3" />
                    <div>
                      <div className="font-medium">{item.name}</div>
                      <div className="text-sm text-red-600">Stock: {item.stock}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-red-600">Mínimo: {item.minStock}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 