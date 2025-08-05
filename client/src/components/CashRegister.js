import React, { useState, useEffect, useCallback } from 'react';
import { 
  ShoppingCart, 
  Plus, 
  Minus, 
  Trash2, 
  Clock, 
  DollarSign, 
  CreditCard,
  Banknote,
  AlertTriangle,
  BarChart3,
  Receipt,
  X,
  Zap,
  Target,
  Check,
  Filter,
  ChevronDown,
  ChevronUp,
  Smartphone,
  Search
} from 'lucide-react';
import { products } from '../data/products';
import { productService, saleService, shiftService, loadSampleData } from '../services/firebaseService';
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

  // Estados para reporte diario
  const [showDailyReport, setShowDailyReport] = useState(false);
  const [dailyReport, setDailyReport] = useState({
    totalSales: 0,
    cashTotal: 0,
    cardTotal: 0,
    transferTotal: 0,
    debitTotal: 0,
    totalTransactions: 0,
    cashTransactions: 0,
    cardTransactions: 0,
    transferTransactions: 0,
    debitTransactions: 0
  });

  // Estados para sistema de fechas y validaciones
  const [showDateModal, setShowDateModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [pendingShift, setPendingShift] = useState(null);

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const cartItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const change = cashAmount - cartTotal;

  // Cargar productos desde Firebase
  useEffect(() => {
    const loadProducts = async () => {
      try {
        console.log('🔄 Cargando productos desde Firebase...');
        
        // Intentar cargar datos simulados si Firebase está vacío
        await loadSampleData();
        
        const productsFromFirebase = await productService.getAllProducts();
        console.log('📦 Productos cargados de Firebase:', productsFromFirebase.length);
        
        // Siempre usar Firebase si hay datos, incluso si está vacío
        setAllProducts(productsFromFirebase);
        
        // Solo usar datos locales si Firebase está completamente vacío Y hay un error
      } catch (error) {
        console.error('❌ Error cargando productos de Firebase:', error);
        console.log('🔄 Usando datos locales como fallback...');
        setAllProducts(products);
      }
    };
    loadProducts();
  }, []);

  // Cargar ventas desde Firebase
  useEffect(() => {
    const loadSales = async () => {
      try {
        const salesFromFirebase = await saleService.getAllSales();
        setSales(salesFromFirebase);
      } catch (error) {
        console.error('Error cargando ventas:', error);
      }
    };
    loadSales();
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

      // Para el turno tarde, verificar que exista un turno mañana del mismo día
      if (shift === 'afternoon') {
        const today = new Date().toISOString().split('T')[0];
        const morningShifts = await shiftService.getShiftsByDate(today);
        const morningShift = morningShifts.find(s => s.type === 'morning');
        
        if (!morningShift) {
          toast.error('No se puede abrir el turno tarde sin haber abierto el turno mañana primero.');
          return;
        }
      }

      // Para el turno mañana, solicitar fecha
      if (shift === 'morning') {
        setPendingShift(shift);
        setShowDateModal(true);
        return;
      }

      // Para el turno tarde, usar la fecha actual
      await createShift(shift, new Date().toISOString().split('T')[0]);
    } catch (error) {
      console.error('Error abriendo caja:', error);
      toast.error('Error al abrir la caja');
    }
  };

  const createShift = async (shift, date) => {
    try {
      // Crear nuevo turno en Firebase
      const shiftData = {
        type: shift,
        date: date,
        startTime: new Date(),
        totalSales: 0,
        totalItems: 0
      };

      const shiftId = await shiftService.addShift(shiftData);
      
      setCurrentShift({ id: shiftId, ...shiftData });
      setShiftStartTime(new Date());
      setIsOpen(true);
      toast.success(`Caja abierta - Turno ${getShiftName(shift)} - ${date}`);
    } catch (error) {
      console.error('Error creando turno:', error);
      toast.error('Error al crear el turno');
    }
  };

  const handleDateSubmit = async () => {
    if (!selectedDate) {
      toast.error('Por favor selecciona una fecha');
      return;
    }

    setShowDateModal(false);
    await createShift(pendingShift, selectedDate);
    setPendingShift(null);
    setSelectedDate('');
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

    // Solo validar monto en efectivo si el método de pago es efectivo
    if (paymentMethod === 'cash' && cashAmount < cartTotal) {
      toast.error('El monto en efectivo es menor al total');
      return;
    }

    setIsProcessingSale(true);

    try {
      // Crear objeto de venta
      const sale = {
        items: [...cart],
        total: cartTotal,
        paymentMethod,
        cashAmount: paymentMethod === 'cash' ? cashAmount : 0,
        change: paymentMethod === 'cash' ? change : 0,
        date: new Date(),
        shiftId: currentShift?.id,
        shiftType: currentShift?.type,
        createdAt: new Date()
      };

      // Guardar venta en Firebase
      const saleId = await saleService.addSale(sale);

      // Actualizar stock de productos
      for (const item of cart) {
        const product = allProducts.find(p => p.id === item.id);
        if (product && product.id) {
          try {
            const newStock = Math.max(0, product.stock - item.quantity);
            // Convertir ID a string si es numérico
            const productId = typeof product.id === 'number' ? product.id.toString() : product.id;
            await productService.updateProductStock(productId, newStock);
            
            // Actualizar el estado local del producto
            setAllProducts(prevProducts => 
              prevProducts.map(p => 
                p.id === product.id 
                  ? { ...p, stock: newStock }
                  : p
              )
            );
          } catch (error) {
            console.error(`Error actualizando stock de ${product.name}:`, error);
            // Continuar con la venta aunque falle la actualización de stock
          }
        }
      }

      // Actualizar estado local con la nueva venta
      const saleWithId = { id: saleId, ...sale };
      
      // Actualizar ventas generales
      setSales(prevSales => [saleWithId, ...prevSales]);
      
      // Actualizar ventas del turno actual
      setShiftSales(prevShiftSales => [saleWithId, ...prevShiftSales]);
      setShiftTotal(prevTotal => prevTotal + cartTotal);

      // Actualizar el turno en Firebase con el nuevo total
      if (currentShift) {
        try {
          await shiftService.updateShiftTotal(currentShift.id, shiftTotal + cartTotal);
        } catch (error) {
          console.error('Error actualizando total del turno:', error);
        }
      }

      // Limpiar carrito y resetear valores
      setCart([]);
      setCashAmount(0);
      setPaymentMethod('cash');
      setSelectedProduct('');
      setQuantity(1);
      setSearchTerm('');
      setShowProductDropdown(false);

      // Mensaje de éxito según método de pago
      const methodNames = {
        cash: 'Efectivo',
        card: 'Tarjeta de Crédito',
        transfer: 'Transferencia',
        debit: 'Débito'
      };

      toast.success(`Venta completada exitosamente - ${methodNames[paymentMethod] || 'Otro método'}`);
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

  // Función para generar reporte diario
  const generateDailyReport = (sales) => {
    const report = {
      totalSales: 0,
      cashTotal: 0,
      cardTotal: 0,
      transferTotal: 0,
      debitTotal: 0,
      totalTransactions: sales.length,
      cashTransactions: 0,
      cardTransactions: 0,
      transferTransactions: 0,
      debitTransactions: 0
    };

    sales.forEach(sale => {
      report.totalSales += sale.total;
      
      switch (sale.paymentMethod) {
        case 'cash':
          report.cashTotal += sale.total;
          report.cashTransactions++;
          break;
        case 'card':
          report.cardTotal += sale.total;
          report.cardTransactions++;
          break;
        case 'transfer':
          report.transferTotal += sale.total;
          report.transferTransactions++;
          break;
        case 'debit':
          report.debitTotal += sale.total;
          report.debitTransactions++;
          break;
        default:
          report.cashTotal += sale.total;
          report.cashTransactions++;
      }
    });

    return report;
  };

  // Función para cerrar turno con reporte
  const closeShiftWithReport = async () => {
    if (!currentShift) {
      toast.error('No hay turno activo');
      return;
    }

    try {
      // Generar reporte del turno actual
      const shiftReport = generateDailyReport(shiftSales);
      setDailyReport(shiftReport);
      
      // Si es el turno tarde, mostrar reporte diario completo
      if (currentShift.type === 'afternoon') {
        // Obtener todas las ventas del día
        const todaySales = sales.filter(sale => {
          const saleDate = new Date(sale.date);
          const today = new Date();
          return saleDate.toDateString() === today.toDateString();
        });
        
        const dailyReportData = generateDailyReport(todaySales);
        setDailyReport(dailyReportData);
        setShowDailyReport(true);
      }

      // Cerrar turno
      await closeCashRegister();
      
      toast.success('Turno cerrado exitosamente');
    } catch (error) {
      console.error('Error cerrando turno:', error);
      toast.error('Error al cerrar el turno');
    }
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
                  className={`relative overflow-hidden rounded-3xl p-6 border-2 transition-all duration-300 transform hover:scale-105 hover:shadow-xl ${
                    shift === 'morning' 
                      ? 'bg-gradient-to-br from-orange-50 to-yellow-50 border-orange-200 hover:border-orange-300 hover:from-orange-100 hover:to-yellow-100' 
                      : 'bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200 hover:border-blue-300 hover:from-blue-100 hover:to-purple-100'
                  }`}
                >
                  <div className={`absolute top-0 right-0 w-20 h-20 opacity-10 ${
                    shift === 'morning' ? 'bg-orange-400' : 'bg-blue-400'
                  } rounded-full -translate-y-10 translate-x-10`}></div>
                  <div className="relative z-10 text-center">
                    <div className={`p-4 rounded-2xl w-16 h-16 mx-auto mb-4 flex items-center justify-center ${
                      shift === 'morning' 
                        ? 'bg-orange-100 text-orange-600' 
                        : 'bg-blue-100 text-blue-600'
                    }`}>
                      <Clock className="h-8 w-8" />
                    </div>
                    <h3 className={`text-xl font-bold mb-2 ${
                      shift === 'morning' ? 'text-orange-800' : 'text-blue-800'
                    }`}>
                      {getShiftName(shift)}
                    </h3>
                    <p className={`text-sm font-medium ${
                      shift === 'morning' ? 'text-orange-600' : 'text-blue-600'
                    }`}>
                      {getShiftTime(shift)}
                    </p>
                    <div className={`mt-3 text-xs px-3 py-1 rounded-full ${
                      shift === 'morning' 
                        ? 'bg-orange-200 text-orange-700' 
                        : 'bg-blue-200 text-blue-700'
                    }`}>
                      Toca para abrir
                    </div>
                  </div>
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
                  onClick={closeShiftWithReport}
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
                    <span>Tarjeta Crédito</span>
                  </button>
                  <button
                    onClick={() => setPaymentMethod('transfer')}
                    className={`payment-method-card ${paymentMethod === 'transfer' ? 'selected' : ''}`}
                  >
                    <Banknote className="h-6 w-6" />
                    <span>Transferencia</span>
                  </button>
                  <button
                    onClick={() => setPaymentMethod('debit')}
                    className={`payment-method-card ${paymentMethod === 'debit' ? 'selected' : ''}`}
                  >
                    <Smartphone className="h-6 w-6" />
                    <span>Débito</span>
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

                {paymentMethod !== 'cash' && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-sm text-blue-800">
                      <strong>Método:</strong> {
                        paymentMethod === 'card' ? 'Tarjeta de Crédito' :
                        paymentMethod === 'transfer' ? 'Transferencia' :
                        paymentMethod === 'debit' ? 'Débito' : 'Otro'
                      }
                    </p>
                    <p className="text-xs text-blue-600 mt-1">
                      El monto se registrará en la caja correspondiente
                    </p>
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
                          {sale.paymentMethod === 'cash' ? 'Efectivo' : 
                           sale.paymentMethod === 'card' ? 'Tarjeta Crédito' :
                           sale.paymentMethod === 'transfer' ? 'Transferencia' :
                           sale.paymentMethod === 'debit' ? 'Débito' : 'Otro'}
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

      {/* Modal de Reporte Diario */}
      {showDailyReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Reporte Diario</h3>
              <button
                onClick={() => setShowDailyReport(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="space-y-6">
              {/* Resumen General */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="text-lg font-semibold text-blue-900 mb-3">Resumen del Día</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-blue-700">Total de Ventas</p>
                    <p className="text-2xl font-bold text-blue-900">${dailyReport.totalSales.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-blue-700">Total de Transacciones</p>
                    <p className="text-2xl font-bold text-blue-900">{dailyReport.totalTransactions}</p>
                  </div>
                </div>
              </div>

              {/* Desglose por Método de Pago */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-900">Desglose por Método de Pago</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Efectivo */}
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <DollarSign className="h-5 w-5 text-green-600" />
                        <span className="font-semibold text-green-900">Efectivo</span>
                      </div>
                      <span className="text-sm text-green-600">{dailyReport.cashTransactions} trans.</span>
                    </div>
                    <p className="text-2xl font-bold text-green-900">${dailyReport.cashTotal.toLocaleString()}</p>
                    <p className="text-xs text-green-600 mt-1">Para arqueo de caja</p>
                  </div>

                  {/* Tarjeta de Crédito */}
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <CreditCard className="h-5 w-5 text-purple-600" />
                        <span className="font-semibold text-purple-900">Tarjeta Crédito</span>
                      </div>
                      <span className="text-sm text-purple-600">{dailyReport.cardTransactions} trans.</span>
                    </div>
                    <p className="text-2xl font-bold text-purple-900">${dailyReport.cardTotal.toLocaleString()}</p>
                  </div>

                  {/* Transferencia */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <Banknote className="h-5 w-5 text-blue-600" />
                        <span className="font-semibold text-blue-900">Transferencia</span>
                      </div>
                      <span className="text-sm text-blue-600">{dailyReport.transferTransactions} trans.</span>
                    </div>
                    <p className="text-2xl font-bold text-blue-900">${dailyReport.transferTotal.toLocaleString()}</p>
                  </div>

                  {/* Débito */}
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <Smartphone className="h-5 w-5 text-orange-600" />
                        <span className="font-semibold text-orange-900">Débito</span>
                      </div>
                      <span className="text-sm text-orange-600">{dailyReport.debitTransactions} trans.</span>
                    </div>
                    <p className="text-2xl font-bold text-orange-900">${dailyReport.debitTotal.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              {/* Arqueo de Caja */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="text-lg font-semibold text-yellow-900 mb-3">Arqueo de Caja</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-yellow-700">Total en Efectivo:</span>
                    <span className="font-bold text-yellow-900">${dailyReport.cashTotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-yellow-700">Transacciones en Efectivo:</span>
                    <span className="font-bold text-yellow-900">{dailyReport.cashTransactions}</span>
                  </div>
                  <div className="border-t border-yellow-200 pt-2 mt-2">
                    <p className="text-sm text-yellow-600">
                      <strong>Importante:</strong> Este es el monto que debe estar físicamente en la caja al final del día.
                    </p>
                  </div>
                </div>
              </div>

              {/* Botones de Acción */}
              <div className="flex space-x-3 pt-4">
                <button
                  onClick={() => setShowDailyReport(false)}
                  className="flex-1 btn btn-secondary"
                >
                  Cerrar
                </button>
                <button
                  onClick={() => {
                    // Aquí se podría implementar la impresión del reporte
                    toast.success('Reporte guardado');
                    setShowDailyReport(false);
                  }}
                  className="flex-1 btn btn-primary"
                >
                  Guardar Reporte
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Fecha para Turno Mañana */}
      {showDateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-sm max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Fecha para el Turno Mañana</h3>
              <button
                onClick={() => setShowDateModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Por favor, selecciona la fecha para el turno mañana.
            </p>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="form-input mb-4"
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowDateModal(false)}
                className="btn btn-secondary"
              >
                Cancelar
              </button>
              <button
                onClick={handleDateSubmit}
                className="btn btn-primary"
              >
                Aceptar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CashRegister; 