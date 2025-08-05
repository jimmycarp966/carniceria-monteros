import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  Package, 
  Users, 
  Calendar, 
  Download, 
  Filter,
  Clock,
  Eye,
  Activity,
  Target,
  AlertTriangle,
  TrendingDown,
  FileText,
  Share2,
  Printer
} from 'lucide-react';
import { saleService } from '../services/firebaseService';

const Reports = () => {
  const [selectedReport, setSelectedReport] = useState('sales');
  
  // Estados mejorados para filtros
  const [periodFilter, setPeriodFilter] = useState('month');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [showCustomDateRange, setShowCustomDateRange] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Estados para funcionalidades avanzadas
  const [reportHistory, setReportHistory] = useState([]);
  const [showInsights, setShowInsights] = useState(false);

  // Estados para datos de Firebase
  const [salesData, setSalesData] = useState([]);
  // const [shiftsData, setShiftsData] = useState([]); // Removed as per edit hint
  // const [dailyReport, setDailyReport] = useState(null); // Removed as per edit hint
  // const [shiftReports, setShiftReports] = useState({}); // Removed as per edit hint

  // Datos de ejemplo mejorados para reportes
  // const topProducts = [ // Removed as per edit hint
  //   { name: 'Asado de Tira', sales: 125000, units: 45, growth: 12.5, category: 'carne' },
  //   { name: 'Vacío', sales: 96000, units: 30, growth: 8.3, category: 'carne' },
  //   { name: 'Pollo Entero', sales: 63000, units: 35, growth: -2.1, category: 'pollo' },
  //   { name: 'Chorizo Parrillero', sales: 42000, units: 35, growth: 15.7, category: 'embutidos' },
  //   { name: 'Bife de Chorizo', sales: 42000, units: 12, growth: 5.2, category: 'carne' }
  // ];

  // Datos de productos para el reporte de inventario
  const products = [
    { id: 1, name: 'Asado de Tira', stock: 15, minStock: 5, category: 'carne' },
    { id: 2, name: 'Vacío', stock: 8, minStock: 3, category: 'carne' },
    { id: 3, name: 'Pollo Entero', stock: 12, minStock: 5, category: 'pollo' },
    { id: 4, name: 'Chorizo Parrillero', stock: 0, minStock: 4, category: 'embutidos' },
    { id: 5, name: 'Bife de Chorizo', stock: 3, minStock: 2, category: 'carne' },
    { id: 6, name: 'Carne Molida', stock: 2, minStock: 5, category: 'carne' }
  ];

  const customerStats = [
    { name: 'María González', totalSpent: 45000, visits: 12, lastVisit: '2024-01-15', loyalty: 'gold' },
    { name: 'Carlos Rodríguez', totalSpent: 38000, visits: 8, lastVisit: '2024-01-10', loyalty: 'silver' },
    { name: 'Ana Martínez', totalSpent: 32000, visits: 10, lastVisit: '2024-01-12', loyalty: 'silver' },
    { name: 'Roberto Silva', totalSpent: 28000, visits: 6, lastVisit: '2024-01-08', loyalty: 'bronze' },
    { name: 'Lucía Fernández', totalSpent: 25000, visits: 5, lastVisit: '2024-01-05', loyalty: 'bronze' }
  ];

  const supplierStats = [
    { name: 'Frigorífico Tucumán S.A.', totalOrdered: 2500000, totalPaid: 2300000, reliability: 92, lastOrder: '2024-01-10' },
    { name: 'Granja Avícola Monteros', totalOrdered: 800000, totalPaid: 750000, reliability: 94, lastOrder: '2024-01-08' },
    { name: 'Embutidos del Norte', totalOrdered: 600000, totalPaid: 600000, reliability: 100, lastOrder: '2024-01-12' },
    { name: 'Carnes Premium del Valle', totalOrdered: 1200000, totalPaid: 1100000, reliability: 92, lastOrder: '2024-01-05' },
    { name: 'Frigorífico Regional', totalOrdered: 1800000, totalPaid: 1600000, reliability: 89, lastOrder: '2024-01-15' }
  ];

  // Cargar datos desde Firebase
  useEffect(() => {
    const loadData = async () => {
      try {
        // Cargar ventas
        const sales = await saleService.getAllSales();
        setSalesData(sales);

        // Cargar turnos
        // const shifts = await shiftService.getAllShifts(); // Removed as per edit hint
        // setShiftsData(shifts);

        // Generar reporte diario
        // const today = new Date(); // Removed as per edit hint
        // const dailyReportData = await reportService.generateDailyReport(today); // Removed as per edit hint
        // setDailyReport(dailyReportData);

        // Generar reportes por turno
        // const shiftReportsData = {}; // Removed as per edit hint
        // for (const shift of shifts) { // Removed as per edit hint
        //   if (shift.isActive === false) { // Removed as per edit hint
        //     const shiftReport = await reportService.generateShiftReport(shift.id); // Removed as per edit hint
        //     shiftReportsData[shift.id] = shiftReport; // Removed as per edit hint
        //   } // Removed as per edit hint
        // } // Removed as per edit hint
        // setShiftReports(shiftReportsData); // Removed as per edit hint

      } catch (error) {
        console.error('Error cargando datos:', error);
      }
    };

    loadData();
  }, []);

  // Insights inteligentes
  const insights = [
    {
      id: 1,
      type: 'positive',
      title: 'Crecimiento Sostenido',
      description: 'Las ventas han crecido un 23.6% este mes',
      icon: TrendingUp,
      value: '+23.6%',
      category: 'sales'
    },
    {
      id: 2,
      type: 'warning',
      title: 'Stock Bajo',
      description: '3 productos están por agotarse',
      icon: Package,
      value: '3',
      category: 'inventory'
    },
    {
      id: 3,
      type: 'positive',
      title: 'Cliente Frecuente',
      description: 'María González es tu mejor cliente',
      icon: Users,
      value: '12 visitas',
      category: 'customers'
    },
    {
      id: 4,
      type: 'info',
      title: 'Margen de Ganancia',
      description: 'El margen promedio es del 26.8%',
      icon: DollarSign,
      value: '26.8%',
      category: 'profit'
    }
  ];

  // Simular historial de reportes
  useEffect(() => {
    const history = [
      { id: 1, type: 'Ventas', date: '2024-01-15', size: '2.3MB', status: 'completed' },
      { id: 2, type: 'Inventario', date: '2024-01-14', size: '1.8MB', status: 'completed' },
      { id: 3, type: 'Clientes', date: '2024-01-13', size: '1.5MB', status: 'completed' }
    ];
    setReportHistory(history);
  }, []);

  const renderSalesReport = () => (
    <div className="space-y-6">
      {/* Estadísticas Principales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stats-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="stats-label">Ventas Totales</p>
              <p className="stats-value">$0</p>
            </div>
            <div className="stats-icon">
              <DollarSign className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="stats-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="stats-label">Transacciones</p>
                             <p className="stats-value">0</p>
            </div>
            <div className="stats-icon">
              <TrendingUp className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="stats-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="stats-label">Promedio</p>
                             <p className="stats-value">$0</p>
            </div>
            <div className="stats-icon">
              <BarChart3 className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="stats-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="stats-label">Turnos Activos</p>
                             <p className="stats-value">0</p>
            </div>
            <div className="stats-icon">
              <Clock className="h-6 w-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Reportes por Turno */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">Reportes por Turno</h3>
          <div className="flex space-x-2">
            <button className="btn btn-secondary">
              <Eye className="h-4 w-4 mr-2" />
              Ver Detalles
            </button>
            <button className="btn btn-primary">
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </button>
          </div>
        </div>
        
        <div className="space-y-4">
                     {[].map(shift => {
             const shiftReport = {};
            const shiftName = shift.type === 'morning' ? 'Mañana' : 'Tarde';
            const shiftTime = shift.type === 'morning' ? '8:00 - 14:00' : '18:00 - 22:00';
            
            return (
              <div key={shift.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-primary-100 rounded-2xl flex items-center justify-center">
                    <Clock className="h-6 w-6 text-primary-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Turno {shiftName}</p>
                    <p className="text-sm text-gray-600">{shiftTime}</p>
                    <p className="text-xs text-gray-500">
                      {shift.createdAt?.toDate?.()?.toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">
                    ${shiftReport?.totalSales?.toLocaleString() || shift.totalSales?.toLocaleString() || '0'}
                  </p>
                  <p className="text-sm text-gray-600">
                    {shiftReport?.salesCount || shift.salesCount || 0} ventas
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Ventas Recientes */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">Ventas Recientes</h3>
          <button className="text-primary-600 hover:text-primary-700 font-medium">Ver todas</button>
        </div>
        
        <div className="space-y-3">
          {salesData.slice(0, 5).map(sale => (
            <div key={sale.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center">
                  <span className="text-sm font-bold text-primary-600">V</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    Venta #{sale.id.slice(-6)}
                  </p>
                  <p className="text-sm text-gray-600">
                    {sale.date?.toDate?.()?.toLocaleString() || new Date(sale.date).toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-gray-900">${sale.total?.toLocaleString()}</p>
                <p className="text-xs text-gray-600">{sale.items?.length || 0} items</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderCustomerReport = () => (
    <div className="space-y-6">
      {/* Estadísticas de Clientes */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="stats-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="stats-label">Total Clientes</p>
              <p className="stats-value">{customerStats.length}</p>
            </div>
            <div className="stats-icon">
              <Users className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="stats-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="stats-label">Clientes Activos</p>
              <p className="stats-value">{customerStats.filter(c => c.visits > 3).length}</p>
            </div>
            <div className="stats-icon">
              <Activity className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="stats-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="stats-label">Promedio Visitas</p>
              <p className="stats-value">{(customerStats.reduce((sum, c) => sum + c.visits, 0) / customerStats.length).toFixed(1)}</p>
            </div>
            <div className="stats-icon">
              <Target className="h-6 w-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Mejores Clientes */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">Mejores Clientes</h3>
          <button className="btn btn-primary">
            <Download className="h-4 w-4 mr-2" />
            Exportar Lista
          </button>
        </div>
        
        <div className="space-y-3">
          {customerStats.map((customer, index) => (
            <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center">
                  <span className="text-sm font-bold text-primary-600">{index + 1}</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">{customer.name}</p>
                  <p className="text-sm text-gray-600">{customer.visits} visitas</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-gray-900">${customer.totalSpent.toLocaleString()}</p>
                <div className={`badge ${customer.loyalty === 'gold' ? 'badge-success' : customer.loyalty === 'silver' ? 'badge-info' : 'badge-warning'}`}>
                  {customer.loyalty}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderInventoryReport = () => (
    <div className="space-y-6">
      {/* Alertas de Inventario */}
      <div className="bg-red-50 border border-red-200 rounded-3xl p-4">
        <div className="flex items-center mb-3">
          <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
          <h3 className="text-lg font-semibold text-red-800">Alertas de Stock</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {products.filter(p => p.stock <= p.minStock).slice(0, 6).map(product => (
            <div key={product.id} className="bg-white rounded-2xl p-3 border border-red-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">{product.name}</p>
                  <p className="text-sm text-red-600">
                    Stock: {product.stock} (Mín: {product.minStock})
                  </p>
                </div>
                <div className="badge badge-danger">
                  {product.stock === 0 ? 'Agotado' : 'Bajo Stock'}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Estadísticas de Inventario */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stats-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="stats-label">Total Productos</p>
              <p className="stats-value">{products.length}</p>
            </div>
            <div className="stats-icon">
              <Package className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="stats-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="stats-label">Stock Total</p>
              <p className="stats-value">{products.reduce((sum, p) => sum + p.stock, 0)}</p>
            </div>
            <div className="stats-icon">
              <BarChart3 className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="stats-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="stats-label">Bajo Stock</p>
              <p className="stats-value">{products.filter(p => p.stock <= p.minStock).length}</p>
            </div>
            <div className="stats-icon">
              <AlertTriangle className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="stats-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="stats-label">Agotados</p>
              <p className="stats-value">{products.filter(p => p.stock === 0).length}</p>
            </div>
            <div className="stats-icon">
              <TrendingDown className="h-6 w-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Productos por Categoría */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">Productos por Categoría</h3>
          <button className="btn btn-primary">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </button>
        </div>
        
        <div className="space-y-3">
          {['carne', 'pollo', 'embutidos'].map(category => {
            const categoryProducts = products.filter(p => p.category === category);
            const totalStock = categoryProducts.reduce((sum, p) => sum + p.stock, 0);
            const lowStock = categoryProducts.filter(p => p.stock <= p.minStock).length;
            
            return (
              <div key={category} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center">
                    <span className="text-sm font-bold text-primary-600">{category.charAt(0).toUpperCase()}</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{category.charAt(0).toUpperCase() + category.slice(1)}</p>
                    <p className="text-sm text-gray-600">{categoryProducts.length} productos</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">{totalStock} unidades</p>
                  {lowStock > 0 && (
                    <div className="badge badge-warning">{lowStock} bajo stock</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  const renderSupplierReport = () => (
    <div className="space-y-6">
      {/* Estadísticas de Proveedores */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stats-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="stats-label">Total Proveedores</p>
              <p className="stats-value">{supplierStats.length}</p>
            </div>
            <div className="stats-icon">
              <Users className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="stats-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="stats-label">Total Pedidos</p>
              <p className="stats-value">${supplierStats.reduce((sum, s) => sum + s.totalOrdered, 0).toLocaleString()}</p>
            </div>
            <div className="stats-icon">
              <Package className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="stats-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="stats-label">Total Pagado</p>
              <p className="stats-value">${supplierStats.reduce((sum, s) => sum + s.totalPaid, 0).toLocaleString()}</p>
            </div>
            <div className="stats-icon">
              <DollarSign className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="stats-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="stats-label">Promedio Confiabilidad</p>
              <p className="stats-value">{(supplierStats.reduce((sum, s) => sum + s.reliability, 0) / supplierStats.length).toFixed(1)}%</p>
            </div>
            <div className="stats-icon">
              <Target className="h-6 w-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Proveedores */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">Proveedores</h3>
          <button className="btn btn-primary">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </button>
        </div>
        
        <div className="space-y-3">
          {supplierStats.map((supplier, index) => (
            <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center">
                  <span className="text-sm font-bold text-primary-600">{index + 1}</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">{supplier.name}</p>
                  <p className="text-sm text-gray-600">Último pedido: {supplier.lastOrder}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-gray-900">${supplier.totalPaid.toLocaleString()}</p>
                <div className={`badge ${supplier.reliability >= 95 ? 'badge-success' : supplier.reliability >= 90 ? 'badge-warning' : 'badge-danger'}`}>
                  {supplier.reliability}% confiable
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-4 lg:p-6 w-full">
      {/* Header Mejorado */}
      <div className="bg-white rounded-3xl shadow-xl border border-gray-200 p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Reportes Avanzados</h1>
            <p className="text-gray-600">Análisis detallado y insights inteligentes</p>
          </div>
          <div className="mt-4 sm:mt-0 flex space-x-2">
            <button 
              onClick={() => setShowInsights(!showInsights)}
              className="btn btn-secondary"
            >
              <Eye className="h-4 w-4 mr-2" />
              Insights
            </button>
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className="btn btn-primary"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filtros
            </button>
          </div>
        </div>
      </div>

      {/* Insights Inteligentes */}
      {showInsights && (
        <div className="mb-6">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-3xl p-4">
            <div className="flex items-center mb-3">
              <Target className="h-5 w-5 text-blue-600 mr-2" />
              <h3 className="text-lg font-semibold text-blue-800">Insights Inteligentes</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {insights.map(insight => (
                <button
                  key={insight.id}
                  className="bg-white rounded-2xl p-3 border border-blue-200 hover:border-blue-300 hover:shadow-md transition-all duration-200 transform hover:scale-105"
                >
                  <div className="flex items-center space-x-2">
                    <insight.icon className={`h-5 w-5 ${insight.type === 'positive' ? 'text-green-600' : insight.type === 'warning' ? 'text-yellow-600' : 'text-blue-600'}`} />
                    <div className="text-left">
                      <p className="text-sm font-medium text-gray-900">{insight.title}</p>
                      <p className="text-xs text-gray-600">{insight.description}</p>
                    </div>
                  </div>
                  <div className="text-right mt-2">
                    <span className={`text-sm font-bold ${insight.type === 'positive' ? 'text-green-600' : insight.type === 'warning' ? 'text-yellow-600' : 'text-blue-600'}`}>
                      {insight.value}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Filtros Avanzados */}
      {showFilters && (
        <div className="mb-6">
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Filtros Avanzados</h3>
              <button 
                onClick={() => setShowCustomDateRange(!showCustomDateRange)}
                className="btn btn-secondary"
              >
                <Calendar className="h-4 w-4 mr-2" />
                Fecha Personalizada
              </button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="form-label">Período</label>
                <select
                  value={periodFilter}
                  onChange={(e) => setPeriodFilter(e.target.value)}
                  className="form-select"
                >
                  <option value="day">Diario</option>
                  <option value="week">Semanal</option>
                  <option value="month">Mensual</option>
                  <option value="quarter">Trimestral</option>
                  <option value="year">Anual</option>
                  <option value="custom">Personalizado</option>
                </select>
              </div>
              
              {showCustomDateRange && (
                <>
                  <div>
                    <label className="form-label">Fecha Inicio</label>
                    <input
                      type="date"
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                      className="form-input"
                    />
                  </div>
                  <div>
                    <label className="form-label">Fecha Fin</label>
                    <input
                      type="date"
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                      className="form-input"
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Navegación de Reportes */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'sales', label: 'Ventas', icon: DollarSign },
            { id: 'customers', label: 'Clientes', icon: Users },
            { id: 'inventory', label: 'Inventario', icon: Package },
            { id: 'suppliers', label: 'Proveedores', icon: Users }
          ].map(report => (
            <button
              key={report.id}
              onClick={() => setSelectedReport(report.id)}
              className={`btn ${selectedReport === report.id ? 'btn-primary' : 'btn-secondary'}`}
            >
              <report.icon className="h-4 w-4 mr-2" />
              {report.label}
            </button>
          ))}
        </div>
      </div>

      {/* Contenido del Reporte */}
      <div className="mb-6">
        {selectedReport === 'sales' && renderSalesReport()}
        {selectedReport === 'customers' && renderCustomerReport()}
        {selectedReport === 'inventory' && renderInventoryReport()}
        {selectedReport === 'suppliers' && renderSupplierReport()}
      </div>

      {/* Historial de Reportes */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">Historial de Reportes</h3>
          <button className="btn btn-primary">
            <Download className="h-4 w-4 mr-2" />
            Generar Nuevo
          </button>
        </div>
        
        <div className="space-y-3">
          {reportHistory.map(report => (
            <div key={report.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center">
                  <FileText className="h-5 w-5 text-primary-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Reporte de {report.type}</p>
                  <p className="text-sm text-gray-600">{report.date} - {report.size}</p>
                </div>
              </div>
              <div className="flex space-x-2">
                <button className="btn btn-secondary">
                  <Download className="h-4 w-4" />
                </button>
                <button className="btn btn-secondary">
                  <Share2 className="h-4 w-4" />
                </button>
                <button className="btn btn-secondary">
                  <Printer className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Reports; 