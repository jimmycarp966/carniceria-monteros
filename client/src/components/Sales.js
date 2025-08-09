import React, { useState, useEffect } from 'react';
import { ShoppingCart, Plus, Minus, Trash2, DollarSign, Calendar, Receipt } from 'lucide-react';
import toast from 'react-hot-toast';
import { saleService, productService, loadSampleData } from '../services/firebaseService';
import { dataSyncService } from '../services/realtimeService';
import ErrorBoundary from './ErrorBoundary';

const Sales = () => {
  const [cart, setCart] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [sales, setSales] = useState([]);
  const [showSalesHistory, setShowSalesHistory] = useState(false);
  const [allProducts, setAllProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Cargar productos y ventas desde Firebase
  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      try {
        console.log('🔄 Cargando datos en componente Sales...');
        
        // Intentar cargar datos simulados si Firebase está vacío
        await loadSampleData();
        
        // Cargar productos desde Firebase
        const productsFromFirebase = await productService.getAllProducts();
        console.log('📦 Productos cargados en Sales:', productsFromFirebase.length);
        if (!isMounted) return;
        setAllProducts(Array.isArray(productsFromFirebase) ? productsFromFirebase : []);
        
        // Cargar ventas desde Firebase
        const salesFromFirebase = await saleService.getAllSales();
        console.log('💰 Ventas cargadas en Sales:', salesFromFirebase.length);
        if (!isMounted) return;
        setSales(Array.isArray(salesFromFirebase) ? salesFromFirebase : []);
        setHasError(false);
      } catch (error) {
        console.error('❌ Error cargando datos en Sales:', error);
        if (!isMounted) return;
        setHasError(true);
      } finally {
        if (!isMounted) return;
        setIsLoading(false);
      }
    };
    // Pequeño timeout para evitar sensación de congelado
    const id = setTimeout(loadData, 50);
    return () => { isMounted = false; clearTimeout(id); };
  }, []);

  const retryLoad = () => {
    setIsLoading(true);
    setHasError(false);
    // Re-disparar efecto
    (async () => {
      try {
        await loadSampleData();
        const prods = await productService.getAllProducts();
        const s = await saleService.getAllSales();
        setAllProducts(Array.isArray(prods) ? prods : []);
        setSales(Array.isArray(s) ? s : []);
      } catch (e) {
        console.error(e);
        setHasError(true);
      } finally {
        setIsLoading(false);
      }
    })();
  };

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

      // Sincronizar venta para que actualice inventario y realtime
      const payload = { ...saleData };
      // Evitar enviar shiftId undefined a Firestore
      if (payload.shiftId === undefined) delete payload.shiftId;
      const saleId = await dataSyncService.syncSale(payload);
      console.log('✅ Venta agregada a Firebase con ID:', saleId);

      // Actualizar estado local
      const saleWithId = { ...saleData, id: saleId };
      setSales([saleWithId, ...sales]);
      setCart([]);
      toast.success('Venta completada exitosamente');
    } catch (error) {
      console.error('❌ Error completando venta desde Sales:', error);
      toast.error('Error al completar la venta');
    }
  };

  const stats = {
    totalSales: sales.length,
    totalRevenue: sales.reduce((sum, sale) => sum + sale.total, 0),
    averageSale: sales.length > 0 ? sales.reduce((sum, sale) => sum + sale.total, 0) / sales.length : 0,
    todaySales: sales.filter(sale => {
      const today = new Date().toDateString();
      const saleDate = new Date(sale.date).toDateString();
      return today === saleDate;
    }).length
  };

  return (
    <ErrorBoundary>
      <div className="p-4 lg:p-6 space-y-4">
      {isLoading && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-gray-600">Cargando ventas...</div>
      )}
      {(!isLoading && hasError) && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-yellow-800 flex items-center justify-between">
          <span>Hubo un problema cargando los datos. Intentá nuevamente.</span>
          <button onClick={retryLoad} className="btn btn-secondary">Reintentar</button>
        </div>
      )}
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Ventas</h1>
          <p className="mt-2 text-gray-600">Gestiona las ventas y el carrito de compras</p>
        </div>
        <div className="flex space-x-2 w-full sm:w-auto">
          <button
            onClick={() => setShowSalesHistory(!showSalesHistory)}
            className="btn btn-secondary flex items-center justify-center flex-1 sm:flex-none"
          >
            <Calendar className="h-4 w-4 mr-2" />
            Historial
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 lg:p-6">
          <div className="flex items-center">
            <ShoppingCart className="h-6 w-6 text-primary-600" />
            <div className="ml-3">
              <p className="text-xs lg:text-sm font-medium text-gray-500">Ventas Hoy</p>
              <p className="text-lg lg:text-2xl font-bold text-gray-900">{stats.todaySales}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 lg:p-6">
          <div className="flex items-center">
            <Receipt className="h-6 w-6 text-green-600" />
            <div className="ml-3">
              <p className="text-xs lg:text-sm font-medium text-gray-500">Total Ventas</p>
              <p className="text-lg lg:text-2xl font-bold text-gray-900">{stats.totalSales}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 lg:p-6">
          <div className="flex items-center">
            <DollarSign className="h-6 w-6 text-blue-600" />
            <div className="ml-3">
              <p className="text-xs lg:text-sm font-medium text-gray-500">Ingresos</p>
              <p className="text-lg lg:text-2xl font-bold text-gray-900">
                ${(stats.totalRevenue / 1000).toFixed(0)}k
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 lg:p-6">
          <div className="flex items-center">
            <DollarSign className="h-6 w-6 text-purple-600" />
            <div className="ml-3">
              <p className="text-xs lg:text-sm font-medium text-gray-500">Promedio</p>
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
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Historial de Ventas</h3>
          {sales.length === 0 ? (
            <div className="text-center py-8">
              <Receipt className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No hay ventas registradas</p>
            </div>
          ) : (
            <div className="space-y-4">
              {sales.map(sale => (
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
      </div>
    </ErrorBoundary>
  );
};

export default Sales; 