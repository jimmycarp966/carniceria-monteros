import React, { useState, useEffect } from 'react';
import { 
  Search,
  CreditCard,
  Banknote,
  Calculator,
  Clock,
  Receipt,
  Check,
  X,
  AlertTriangle,
  RotateCcw,
  User,
  Shield
} from 'lucide-react';
import realtimeService from '../services/realtimeService';
import { productService, shiftService } from '../services/firebaseService';
import ShiftManagement from './ShiftManagement';
import CashRegisterAccessGuard from './CashRegisterAccessGuard';
import { useCashRegisterAccess } from '../hooks/useCashRegisterAccess';
import toast from 'react-hot-toast';

const SimpleCashRegister = () => {
  // Hook de control de acceso
  const { 
    currentUser, 
    userRole, 
    canOpenShift, 
    canCloseShift 
  } = useCashRegisterAccess();

  // Estados principales de la venta actual
  const [currentSale, setCurrentSale] = useState({
    products: [],
    subtotal: 0,
    total: 0
  });
  
  // Estados de interface
  const [searchTerm, setSearchTerm] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [cashAmount, setCashAmount] = useState(0);
  const [showNumericKeypad, setShowNumericKeypad] = useState(false);
  const [isProcessingSale, setIsProcessingSale] = useState(false);
  
  // Estados de productos
  const [allProducts, setAllProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  
  // Estados de turnos
  const [currentShift, setCurrentShift] = useState(null);
  const [shiftTotal, setShiftTotal] = useState(0);
  const [showShiftManagement, setShowShiftManagement] = useState(false);
  
  // Estados de cliente
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  // Cargar productos al inicio
  useEffect(() => {
    const initData = async () => {
      try {
        const products = await productService.getAllProducts();
        setAllProducts(products);
      } catch (error) {
        console.error('Error cargando productos:', error);
        toast.error('Error cargando productos');
      }
    };

    const initShift = async () => {
      try {
        const shifts = await shiftService.getAllShifts();
        const openShift = shifts.find(shift => !shift.endTime);
        
        if (openShift) {
          setCurrentShift(openShift);
          setShiftTotal(openShift.totalSales || 0);
        }
      } catch (error) {
        console.error('Error cargando turno:', error);
      }
    };

    const setupListeners = () => {
      // Listeners de tiempo real
      realtimeService.on('sales_updated', (data) => {
        if (data.sales && currentShift) {
          const shiftSalesUpdated = data.sales.filter(sale => 
            sale.shiftId === currentShift.id
          );
          setShiftTotal(shiftSalesUpdated.reduce((sum, sale) => sum + sale.total, 0));
        }
      });

      realtimeService.on('shifts_updated', (data) => {
        if (data.shifts) {
          const openShift = data.shifts.find(shift => !shift.endTime);
          setCurrentShift(openShift);
        }
      });
    };

    initData();
    initShift();
    setupListeners();
    
    return () => {
      realtimeService.off('sales_updated');
      realtimeService.off('shifts_updated');
    };
  }, [currentShift]);

  const loadCurrentShift = async () => {
    try {
      const shifts = await shiftService.getAllShifts();
      const openShift = shifts.find(shift => !shift.endTime);
      
      if (openShift) {
        setCurrentShift(openShift);
        setShiftTotal(openShift.totalSales || 0);
      }
    } catch (error) {
      console.error('Error cargando turno:', error);
    }
  };

  // Búsqueda de productos
  const handleSearchChange = (e) => {
    const term = e.target.value;
    setSearchTerm(term);
    
    if (term.length >= 2) {
      const filtered = allProducts.filter(product =>
        product.name.toLowerCase().includes(term.toLowerCase()) ||
        product.code?.toLowerCase().includes(term.toLowerCase()) ||
        product.barcode?.includes(term)
      ).slice(0, 10);
      
      setFilteredProducts(filtered);
      setShowProductDropdown(true);
    } else {
      setShowProductDropdown(false);
    }
  };

  // Seleccionar producto para la venta
  const selectProduct = (product) => {
    setSelectedProduct(product);
    setSearchTerm(product.name);
    setShowProductDropdown(false);
    setQuantity(1);
  };

  // Agregar producto a la venta actual
  const addProductToSale = () => {
    if (!selectedProduct || !quantity || quantity <= 0) {
      toast.error('Selecciona un producto y cantidad válida');
      return;
    }

    if (selectedProduct.stock < quantity) {
      toast.error('Stock insuficiente');
      return;
    }

    const productInSale = {
      id: selectedProduct.id,
      name: selectedProduct.name,
      price: selectedProduct.price,
      quantity: quantity,
      subtotal: selectedProduct.price * quantity,
      code: selectedProduct.code,
      originalStock: selectedProduct.stock
    };

    const newProducts = [...currentSale.products];
    const existingIndex = newProducts.findIndex(p => p.id === selectedProduct.id);
    
    if (existingIndex >= 0) {
      // Producto ya existe, actualizar cantidad
      newProducts[existingIndex].quantity += quantity;
      newProducts[existingIndex].subtotal = newProducts[existingIndex].price * newProducts[existingIndex].quantity;
    } else {
      // Nuevo producto
      newProducts.push(productInSale);
    }

    const subtotal = newProducts.reduce((sum, p) => sum + p.subtotal, 0);
    
    setCurrentSale({
      products: newProducts,
      subtotal: subtotal,
      total: subtotal
    });

    // Limpiar selección
    setSelectedProduct(null);
    setSearchTerm('');
    setQuantity(1);
    
    toast.success(`${quantity} x ${productInSale.name} agregado`);
  };

  // Eliminar producto de la venta
  const removeProductFromSale = (productId) => {
    const newProducts = currentSale.products.filter(p => p.id !== productId);
    const subtotal = newProducts.reduce((sum, p) => sum + p.subtotal, 0);
    
    setCurrentSale({
      products: newProducts,
      subtotal: subtotal,
      total: subtotal
    });
  };

  // Actualizar cantidad de producto en la venta
  const updateProductQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      removeProductFromSale(productId);
      return;
    }

    const newProducts = currentSale.products.map(p => {
      if (p.id === productId) {
        if (newQuantity > p.originalStock) {
          toast.error('Stock insuficiente');
          return p;
        }
        return {
          ...p,
          quantity: newQuantity,
          subtotal: p.price * newQuantity
        };
      }
      return p;
    });

    const subtotal = newProducts.reduce((sum, p) => sum + p.subtotal, 0);
    
    setCurrentSale({
      products: newProducts,
      subtotal: subtotal,
      total: subtotal
    });
  };

  // Procesar venta
  const processSale = async () => {
    if (!currentShift) {
      toast.error('Debe abrir un turno primero');
      setShowShiftManagement(true);
      return;
    }

    if (currentSale.products.length === 0) {
      toast.error('Agregue productos a la venta');
      return;
    }

    if (paymentMethod === 'cash' && cashAmount < currentSale.total) {
      toast.error('Monto en efectivo insuficiente');
      return;
    }

    setIsProcessingSale(true);
    
    try {
      const saleData = {
        products: currentSale.products,
        subtotal: currentSale.subtotal,
        total: currentSale.total,
        paymentMethod,
        cashAmount: paymentMethod === 'cash' ? cashAmount : currentSale.total,
        change: paymentMethod === 'cash' ? (cashAmount - currentSale.total) : 0,
        shiftId: currentShift.id,
        customerId: selectedCustomer?.id,
        timestamp: new Date(),
        // Información del empleado que procesa la venta
        employeeId: currentUser?.employeeId || currentUser?.id,
        employeeName: currentUser?.name,
        employeeEmail: currentUser?.email,
        employeeRole: currentUser?.role,
        processedBy: {
          id: currentUser?.id,
          name: currentUser?.name,
          email: currentUser?.email,
          role: currentUser?.role,
          position: currentUser?.position
        }
      };

      // Sincronizar venta
      const saleId = await dataSyncService.syncSale(saleData);
      
      if (saleId) {
        toast.success('Venta procesada exitosamente');
        
        // Limpiar venta actual
        setCurrentSale({
          products: [],
          subtotal: 0,
          total: 0
        });
        setCashAmount(0);
        setSelectedCustomer(null);
        
        // Notificar venta completada
        notificationService.notifySaleCompleted(saleData);
        
        // Actualizar datos del turno
        loadCurrentShift();
        
        // Imprimir recibo
        printReceipt(saleData);
      }
    } catch (error) {
      console.error('Error procesando venta:', error);
      toast.error('Error procesando la venta');
    } finally {
      setIsProcessingSale(false);
    }
  };

  // Limpiar venta actual
  const clearSale = () => {
    setCurrentSale({
      products: [],
      subtotal: 0,
      total: 0
    });
    setCashAmount(0);
    setSelectedCustomer(null);
    setSelectedProduct(null);
    setSearchTerm('');
    setQuantity(1);
  };

  // Imprimir recibo
  const printReceipt = (saleData) => {
    // Crear ventana de impresión
    const printWindow = window.open('', '_blank');
    const receiptHtml = `
      <html>
        <head>
          <title>Recibo de Venta</title>
          <style>
            body { font-family: monospace; width: 300px; margin: 0; padding: 20px; }
            .header { text-align: center; border-bottom: 1px solid #000; padding-bottom: 10px; }
            .item { display: flex; justify-content: space-between; margin: 5px 0; }
            .total { border-top: 1px solid #000; padding-top: 10px; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>CARNICERÍA</h2>
            <p>Fecha: ${new Date().toLocaleString()}</p>
            <p>Turno: ${currentShift?.id}</p>
          </div>
          
          <div class="items">
            ${saleData.products.map(p => `
              <div class="item">
                <span>${p.quantity} x ${p.name}</span>
                <span>$${p.subtotal.toLocaleString()}</span>
              </div>
            `).join('')}
          </div>
          
          <div class="total">
            <div class="item">
              <span>TOTAL:</span>
              <span>$${saleData.total.toLocaleString()}</span>
            </div>
            <div class="item">
              <span>PAGO (${saleData.paymentMethod === 'cash' ? 'Efectivo' : 'Tarjeta'}):</span>
              <span>$${saleData.cashAmount.toLocaleString()}</span>
            </div>
            ${saleData.change > 0 ? `
              <div class="item">
                <span>CAMBIO:</span>
                <span>$${saleData.change.toLocaleString()}</span>
              </div>
            ` : ''}
          </div>
          
          <div style="text-align: center; margin-top: 20px;">
            <p>¡Gracias por su compra!</p>
          </div>
        </body>
      </html>
    `;
    
    printWindow.document.write(receiptHtml);
    printWindow.document.close();
    printWindow.print();
  };

  // Teclado numérico para montos
  const NumericKeypad = ({ onClose, value, onChange, title = "Monto" }) => {
    const handleNumericInput = (num) => {
      const currentValue = value.toString();
      const newValue = currentValue === '0' ? num.toString() : currentValue + num.toString();
      onChange(parseFloat(newValue));
    };

    const handleDelete = () => {
      const currentValue = value.toString();
      const newValue = currentValue.slice(0, -1) || '0';
      onChange(parseFloat(newValue));
    };

    const handleClear = () => {
      onChange(0);
    };

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-6 w-80 max-w-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">{title}</h3>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl">
              <X className="h-5 w-5" />
            </button>
          </div>
          
          <div className="mb-4">
            <div className="text-2xl font-bold text-center p-4 bg-gray-50 rounded-xl">
              ${value.toLocaleString()}
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
              onClick={handleClear}
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
              onClick={handleDelete}
              className="p-4 text-sm font-semibold bg-yellow-100 hover:bg-yellow-200 text-yellow-600 rounded-xl transition-colors"
            >
              ←
            </button>
          </div>
          
          <button
            onClick={onClose}
            className="w-full mt-4 bg-primary-600 text-white py-3 rounded-xl hover:bg-primary-700 transition-colors"
          >
            Confirmar
          </button>
        </div>
      </div>
    );
  };

  const calculateChange = () => {
    return paymentMethod === 'cash' ? Math.max(0, cashAmount - currentSale.total) : 0;
  };

  return (
    <CashRegisterAccessGuard>
      <div className="p-4 lg:p-6 w-full max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-3xl shadow-xl border border-gray-200 p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Caja Registradora</h1>
            <p className="text-gray-600">Sistema de ventas directo</p>
            
            {/* Información del usuario logueado */}
            {currentUser && (
              <div className="flex items-center mt-2 text-sm text-gray-500">
                <User className="h-4 w-4 mr-2" />
                <span className="font-medium">{currentUser.name}</span>
                <span className="mx-2">•</span>
                <span className="flex items-center">
                  <Shield className="h-3 w-3 mr-1" />
                  {userRole?.displayName}
                </span>
              </div>
            )}
          </div>
          
          <div className="mt-4 sm:mt-0 flex flex-col space-y-2">
            {/* Estado del turno */}
            {currentShift ? (
              <div className="flex items-center space-x-2">
                <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                  <Clock className="h-4 w-4 mr-1 inline" />
                  Turno Abierto
                </div>
                <span className="text-lg font-bold text-green-600">
                  ${shiftTotal.toLocaleString()}
                </span>
              </div>
            ) : (
              <button
                onClick={() => {
                  if (!canOpenShift) {
                    toast.error(`Su rol de ${userRole?.displayName} no puede abrir turnos`);
                    return;
                  }
                  setShowShiftManagement(true);
                }}
                disabled={!canOpenShift}
                className={`px-4 py-2 rounded-lg flex items-center ${
                  canOpenShift 
                    ? 'bg-red-600 text-white hover:bg-red-700' 
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                <AlertTriangle className="h-4 w-4 mr-2" />
                {canOpenShift ? 'Abrir Turno' : 'Sin Permisos'}
              </button>
            )}
            
            {/* Información adicional del turno */}
            {currentShift && (
              <div className="text-xs text-gray-500 text-right">
                <p>Turno: {currentShift.employeeName || currentUser?.name}</p>
                <p>Desde: {currentShift.startTime?.toDate?.()?.toLocaleTimeString() || 'N/A'}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Panel Izquierdo - Búsqueda y Selección */}
        <div className="space-y-6">
          {/* Búsqueda de Productos */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Buscar Producto</h2>
            
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                value={searchTerm}
                onChange={handleSearchChange}
                placeholder="Buscar por nombre, código o código de barras..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              
              {showProductDropdown && filteredProducts.length > 0 && (
                <div className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-xl shadow-lg z-10 max-h-60 overflow-y-auto">
                  {filteredProducts.map(product => (
                    <button
                      key={product.id}
                      onClick={() => selectProduct(product)}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium text-gray-900">{product.name}</p>
                          <p className="text-sm text-gray-500">
                            {product.code} • Stock: {product.stock}
                          </p>
                        </div>
                        <span className="text-lg font-bold text-primary-600">
                          ${product.price.toLocaleString()}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Producto Seleccionado */}
            {selectedProduct && (
              <div className="bg-gray-50 rounded-xl p-4 mb-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-bold text-gray-900">{selectedProduct.name}</h3>
                    <p className="text-sm text-gray-600">
                      Código: {selectedProduct.code} • Stock: {selectedProduct.stock}
                    </p>
                  </div>
                  <span className="text-xl font-bold text-primary-600">
                    ${selectedProduct.price.toLocaleString()}
                  </span>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <label className="text-sm font-medium text-gray-700">Cantidad:</label>
                    <input
                      type="number"
                      value={quantity}
                      onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                      min="1"
                      max={selectedProduct.stock}
                      className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-center"
                    />
                  </div>
                  
                  <button
                    onClick={addProductToSale}
                    className="flex-1 bg-primary-600 text-white py-2 px-4 rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    Agregar a Venta
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Panel Derecho - Venta Actual */}
        <div className="space-y-6">
          {/* Venta Actual */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Venta Actual</h2>
              {currentSale.products.length > 0 && (
                <button
                  onClick={clearSale}
                  className="text-red-600 hover:text-red-800 flex items-center text-sm"
                >
                  <RotateCcw className="h-4 w-4 mr-1" />
                  Limpiar
                </button>
              )}
            </div>

            {/* Lista de Productos */}
            <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
              {currentSale.products.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Receipt className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                  <p>No hay productos en la venta actual</p>
                </div>
              ) : (
                currentSale.products.map(product => (
                  <div key={product.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{product.name}</h4>
                      <p className="text-sm text-gray-600">
                        ${product.price.toLocaleString()} c/u
                      </p>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        value={product.quantity}
                        onChange={(e) => updateProductQuantity(product.id, parseInt(e.target.value) || 0)}
                        min="0"
                        max={product.originalStock}
                        className="w-16 px-2 py-1 border border-gray-300 rounded text-center text-sm"
                      />
                      
                      <span className="font-bold text-gray-900 w-20 text-right">
                        ${product.subtotal.toLocaleString()}
                      </span>
                      
                      <button
                        onClick={() => removeProductFromSale(product.id)}
                        className="text-red-600 hover:text-red-800 p-1"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Totales */}
            {currentSale.products.length > 0 && (
              <div className="border-t border-gray-200 pt-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-lg">
                    <span className="font-medium">Subtotal:</span>
                    <span>${currentSale.subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-xl font-bold text-primary-600">
                    <span>TOTAL:</span>
                    <span>${currentSale.total.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Panel de Pago */}
          {currentSale.products.length > 0 && (
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Método de Pago</h2>
              
              {/* Botones de Método de Pago */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <button
                  onClick={() => setPaymentMethod('cash')}
                  className={`p-4 rounded-xl border-2 transition-colors ${
                    paymentMethod === 'cash'
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <Banknote className="h-6 w-6 mx-auto mb-2" />
                  <span className="font-medium">Efectivo</span>
                </button>
                
                <button
                  onClick={() => setPaymentMethod('card')}
                  className={`p-4 rounded-xl border-2 transition-colors ${
                    paymentMethod === 'card'
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <CreditCard className="h-6 w-6 mx-auto mb-2" />
                  <span className="font-medium">Tarjeta</span>
                </button>
              </div>

              {/* Monto en Efectivo */}
              {paymentMethod === 'cash' && (
                <div className="mb-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <label className="text-sm font-medium text-gray-700">Monto recibido:</label>
                    <button
                      onClick={() => setShowNumericKeypad(true)}
                      className="flex items-center space-x-1 text-primary-600 hover:text-primary-800"
                    >
                      <Calculator className="h-4 w-4" />
                      <span className="text-sm">Calculadora</span>
                    </button>
                  </div>
                  
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                    <input
                      type="number"
                      value={cashAmount}
                      onChange={(e) => setCashAmount(parseFloat(e.target.value) || 0)}
                      placeholder="0"
                      className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent text-lg font-bold text-right"
                    />
                  </div>
                  
                  {cashAmount > 0 && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-700">Cambio:</span>
                        <span className={`text-lg font-bold ${
                          calculateChange() >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          ${calculateChange().toLocaleString()}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Botón de Procesar Venta */}
              <button
                onClick={processSale}
                disabled={isProcessingSale || (paymentMethod === 'cash' && cashAmount < currentSale.total)}
                className="w-full bg-green-600 text-white py-4 rounded-xl hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center text-lg font-bold"
              >
                {isProcessingSale ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Procesando...
                  </>
                ) : (
                  <>
                    <Check className="h-5 w-5 mr-2" />
                    Procesar Venta
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modales */}
      {showNumericKeypad && (
        <NumericKeypad
          value={cashAmount}
          onChange={setCashAmount}
          onClose={() => setShowNumericKeypad(false)}
          title="Monto en Efectivo"
        />
      )}

      {showShiftManagement && (
        <ShiftManagement
          onClose={() => setShowShiftManagement(false)}
          onShiftUpdate={loadCurrentShift}
        />
      )}
      </div>
    </CashRegisterAccessGuard>
  );
};

export default SimpleCashRegister;
