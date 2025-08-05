import React, { useState, useEffect, useCallback } from 'react';
import { products } from '../data/products';
import { 
  DollarSign, 
  Plus, 
  Minus, 
  Trash2, 
  Receipt, 
  CreditCard, 
  Calculator,
  X,
  Check,
  Filter,
  ShoppingCart,
  Clock,
  TrendingUp
} from 'lucide-react';
import toast from 'react-hot-toast';

const CashRegister = () => {
  const [cart, setCart] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [cashAmount, setCashAmount] = useState(0);
  const [sales, setSales] = useState([]);
  const [showSalesHistory, setShowSalesHistory] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  
  // Estados para turnos mejorados
  const [currentShift, setCurrentShift] = useState(null);
  const [shiftStartTime, setShiftStartTime] = useState(null);
  const [shiftSales, setShiftSales] = useState([]);
  const [shiftTotal, setShiftTotal] = useState(0);
  
  // Estados para filtros
  const [periodFilter, setPeriodFilter] = useState('today');
  const [customDate, setCustomDate] = useState('');
  const [filteredSales, setFilteredSales] = useState([]);
  const [periodTotal, setPeriodTotal] = useState(0);
  const [showFilters, setShowFilters] = useState(false);

  // Estados para mejor UX
  const [showShiftModal, setShowShiftModal] = useState(false);
  const [isProcessingSale, setIsProcessingSale] = useState(false);

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const cartItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const change = cashAmount - cartTotal;

  // Función para filtrar ventas por período
  const filterSalesByPeriod = useCallback((period, customDateValue = null) => {
    const now = new Date();
    let startDate, endDate;

    switch (period) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
        break;
      case 'week':
        const dayOfWeek = now.getDay();
        const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysToSubtract);
        endDate = new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        break;
      case 'quarter':
        const quarter = Math.floor(now.getMonth() / 3);
        startDate = new Date(now.getFullYear(), quarter * 3, 1);
        endDate = new Date(now.getFullYear(), (quarter + 1) * 3, 1);
        break;
      case 'custom':
        if (customDateValue) {
          const selectedDate = new Date(customDateValue);
          startDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
          endDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate() + 1);
        } else {
          return;
        }
        break;
      default:
        return;
    }

    const filtered = sales.filter(sale => {
      const saleDate = new Date(sale.date);
      return saleDate >= startDate && saleDate < endDate;
    });

    setFilteredSales(filtered);
    const total = filtered.reduce((sum, sale) => sum + sale.total, 0);
    setPeriodTotal(total);
  }, [sales]);

  // Aplicar filtro cuando cambie el período
  useEffect(() => {
    filterSalesByPeriod(periodFilter, customDate);
  }, [periodFilter, customDate, filterSalesByPeriod]);

  // Función para obtener el nombre del período
  const getPeriodName = (period) => {
    switch (period) {
      case 'today': return 'Hoy';
      case 'week': return 'Esta Semana';
      case 'month': return 'Este Mes';
      case 'quarter': return 'Este Trimestre';
      case 'custom': return customDate ? new Date(customDate).toLocaleDateString('es-ES') : 'Fecha Específica';
      default: return 'Hoy';
    }
  };

  // Función para abrir caja mejorada
  const openCashRegister = (shift) => {
    setIsOpen(true);
    setCurrentShift(shift);
    setShiftStartTime(new Date().toISOString());
    setShiftSales([]);
    setShiftTotal(0);
    setShowShiftModal(false);
    toast.success(`Caja abierta - Turno ${shift === 'morning' ? 'Mañana' : 'Tarde'}`);
  };

  // Función para cerrar caja mejorada
  const closeCashRegister = () => {
    if (shiftSales.length > 0) {
      const totalSales = shiftSales.length;
      const totalAmount = shiftTotal;
      const shiftDuration = shiftStartTime ? 
        Math.round((new Date() - new Date(shiftStartTime)) / (1000 * 60)) : 0;
      
      toast.success(`Caja cerrada - ${totalSales} ventas, $${totalAmount.toLocaleString()}, ${shiftDuration} min`);
    } else {
      toast.success('Caja cerrada');
    }
    
    setIsOpen(false);
    setCurrentShift(null);
    setShiftStartTime(null);
    setShiftSales([]);
    setShiftTotal(0);
  };

  // Función para obtener el nombre del turno
  const getShiftName = (shift) => {
    return shift === 'morning' ? 'Mañana' : 'Tarde';
  };

  // Función para obtener duración del turno
  const getShiftDuration = () => {
    if (!shiftStartTime) return 0;
    return Math.round((new Date() - new Date(shiftStartTime)) / (1000 * 60));
  };

  const addToCart = () => {
    if (!selectedProduct) {
      toast.error('Selecciona un producto');
      return;
    }
    if (quantity <= 0) {
      toast.error('La cantidad debe ser mayor a 0');
      return;
    }

    const product = products.find(p => p.id === parseInt(selectedProduct));
    if (!product) return;

    const existingItem = cart.find(item => item.id === product.id);
    if (existingItem) {
      setCart(cart.map(item => 
        item.id === product.id 
          ? { ...item, quantity: item.quantity + quantity }
          : item
      ));
    } else {
      setCart([...cart, { ...product, quantity }]);
    }

    setSelectedProduct('');
    setQuantity(1);
    toast.success(`${product.name} agregado al carrito`);
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.id !== productId));
    toast.success('Producto removido del carrito');
  };

  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart(cart.map(item => 
      item.id === productId ? { ...item, quantity: newQuantity } : item
    ));
  };

  const completeSale = async () => {
    if (cart.length === 0) {
      toast.error('El carrito está vacío');
      return;
    }

    if (paymentMethod === 'cash' && cashAmount < cartTotal) {
      toast.error('El monto en efectivo es insuficiente');
      return;
    }

    setIsProcessingSale(true);

    // Simular procesamiento
    await new Promise(resolve => setTimeout(resolve, 1000));

    const sale = {
      id: Date.now(),
      items: [...cart],
      total: cartTotal,
      paymentMethod,
      cashAmount: paymentMethod === 'cash' ? cashAmount : 0,
      change: paymentMethod === 'cash' ? change : 0,
      date: new Date().toISOString(),
      customer: 'Cliente General',
      shift: currentShift,
      shiftStartTime: shiftStartTime
    };

    setSales([sale, ...sales]);
    setShiftSales([sale, ...shiftSales]);
    setShiftTotal(shiftTotal + cartTotal);
    setCart([]);
    setCashAmount(0);
    setPaymentMethod('cash');
    setIsProcessingSale(false);
    
    toast.success('Venta completada exitosamente');
  };

  const stats = {
    totalSales: sales.length,
    totalRevenue: sales.reduce((sum, sale) => sum + sale.total, 0),
    averageSale: sales.length > 0 ? sales.reduce((sum, sale) => sum + sale.total, 0) / sales.length : 0,
    todaySales: sales.filter(sale => {
      const today = new Date().toDateString();
      const saleDate = new Date(sale.date).toDateString();
      return today === saleDate;
    }).length,
    periodSales: filteredSales.length,
    periodRevenue: periodTotal,
    periodAverage: filteredSales.length > 0 ? periodTotal / filteredSales.length : 0,
    periodPaymentMethods: filteredSales.reduce((acc, sale) => {
      acc[sale.paymentMethod] = (acc[sale.paymentMethod] || 0) + 1;
      return acc;
    }, {})
  };

  const paymentMethods = [
    { id: 'cash', name: 'Efectivo', icon: DollarSign, color: 'green' },
    { id: 'card', name: 'Tarjeta', icon: CreditCard, color: 'blue' },
    { id: 'transfer', name: 'Transferencia', icon: Calculator, color: 'purple' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 lg:p-6">
      {/* Header Mejorado */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 mb-6">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-primary-100 rounded-xl">
                <DollarSign className="h-6 w-6 text-primary-600" />
              </div>
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Sistema de Caja</h1>
                <p className="text-gray-600">Gestión de ventas y turnos</p>
              </div>
            </div>
            
            {isOpen && shiftStartTime && (
              <div className="flex items-center gap-2 mt-3 p-3 bg-green-50 rounded-lg border border-green-200">
                <Clock className="h-4 w-4 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-green-800">
                    Turno {getShiftName(currentShift)} - {getShiftDuration()} min
                  </p>
                  <p className="text-xs text-green-600">
                    Abierta desde {new Date(shiftStartTime).toLocaleTimeString('es-ES')}
                  </p>
                </div>
              </div>
            )}
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
            {!isOpen ? (
              <button
                onClick={() => setShowShiftModal(true)}
                className="btn btn-primary flex items-center justify-center gap-2 px-6 py-3 text-lg font-semibold"
              >
                <Check className="h-5 w-5" />
                Abrir Caja
              </button>
            ) : (
              <div className="flex gap-3">
                <button
                  onClick={() => setShowSalesHistory(!showSalesHistory)}
                  className="btn btn-secondary flex items-center gap-2"
                >
                  <Receipt className="h-4 w-4" />
                  Historial
                </button>
                <button
                  onClick={closeCashRegister}
                  className="btn btn-danger flex items-center gap-2"
                >
                  <X className="h-4 w-4" />
                  Cerrar Caja
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats Cards Mejorados */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 lg:p-6 hover:shadow-xl transition-shadow">
          <div className="flex items-center">
            <div className="p-2 bg-primary-100 rounded-lg">
              <DollarSign className="h-5 w-5 text-primary-600" />
            </div>
            <div className="ml-3 flex-1">
              <p className="text-xs lg:text-sm font-medium text-gray-500">
                {isOpen ? `Caja Turno ${getShiftName(currentShift)}` : 'Caja Cerrada'}
              </p>
              <p className="text-lg lg:text-2xl font-bold text-gray-900">
                ${isOpen ? shiftTotal.toLocaleString() : '0'}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 lg:p-6 hover:shadow-xl transition-shadow">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Receipt className="h-5 w-5 text-green-600" />
            </div>
            <div className="ml-3 flex-1">
              <p className="text-xs lg:text-sm font-medium text-gray-500">
                {isOpen ? 'Ventas del Turno' : 'Ventas Hoy'}
              </p>
              <p className="text-lg lg:text-2xl font-bold text-gray-900">
                {isOpen ? shiftSales.length : stats.todaySales}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 lg:p-6 hover:shadow-xl transition-shadow">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <TrendingUp className="h-5 w-5 text-blue-600" />
            </div>
            <div className="ml-3 flex-1">
              <p className="text-xs lg:text-sm font-medium text-gray-500">
                {isOpen ? 'Promedio del Turno' : 'Promedio'}
              </p>
              <p className="text-lg lg:text-2xl font-bold text-gray-900">
                ${isOpen ? (shiftSales.length > 0 ? (shiftTotal / shiftSales.length).toFixed(0) : '0') : stats.averageSale.toFixed(0)}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 lg:p-6 hover:shadow-xl transition-shadow">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Clock className="h-5 w-5 text-purple-600" />
            </div>
            <div className="ml-3 flex-1">
              <p className="text-xs lg:text-sm font-medium text-gray-500">
                {isOpen ? 'Duración' : 'Estado'}
              </p>
              <p className="text-lg lg:text-2xl font-bold text-gray-900">
                {isOpen ? `${getShiftDuration()} min` : 'Cerrada'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido Principal */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Panel de Productos */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900">Agregar Productos</h3>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Seleccionar Producto
              </label>
              <select
                value={selectedProduct}
                onChange={(e) => setSelectedProduct(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-lg"
              >
                <option value="">Seleccionar producto...</option>
                {products.map(product => (
                  <option key={product.id} value={product.id}>
                    {product.name} - ${product.price.toLocaleString()}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cantidad
              </label>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="p-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  <Minus className="h-5 w-5" />
                </button>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                  className="flex-1 border border-gray-300 rounded-xl px-4 py-3 text-center text-lg font-semibold focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="p-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  <Plus className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            <button
              onClick={addToCart}
              disabled={!selectedProduct}
              className="w-full btn btn-primary flex items-center justify-center gap-2 py-4 text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="h-5 w-5" />
              Agregar al Carrito
            </button>
          </div>
        </div>

        {/* Carrito Mejorado */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900">Carrito de Compras</h3>
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-gray-400" />
              <span className="text-sm font-medium text-gray-500">
                {cartItems} items
              </span>
            </div>
          </div>
          
          {cart.length === 0 ? (
            <div className="text-center py-12">
              <div className="p-4 bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <ShoppingCart className="h-8 w-8 text-gray-400" />
              </div>
              <p className="text-gray-500 text-lg">El carrito está vacío</p>
              <p className="text-gray-400 text-sm mt-1">Agrega productos para comenzar</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="max-h-64 overflow-y-auto space-y-3">
                {cart.map(item => (
                  <div key={item.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{item.name}</h4>
                      <p className="text-sm text-gray-500">${item.price.toLocaleString()} c/u</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="text-lg font-bold w-12 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="text-right ml-4">
                      <p className="font-bold text-gray-900 text-lg">
                        ${(item.price * item.quantity).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="border-t border-gray-200 pt-6">
                <div className="flex justify-between items-center mb-6">
                  <span className="text-xl font-bold text-gray-900">Total:</span>
                  <span className="text-3xl font-bold text-primary-600">
                    ${cartTotal.toLocaleString()}
                  </span>
                </div>

                {/* Métodos de Pago Mejorados */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Método de Pago
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {paymentMethods.map(method => (
                      <button
                        key={method.id}
                        onClick={() => setPaymentMethod(method.id)}
                        className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                          paymentMethod === method.id
                            ? `border-${method.color}-500 bg-${method.color}-50 shadow-lg`
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <method.icon className={`h-6 w-6 mx-auto mb-2 ${
                          paymentMethod === method.id ? `text-${method.color}-600` : 'text-gray-500'
                        }`} />
                        <span className={`text-sm font-medium block ${
                          paymentMethod === method.id ? `text-${method.color}-700` : 'text-gray-600'
                        }`}>
                          {method.name}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Input de Efectivo Mejorado */}
                {paymentMethod === 'cash' && (
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Monto en Efectivo
                    </label>
                    <input
                      type="number"
                      value={cashAmount}
                      onChange={(e) => setCashAmount(parseFloat(e.target.value) || 0)}
                      className="w-full border border-gray-300 rounded-xl px-4 py-3 text-lg font-semibold focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="0.00"
                    />
                    {cashAmount > 0 && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Cambio:</span>
                          <span className={`font-bold text-lg ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            ${change.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <button
                  onClick={completeSale}
                  disabled={cart.length === 0 || (paymentMethod === 'cash' && cashAmount < cartTotal) || isProcessingSale}
                  className="w-full btn btn-primary flex items-center justify-center gap-3 py-4 text-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessingSale ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Procesando...
                    </>
                  ) : (
                    <>
                      <DollarSign className="h-5 w-5" />
                      Completar Venta
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Historial de Ventas Mejorado */}
      {showSalesHistory && (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 mt-6">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4 lg:mb-0">Historial de Ventas</h3>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="btn btn-secondary flex items-center gap-2"
            >
              <Filter className="h-4 w-4" />
              Filtros
            </button>
          </div>

          {/* Filtros Mejorados */}
          {showFilters && (
            <div className="bg-gray-50 rounded-xl p-6 mb-6">
              <h4 className="text-sm font-medium text-gray-700 mb-4">Filtrar por Período</h4>
              <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
                {[
                  { key: 'today', label: 'Hoy' },
                  { key: 'week', label: 'Esta Semana' },
                  { key: 'month', label: 'Este Mes' },
                  { key: 'quarter', label: 'Este Trimestre' },
                  { key: 'year', label: 'Este Año' },
                  { key: 'custom', label: 'Personalizado' }
                ].map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setPeriodFilter(key)}
                    className={`px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                      periodFilter === key
                        ? 'bg-primary-100 text-primary-700 border-2 border-primary-300 shadow-md'
                        : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              
              {periodFilter === 'custom' && (
                <div className="mt-4">
                  <input
                    type="date"
                    value={customDate}
                    onChange={(e) => setCustomDate(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg text-sm border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Fecha específica"
                  />
                </div>
              )}
            </div>
          )}

          {/* Resumen del Período Mejorado */}
          <div className="bg-gradient-to-r from-primary-50 to-primary-100 rounded-xl p-6 mb-6 border border-primary-200">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center">
              <div>
                <h4 className="text-xl font-bold text-primary-900">
                  {getPeriodName(periodFilter)}
                </h4>
                <p className="text-primary-600">
                  {filteredSales.length} ventas registradas
                </p>
              </div>
              <div className="text-right mt-4 lg:mt-0">
                <p className="text-3xl font-bold text-primary-900">
                  ${periodTotal.toLocaleString()}
                </p>
                <p className="text-primary-600">Total del período</p>
              </div>
            </div>
          </div>

          {/* Lista de Ventas Mejorada */}
          {filteredSales.length === 0 ? (
            <div className="text-center py-12">
              <div className="p-4 bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Receipt className="h-8 w-8 text-gray-400" />
              </div>
              <p className="text-gray-500 text-lg">
                No hay ventas registradas para {getPeriodName(periodFilter).toLowerCase()}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredSales.map(sale => (
                <div key={sale.id} className="border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
                  <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-bold text-gray-900 text-lg">
                          Venta #{sale.id}
                        </h4>
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                          Completada
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mb-2">
                        {new Date(sale.date).toLocaleDateString('es-ES', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })} - {new Date(sale.date).toLocaleTimeString('es-ES', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                      <div className="flex items-center gap-2">
                        {(() => {
                          const method = paymentMethods.find(m => m.id === sale.paymentMethod);
                          const IconComponent = method?.icon;
                          return IconComponent ? <IconComponent className="h-4 w-4 text-gray-400" /> : null;
                        })()}
                        <span className="text-xs text-gray-500">
                          {paymentMethods.find(m => m.id === sale.paymentMethod)?.name}
                        </span>
                      </div>
                    </div>
                    <div className="text-right mt-4 lg:mt-0">
                      <p className="text-2xl font-bold text-primary-600">
                        ${sale.total.toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-500">
                        {sale.items.length} productos
                      </p>
                      {sale.paymentMethod === 'cash' && sale.change > 0 && (
                        <p className="text-xs text-green-600 font-medium">
                          Cambio: ${sale.change.toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2 pt-4 border-t border-gray-100">
                    {sale.items.map(item => (
                      <div key={item.id} className="flex justify-between items-center text-sm">
                        <span className="text-gray-700">{item.name} x{item.quantity}</span>
                        <span className="text-gray-900 font-medium">${(item.price * item.quantity).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal para Abrir Caja */}
      {showShiftModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Abrir Caja</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Seleccionar Turno
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => openCashRegister('morning')}
                    className="p-4 border-2 border-gray-200 rounded-xl hover:border-primary-300 hover:bg-primary-50 transition-all duration-200"
                  >
                    <div className="text-center">
                      <div className="text-2xl mb-2">🌅</div>
                      <div className="font-semibold text-gray-900">Turno Mañana</div>
                      <div className="text-sm text-gray-500">6:00 - 14:00</div>
                    </div>
                  </button>
                  <button
                    onClick={() => openCashRegister('afternoon')}
                    className="p-4 border-2 border-gray-200 rounded-xl hover:border-primary-300 hover:bg-primary-50 transition-all duration-200"
                  >
                    <div className="text-center">
                      <div className="text-2xl mb-2">🌆</div>
                      <div className="font-semibold text-gray-900">Turno Tarde</div>
                      <div className="text-sm text-gray-500">14:00 - 22:00</div>
                    </div>
                  </button>
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowShiftModal(false)}
                  className="flex-1 btn btn-secondary"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CashRegister; 