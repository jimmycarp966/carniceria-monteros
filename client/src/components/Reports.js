import React, { useState } from 'react';
import { products } from '../data/products';
import { customers } from '../data/customers';
import { suppliers } from '../data/suppliers';
import { inventoryItems } from '../data/inventory';
import { BarChart3, TrendingUp, DollarSign, Users, Package, Download } from 'lucide-react';
import toast from 'react-hot-toast';

const Reports = () => {
  const [selectedReport, setSelectedReport] = useState('sales');
  const [dateRange, setDateRange] = useState('month');
  
  // Nuevos estados para filtros
  const [periodFilter, setPeriodFilter] = useState('month'); // day, week, month, quarter, year
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [showCustomDateRange, setShowCustomDateRange] = useState(false);

  // Datos de ejemplo para reportes
  const salesData = [
    { month: 'Ene', sales: 450000, profit: 120000 },
    { month: 'Feb', sales: 520000, profit: 140000 },
    { month: 'Mar', sales: 480000, profit: 130000 },
    { month: 'Abr', sales: 610000, profit: 160000 },
    { month: 'May', sales: 550000, profit: 150000 },
    { month: 'Jun', sales: 680000, profit: 180000 }
  ];

  const topProducts = [
    { name: 'Asado de Tira', sales: 125000, units: 45 },
    { name: 'Vacío', sales: 96000, units: 30 },
    { name: 'Pollo Entero', sales: 63000, units: 35 },
    { name: 'Chorizo Parrillero', sales: 42000, units: 35 },
    { name: 'Bife de Chorizo', sales: 42000, units: 12 }
  ];

  const customerStats = [
    { name: 'María González', totalSpent: 45000, visits: 12 },
    { name: 'Carlos Rodríguez', totalSpent: 38000, visits: 8 },
    { name: 'Ana Martínez', totalSpent: 32000, visits: 10 },
    { name: 'Roberto Silva', totalSpent: 28000, visits: 6 },
    { name: 'Lucía Fernández', totalSpent: 25000, visits: 5 }
  ];

  const supplierStats = [
    { name: 'Frigorífico Tucumán S.A.', totalOrdered: 2500000, totalPaid: 2300000 },
    { name: 'Granja Avícola Monteros', totalOrdered: 800000, totalPaid: 750000 },
    { name: 'Embutidos del Norte', totalOrdered: 600000, totalPaid: 600000 },
    { name: 'Carnes Premium del Valle', totalOrdered: 1200000, totalPaid: 1100000 },
    { name: 'Frigorífico Regional', totalOrdered: 1800000, totalPaid: 1600000 }
  ];

  // Estadísticas generales
  const generalStats = {
    totalSales: salesData.reduce((sum, item) => sum + item.sales, 0),
    totalProfit: salesData.reduce((sum, item) => sum + item.profit, 0),
    totalCustomers: customers.length,
    totalProducts: products.length,
    totalSuppliers: suppliers.length,
    totalInventory: inventoryItems.reduce((sum, item) => sum + item.currentStock, 0),
    averageSale: salesData.reduce((sum, item) => sum + item.sales, 0) / salesData.length,
    growthRate: ((salesData[5].sales - salesData[0].sales) / salesData[0].sales * 100).toFixed(1)
  };

  const handleDownloadReport = (type) => {
    toast.success(`Descargando reporte de ${type}...`);
    // Aquí iría la lógica real de descarga
  };

  // Función para obtener el nombre del período
  const getPeriodName = (period) => {
    switch (period) {
      case 'day': return 'Diario';
      case 'week': return 'Semanal';
      case 'month': return 'Mensual';
      case 'quarter': return 'Trimestral';
      case 'year': return 'Anual';
      case 'custom': return 'Personalizado';
      default: return 'Mensual';
    }
  };

  // Función para exportar reporte real
  const exportRealReport = (reportType) => {
    const reportData = {
      type: reportType,
      period: getPeriodName(periodFilter),
      dateRange: periodFilter === 'custom' ? `${customStartDate} - ${customEndDate}` : new Date().toLocaleDateString(),
      generatedAt: new Date().toISOString(),
      data: {
        sales: salesData,
        products: topProducts,
        customers: customerStats,
        suppliers: supplierStats,
        general: generalStats
      }
    };

    // Crear archivo JSON para descarga
    const dataStr = JSON.stringify(reportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `reporte_${reportType}_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success(`Reporte ${reportType} exportado exitosamente`);
  };

  const renderSalesReport = () => (
    <div className="space-y-6">
      {/* Filtros de período */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Filtros de Período</h3>
          <button
            onClick={() => setShowCustomDateRange(!showCustomDateRange)}
            className="btn btn-secondary text-sm"
          >
            {showCustomDateRange ? 'Ocultar' : 'Rango Personalizado'}
          </button>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
          <button
            onClick={() => setPeriodFilter('day')}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              periodFilter === 'day'
                ? 'bg-primary-100 text-primary-700 border border-primary-300'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Diario
          </button>
          <button
            onClick={() => setPeriodFilter('week')}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              periodFilter === 'week'
                ? 'bg-primary-100 text-primary-700 border border-primary-300'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Semanal
          </button>
          <button
            onClick={() => setPeriodFilter('month')}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              periodFilter === 'month'
                ? 'bg-primary-100 text-primary-700 border border-primary-300'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Mensual
          </button>
          <button
            onClick={() => setPeriodFilter('quarter')}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              periodFilter === 'quarter'
                ? 'bg-primary-100 text-primary-700 border border-primary-300'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Trimestral
          </button>
          <button
            onClick={() => setPeriodFilter('year')}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              periodFilter === 'year'
                ? 'bg-primary-100 text-primary-700 border border-primary-300'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Anual
          </button>
          <button
            onClick={() => setPeriodFilter('custom')}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              periodFilter === 'custom'
                ? 'bg-primary-100 text-primary-700 border border-primary-300'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Personalizado
          </button>
        </div>

        {showCustomDateRange && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Fecha Inicio</label>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Fecha Fin</label>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>
          </div>
        )}
      </div>

      {/* Sales Chart - Mejorado */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Ventas {getPeriodName(periodFilter)}</h3>
          <button
            onClick={() => exportRealReport('ventas')}
            className="btn btn-primary flex items-center text-sm"
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </button>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Gráfico de ventas */}
          <div className="space-y-3">
            {salesData.map((item, index) => (
              <div key={index} className="flex items-center space-x-4">
                <div className="w-16 text-sm font-medium text-gray-900">{item.month}</div>
                <div className="flex-1 bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-blue-600 h-3 rounded-full transition-all duration-300" 
                    style={{ width: `${(item.sales / 700000) * 100}%` }}
                  ></div>
                </div>
                <div className="text-right min-w-[120px]">
                  <div className="text-sm font-medium text-gray-900">${item.sales.toLocaleString()}</div>
                  <div className="text-xs text-green-600">+${item.profit.toLocaleString()}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Resumen estadístico */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3">Resumen del Período</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total Ventas:</span>
                <span className="text-sm font-medium">${generalStats.totalSales.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total Ganancia:</span>
                <span className="text-sm font-medium text-green-600">${generalStats.totalProfit.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Promedio por Período:</span>
                <span className="text-sm font-medium">${generalStats.averageSale.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Crecimiento:</span>
                <span className="text-sm font-medium text-blue-600">+{generalStats.growthRate}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Top Products */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Productos Más Vendidos</h3>
        <div className="space-y-4">
          {topProducts.map((product, index) => (
            <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-blue-600">{index + 1}</span>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900">{product.name}</div>
                  <div className="text-xs text-gray-500">{product.units} unidades</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-gray-900">${product.sales.toLocaleString()}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderCustomerReport = () => (
    <div className="space-y-6">
      {/* Customer Stats */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Mejores Clientes</h3>
        <div className="space-y-4">
          {customerStats.map((customer, index) => (
            <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-green-600">{index + 1}</span>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900">{customer.name}</div>
                  <div className="text-xs text-gray-500">{customer.visits} visitas</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-gray-900">${customer.totalSpent.toLocaleString()}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Customer Credit Analysis */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Análisis de Crédito</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {customers.filter(c => c.status === 'active').length}
            </div>
            <div className="text-sm text-gray-600">Clientes Activos</div>
          </div>
          <div className="text-center p-4 bg-red-50 rounded-lg">
            <div className="text-2xl font-bold text-red-600">
              {customers.filter(c => c.status === 'overdue').length}
            </div>
            <div className="text-sm text-gray-600">Clientes Atrasados</div>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              ${customers.reduce((sum, c) => sum + c.currentBalance, 0).toLocaleString()}
            </div>
            <div className="text-sm text-gray-600">Deuda Total</div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderInventoryReport = () => (
    <div className="space-y-6">
      {/* Inventory Status */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Estado del Inventario</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {inventoryItems.filter(i => i.status === 'normal').length}
            </div>
            <div className="text-sm text-gray-600">Stock Normal</div>
          </div>
          <div className="text-center p-4 bg-yellow-50 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600">
              {inventoryItems.filter(i => i.status === 'low').length}
            </div>
            <div className="text-sm text-gray-600">Stock Bajo</div>
          </div>
          <div className="text-center p-4 bg-red-50 rounded-lg">
            <div className="text-2xl font-bold text-red-600">
              {inventoryItems.filter(i => i.status === 'critical').length}
            </div>
            <div className="text-sm text-gray-600">Stock Crítico</div>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              ${inventoryItems.reduce((sum, i) => sum + (i.currentStock * i.cost), 0).toLocaleString()}
            </div>
            <div className="text-sm text-gray-600">Valor Total</div>
          </div>
        </div>
      </div>

      {/* Low Stock Alert */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Alertas de Stock Bajo</h3>
        <div className="space-y-3">
          {inventoryItems
            .filter(item => item.status === 'low' || item.status === 'critical')
            .map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`w-4 h-4 rounded-full ${
                    item.status === 'critical' ? 'bg-red-500' : 'bg-yellow-500'
                  }`}></div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">{item.productName}</div>
                    <div className="text-xs text-gray-500">{item.category}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-sm font-medium ${
                    item.status === 'critical' ? 'text-red-600' : 'text-yellow-600'
                  }`}>
                    {item.currentStock} {item.unit}
                  </div>
                  <div className="text-xs text-gray-500">Mín: {item.minStock}</div>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );

  const renderSupplierReport = () => (
    <div className="space-y-6">
      {/* Supplier Analysis */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Análisis de Proveedores</h3>
        <div className="space-y-4">
          {supplierStats.map((supplier, index) => (
            <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-purple-600">{index + 1}</span>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900">{supplier.name}</div>
                  <div className="text-xs text-gray-500">Pedido: ${supplier.totalOrdered.toLocaleString()}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-gray-900">${supplier.totalPaid.toLocaleString()}</div>
                <div className="text-xs text-red-600">
                  Deuda: ${(supplier.totalOrdered - supplier.totalPaid).toLocaleString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Payment Status */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Estado de Pagos</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {suppliers.filter(s => s.status === 'active').length}
            </div>
            <div className="text-sm text-gray-600">Proveedores Activos</div>
          </div>
          <div className="text-center p-4 bg-red-50 rounded-lg">
            <div className="text-2xl font-bold text-red-600">
              {suppliers.filter(s => s.status === 'overdue').length}
            </div>
            <div className="text-sm text-gray-600">Pagos Atrasados</div>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              ${suppliers.reduce((sum, s) => sum + s.totalOwed, 0).toLocaleString()}
            </div>
            <div className="text-sm text-gray-600">Deuda Total</div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Reportes</h1>
          <p className="mt-1 text-sm text-gray-500">
            Análisis y estadísticas del negocio
          </p>
        </div>
        <div className="flex space-x-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="week">Esta Semana</option>
            <option value="month">Este Mes</option>
            <option value="quarter">Este Trimestre</option>
            <option value="year">Este Año</option>
          </select>
          <button
            onClick={() => handleDownloadReport(selectedReport)}
            className="btn btn-secondary flex items-center"
          >
            <Download className="h-4 w-4 mr-2" />
            Descargar
          </button>
        </div>
      </div>

      {/* General Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <DollarSign className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Ventas Totales</p>
              <p className="text-2xl font-semibold text-gray-900">
                ${generalStats.totalSales.toLocaleString()}
              </p>
              <p className="text-sm text-green-600">+{generalStats.growthRate}% vs mes anterior</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <TrendingUp className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Ganancia Total</p>
              <p className="text-2xl font-semibold text-gray-900">
                ${generalStats.totalProfit.toLocaleString()}
              </p>
              <p className="text-sm text-blue-600">{(generalStats.totalProfit / generalStats.totalSales * 100).toFixed(1)}% margen</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Clientes Activos</p>
              <p className="text-2xl font-semibold text-gray-900">{generalStats.totalCustomers}</p>
              <p className="text-sm text-purple-600">Promedio: ${Math.round(generalStats.totalSales / generalStats.totalCustomers).toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <Package className="h-8 w-8 text-orange-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Productos</p>
              <p className="text-2xl font-semibold text-gray-900">{generalStats.totalProducts}</p>
              <p className="text-sm text-orange-600">{generalStats.totalInventory} unidades en stock</p>
            </div>
          </div>
        </div>
      </div>

      {/* Report Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            {[
              { id: 'sales', name: 'Ventas', icon: TrendingUp },
              { id: 'customers', name: 'Clientes', icon: Users },
              { id: 'inventory', name: 'Inventario', icon: Package },
              { id: 'suppliers', name: 'Proveedores', icon: BarChart3 }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedReport(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
                  selectedReport === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="h-4 w-4 mr-2" />
                {tab.name}
              </button>
            ))}
          </nav>
        </div>
        <div className="p-6">
          {selectedReport === 'sales' && renderSalesReport()}
          {selectedReport === 'customers' && renderCustomerReport()}
          {selectedReport === 'inventory' && renderInventoryReport()}
          {selectedReport === 'suppliers' && renderSupplierReport()}
        </div>
      </div>
    </div>
  );
};

export default Reports; 