import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db } from '../firebase';
import { ShoppingCart, Plus, Minus, Trash2, DollarSign, Calendar, Receipt } from 'lucide-react';
import toast from 'react-hot-toast';
import { shiftService } from '../services/firebaseService';
import realtimeService, { dataSyncService } from '../services/realtimeService';
import ErrorBoundary from './ErrorBoundary';

const Sales = () => {
  const [cart, setCart] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [sales, setSales] = useState([]);
  const [filteredSales, setFilteredSales] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showSalesHistory, setShowSalesHistory] = useState(false);
  const [allProducts, setAllProducts] = useState([]);
  const [todayShifts, setTodayShifts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

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

  // Listeners directos a Firestore para productos y ventas (sin depender de servicios)
  useEffect(() => {
    try {
      const unsubProducts = onSnapshot(query(collection(db, 'products'), orderBy('name')), (snap) => {
        const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setAllProducts(Array.isArray(list) ? list : []);
      });
      const unsubSales = onSnapshot(query(collection(db, 'sales'), orderBy('createdAt', 'desc')), (snap) => {
        const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setSales(Array.isArray(list) ? list : []);
        setIsLoading(false);
      });
      return () => { try { unsubProducts(); } catch {} try { unsubSales(); } catch {} };
    } catch {}
  }, []);

  // Efecto para filtrar ventas cuando cambian las ventas o la fecha seleccionada
  useEffect(() => {
    const filtered = filterSalesByDate(sales, selectedDate);
    setFilteredSales(filtered);
  }, [sales, selectedDate]);

  // Efecto para cargar turnos cuando cambia la fecha
  useEffect(() => {
    loadShiftsForDate(selectedDate);
  }, [selectedDate]);

  // Suscribirse a actualizaciones en tiempo real (productos y ventas)
  useEffect(() => {
    const handleProducts = (data) => {
      if (Array.isArray(data.products)) setAllProducts(data.products);
    };
    const handleSales = (data) => {
      if (Array.isArray(data.sales)) {
        setSales(data.sales);
        // Filtrar automáticamente por la fecha seleccionada
        const filtered = filterSalesByDate(data.sales, selectedDate);
        setFilteredSales(filtered);
      }
    };
    const handleNewSale = (data) => {
      // Cuando se registra una nueva venta, verificar si es del día seleccionado
      if (data.saleData) {
        const saleDate = new Date(data.saleData.timestamp || Date.now());
        const targetDate = new Date(selectedDate);
        if (saleDate.toDateString() === targetDate.toDateString()) {
          // Recargar turnos para actualizar totales
          loadShiftsForDate(selectedDate);
        }
      }
    };
    try {
      realtimeService.on('products_updated', handleProducts);
      realtimeService.on('sales_updated', handleSales);
      realtimeService.on('sale_synced', handleNewSale);
    } catch {}
    return () => {
      try { realtimeService.off('products_updated', handleProducts); } catch {}
      try { realtimeService.off('sales_updated', handleSales); } catch {}
      try { realtimeService.off('sale_synced', handleNewSale); } catch {}
    };
  }, [selectedDate]);

  // Sin retry manual: onSnapshot es la fuente de verdad

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const cartItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  const addToCart = () => {
    if (!selectedProduct) {
      toast.error('Selecciona un producto');
      return;
    }
    if (quantity <= 0) {
      toast.error('La cantidad debe ser mayor a 0');
      return;
    }

    const product = allProducts.find(p => String(p.id) === String(selectedProduct));
    if (!product) return;

    const existingItem = cart.find(item => String(item.id) === String(product.id));
    if (existingItem) {
      setCart(cart.map(item => (
        String(item.id) === String(product.id)
          ? { ...item, quantity: (Number(item.quantity) || 0) + (Number(quantity) || 1) }
          : item
      )));
    } else {
      setCart([...cart, { ...product, quantity: Number(quantity) || 1 }]);
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

    try {
      console.log('🔄 Completando venta desde componente Sales...');
      
      const saleData = {
        items: cart.map(item => ({
          productId: item.id,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          subtotal: item.price * item.quantity
        })),
        total: cartTotal,
        date: new Date().toISOString(),
        customer: 'Cliente General',
        paymentMethod: 'cash' // Método de pago por defecto
      };

      // Asociar a turno activo si existe
      const activeShift = await shiftService.getActiveShift().catch(() => null);
      const payload = { ...saleData };
      if (activeShift?.id) payload.shiftId = activeShift.id;
      const saleId = await dataSyncService.syncSale(payload);
      console.log('✅ Venta agregada a Firebase con ID:', saleId);

      // Actualizar total del turno si corresponde
      if (activeShift?.id) {
        try {
          const newTotal = (Number(activeShift.total) || 0) + (Number(cartTotal) || 0);
          await shiftService.updateShiftTotal(activeShift.id, newTotal);
        } catch (e) {
          // no bloquear flujo
        }
      }

      // Actualizar estado local
      // Dejar que el onSnapshot de Firestore actualice la lista; solo limpiar carrito
      setCart([]);
      toast.success('Venta completada exitosamente');
    } catch (error) {
      console.error('❌ Error completando venta desde Sales:', error);
      toast.error('Error al completar la venta');
    }
  };

  const stats = {
    totalSales: filteredSales.length,
    totalRevenue: filteredSales.reduce((sum, sale) => sum + (sale.total || sale.finalTotal || 0), 0),
    averageSale: filteredSales.length > 0 ? filteredSales.reduce((sum, sale) => sum + (sale.total || sale.finalTotal || 0), 0) / filteredSales.length : 0,
    shiftsToday: todayShifts.length,
    activeShifts: todayShifts.filter(shift => !shift.endTime).length
  };

  return (
    <ErrorBoundary>
      <div className="p-4 lg:p-6 space-y-4">
      {isLoading && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-gray-600">Cargando ventas...</div>
      )}
      {/* Sin fallback de cache ni reintento manual */}
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Ventas</h1>
          <p className="mt-2 text-gray-600">Gestiona las ventas del día seleccionado</p>
        </div>
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto">
          {/* Selector de fecha */}
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={() => setShowSalesHistory(!showSalesHistory)}
            className="btn btn-secondary flex items-center justify-center flex-1 sm:flex-none"
          >
            <Receipt className="h-4 w-4 mr-2" />
            {showSalesHistory ? 'Ocultar' : 'Mostrar'} Historial
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 lg:p-6">
          <div className="flex items-center">
            <ShoppingCart className="h-6 w-6 text-primary-600" />
            <div className="ml-3">
              <p className="text-xs lg:text-sm font-medium text-gray-500">Ventas del Día</p>
              <p className="text-lg lg:text-2xl font-bold text-gray-900">{stats.totalSales}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 lg:p-6">
          <div className="flex items-center">
            <DollarSign className="h-6 w-6 text-green-600" />
            <div className="ml-3">
              <p className="text-xs lg:text-sm font-medium text-gray-500">Ingresos del Día</p>
              <p className="text-lg lg:text-2xl font-bold text-gray-900">
                ${stats.totalRevenue.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 lg:p-6">
          <div className="flex items-center">
            <Receipt className="h-6 w-6 text-blue-600" />
            <div className="ml-3">
              <p className="text-xs lg:text-sm font-medium text-gray-500">Turnos del Día</p>
              <p className="text-lg lg:text-2xl font-bold text-gray-900">{stats.shiftsToday}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 lg:p-6">
          <div className="flex items-center">
            <DollarSign className="h-6 w-6 text-purple-600" />
            <div className="ml-3">
              <p className="text-xs lg:text-sm font-medium text-gray-500">Promedio Venta</p>
              <p className="text-lg lg:text-2xl font-bold text-gray-900">
                ${stats.averageSale.toFixed(0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
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
                {allProducts.map(product => (
                  <option key={product.id} value={product.id}>
                 {product.name} - ${(Number(product.price) || 0).toLocaleString()}
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
              <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">El carrito está vacío</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="max-h-64 overflow-y-auto space-y-3">
                {cart.map(item => (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{item.name}</h4>
                       <p className="text-sm text-gray-500">${(Number(item.price) || 0).toLocaleString()} c/u</p>
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
                       {((Number(item.price) || 0) * (Number(item.quantity) || 0)).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="border-t pt-4">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-lg font-semibold text-gray-900">Total:</span>
                  <span className="text-2xl font-bold text-primary-600">
                    {(Number(cartTotal) || 0).toLocaleString()}
                  </span>
                </div>
                <button
                  onClick={completeSale}
                  className="w-full btn btn-primary flex items-center justify-center"
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
              <p className="text-gray-500">No hay ventas registradas para esta fecha</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredSales.map(sale => (
                <div key={sale.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3">
                    <div>
                      <h4 className="font-medium text-gray-900">
                        Venta #{sale.id}
                      </h4>
                      <p className="text-sm text-gray-500">
                        {new Date(sale.date).toLocaleDateString()} - {new Date(sale.date).toLocaleTimeString()}
                      </p>
                    </div>
                    <div className="text-right mt-2 sm:mt-0">
                      <p className="text-lg font-bold text-primary-600">
                        ${sale.total.toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-500">
                        {sale.items.length} productos
                      </p>
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

      {/* Shifts of the Day */}
      {showSalesHistory && todayShifts.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 lg:p-6">
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
                    Turno #{shift.id.slice(-8)}
                  </h4>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    shift.endTime 
                      ? 'bg-gray-100 text-gray-700' 
                      : 'bg-green-100 text-green-700'
                  }`}>
                    {shift.endTime ? 'Cerrado' : 'Activo'}
                  </span>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Empleado:</span>
                    <span className="text-gray-900">{shift.employeeName || 'No especificado'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Inicio:</span>
                    <span className="text-gray-900">
                      {shift.startTime?.toDate?.()?.toLocaleTimeString('es-ES', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      }) || 'No especificado'}
                    </span>
                  </div>
                  {shift.endTime && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Fin:</span>
                      <span className="text-gray-900">
                        {shift.endTime.toDate?.()?.toLocaleTimeString('es-ES', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        }) || 'No especificado'}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600">Ventas:</span>
                    <span className="text-gray-900">{shift.salesCount || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total:</span>
                    <span className="text-gray-900 font-medium">
                      ${(shift.totals?.overall || 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      </div>
    </ErrorBoundary>
  );
};

export default Sales; 