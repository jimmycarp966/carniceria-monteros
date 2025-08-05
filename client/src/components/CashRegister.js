import React, { useState, useEffect } from 'react';
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
  Calendar,
  Filter
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
  const [dailyTotal, setDailyTotal] = useState(0);
  const [isOpen, setIsOpen] = useState(true);
  
  // Nuevos estados para filtros
  const [periodFilter, setPeriodFilter] = useState('today'); // today, week, month, quarter, custom
  const [customDate, setCustomDate] = useState('');
  const [filteredSales, setFilteredSales] = useState([]);
  const [periodTotal, setPeriodTotal] = useState(0);
  const [showFilters, setShowFilters] = useState(false);

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const cartItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const change = cashAmount - cartTotal;

  // Calcular totales diarios
  useEffect(() => {
    const today = new Date().toDateString();
    const todaySales = sales.filter(sale => 
      new Date(sale.date).toDateString() === today
    );
    const total = todaySales.reduce((sum, sale) => sum + sale.total, 0);
    setDailyTotal(total);
  }, [sales]);

  // Función para filtrar ventas por período
  const filterSalesByPeriod = (period, customDateValue = null) => {
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
  };

  // Aplicar filtro cuando cambie el período
  useEffect(() => {
    filterSalesByPeriod(periodFilter, customDate);
  }, [periodFilter, customDate, sales]);

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

  const completeSale = () => {
    if (cart.length === 0) {
      toast.error('El carrito está vacío');
      return;
    }

    if (paymentMethod === 'cash' && cashAmount < cartTotal) {
      toast.error('El monto en efectivo es insuficiente');
      return;
    }

    const sale = {
      id: Date.now(),
      items: [...cart],
      total: cartTotal,
      paymentMethod,
      cashAmount: paymentMethod === 'cash' ? cashAmount : 0,
      change: paymentMethod === 'cash' ? change : 0,
      date: new Date().toISOString(),
      customer: 'Cliente General'
    };

    setSales([sale, ...sales]);
    setCart([]);
    setCashAmount(0);
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
    // Estadísticas del período seleccionado
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
    <div className="p-4 lg:p-6 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Caja</h1>
          <p className="mt-2 text-gray-600">Sistema de caja y ventas</p>
        </div>
        <div className="flex space-x-2 w-full sm:w-auto">
          <button
            onClick={() => setShowSalesHistory(!showSalesHistory)}
            className="btn btn-secondary flex items-center justify-center flex-1 sm:flex-none"
          >
            <Receipt className="h-4 w-4 mr-2" />
            Historial
          </button>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className={`btn flex items-center justify-center flex-1 sm:flex-none ${
              isOpen ? 'btn-success' : 'btn-danger'
            }`}
          >
            {isOpen ? (
              <>
                <Check className="h-4 w-4 mr-2" />
                Abierta
              </>
            ) : (
              <>
                <X className="h-4 w-4 mr-2" />
                Cerrada
              </>
            )}
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 lg:p-6">
          <div className="flex items-center">
            <DollarSign className="h-6 w-6 text-primary-600" />
            <div className="ml-3">
              <p className="text-xs lg:text-sm font-medium text-gray-500">
                {showSalesHistory ? getPeriodName(periodFilter) : 'Caja Hoy'}
              </p>
              <p className="text-lg lg:text-2xl font-bold text-gray-900">
                ${showSalesHistory ? periodTotal.toLocaleString() : dailyTotal.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 lg:p-6">
          <div className="flex items-center">
            <Receipt className="h-6 w-6 text-green-600" />
            <div className="ml-3">
              <p className="text-xs lg:text-sm font-medium text-gray-500">
                {showSalesHistory ? 'Ventas del Período' : 'Ventas Hoy'}
              </p>
              <p className="text-lg lg:text-2xl font-bold text-gray-900">
                {showSalesHistory ? stats.periodSales : stats.todaySales}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 lg:p-6">
          <div className="flex items-center">
            <CreditCard className="h-6 w-6 text-blue-600" />
            <div className="ml-3">
              <p className="text-xs lg:text-sm font-medium text-gray-500">
                {showSalesHistory ? 'Promedio del Período' : 'Total Ventas'}
              </p>
              <p className="text-lg lg:text-2xl font-bold text-gray-900">
                ${showSalesHistory ? stats.periodAverage.toFixed(0) : stats.totalSales}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 lg:p-6">
          <div className="flex items-center">
            <Calculator className="h-6 w-6 text-purple-600" />
            <div className="ml-3">
              <p className="text-xs lg:text-sm font-medium text-gray-500">
                {showSalesHistory ? 'Promedio por Venta' : 'Promedio'}
              </p>
              <p className="text-lg lg:text-2xl font-bold text-gray-900">
                ${showSalesHistory ? (stats.periodRevenue / Math.max(stats.periodSales, 1)).toFixed(0) : stats.averageSale.toFixed(0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Product Selection */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 lg:p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Agregar Producto</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Seleccionar Producto
              </label>
              <select
                value={selectedProduct}
                onChange={(e) => setSelectedProduct(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
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
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-center focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>
            <button
              onClick={addToCart}
              className="w-full btn btn-primary flex items-center justify-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              Agregar al Carrito
            </button>
          </div>
        </div>

        {/* Cart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 lg:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Carrito de Compras</h3>
            <div className="text-sm text-gray-500">
              {cartItems} items
            </div>
          </div>
          
          {cart.length === 0 ? (
            <div className="text-center py-8">
              <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">El carrito está vacío</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="max-h-64 overflow-y-auto space-y-3">
                {cart.map(item => (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{item.name}</h4>
                      <p className="text-sm text-gray-500">${item.price.toLocaleString()} c/u</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="p-1 text-gray-400 hover:text-gray-600"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="text-sm font-medium w-8 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="p-1 text-gray-400 hover:text-gray-600"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="p-1 text-red-400 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">
                        ${(item.price * item.quantity).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="border-t pt-4">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-lg font-semibold text-gray-900">Total:</span>
                  <span className="text-2xl font-bold text-primary-600">
                    ${cartTotal.toLocaleString()}
                  </span>
                </div>

                {/* Payment Method */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Método de Pago
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {paymentMethods.map(method => (
                      <button
                        key={method.id}
                        onClick={() => setPaymentMethod(method.id)}
                        className={`p-3 rounded-lg border-2 transition-colors ${
                          paymentMethod === method.id
                            ? `border-${method.color}-500 bg-${method.color}-50`
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <method.icon className={`h-5 w-5 mx-auto mb-1 ${
                          paymentMethod === method.id ? `text-${method.color}-600` : 'text-gray-500'
                        }`} />
                        <span className={`text-xs font-medium ${
                          paymentMethod === method.id ? `text-${method.color}-700` : 'text-gray-600'
                        }`}>
                          {method.name}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Cash Amount Input */}
                {paymentMethod === 'cash' && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Monto en Efectivo
                    </label>
                    <input
                      type="number"
                      value={cashAmount}
                      onChange={(e) => setCashAmount(parseFloat(e.target.value) || 0)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="0.00"
                    />
                    {cashAmount > 0 && (
                      <div className="mt-2 text-sm">
                        <span className="text-gray-600">Cambio: </span>
                        <span className={`font-medium ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          ${change.toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                <button
                  onClick={completeSale}
                  disabled={cart.length === 0 || (paymentMethod === 'cash' && cashAmount < cartTotal)}
                  className="w-full btn btn-primary flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <DollarSign className="h-4 w-4 mr-2" />
                  Completar Venta
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sales History */}
      {showSalesHistory && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 lg:p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Historial de Ventas</h3>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="btn btn-secondary flex items-center justify-center"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filtros
            </button>
          </div>

          {/* Filtros */}
          {showFilters && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Filtrar por Período</h4>
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                <button
                  onClick={() => setPeriodFilter('today')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    periodFilter === 'today'
                      ? 'bg-primary-100 text-primary-700 border border-primary-300'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  Hoy
                </button>
                <button
                  onClick={() => setPeriodFilter('week')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    periodFilter === 'week'
                      ? 'bg-primary-100 text-primary-700 border border-primary-300'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  Esta Semana
                </button>
                <button
                  onClick={() => setPeriodFilter('month')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    periodFilter === 'month'
                      ? 'bg-primary-100 text-primary-700 border border-primary-300'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  Este Mes
                </button>
                <button
                  onClick={() => setPeriodFilter('quarter')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    periodFilter === 'quarter'
                      ? 'bg-primary-100 text-primary-700 border border-primary-300'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  Este Trimestre
                </button>
                <div className="relative">
                  <input
                    type="date"
                    value={customDate}
                    onChange={(e) => {
                      setCustomDate(e.target.value);
                      setPeriodFilter('custom');
                    }}
                    className="w-full px-3 py-2 rounded-lg text-sm border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Fecha específica"
                  />
                  <Calendar className="h-4 w-4 text-gray-400 absolute right-3 top-2.5" />
                </div>
              </div>
            </div>
          )}

          {/* Resumen del período */}
          <div className="bg-primary-50 rounded-lg p-4 mb-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
              <div>
                <h4 className="text-lg font-semibold text-primary-900">
                  {getPeriodName(periodFilter)}
                </h4>
                <p className="text-sm text-primary-600">
                  {filteredSales.length} ventas registradas
                </p>
              </div>
              <div className="text-right mt-2 sm:mt-0">
                <p className="text-2xl font-bold text-primary-900">
                  ${periodTotal.toLocaleString()}
                </p>
                <p className="text-sm text-primary-600">Total del período</p>
              </div>
            </div>
          </div>

          {/* Lista de ventas */}
          {filteredSales.length === 0 ? (
            <div className="text-center py-8">
              <Receipt className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">
                No hay ventas registradas para {getPeriodName(periodFilter).toLowerCase()}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredSales.map(sale => (
                <div key={sale.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3">
                    <div>
                      <h4 className="font-medium text-gray-900">
                        Venta #{sale.id}
                      </h4>
                      <p className="text-sm text-gray-500">
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
                      <div className="flex items-center mt-1">
                        {(() => {
                          const method = paymentMethods.find(m => m.id === sale.paymentMethod);
                          const IconComponent = method?.icon;
                          return IconComponent ? <IconComponent className="h-4 w-4 text-gray-400 mr-1" /> : null;
                        })()}
                        <span className="text-xs text-gray-500">
                          {paymentMethods.find(m => m.id === sale.paymentMethod)?.name}
                        </span>
                      </div>
                    </div>
                    <div className="text-right mt-2 sm:mt-0">
                      <p className="text-lg font-bold text-primary-600">
                        ${sale.total.toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-500">
                        {sale.items.length} productos
                      </p>
                      {sale.paymentMethod === 'cash' && sale.change > 0 && (
                        <p className="text-xs text-green-600">
                          Cambio: ${sale.change.toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    {sale.items.map(item => (
                      <div key={item.id} className="flex justify-between items-center text-sm">
                        <span className="text-gray-700">{item.name} x{item.quantity}</span>
                        <span className="text-gray-900">${(item.price * item.quantity).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CashRegister; 