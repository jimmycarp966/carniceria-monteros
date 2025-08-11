import React, { useState, useEffect, useMemo } from 'react';
import { 
  DollarSign, 
  ShoppingCart, 
  Package, 
  Users, 
  TrendingUp, 
  TrendingDown,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle,
  Eye,
  EyeOff
} from 'lucide-react';
import { collection, query, orderBy, limit, onSnapshot, where } from 'firebase/firestore';
import { db } from '../firebase';
import { toast } from 'react-toastify';

// Componentes
import LoadingSpinner from './LoadingSpinner';

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalSales: 0,
    todaySales: 0,
    totalProducts: 0,
    totalCustomers: 0,
    lowStockProducts: 0,
    activeShifts: 0
  });
  const [recentSales, setRecentSales] = useState([]);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [showSensitiveData, setShowSensitiveData] = useState(false);

  // Cargar datos del dashboard
  useEffect(() => {
    setLoading(true);
    
    const unsubscribeSales = onSnapshot(
      query(collection(db, 'sales'), orderBy('timestamp', 'desc'), limit(5)),
      (snapshot) => {
        const sales = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setRecentSales(sales);
        
        // Calcular estadísticas de ventas
        const totalSales = sales.reduce((sum, sale) => sum + (sale.total || 0), 0);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todaySales = sales
          .filter(sale => sale.timestamp?.toDate() >= today)
          .reduce((sum, sale) => sum + (sale.total || 0), 0);
        
        setStats(prev => ({ ...prev, totalSales, todaySales }));
      },
      (error) => {
        console.error('Error cargando ventas:', error);
        toast.error('Error al cargar datos de ventas');
      }
    );

    const unsubscribeProducts = onSnapshot(
      query(collection(db, 'products')),
      (snapshot) => {
        const products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const lowStock = products.filter(p => (p.stock || 0) <= (p.minStock || 10));
        
        setStats(prev => ({ 
          ...prev, 
          totalProducts: products.length,
          lowStockProducts: lowStock.length 
        }));
        setLowStockItems(lowStock.slice(0, 5));
      },
      (error) => {
        console.error('Error cargando productos:', error);
        toast.error('Error al cargar datos de productos');
      }
    );

    const unsubscribeCustomers = onSnapshot(
      query(collection(db, 'customers')),
      (snapshot) => {
        const customers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setStats(prev => ({ ...prev, totalCustomers: customers.length }));
      },
      (error) => {
        console.error('Error cargando clientes:', error);
        toast.error('Error al cargar datos de clientes');
      }
    );

    const unsubscribeShifts = onSnapshot(
      query(collection(db, 'shifts'), where('status', '==', 'active')),
      (snapshot) => {
        setStats(prev => ({ ...prev, activeShifts: snapshot.docs.length }));
      },
      (error) => {
        console.error('Error cargando turnos:', error);
      }
    );

    setLoading(false);

    return () => {
      unsubscribeSales();
      unsubscribeProducts();
      unsubscribeCustomers();
      unsubscribeShifts();
    };
  }, []);

  // Calcular tendencias
  const trends = useMemo(() => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);
    
    const yesterdaySales = recentSales
      .filter(sale => {
        const saleDate = sale.timestamp?.toDate();
        return saleDate >= yesterday && saleDate < new Date(yesterday.getTime() + 24 * 60 * 60 * 1000);
      })
      .reduce((sum, sale) => sum + (sale.total || 0), 0);

    const todaySales = stats.todaySales;
    const salesChange = yesterdaySales > 0 ? ((todaySales - yesterdaySales) / yesterdaySales) * 100 : 0;

    return {
      salesChange,
      isPositive: salesChange >= 0
    };
  }, [stats.todaySales, recentSales]);

  // Formatear moneda
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Formatear fecha
  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    return timestamp.toDate().toLocaleString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return <LoadingSpinner text="Cargando dashboard..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gradient">
            Dashboard
          </h1>
          <p className="text-gray-600 mt-1">
            Resumen ejecutivo del negocio
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowSensitiveData(!showSensitiveData)}
            className="btn btn-secondary flex items-center"
          >
            {showSensitiveData ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
            {showSensitiveData ? 'Ocultar' : 'Mostrar'} Datos
          </button>
        </div>
      </div>

      {/* KPIs Principales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6">
        {/* Ventas Totales */}
        <div className="stats-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="stats-label">Ventas Totales</p>
              <p className="stats-value">
                {showSensitiveData ? formatCurrency(stats.totalSales) : '***'}
              </p>
              <div className="flex items-center mt-1">
                {trends.isPositive ? (
                  <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-600 mr-1" />
                )}
                <span className={`text-sm font-medium ${
                  trends.isPositive ? 'text-green-600' : 'text-red-600'
                }`}>
                  {Math.abs(trends.salesChange).toFixed(1)}%
                </span>
                <span className="text-sm text-gray-500 ml-1">vs ayer</span>
              </div>
            </div>
            <div className="p-3 bg-gradient-to-br from-green-100 to-green-200 rounded-lg">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        {/* Ventas de Hoy */}
        <div className="stats-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="stats-label">Ventas de Hoy</p>
              <p className="stats-value">
                {showSensitiveData ? formatCurrency(stats.todaySales) : '***'}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {new Date().toLocaleDateString('es-AR', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>
            <div className="p-3 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg">
              <Calendar className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Productos */}
        <div className="stats-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="stats-label">Total Productos</p>
              <p className="stats-value">{stats.totalProducts}</p>
              <p className="text-sm text-gray-500 mt-1">
                {stats.lowStockProducts} con stock bajo
              </p>
            </div>
            <div className="p-3 bg-gradient-to-br from-orange-100 to-orange-200 rounded-lg">
              <Package className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </div>

        {/* Clientes */}
        <div className="stats-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="stats-label">Total Clientes</p>
              <p className="stats-value">{stats.totalCustomers}</p>
              <p className="text-sm text-gray-500 mt-1">
                Base de datos activa
              </p>
            </div>
            <div className="p-3 bg-gradient-to-br from-purple-100 to-purple-200 rounded-lg">
              <Users className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Alertas y Estado */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Alertas */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2" />
              Alertas del Sistema
            </h3>
          </div>
          <div className="card-body">
            <div className="space-y-3">
              {stats.lowStockProducts > 0 && (
                <div className="flex items-center p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 mr-3" />
                  <div>
                    <p className="font-medium text-yellow-800">
                      Stock Bajo
                    </p>
                    <p className="text-sm text-yellow-700">
                      {stats.lowStockProducts} productos necesitan reposición
                    </p>
                  </div>
                </div>
              )}
              
              {stats.activeShifts > 0 && (
                <div className="flex items-center p-3 bg-green-50 border border-green-200 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
                  <div>
                    <p className="font-medium text-green-800">
                      Turnos Activos
                    </p>
                    <p className="text-sm text-green-700">
                      {stats.activeShifts} turno(s) en curso
                    </p>
                  </div>
                </div>
              )}

              {stats.lowStockProducts === 0 && stats.activeShifts === 0 && (
                <div className="flex items-center p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-blue-600 mr-3" />
                  <div>
                    <p className="font-medium text-blue-800">
                      Todo en Orden
                    </p>
                    <p className="text-sm text-blue-700">
                      No hay alertas pendientes
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Estado del Sistema */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Clock className="h-5 w-5 text-gray-600 mr-2" />
              Estado del Sistema
            </h3>
          </div>
          <div className="card-body">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Conexión a Firebase</span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  <div className="w-2 h-2 bg-green-400 rounded-full mr-1"></div>
                  Conectado
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Sincronización</span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  <div className="w-2 h-2 bg-green-400 rounded-full mr-1"></div>
                  En tiempo real
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Última actualización</span>
                <span className="text-sm text-gray-900">
                  {new Date().toLocaleTimeString('es-AR')}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Versión del sistema</span>
                <span className="text-sm text-gray-900">v2.0.0</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Ventas Recientes y Stock Bajo */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ventas Recientes */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <ShoppingCart className="h-5 w-5 text-green-600 mr-2" />
              Ventas Recientes
            </h3>
          </div>
          <div className="card-body">
            {recentSales.length > 0 ? (
              <div className="space-y-3">
                {recentSales.map((sale) => (
                  <div key={sale.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">
                        Venta #{sale.id.slice(-6)}
                      </p>
                      <p className="text-sm text-gray-500">
                        {formatDate(sale.timestamp)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">
                        {showSensitiveData ? formatCurrency(sale.total || 0) : '***'}
                      </p>
                      <p className="text-sm text-gray-500">
                        {sale.items?.length || 0} productos
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No hay ventas recientes</p>
              </div>
            )}
          </div>
        </div>

        {/* Productos con Stock Bajo */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Package className="h-5 w-5 text-red-600 mr-2" />
              Stock Bajo
            </h3>
          </div>
          <div className="card-body">
            {lowStockItems.length > 0 ? (
              <div className="space-y-3">
                {lowStockItems.map((product) => (
                  <div key={product.id} className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">
                        {product.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        Categoría: {product.category}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-red-600">
                        {product.stock || 0} {product.unit || 'unidades'}
                      </p>
                      <p className="text-sm text-gray-500">
                        Mín: {product.minStock || 10}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-4" />
                <p className="text-gray-500">Todo el stock está en orden</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 