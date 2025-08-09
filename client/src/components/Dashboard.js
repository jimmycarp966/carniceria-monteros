import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
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

// Componentes memoizados para evitar re-renders
const StatCard = memo(({ title, value, icon: Icon, color, subtitle, subtitleIcon: SubtitleIcon }) => (
  <div className="bg-white rounded-2xl p-6 shadow-lg">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <p className={`text-3xl font-bold text-${color}-600`}>
          {typeof value === 'number' ? (Number(value) || 0).toLocaleString() : value}
        </p>
      </div>
      <div className={`p-3 bg-${color}-100 rounded-xl`}>
        <Icon className={`h-8 w-8 text-${color}-600`} />
      </div>
    </div>
    {subtitle && (
      <div className="mt-4 flex items-center text-sm">
        <SubtitleIcon className={`h-4 w-4 text-${color}-500 mr-1`} />
        <span className={`text-${color}-600`}>{subtitle}</span>
      </div>
    )}
  </div>
));

const NotificationItem = memo(({ notification }) => (
  <div className="flex items-center p-3 bg-gray-50 rounded-xl">
    <div className="flex-1">
      <div className="font-medium">{notification.type}</div>
      <div className="text-sm text-gray-600">
        {notification.data?.message || 'Nueva notificación'}
      </div>
      <div className="text-xs text-gray-500">
        {new Date(notification.timestamp?.toDate?.() || notification.timestamp || Date.now()).toLocaleString()}
      </div>
    </div>
  </div>
));

const SalesChart = memo(({ salesChart }) => {
  const maxValue = Math.max(1, ...salesChart.map(d => d.ventas || 0));
  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg">
      <h3 className="text-lg font-semibold mb-4">Ventas por Hora</h3>
      <div className="h-64 flex items-end justify-between space-x-1">
        {salesChart.map((data, index) => (
          <div key={index} className="flex-1 flex flex-col items-center">
            <div
              className="w-full bg-gradient-to-t from-orange-500 to-red-500 rounded-t"
              style={{ height: `${(Math.max(0, data.ventas || 0) / maxValue) * 200}px` }}
            />
            <span className="text-xs text-gray-600 mt-1">{data.hora}</span>
          </div>
        ))}
      </div>
    </div>
  );
});

const ProductPerformance = memo(({ productPerformance }) => (
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
            <div className="font-semibold text-green-600">${(Number(product.ventas) || 0).toLocaleString()}</div>
          </div>
        </div>
      ))}
    </div>
  </div>
));

const RecentSales = memo(({ ventasRecientes }) => (
  <div className="bg-white rounded-2xl p-6 shadow-lg">
    <h3 className="text-lg font-semibold mb-4">Ventas Recientes</h3>
    <div className="space-y-3">
      {ventasRecientes.map((sale, index) => (
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
            <div className="font-semibold text-green-600">${(Number(sale.monto) || 0).toLocaleString()}</div>
            <div className="text-xs text-gray-500">{sale.hora}</div>
          </div>
        </div>
      ))}
    </div>
  </div>
));

const StockAlerts = memo(({ stockAlerts }) => (
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
));

const Dashboard = () => {
  // Estados optimizados con valores iniciales
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

  const [stockAlerts] = useState([]);
  const [recentNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Estados para gráficos y análisis
  const [salesChart, setSalesChart] = useState([]);
  const [productPerformance, setProductPerformance] = useState([]);

  // Funciones optimizadas con useCallback - definidas antes de su uso
  const updateSalesStats = useCallback((sales) => {
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
  }, []);

  const updateRecentSales = useCallback((sales) => {
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
  }, []);

  const updateProductStats = useCallback((products) => {
    const lowStock = products.filter(p => (p.stock || 0) <= (p.minStock || 5));
    
    setRealtimeStats(prev => ({
      ...prev,
      inventarioBajo: lowStock.length
    }));
  }, []);

  const generateChartData = useCallback((sales) => {
    // Datos para gráfico de ventas por hora optimizado
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
    
    // Datos para rendimiento de productos optimizado
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
  }, []);

  // Cargar datos iniciales optimizado
  const loadInitialData = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Cargar datos en paralelo con cache
      const [products, sales] = await Promise.all([
        productService.getAllProducts(1, 50), // Solo primera página
        saleService.getAllSales(1, 100) // Solo últimas 100 ventas
      ]);
      
      updateSalesStats(sales);
      updateRecentSales(sales);
      updateProductStats(products);
      
      // Generar datos de gráficos de forma optimizada
      generateChartData(sales);
      
    } catch (error) {
      console.error('Error cargando datos iniciales:', error);
      toast.error('Error cargando datos del dashboard');
    } finally {
      setIsLoading(false);
    }
  }, [updateSalesStats, updateProductStats, generateChartData, updateRecentSales]);

  // Inicializar: usar carga puntual; listeners solo para eventos críticos
  useEffect(() => {
    console.log('🚀 Inicializando Dashboard optimizado...');
    loadInitialData();
    
    // Actualizar estado de conexión cada 60 segundos (reducido de 30)
    const connectionInterval = setInterval(() => {
      const syncState = realtimeService.getSyncState();
      setConnectionStatus({
        isOnline: syncState.isOnline,
        pendingOperations: syncState.offlineQueueSize,
        lastSync: syncState.lastSync
      });
    }, 60000);
    
    return () => {
      clearInterval(connectionInterval);
      // sin off: no registramos listeners en este componente ahora
    };
  }, [loadInitialData, updateSalesStats, updateProductStats, updateRecentSales]);

  // Handlers optimizados
  const handleForceSync = useCallback(async () => {
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
  }, []);

  const handleRefresh = useCallback(() => {
    loadInitialData();
    toast.success('Datos actualizados');
  }, [loadInitialData]);

  // Estadísticas memoizadas
  const statsCards = useMemo(() => [
    {
      title: 'Ventas Hoy',
      value: realtimeStats.ventasHoy,
      icon: DollarSign,
      color: 'green',
      subtitle: `+${(Number(realtimeStats.ventasUltimaHora) || 0).toLocaleString()} última hora`,
      subtitleIcon: TrendingUp
    },
    {
      title: 'Productos Vendidos',
      value: realtimeStats.productosVendidos,
      icon: Package,
      color: 'blue',
      subtitle: `Promedio: $${(Number(realtimeStats.promedioTicket) || 0).toLocaleString()}`,
      subtitleIcon: ShoppingCart
    },
    {
      title: 'Clientes Nuevos',
      value: realtimeStats.clientesNuevos,
      icon: Users,
      color: 'purple',
      subtitle: 'Este mes',
      subtitleIcon: Activity
    },
    {
      title: 'Stock Bajo',
      value: realtimeStats.inventarioBajo,
      icon: AlertTriangle,
      color: 'red',
      subtitle: 'Requieren atención',
      subtitleIcon: AlertTriangle
    }
  ], [realtimeStats]);

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
                <NotificationItem key={index} notification={notification} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Estadísticas principales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-6">
        {statsCards.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>

      {/* Gráficos y análisis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 mb-6">
        <SalesChart salesChart={salesChart} />
        <ProductPerformance productPerformance={productPerformance} />
      </div>

      {/* Ventas recientes y alertas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        <RecentSales ventasRecientes={realtimeStats.ventasRecientes} />
        <StockAlerts stockAlerts={stockAlerts} />
      </div>
    </div>
  );
};

export default Dashboard; 