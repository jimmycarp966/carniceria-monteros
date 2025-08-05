import React, { useState, useEffect, useCallback } from 'react';
import { products } from '../data/products';
import { 
  DollarSign, 
  Plus, 
  Minus, 
  Trash2, 
  Receipt, 
  CreditCard, 
  AlertTriangle,
  Zap,
  Target,
  BarChart3,
  Clock,
  ShoppingCart,
  Check,
  Filter,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import toast from 'react-hot-toast';
import { productService, saleService, shiftService } from '../services/firebaseService';

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
  const [isProcessingSale, setIsProcessingSale] = useState(false);
  
  // Estados para inventario inteligente
  const [lowStockAlerts, setLowStockAlerts] = useState([]);
  const [quickActions, setQuickActions] = useState([]);
  const [showQuickActions, setShowQuickActions] = useState(false);

  // Estados para buscador de productos
  const [searchTerm, setSearchTerm] = useState('');
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [allProducts, setAllProducts] = useState([]);

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const cartItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const change = cashAmount - cartTotal;

  // Cargar productos desde Firebase
  useEffect(() => {
    const loadProducts = async () => {
      try {
        const productsFromFirebase = await productService.getAllProducts();
        if (productsFromFirebase.length > 0) {
          setAllProducts(productsFromFirebase);
        } else {
          // Si no hay productos en Firebase, usar los datos locales
          setAllProducts(products);
        }
      } catch (error) {
        console.error('Error cargando productos:', error);
        setAllProducts(products);
      }
    };
    loadProducts();
  }, []);

  // Filtrar productos basado en búsqueda
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredProducts(allProducts);
    } else {
      const filtered = allProducts.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredProducts(filtered);
    }
  }, [searchTerm, allProducts]);

  // Verificar turno activo al cargar
  useEffect(() => {
    const checkActiveShift = async () => {
      try {
        const activeShift = await shiftService.getActiveShift();
        if (activeShift) {
          setCurrentShift(activeShift);
          setIsOpen(true);
          setShiftStartTime(new Date(activeShift.createdAt?.toDate() || Date.now()));
        }
      } catch (error) {
        console.error('Error verificando turno activo:', error);
      }
    };
    checkActiveShift();
  }, []);

  // Simular alertas de inventario inteligente
  useEffect(() => {
    const alerts = allProducts
      .filter(product => product.stock <= product.minStock)
      .map(product => ({
        id: product.id,
        name: product.name,
        stock: product.stock,
        minStock: product.minStock,
        priority: product.stock === 0 ? 'high' : 'medium'
      }));
    setLowStockAlerts(alerts);
  }, [allProducts]);

  // Generar acciones rápidas basadas en ventas frecuentes
  useEffect(() => {
    const frequentProducts = allProducts
      .sort((a, b) => (b.salesCount || 0) - (a.salesCount || 0))
      .slice(0, 6)
      .map(product => ({
        id: product.id,
        name: product.name,
        price: product.price,
        icon: product.category === 'carne' ? '🥩' : product.category === 'pollo' ? '🍗' : '🥓'
      }));
    setQuickActions(frequentProducts);
  }, [allProducts]);

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
      case 'custom':
        if (customDateValue) {
          startDate = new Date(customDateValue);
          endDate = new Date(customDateValue);
          endDate.setDate(endDate.getDate() + 1);
        } else {
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
        }
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    }

    const filtered = sales.filter(sale => {
      const saleDate = new Date(sale.date);
      return saleDate >= startDate && saleDate < endDate;
    });

    setFilteredSales(filtered);
    setPeriodTotal(filtered.reduce((sum, sale) => sum + sale.total, 0));
  }, [sales]);

  useEffect(() => {
    filterSalesByPeriod(periodFilter, customDate);
  }, [periodFilter, customDate, filterSalesByPeriod]);

  const getPeriodName = (period) => {
    switch (period) {
      case 'today': return 'Hoy';
      case 'week': return 'Esta Semana';
      case 'month': return 'Este Mes';
      case 'custom': return 'Personalizado';
      default: return 'Hoy';
    }
  };

  const openCashRegister = async (shift) => {
    try {
      // Verificar si ya hay un turno activo
      const activeShift = await shiftService.getActiveShift();
      if (activeShift) {
        toast.error('Ya hay un turno activo. Cierra el turno actual primero.');
        return;
      }

      // Crear nuevo turno en Firebase
      const shiftData = {
        type: shift,
        startTime: new Date(),
        totalSales: 0,
        totalItems: 0
      };

      const shiftId = await shiftService.addShift(shiftData);
      
      setCurrentShift({ id: shiftId, ...shiftData });
      setShiftStartTime(new Date());
      setIsOpen(true);
      toast.success(`Caja abierta - Turno ${getShiftName(shift)}`);
    } catch (error) {
      console.error('Error abriendo caja:', error);
      toast.error('Error al abrir la caja');
    }
  };

  const closeCashRegister = async () => {
    if (cart.length > 0) {
      toast.error('No se puede cerrar la caja con productos en el carrito');
      return;
    }
    
    try {
      if (currentShift) {
        const closingData = {
          endTime: new Date(),
          totalSales: shiftTotal,
          totalItems: shiftSales.reduce((sum, sale) => sum + sale.items.length, 0),
          salesCount: shiftSales.length
        };

        await shiftService.closeShift(currentShift.id, closingData);
      }
      
      setCurrentShift(null);
      setShiftStartTime(null);
      setShiftSales([]);
      setShiftTotal(0);
      setIsOpen(false);
      toast.success('Caja cerrada correctamente');
    } catch (error) {
      console.error('Error cerrando caja:', error);
      toast.error('Error al cerrar la caja');
    }
  };

  const getShiftName = (shift) => {
    return shift === 'morning' ? 'Mañana' : 'Tarde';
  };

  const getShiftTime = (shift) => {
    return shift === 'morning' ? '8:00 - 14:00' : '18:00 - 22:00';
  };

  const getShiftDuration = () => {
    if (!shiftStartTime) return '00:00:00';
    const now = new Date();
    const diff = now - shiftStartTime;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const addToCart = () => {
    if (!isOpen) {
      toast.error('La caja debe estar abierta para vender');
      return;
    }

    if (!selectedProduct) {
      toast.error('Selecciona un producto');
      return;
    }

    const product = allProducts.find(p => p.id === selectedProduct);
    if (!product) {
      toast.error('Producto no encontrado');
      return;
    }

    if (product.stock < quantity) {
      toast.error(`Stock insuficiente. Solo hay ${product.stock} unidades disponibles`);
      return;
    }

    const existingItem = cart.find(item => item.id === selectedProduct);
    
    if (existingItem) {
      setCart(cart.map(item => 
        item.id === selectedProduct 
          ? { ...item, quantity: item.quantity + quantity }
          : item
      ));
    } else {
      setCart([...cart, { ...product, quantity }]);
    }

    setSelectedProduct('');
    setQuantity(1);
    setSearchTerm('');
    setShowProductDropdown(false);
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
    if (!isOpen) {
      toast.error('La caja debe estar abierta para vender');
      return;
    }

    if (cart.length === 0) {
      toast.error('El carrito está vacío');
      return;
    }

    if (paymentMethod === 'cash' && cashAmount < cartTotal) {
      toast.error('El monto en efectivo es menor al total');
      return;
    }

    setIsProcessingSale(true);

    try {
      // Simular procesamiento
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Crear objeto de venta
      const sale = {
        items: [...cart],
        total: cartTotal,
        paymentMethod,
        cashAmount,
        change,
        date: new Date(),
        shiftId: currentShift?.id,
        shiftType: currentShift?.type
      };

      // Guardar venta en Firebase
      const saleId = await saleService.addSale(sale);

      // Actualizar stock de productos
      for (const item of cart) {
        const product = allProducts.find(p => p.id === item.id);
        if (product) {
          const newStock = product.stock - item.quantity;
          await productService.updateProductStock(item.id, newStock);
        }
      }

      // Actualizar estado local
      const saleWithId = { id: saleId, ...sale };
      setSales([saleWithId, ...sales]);
      setShiftSales([saleWithId, ...shiftSales]);
      setShiftTotal(shiftTotal + cartTotal);
      setCart([]);
      setCashAmount(0);
      setPaymentMethod('cash');

      toast.success('Venta completada exitosamente');
    } catch (error) {
      console.error('Error completando venta:', error);
      toast.error('Error al completar la venta');
    } finally {
      setIsProcessingSale(false);
    }
  };

  const addQuickAction = (product) => {
    if (!isOpen) {
      toast.error('La caja debe estar abierta para vender');
      return;
    }

    const existingItem = cart.find(item => item.id === product.id);
    
    if (existingItem) {
      setCart(cart.map(item => 
        item.id === product.id 
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }

    toast.success(`${product.name} agregado al carrito`);
  };

  const handleProductSearch = (term) => {
    setSearchTerm(term);
    setShowProductDropdown(true);
  };

  const selectProductFromDropdown = (product) => {
    setSelectedProduct(product.id);
    setSearchTerm(product.name);
    setShowProductDropdown(false);
  };

  return (
    <div className="p-4 lg:p-6 w-full">
      {/* Header Mejorado */}
      <div className="bg-white rounded-3xl shadow-xl border border-gray-200 p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Caja Registradora</h1>
            <p className="text-gray-600">Gestión de ventas y transacciones</p>
          </div>
          <div className="mt-4 sm:mt-0 flex space-x-2">
            <button 
              onClick={() => setShowQuickActions(!showQuickActions)}
              className="btn btn-secondary"
            >
              <Zap className="h-4 w-4 mr-2" />
              Acciones Rápidas
            </button>
            <button 
              onClick={() => setShowSalesHistory(!showSalesHistory)}
              className="btn btn-primary"
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Historial
            </button>
          </div>
        </div>
      </div>

      {/* Alertas de Inventario Inteligente */}
      {lowStockAlerts.length > 0 && (
        <div className="mb-6">
          <div className="bg-red-50 border border-red-200 rounded-3xl p-4">
            <div className="flex items-center mb-3">
              <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
              <h3 className="text-lg font-semibold text-red-800">Alertas de Stock</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {lowStockAlerts.map(alert => (
                <div key={alert.id} className="bg-white rounded-2xl p-3 border border-red-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{alert.name}</p>
                      <p className="text-sm text-red-600">
                        Stock: {alert.stock} (Mín: {alert.minStock})
                      </p>
                    </div>
                    <div className={`badge ${alert.priority === 'high' ? 'badge-danger' : 'badge-warning'}`}>
                      {alert.priority === 'high' ? 'Agotado' : 'Bajo Stock'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Acciones Rápidas */}
      {showQuickActions && (
        <div className="mb-6">
          <div className="bg-blue-50 border border-blue-200 rounded-3xl p-4">
            <div className="flex items-center mb-3">
              <Target className="h-5 w-5 text-blue-600 mr-2" />
              <h3 className="text-lg font-semibold text-blue-800">Productos Frecuentes</h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {quickActions.map(product => (
                <button
                  key={product.id}
                  onClick={() => addQuickAction(product)}
                  className="bg-white rounded-2xl p-3 border border-blue-200 hover:border-blue-300 hover:shadow-md transition-all duration-200 transform hover:scale-105"
                >
                  <div className="text-center">
                    <div className="text-2xl mb-2">{product.icon}</div>
                    <p className="text-xs font-medium text-gray-900 truncate">{product.name}</p>
                    <p className="text-xs text-gray-600">${product.price.toLocaleString()}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Estado de la Caja */}
      {!isOpen ? (
        <div className="card">
          <div className="text-center">
            <div className="p-4 bg-primary-100 rounded-3xl w-20 h-20 mx-auto mb-4 flex items-center justify-center">
              <DollarSign className="h-10 w-10 text-primary-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Caja Cerrada</h2>
            <p className="text-gray-600 mb-6">Selecciona un turno para abrir la caja</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {['morning', 'afternoon'].map(shift => (
                <button
                  key={shift}
                  onClick={() => openCashRegister(shift)}
                  className="shift-card"
                >
                  <div className="shift-icon">
                    <Clock className="h-6 w-6" />
                  </div>
                  <h3 className="shift-title">{getShiftName(shift)}</h3>
                  <p className="shift-time">{getShiftTime(shift)}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Panel de Productos */}
          <div className="space-y-6">
            {/* Información del Turno */}
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Turno Activo</h3>
                  <p className="text-sm text-gray-600">{getShiftName(currentShift?.type)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Duración</p>
                  <p className="text-lg font-bold text-primary-600">{getShiftDuration()}</p>
                </div>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={closeCashRegister}
                  className="btn btn-danger flex-1"
                >
                  Cerrar Caja
                </button>
                <div className="caja-status open">
                  <Check className="h-4 w-4 mr-1" />
                  Abierta
                </div>
              </div>
            </div>

            {/* Selección de Productos con Buscador */}
            <div className="card">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Agregar Producto</h3>
              <div className="space-y-4">
                <div className="form-group relative">
                  <label className="form-label">Buscar Producto</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => handleProductSearch(e.target.value)}
                      placeholder="Buscar productos..."
                      className="form-input pr-10"
                      onFocus={() => setShowProductDropdown(true)}
                    />
                    <button
                      onClick={() => setShowProductDropdown(!showProductDropdown)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showProductDropdown ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>
                  </div>
                  
                  {/* Dropdown de productos */}
                  {showProductDropdown && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-2xl shadow-xl max-h-60 overflow-y-auto">
                      {filteredProducts.length > 0 ? (
                        filteredProducts.map(product => (
                          <button
                            key={product.id}
                            onClick={() => selectProductFromDropdown(product)}
                            className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 flex items-center justify-between"
                          >
                            <div>
                              <p className="font-medium text-gray-900">{product.name}</p>
                              <p className="text-sm text-gray-600">{product.category}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-primary-600">${product.price.toLocaleString()}</p>
                              <p className="text-xs text-gray-500">Stock: {product.stock}</p>
                            </div>
                          </button>
                        ))
                      ) : (
                        <div className="px-4 py-3 text-gray-500 text-center">
                          No se encontraron productos
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">Cantidad</label>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <input
                      type="number"
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      className="form-input text-center"
                      min="1"
                    />
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <button
                  onClick={addToCart}
                  className="btn btn-primary w-full"
                  disabled={!selectedProduct}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar al Carrito
                </button>
              </div>
            </div>

            {/* Acciones Rápidas */}
            <div className="card">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Acciones Rápidas</h3>
              <div className="grid grid-cols-2 gap-3">
                {quickActions.map(product => (
                  <button
                    key={product.id}
                    onClick={() => addQuickAction(product)}
                    className="p-3 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-all duration-200 text-left"
                  >
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl">{product.icon}</span>
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{product.name}</p>
                        <p className="text-primary-600 font-bold">${product.price.toLocaleString()}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Panel de Carrito y Pago */}
          <div className="space-y-6">
            {/* Carrito */}
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">Carrito</h3>
                <div className="flex items-center space-x-2">
                  <ShoppingCart className="h-5 w-5 text-primary-600" />
                  <span className="text-sm font-medium text-gray-600">{cartItems} items</span>
                </div>
              </div>

              {cart.length === 0 ? (
                <div className="text-center py-8">
                  <ShoppingCart className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">El carrito está vacío</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {cart.map(item => (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-2xl">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center">
                          <span className="text-sm font-bold text-primary-600">{item.category?.charAt(0).toUpperCase()}</span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{item.name}</p>
                          <p className="text-sm text-gray-600">${item.price.toLocaleString()} c/u</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="p-1 rounded-lg bg-gray-200 hover:bg-gray-300 transition-colors"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="font-medium text-gray-900 min-w-[2rem] text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="p-1 rounded-lg bg-gray-200 hover:bg-gray-300 transition-colors"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="p-1 rounded-lg bg-red-100 hover:bg-red-200 transition-colors text-red-600"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Método de Pago */}
            <div className="card">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Método de Pago</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setPaymentMethod('cash')}
                    className={`payment-method-card ${paymentMethod === 'cash' ? 'selected' : ''}`}
                  >
                    <DollarSign className="h-6 w-6" />
                    <span>Efectivo</span>
                  </button>
                  <button
                    onClick={() => setPaymentMethod('card')}
                    className={`payment-method-card ${paymentMethod === 'card' ? 'selected' : ''}`}
                  >
                    <CreditCard className="h-6 w-6" />
                    <span>Tarjeta</span>
                  </button>
                </div>

                {paymentMethod === 'cash' && (
                  <div className="form-group">
                    <label className="form-label">Monto Recibido</label>
                    <input
                      type="number"
                      value={cashAmount}
                      onChange={(e) => setCashAmount(parseFloat(e.target.value) || 0)}
                      className="form-input"
                      placeholder="0"
                    />
                    {change > 0 && (
                      <p className="text-sm text-green-600 mt-1">Cambio: ${change.toLocaleString()}</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Total y Completar Venta */}
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">Total</h3>
                <p className="text-2xl font-bold text-primary-600">${cartTotal.toLocaleString()}</p>
              </div>
              
              <button
                onClick={completeSale}
                disabled={cart.length === 0 || isProcessingSale}
                className="btn btn-primary w-full"
              >
                {isProcessingSale ? (
                  <div className="flex items-center">
                    <div className="loading-spinner mr-2"></div>
                    Procesando...
                  </div>
                ) : (
                  <>
                    <Receipt className="h-4 w-4 mr-2" />
                    Completar Venta
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Historial de Ventas */}
      {showSalesHistory && (
        <div className="mt-6">
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Historial de Ventas</h3>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="btn btn-secondary"
              >
                <Filter className="h-4 w-4 mr-2" />
                Filtros
              </button>
            </div>

            {showFilters && (
              <div className="mb-4 p-4 bg-gray-50 rounded-2xl">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="form-label">Período</label>
                    <select
                      value={periodFilter}
                      onChange={(e) => setPeriodFilter(e.target.value)}
                      className="form-select"
                    >
                      <option value="today">Hoy</option>
                      <option value="week">Esta Semana</option>
                      <option value="month">Este Mes</option>
                      <option value="quarter">Este Trimestre</option>
                      <option value="custom">Personalizado</option>
                    </select>
                  </div>
                  {periodFilter === 'custom' && (
                    <div>
                      <label className="form-label">Fecha</label>
                      <input
                        type="date"
                        value={customDate}
                        onChange={(e) => setCustomDate(e.target.value)}
                        className="form-input"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="mb-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  {getPeriodName(periodFilter)} - {filteredSales.length} ventas
                </p>
                <p className="text-lg font-bold text-primary-600">
                  Total: ${periodTotal.toLocaleString()}
                </p>
              </div>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {filteredSales.length === 0 ? (
                <div className="text-center py-8">
                  <Receipt className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No hay ventas en este período</p>
                </div>
              ) : (
                filteredSales.map(sale => (
                  <div key={sale.id} className="history-item">
                    <div className="history-header">
                      <div>
                        <p className="font-medium text-gray-900">
                          Venta #{sale.id}
                        </p>
                        <p className="text-sm text-gray-500">
                          {new Date(sale.date).toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="history-amount">${sale.total.toLocaleString()}</p>
                        <p className="text-xs text-gray-500">
                          {sale.paymentMethod === 'cash' ? 'Efectivo' : 'Tarjeta'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Overlay de Procesamiento */}
      {isProcessingSale && (
        <div className="processing-overlay">
          <div className="processing-content">
            <div className="processing-spinner"></div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Procesando Venta</h3>
            <p className="text-gray-600">Por favor espera...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default CashRegister; 