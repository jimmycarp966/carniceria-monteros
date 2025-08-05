import React, { useState, useEffect, useRef } from 'react';
import { 
  ShoppingCart, 
  Plus, 
  Minus, 
  Trash2, 
  CreditCard,
  Banknote,
  X,
  Check,
  Search,
  Camera,
  Calculator,
  RotateCcw,
  Percent,
  Hash as BarcodeIcon
} from 'lucide-react';
import { realtimeService, dataSyncService, notificationService } from '../services/realtimeService';
import { productService } from '../services/firebaseService';
import toast from 'react-hot-toast';

const EnhancedCashRegister = () => {
  // Estados principales
  const [cart, setCart] = useState([]);

  const [quantity, setQuantity] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [cashAmount, setCashAmount] = useState(0);
  const [isProcessingSale, setIsProcessingSale] = useState(false);
  
  // Estados para turnos
  const [currentShift] = useState(null);
  const [shiftSales, setShiftSales] = useState([]);
  const [shiftTotal, setShiftTotal] = useState(0);
  
  // Estados para búsqueda y productos
  const [searchTerm, setSearchTerm] = useState('');
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [recentProducts, setRecentProducts] = useState([]);
  
  // Estados para interfaz mejorada
  const [showNumericKeypad, setShowNumericKeypad] = useState(false);
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [showDiscountModal, setShowDiscountModal] = useState(false);

  const [selectedCustomer, setSelectedCustomer] = useState(null);
  
  // Estados para descuentos y promociones
  const [discountType, setDiscountType] = useState('percentage');
  const [discountValue, setDiscountValue] = useState(0);
  const [appliedDiscount, setAppliedDiscount] = useState(0);
  

  
  // Referencias
  const searchInputRef = useRef(null);
  const barcodeInputRef = useRef(null);

  
  // Cálculos
  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const cartItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const finalTotal = cartTotal - appliedDiscount;
  const change = cashAmount - finalTotal;

  // Inicializar listeners de tiempo real
  useEffect(() => {
    realtimeService.initializeRealtimeListeners();
    
    // Escuchar actualizaciones de productos
    realtimeService.on('products_updated', (data) => {
      setAllProducts(data.products);
      const updateFiltered = () => updateFilteredProducts(data.products);
      updateFiltered();
    });
    
    // Escuchar alertas de stock
    realtimeService.on('stock_alert', (data) => {
      setStockAlerts(data.items);
      if (data.items.length > 0) {
        toast.error(`¡Alerta! ${data.items.length} productos con stock bajo`);
      }
    });
    
    // Escuchar notificaciones
    realtimeService.on('notification_received', (notification) => {
      setRealtimeNotifications(prev => [notification, ...prev.slice(0, 9)]);
      toast.success(notification.data.message || 'Nueva notificación');
    });
    
    return () => {
      realtimeService.cleanup();
    };
  }, []);

  // Cargar productos
  useEffect(() => {
    const loadInitialProducts = async () => {
      await loadProducts();
    };
    loadInitialProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const products = await productService.getAllProducts();
      setAllProducts(products);
      updateFilteredProducts(products);
    } catch (error) {
      console.error('Error cargando productos:', error);
      toast.error('Error cargando productos');
    }
  };

  const updateFilteredProducts = (products) => {
    if (!searchTerm) {
      setFilteredProducts(products.slice(0, 10));
      return;
    }
    
    const filtered = products.filter(product =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.code?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredProducts(filtered.slice(0, 10));
  };

  // Búsqueda de productos
  const handleProductSearch = (term) => {
    setSearchTerm(term);
    updateFilteredProducts(allProducts);
    setShowProductDropdown(true);
  };

  const selectProductFromDropdown = (product) => {
    setSelectedProduct(product);
    setQuantity(1);
    setSearchTerm('');
    setShowProductDropdown(false);
    addToCart(product);
    
    // Agregar a productos recientes
    setRecentProducts(prev => {
      const filtered = prev.filter(p => p.id !== product.id);
      return [product, ...filtered.slice(0, 4)];
    });
  };

  // Agregar al carrito
  const addToCart = (product) => {
    const existingItem = cart.find(item => item.id === product.id);
    
    if (existingItem) {
      setCart(prev => prev.map(item =>
        item.id === product.id
          ? { ...item, quantity: item.quantity + quantity }
          : item
      ));
    } else {
      setCart(prev => [...prev, {
        ...product,
        quantity: quantity
      }]);
    }
    
    // Reproducir sonido de confirmación
    playSound('add');
    
    toast.success(`${product.name} agregado al carrito`);
  };

  // Remover del carrito
  const removeFromCart = (productId) => {
    setCart(prev => prev.filter(item => item.id !== productId));
    playSound('remove');
  };

  // Actualizar cantidad
  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }
    
    setCart(prev => prev.map(item =>
      item.id === productId
        ? { ...item, quantity: newQuantity }
        : item
    ));
  };

  // Aplicar descuento
  const applyDiscount = () => {
    if (discountType === 'percentage') {
      const discountAmount = (cartTotal * discountValue) / 100;
      setAppliedDiscount(discountAmount);
    } else {
      setAppliedDiscount(discountValue);
    }
    
    setShowDiscountModal(false);
    toast.success('Descuento aplicado');
  };

  // Completar venta
  const completeSale = async () => {
    if (cart.length === 0) {
      toast.error('El carrito está vacío');
      return;
    }

    if (paymentMethod === 'cash' && cashAmount < finalTotal) {
      toast.error('Monto insuficiente');
      return;
    }

    setIsProcessingSale(true);

    try {
      const saleData = {
        items: cart.map(item => ({
          productId: item.id,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          subtotal: item.price * item.quantity
        })),
        total: cartTotal,
        discount: appliedDiscount,
        finalTotal: finalTotal,
        paymentMethod: paymentMethod,
        cashAmount: cashAmount,
        change: change,
        customer: selectedCustomer,
        shiftId: currentShift?.id,
        timestamp: new Date().toISOString()
      };

      // Sincronizar venta
      const saleId = await dataSyncService.syncSale(saleData);
      
      // Notificar venta completada
      await notificationService.notifySaleCompleted({
        saleId,
        total: finalTotal,
        items: saleData.items.length
      });

      // Limpiar carrito
      setCart([]);
      setAppliedDiscount(0);
      setCashAmount(0);
      setSelectedCustomer(null);
      
      // Actualizar estadísticas del turno
      if (currentShift) {
        setShiftSales(prev => [...prev, saleData]);
        setShiftTotal(prev => prev + finalTotal);
      }

      playSound('sale');
      toast.success(`Venta completada - $${finalTotal.toLocaleString()}`);
      
      // Imprimir ticket (simulado)
      printReceipt(saleData);
      
    } catch (error) {
      console.error('Error completando venta:', error);
      toast.error('Error procesando venta');
    } finally {
      setIsProcessingSale(false);
    }
  };

  // Escáner de códigos de barras
  const handleBarcodeScan = (barcode) => {
    const product = allProducts.find(p => p.code === barcode);
    if (product) {
      selectProductFromDropdown(product);
      setShowBarcodeScanner(false);
    } else {
      toast.error('Producto no encontrado');
    }
  };

  // Teclado numérico virtual
  const handleNumericInput = (value) => {
    if (showNumericKeypad) {
      setCashAmount(prev => {
        const newValue = prev * 10 + value;
        return newValue > 999999 ? prev : newValue;
      });
    }
  };

  const handleNumericClear = () => {
    setCashAmount(0);
  };

  const handleNumericDelete = () => {
    setCashAmount(prev => Math.floor(prev / 10));
  };

  // Sonidos
  const playSound = (type) => {
    // Simular sonidos (en producción usar Web Audio API)
    console.log(`🔊 Reproduciendo sonido: ${type}`);
  };

  // Imprimir ticket
  const printReceipt = (saleData) => {
    const receipt = `
      ================================
      CARNICERÍA MONTEROS
      ================================
      Fecha: ${new Date().toLocaleString()}
      Ticket: ${saleData.saleId || 'PENDIENTE'}
      ================================
      ${saleData.items.map(item => 
        `${item.name}
         ${item.quantity} x $${item.price} = $${item.subtotal}`
      ).join('\n')}
      ================================
      Subtotal: $${saleData.total}
      Descuento: $${saleData.discount}
      Total: $${saleData.finalTotal}
      ================================
      Pago: ${saleData.paymentMethod}
      ${saleData.paymentMethod === 'cash' ? 
        `Efectivo: $${saleData.cashAmount}
         Cambio: $${saleData.change}` : ''
      }
      ================================
      ¡Gracias por su compra!
    `;
    
    console.log('🖨️ Imprimiendo ticket:', receipt);
    // En producción, usar API de impresión
  };

  // Componente de teclado numérico
  const NumericKeypad = () => (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 w-80 max-w-sm">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Teclado Numérico</h3>
          <button
            onClick={() => setShowNumericKeypad(false)}
            className="p-2 hover:bg-gray-100 rounded-xl"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="mb-4">
          <div className="text-2xl font-bold text-center p-4 bg-gray-50 rounded-xl">
            ${cashAmount.toLocaleString()}
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-2">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
            <button
              key={num}
              onClick={() => handleNumericInput(num)}
              className="p-4 text-xl font-semibold bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
            >
              {num}
            </button>
          ))}
          <button
            onClick={handleNumericClear}
            className="p-4 text-sm font-semibold bg-red-100 hover:bg-red-200 text-red-600 rounded-xl transition-colors"
          >
            C
          </button>
          <button
            onClick={() => handleNumericInput(0)}
            className="p-4 text-xl font-semibold bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
          >
            0
          </button>
          <button
            onClick={handleNumericDelete}
            className="p-4 text-sm font-semibold bg-yellow-100 hover:bg-yellow-200 text-yellow-600 rounded-xl transition-colors"
          >
            ←
          </button>
        </div>
        
        <button
          onClick={() => setShowNumericKeypad(false)}
          className="w-full mt-4 p-3 bg-green-500 text-white font-semibold rounded-xl hover:bg-green-600 transition-colors"
        >
          Confirmar
        </button>
      </div>
    </div>
  );

  // Componente de escáner de códigos
  const BarcodeScanner = () => (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 w-96 max-w-sm">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Escanear Código</h3>
          <button
            onClick={() => setShowBarcodeScanner(false)}
            className="p-2 hover:bg-gray-100 rounded-xl"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="mb-4">
          <input
            ref={barcodeInputRef}
            type="text"
            placeholder="Ingrese código de barras..."
            className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleBarcodeScan(e.target.value);
              }
            }}
            autoFocus
          />
        </div>
        
        <div className="text-center text-gray-600 mb-4">
          <BarcodeIcon className="h-12 w-12 mx-auto mb-2 text-gray-400" />
          <p>Escaneé el código de barras o ingréselo manualmente</p>
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => barcodeInputRef.current?.focus()}
            className="p-3 bg-blue-500 text-white font-semibold rounded-xl hover:bg-blue-600 transition-colors"
          >
            <Camera className="h-5 w-5 inline mr-2" />
            Escanear
          </button>
          <button
            onClick={() => setShowBarcodeScanner(false)}
            className="p-3 bg-gray-500 text-white font-semibold rounded-xl hover:bg-gray-600 transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-4 lg:p-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Panel Principal - Carrito y Productos */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Header con estadísticas */}
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-800">Caja Registradora</h2>
              <div className="flex items-center space-x-2">
                <div className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                  {realtimeService.getSyncState().isOnline ? '🟢 En línea' : '🔴 Offline'}
                </div>
                <button
                  onClick={() => setShowBarcodeScanner(true)}
                  className="p-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors"
                >
                  <BarcodeIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">${shiftTotal.toLocaleString()}</div>
                <div className="text-sm text-gray-600">Total Turno</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{shiftSales.length}</div>
                <div className="text-sm text-gray-600">Ventas</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{cartItems}</div>
                <div className="text-sm text-gray-600">En Carrito</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">${finalTotal.toLocaleString()}</div>
                <div className="text-sm text-gray-600">Total Actual</div>
              </div>
            </div>
          </div>

          {/* Búsqueda de productos */}
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Buscar productos..."
                value={searchTerm}
                onChange={(e) => handleProductSearch(e.target.value)}
                onFocus={() => setShowProductDropdown(true)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
            
            {/* Dropdown de productos */}
            {showProductDropdown && filteredProducts.length > 0 && (
              <div className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                {filteredProducts.map(product => (
                  <button
                    key={product.id}
                    onClick={() => selectProductFromDropdown(product)}
                    className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 flex items-center justify-between"
                  >
                    <div>
                      <div className="font-medium text-gray-900">{product.name}</div>
                      <div className="text-sm text-gray-600">${product.price}</div>
                    </div>
                    <div className="text-sm text-gray-500">
                      Stock: {product.stock || 0}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Productos recientes */}
          {recentProducts.length > 0 && (
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <h3 className="text-lg font-semibold mb-4">Productos Recientes</h3>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {recentProducts.map(product => (
                  <button
                    key={product.id}
                    onClick={() => selectProductFromDropdown(product)}
                    className="p-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-left"
                  >
                    <div className="font-medium text-sm">{product.name}</div>
                    <div className="text-green-600 font-semibold">${product.price}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Carrito */}
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Carrito de Compras</h3>
              <button
                onClick={() => setCart([])}
                className="text-red-500 hover:text-red-700 text-sm font-medium"
              >
                Vaciar
              </button>
            </div>
            
            {cart.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <ShoppingCart className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                <p>El carrito está vacío</p>
                <p className="text-sm">Busque productos para comenzar</p>
              </div>
            ) : (
              <div className="space-y-3">
                {cart.map(item => (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <div className="flex-1">
                      <div className="font-medium">{item.name}</div>
                      <div className="text-sm text-gray-600">${item.price} c/u</div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="p-1 hover:bg-red-100 rounded"
                      >
                        <Minus className="h-4 w-4 text-red-500" />
                      </button>
                      <span className="font-semibold min-w-[2rem] text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="p-1 hover:bg-green-100 rounded"
                      >
                        <Plus className="h-4 w-4 text-green-500" />
                      </button>
                      <div className="text-right min-w-[4rem]">
                        <div className="font-semibold">${(item.price * item.quantity).toLocaleString()}</div>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="p-1 hover:bg-red-100 rounded ml-2"
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Panel Lateral - Pago y Controles */}
        <div className="space-y-6">
          
          {/* Resumen de compra */}
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <h3 className="text-lg font-semibold mb-4">Resumen de Compra</h3>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>${cartTotal.toLocaleString()}</span>
              </div>
              
              {appliedDiscount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Descuento:</span>
                  <span>-${appliedDiscount.toLocaleString()}</span>
                </div>
              )}
              
              <div className="border-t pt-3">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total:</span>
                  <span>${finalTotal.toLocaleString()}</span>
                </div>
              </div>
            </div>
            
            {/* Descuento */}
            <div className="mt-4">
              <button
                onClick={() => setShowDiscountModal(true)}
                className="w-full p-3 bg-orange-500 text-white font-semibold rounded-xl hover:bg-orange-600 transition-colors"
              >
                <Percent className="h-4 w-4 inline mr-2" />
                Aplicar Descuento
              </button>
            </div>
          </div>

          {/* Método de pago */}
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <h3 className="text-lg font-semibold mb-4">Método de Pago</h3>
            
            <div className="space-y-3">
              {[
                { id: 'cash', label: 'Efectivo', icon: Banknote },
                { id: 'card', label: 'Tarjeta', icon: CreditCard },
                { id: 'transfer', label: 'Transferencia', icon: Smartphone },
                { id: 'debit', label: 'Débito', icon: CreditCard }
              ].map(method => (
                <button
                  key={method.id}
                  onClick={() => setPaymentMethod(method.id)}
                  className={`w-full p-3 rounded-xl border-2 transition-colors flex items-center ${
                    paymentMethod === method.id
                      ? 'border-orange-500 bg-orange-50 text-orange-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <method.icon className="h-5 w-5 mr-3" />
                  {method.label}
                </button>
              ))}
            </div>
            
            {/* Efectivo recibido */}
            {paymentMethod === 'cash' && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Efectivo Recibido
                </label>
                <div className="flex space-x-2">
                  <input
                    type="number"
                    value={cashAmount}
                    onChange={(e) => setCashAmount(Number(e.target.value))}
                    className="flex-1 p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="0"
                  />
                  <button
                    onClick={() => setShowNumericKeypad(true)}
                    className="p-3 bg-gray-500 text-white rounded-xl hover:bg-gray-600 transition-colors"
                  >
                    <Calculator className="h-5 w-5" />
                  </button>
                </div>
                
                {cashAmount > 0 && (
                  <div className="mt-2 text-sm">
                    <div className="flex justify-between">
                      <span>Cambio:</span>
                      <span className={change >= 0 ? 'text-green-600' : 'text-red-600'}>
                        ${change.toLocaleString()}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Botones de acción */}
          <div className="space-y-3">
            <button
              onClick={completeSale}
              disabled={isProcessingSale || cart.length === 0 || (paymentMethod === 'cash' && cashAmount < finalTotal)}
              className="w-full p-4 bg-green-500 text-white font-semibold rounded-xl hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
            >
              {isProcessingSale ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Procesando...
                </>
              ) : (
                <>
                  <Check className="h-5 w-5 mr-2" />
                  Completar Venta
                </>
              )}
            </button>
            
            <button
              onClick={() => setCart([])}
              className="w-full p-3 bg-gray-500 text-white font-semibold rounded-xl hover:bg-gray-600 transition-colors"
            >
              <RotateCcw className="h-5 w-5 inline mr-2" />
              Cancelar
            </button>
          </div>
        </div>
      </div>

      {/* Modales */}
      {showNumericKeypad && <NumericKeypad />}
      {showBarcodeScanner && <BarcodeScanner />}
      
      {/* Modal de descuento */}
      {showDiscountModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-80 max-w-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Aplicar Descuento</h3>
              <button
                onClick={() => setShowDiscountModal(false)}
                className="p-2 hover:bg-gray-100 rounded-xl"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Descuento
                </label>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setDiscountType('percentage')}
                    className={`flex-1 p-3 rounded-xl border-2 ${
                      discountType === 'percentage'
                        ? 'border-orange-500 bg-orange-50 text-orange-700'
                        : 'border-gray-200'
                    }`}
                  >
                    Porcentaje
                  </button>
                  <button
                    onClick={() => setDiscountType('amount')}
                    className={`flex-1 p-3 rounded-xl border-2 ${
                      discountType === 'amount'
                        ? 'border-orange-500 bg-orange-50 text-orange-700'
                        : 'border-gray-200'
                    }`}
                  >
                    Monto
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Valor del Descuento
                </label>
                <input
                  type="number"
                  value={discountValue}
                  onChange={(e) => setDiscountValue(Number(e.target.value))}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder={discountType === 'percentage' ? '10' : '1000'}
                />
              </div>
              
              <div className="flex space-x-2">
                <button
                  onClick={applyDiscount}
                  className="flex-1 p-3 bg-green-500 text-white font-semibold rounded-xl hover:bg-green-600 transition-colors"
                >
                  Aplicar
                </button>
                <button
                  onClick={() => setShowDiscountModal(false)}
                  className="flex-1 p-3 bg-gray-500 text-white font-semibold rounded-xl hover:bg-gray-600 transition-colors"
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

export default EnhancedCashRegister; 