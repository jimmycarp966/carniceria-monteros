import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Receipt, 
  DollarSign, 
  TrendingUp, 
  Filter,
  Clock,
  Percent
} from 'lucide-react';
import { shiftService, saleService } from '../services/firebaseService';
import { realtimeService } from '../services/realtimeService';
import toast from 'react-hot-toast';

const SalesReports = () => {
  // Estados principales
  const [sales, setSales] = useState([]);
  const [filteredSales, setFilteredSales] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [todayShifts, setTodayShifts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  
  // Estados para filtros avanzados
  const [dateRange, setDateRange] = useState({
    start: new Date().toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('all');
  const [shiftFilter, setShiftFilter] = useState('all');
  const [customerFilter, setCustomerFilter] = useState('all');
  
  // Estados de datos (para futuras funcionalidades)
  // const [customers, setCustomers] = useState([]);
  // const [products, setProducts] = useState([]);
  
  // Estados para descuentos (funcionalidad movida desde caja)
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [selectedSaleForDiscount, setSelectedSaleForDiscount] = useState(null);
  const [discountType, setDiscountType] = useState('percentage');
  const [discountValue, setDiscountValue] = useState(0);

  // Cargar datos iniciales
  useEffect(() => {
    const initData = async () => {
      try {
        setIsLoading(true);
        
        const [salesData] = await Promise.all([
          saleService.getAllSales()
          // customerService.getAllCustomers(), // Para futuras funcionalidades
          // productService.getAllProducts()    // Para futuras funcionalidades
        ]);
        
        setSales(salesData);
        
        const filtered = filterSalesByDate(salesData, selectedDate);
        setFilteredSales(filtered);
        
        await loadShiftsForDate(selectedDate);
        
      } catch (error) {
        console.error('Error cargando datos:', error);
        toast.error('Error cargando datos de ventas');
      } finally {
        setIsLoading(false);
      }
    };

    const setupListeners = () => {
      realtimeService.on('sales_updated', (data) => {
        if (data.sales) {
          setSales(data.sales);
        }
      });

      realtimeService.on('sale_synced', (data) => {
        console.log('Nueva venta sincronizada:', data);
        initData();
      });
    };

    initData();
    setupListeners();
    
    return () => {
      realtimeService.off('sales_updated');
      realtimeService.off('sale_synced');
    };
  }, [selectedDate]);

  // Filtrar por fecha cuando cambia la selección
  useEffect(() => {
    if (sales.length > 0) {
      const filtered = filterSalesByDate(sales, selectedDate);
      setFilteredSales(filtered);
      loadShiftsForDate(selectedDate);
    }
  }, [sales, selectedDate]);



  // Función para filtrar ventas por fecha
  const filterSalesByDate = (salesList, date) => {
    const targetDate = new Date(date);
    const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
    const endOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate() + 1);
    
    return salesList.filter(sale => {
      const saleDate = sale.createdAt?.toDate?.() || new Date(sale.createdAt || sale.timestamp);
      return saleDate >= startOfDay && saleDate < endOfDay;
    });
  };

  // Función para cargar turnos de la fecha seleccionada
  const loadShiftsForDate = async (date) => {
    try {
      const shifts = await shiftService.getAllShifts();
      const targetDate = new Date(date);
      const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
      const endOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate() + 1);
      
      const dayShifts = shifts.filter(shift => {
        const shiftDate = shift.startTime?.toDate?.() || new Date(shift.startTime || shift.createdAt);
        return shiftDate >= startOfDay && shiftDate < endOfDay;
      });
      
      setTodayShifts(dayShifts);
    } catch (error) {
      console.error('Error cargando turnos:', error);
      setTodayShifts([]);
    }
  };

  // Aplicar filtros avanzados
  const applyAdvancedFilters = () => {
    let filtered = [...sales];
    
    // Filtro por rango de fechas
    if (dateRange.start && dateRange.end) {
      const startDate = new Date(dateRange.start);
      const endDate = new Date(dateRange.end);
      endDate.setHours(23, 59, 59, 999); // Incluir todo el día final
      
      filtered = filtered.filter(sale => {
        const saleDate = sale.createdAt?.toDate?.() || new Date(sale.createdAt || sale.timestamp);
        return saleDate >= startDate && saleDate <= endDate;
      });
    }
    
    // Filtro por método de pago
    if (paymentMethodFilter !== 'all') {
      filtered = filtered.filter(sale => sale.paymentMethod === paymentMethodFilter);
    }
    
    // Filtro por turno
    if (shiftFilter !== 'all') {
      filtered = filtered.filter(sale => sale.shiftId === shiftFilter);
    }
    
    // Filtro por cliente
    if (customerFilter !== 'all') {
      filtered = filtered.filter(sale => sale.customerId === customerFilter);
    }
    
    setFilteredSales(filtered);
    setShowFilters(false);
    toast.success('Filtros aplicados');
  };

  // Limpiar filtros
  const clearFilters = () => {
    setDateRange({
      start: new Date().toISOString().split('T')[0],
      end: new Date().toISOString().split('T')[0]
    });
    setPaymentMethodFilter('all');
    setShiftFilter('all');
    setCustomerFilter('all');
    setFilteredSales(filterSalesByDate(sales, selectedDate));
    toast.success('Filtros limpiados');
  };

  // Función para aplicar descuento a una venta (funcionalidad movida desde caja)
  const applyDiscountToSale = async () => {
    if (!selectedSaleForDiscount || !discountValue || discountValue <= 0) {
      toast.error('Valores de descuento inválidos');
      return;
    }

    try {
      const sale = selectedSaleForDiscount;
      const originalTotal = sale.subtotal || sale.total;
      let discountAmount = 0;
      
      if (discountType === 'percentage') {
        if (discountValue > 100) {
          toast.error('El descuento no puede ser mayor al 100%');
          return;
        }
        discountAmount = (originalTotal * discountValue) / 100;
      } else {
        if (discountValue >= originalTotal) {
          toast.error('El descuento no puede ser mayor o igual al total');
          return;
        }
        discountAmount = discountValue;
      }
      
      const newTotal = originalTotal - discountAmount;
      
      // Actualizar la venta con el descuento
      const updatedSale = {
        ...sale,
        originalTotal: originalTotal,
        discountType: discountType,
        discountValue: discountValue,
        discountAmount: discountAmount,
        total: newTotal,
        finalTotal: newTotal,
        hasDiscount: true,
        discountAppliedAt: new Date(),
        discountAppliedBy: 'current-user' // TODO: obtener del contexto
      };
      
      // Aquí deberías actualizar la venta en la base de datos
      // await saleService.updateSale(sale.id, updatedSale);
      console.log('Descuento aplicado:', updatedSale); // Para debug
      
      toast.success(`Descuento de $${discountAmount.toLocaleString()} aplicado`);
      
      setShowDiscountModal(false);
      setSelectedSaleForDiscount(null);
      setDiscountValue(0);
      
      // Recargar datos
      window.location.reload();
      
    } catch (error) {
      console.error('Error aplicando descuento:', error);
      toast.error('Error aplicando descuento');
    }
  };

  // Calcular estadísticas
  const stats = {
    totalSales: filteredSales.length,
    totalRevenue: filteredSales.reduce((sum, sale) => sum + (sale.total || sale.finalTotal || 0), 0),
    averageSale: filteredSales.length > 0 ? filteredSales.reduce((sum, sale) => sum + (sale.total || sale.finalTotal || 0), 0) / filteredSales.length : 0,
    shiftsToday: todayShifts.length,
    activeShifts: todayShifts.filter(shift => !shift.endTime).length,
    cashSales: filteredSales.filter(sale => sale.paymentMethod === 'cash').length,
    cardSales: filteredSales.filter(sale => sale.paymentMethod === 'card').length,
    totalDiscounts: filteredSales.filter(sale => sale.hasDiscount).reduce((sum, sale) => sum + (sale.discountAmount || 0), 0)
  };

  const DiscountModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Aplicar Descuento</h3>
        
        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-2">Venta seleccionada:</p>
          <p className="font-medium">${(selectedSaleForDiscount?.total || 0).toLocaleString()}</p>
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de descuento:</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setDiscountType('percentage')}
              className={`p-3 rounded-lg border ${
                discountType === 'percentage' 
                  ? 'border-primary-500 bg-primary-50 text-primary-700' 
                  : 'border-gray-300'
              }`}
            >
              <Percent className="h-5 w-5 mx-auto mb-1" />
              Porcentaje
            </button>
            <button
              onClick={() => setDiscountType('fixed')}
              className={`p-3 rounded-lg border ${
                discountType === 'fixed' 
                  ? 'border-primary-500 bg-primary-50 text-primary-700' 
                  : 'border-gray-300'
              }`}
            >
              <DollarSign className="h-5 w-5 mx-auto mb-1" />
              Fijo
            </button>
          </div>
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Valor del descuento {discountType === 'percentage' ? '(%)' : '($)'}:
          </label>
          <input
            type="number"
            value={discountValue}
            onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)}
            min="0"
            max={discountType === 'percentage' ? '100' : selectedSaleForDiscount?.total}
            step={discountType === 'percentage' ? '1' : '100'}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          />
        </div>
        
        <div className="flex space-x-3">
          <button
            onClick={() => {
              setShowDiscountModal(false);
              setSelectedSaleForDiscount(null);
              setDiscountValue(0);
            }}
            className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300"
          >
            Cancelar
          </button>
          <button
            onClick={applyDiscountToSale}
            className="flex-1 bg-primary-600 text-white py-2 px-4 rounded-lg hover:bg-primary-700"
          >
            Aplicar
          </button>
        </div>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando reportes de ventas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 w-full">
      {/* Header */}
      <div className="bg-white rounded-3xl shadow-xl border border-gray-200 p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Reportes de Ventas</h1>
            <p className="text-gray-600">Análisis y seguimiento de ventas</p>
          </div>
          
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto">
            {/* Selector de fecha */}
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="btn btn-secondary flex items-center justify-center"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filtros
            </button>
          </div>
        </div>
      </div>

      {/* Filtros Avanzados */}
      {showFilters && (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Filtros Avanzados</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            {/* Rango de fechas */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Fecha inicio:</label>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Fecha fin:</label>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
            
            {/* Método de pago */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Método de pago:</label>
              <select
                value={paymentMethodFilter}
                onChange={(e) => setPaymentMethodFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="all">Todos</option>
                <option value="cash">Efectivo</option>
                <option value="card">Tarjeta</option>
              </select>
            </div>
            
            {/* Turno */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Turno:</label>
              <select
                value={shiftFilter}
                onChange={(e) => setShiftFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="all">Todos</option>
                {todayShifts.map(shift => (
                  <option key={shift.id} value={shift.id}>
                    Turno {shift.id.slice(-6)} - {shift.employeeName}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={applyAdvancedFilters}
              className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
            >
              Aplicar Filtros
            </button>
            <button
              onClick={clearFilters}
              className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300"
            >
              Limpiar
            </button>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 lg:p-6">
          <div className="flex items-center">
            <Receipt className="h-6 w-6 text-primary-600" />
            <div className="ml-3">
              <p className="text-xs lg:text-sm font-medium text-gray-500">Ventas del Período</p>
              <p className="text-lg lg:text-2xl font-bold text-gray-900">{stats.totalSales}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 lg:p-6">
          <div className="flex items-center">
            <DollarSign className="h-6 w-6 text-green-600" />
            <div className="ml-3">
              <p className="text-xs lg:text-sm font-medium text-gray-500">Ingresos Totales</p>
              <p className="text-lg lg:text-2xl font-bold text-gray-900">
                ${stats.totalRevenue.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 lg:p-6">
          <div className="flex items-center">
            <TrendingUp className="h-6 w-6 text-blue-600" />
            <div className="ml-3">
              <p className="text-xs lg:text-sm font-medium text-gray-500">Promedio por Venta</p>
              <p className="text-lg lg:text-2xl font-bold text-gray-900">
                ${stats.averageSale.toFixed(0)}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 lg:p-6">
          <div className="flex items-center">
            <Percent className="h-6 w-6 text-purple-600" />
            <div className="ml-3">
              <p className="text-xs lg:text-sm font-medium text-gray-500">Descuentos</p>
              <p className="text-lg lg:text-2xl font-bold text-gray-900">
                ${stats.totalDiscounts.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Historial de Ventas */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 lg:p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Historial de Ventas - {new Date(selectedDate).toLocaleDateString('es-ES', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </h3>
        
        {filteredSales.length === 0 ? (
          <div className="text-center py-8">
            <Receipt className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No hay ventas registradas para este período</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredSales.map(sale => (
              <div key={sale.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="font-semibold text-gray-900">
                      Venta #{sale.id?.slice(-8) || 'N/A'}
                    </p>
                    <p className="text-sm text-gray-600">
                      {sale.createdAt?.toDate?.()?.toLocaleString() || new Date(sale.timestamp).toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-600">
                      Método: {sale.paymentMethod === 'cash' ? 'Efectivo' : 'Tarjeta'}
                    </p>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-xl font-bold text-gray-900">
                      ${(sale.total || sale.finalTotal || 0).toLocaleString()}
                    </p>
                    {sale.hasDiscount && (
                      <p className="text-sm text-red-600">
                        Descuento: -${(sale.discountAmount || 0).toLocaleString()}
                      </p>
                    )}
                    
                    <div className="flex space-x-2 mt-2">
                      <button
                        onClick={() => {
                          setSelectedSaleForDiscount(sale);
                          setShowDiscountModal(true);
                        }}
                        className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded hover:bg-orange-200"
                      >
                        <Percent className="h-3 w-3 inline mr-1" />
                        Descuento
                      </button>
                    </div>
                  </div>
                </div>
                
                {/* Productos de la venta */}
                <div className="border-t border-gray-100 pt-3">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Productos:</h4>
                  <div className="space-y-1">
                    {sale.products?.map((product, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span className="text-gray-600">
                          {product.quantity}x {product.name}
                        </span>
                        <span className="text-gray-900">
                          ${(product.subtotal || product.price * product.quantity).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Turnos del Día */}
      {todayShifts.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 lg:p-6 mt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Turnos del Día - {new Date(selectedDate).toLocaleDateString('es-ES', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {todayShifts.map(shift => (
              <div key={shift.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900">
                    {shift.employeeName || 'Empleado'}
                  </h4>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    shift.endTime 
                      ? 'bg-gray-100 text-gray-800' 
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {shift.endTime ? 'Cerrado' : 'Activo'}
                  </span>
                </div>
                
                <div className="space-y-1 text-sm text-gray-600">
                  <p>
                    <Clock className="h-4 w-4 inline mr-1" />
                    Inicio: {shift.startTime?.toDate?.()?.toLocaleTimeString() || 'N/A'}
                  </p>
                  {shift.endTime && (
                    <p>
                      <Clock className="h-4 w-4 inline mr-1" />
                      Fin: {shift.endTime?.toDate?.()?.toLocaleTimeString() || 'N/A'}
                    </p>
                  )}
                  <p className="font-medium text-gray-900">
                    Ventas: ${(shift.totalSales || 0).toLocaleString()}
                  </p>
                  <p>
                    Transacciones: {shift.salesCount || 0}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal de Descuento */}
      {showDiscountModal && <DiscountModal />}
    </div>
  );
};

export default SalesReports;
