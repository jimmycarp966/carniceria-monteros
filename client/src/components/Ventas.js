import React, { useState, useEffect } from 'react';
import { 
  ShoppingCart, 
  Package, 
  DollarSign, 
  CreditCard, 
  Receipt, 
  CheckCircle,
  AlertTriangle,
  Search,
  Plus,
  Minus,
  Calculator,
  TrendingUp
} from 'lucide-react';
import { productService, saleService, shiftService } from '../services/firebaseService';
import realtimeService from '../services/realtimeService';
import { useCashRegisterAccess } from '../hooks/useCashRegisterAccess';
import toast from 'react-hot-toast';

const Ventas = () => {
  // Estados principales
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState('efectivo');
  const [currentShift, setCurrentShift] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  // Hook de acceso
  const { currentUser } = useCashRegisterAccess();

  // Cargar datos iniciales
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setIsLoading(true);
      
      // Cargar productos (sin paginación para el formulario)
      const productsData = await productService.getAllProducts(1, 1000);
      console.log('🔍 Productos cargados:', productsData);
      
      const filteredProducts = productsData.filter(p => p.status === 'active' && p.stock > 0);
      console.log('🔍 Productos filtrados (active + stock > 0):', filteredProducts);
      console.log('🔍 Productos con status !== active:', productsData.filter(p => p.status !== 'active'));
      console.log('🔍 Productos con stock <= 0:', productsData.filter(p => p.stock <= 0));
      
      setProducts(filteredProducts);
      
      // Buscar turno activo
      const shifts = await shiftService.getAllShifts();
      const activeShift = shifts.find(shift => shift.status === 'active' || !shift.endTime);
      setCurrentShift(activeShift);
      
      if (!activeShift) {
        toast.error('No hay turno activo. Debe abrir un turno para realizar ventas.');
      }
      
    } catch (error) {
      console.error('Error cargando datos:', error);
      toast.error('Error al cargar los datos');
    } finally {
      setIsLoading(false);
    }
  };

  // Filtrar productos
  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.barcode?.includes(searchTerm)
  );

  // Calcular subtotal
  const calculateSubtotal = () => {
    if (!selectedProduct) return 0;
    return selectedProduct.price * quantity;
  };

  // Validar stock
  const validateStock = () => {
    if (!selectedProduct) return false;
    return quantity <= selectedProduct.stock;
  };

  // Procesar venta
  const processSale = async () => {
    if (!currentShift) {
      toast.error('No hay turno activo');
      return;
    }
    
    if (!selectedProduct) {
      toast.error('Debe seleccionar un producto');
      return;
    }
    
    if (quantity <= 0) {
      toast.error('La cantidad debe ser mayor a 0');
      return;
    }
    
    if (!validateStock()) {
      toast.error(`Stock insuficiente. Disponible: ${selectedProduct.stock} ${selectedProduct.unit}`);
      return;
    }
    
    setIsProcessing(true);
    
    try {
      const subtotal = calculateSubtotal();
      
      const saleData = {
        products: [{
          id: selectedProduct.id,
          name: selectedProduct.name,
          price: selectedProduct.price,
          quantity: quantity,
          unit: selectedProduct.unit || 'kg',
          total: subtotal
        }],
        subtotal: subtotal,
        discount: 0,
        total: subtotal,
        paymentMethod,
        receivedAmount: subtotal,
        change: 0,
        shiftId: currentShift.id,
        employeeName: currentUser?.name,
        employeeId: currentUser?.employeeId || currentUser?.id,
        employeeRole: currentUser?.role || 'ayudante',
        notes: '',
        timestamp: new Date(),
        date: new Date().toISOString().split('T')[0],
        status: 'completed',
        processedBy: {
          id: currentUser?.id,
          name: currentUser?.name,
          email: currentUser?.email,
          role: currentUser?.role || 'ayudante'
        }
      };
      
      // Guardar venta
      const saleId = await saleService.addSale(saleData);
      
      // Actualizar stock del producto
      await productService.updateProduct(selectedProduct.id, {
        stock: selectedProduct.stock - quantity
      });
      
      // Sincronizar en tiempo real
      await realtimeService.syncSale(saleData);
      
      // Notificar a la caja sobre la nueva venta
      await realtimeService.notifySaleCompleted({
        saleId,
        shiftId: currentShift.id,
        total: subtotal,
        employeeName: currentUser?.name
      });
      
      toast.success(`Venta registrada exitosamente - ID: ${saleId}`);
      
             // Limpiar formulario
       setSelectedProduct(null);
       setQuantity(1);
       setSearchTerm('');
       setShowDropdown(false);
      
      // Recargar productos para actualizar stock
      loadInitialData();
      
    } catch (error) {
      console.error('Error procesando venta:', error);
      toast.error('Error al procesar la venta');
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  if (!currentShift) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
        <h3 className="text-xl font-medium text-gray-900 mb-2">No hay turno activo</h3>
        <p className="text-gray-600">Debe abrir un turno en la caja registradora para realizar ventas.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-orange-50/30 to-red-50/30">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <div className="p-3 bg-gradient-to-br from-orange-100 to-red-100 rounded-2xl shadow-lg mr-4">
              <ShoppingCart className="h-8 w-8 text-orange-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                Registrar Venta
              </h1>
              <p className="text-gray-600">Formulario para registrar ventas individuales</p>
            </div>
          </div>
          
          {/* Información del turno */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-orange-200/50 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <TrendingUp className="h-5 w-5 text-green-600 mr-2" />
                <span className="text-sm font-medium text-gray-700">Turno Activo:</span>
                <span className="text-sm text-gray-900 ml-2">{currentShift.employeeName}</span>
              </div>
              <div className="text-sm text-gray-600">
                Abierto: {new Date(currentShift.startTime?.toDate()).toLocaleString()}
              </div>
            </div>
          </div>
        </div>

        {/* Formulario principal */}
        <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8">
          <div className="space-y-8">
            
            {/* Selector de producto */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-4 flex items-center">
                <Package className="h-5 w-5 mr-2 text-orange-600" />
                Producto
              </label>
              
                             {/* Búsqueda de productos */}
               <div className="relative mb-4">
                 <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                 <input
                   type="text"
                   value={searchTerm}
                   onChange={(e) => {
                     setSearchTerm(e.target.value);
                     setShowDropdown(e.target.value.length > 0);
                   }}
                   onFocus={() => setShowDropdown(searchTerm.length > 0)}
                   onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                   placeholder="Buscar productos..."
                   className="w-full pl-12 pr-4 py-4 bg-white/80 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
                 />
                 
                 {/* Lista desplegable de productos */}
                 {showDropdown && filteredProducts.length > 0 && (
                   <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-2xl shadow-xl z-50 max-h-64 overflow-y-auto">
                     {filteredProducts.map(product => (
                       <div
                         key={product.id}
                         onClick={() => {
                           setSelectedProduct(product);
                           setSearchTerm(product.name);
                           setShowDropdown(false);
                         }}
                         className="p-4 hover:bg-orange-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors"
                       >
                         <div className="flex items-center justify-between">
                           <div className="flex-1">
                             <h4 className="font-medium text-gray-900">{product.name}</h4>
                             <p className="text-sm text-gray-600">
                               Stock: {product.stock} {product.unit || 'kg'} • ${product.price?.toLocaleString()}
                             </p>
                           </div>
                           <Package className="h-4 w-4 text-gray-400 ml-2" />
                         </div>
                       </div>
                     ))}
                   </div>
                 )}
               </div>

              {/* Lista de productos */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-64 overflow-y-auto">
                {filteredProducts.map(product => (
                  <div
                    key={product.id}
                    onClick={() => setSelectedProduct(product)}
                    className={`p-4 rounded-2xl border-2 cursor-pointer transition-all duration-200 hover:shadow-lg ${
                      selectedProduct?.id === product.id
                        ? 'border-orange-500 bg-orange-50 shadow-lg'
                        : 'border-gray-200 hover:border-orange-300 bg-white/80'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-gray-900 truncate">{product.name}</h3>
                      <Package className="h-4 w-4 text-gray-400" />
                    </div>
                    <p className="text-sm text-gray-600 mb-1">
                      Stock: {product.stock} {product.unit || 'kg'}
                    </p>
                    <p className="text-lg font-bold text-orange-600">
                      ${product.price?.toLocaleString()} / {product.unit || 'kg'}
                    </p>
                  </div>
                ))}
              </div>

              {filteredProducts.length === 0 && (
                <div className="text-center py-8">
                  <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">
                    {searchTerm ? 'No se encontraron productos' : 'No hay productos disponibles'}
                  </p>
                </div>
              )}
            </div>

            {/* Producto seleccionado */}
            {selectedProduct && (
              <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-2xl p-6 border border-orange-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                  Producto Seleccionado
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-gray-600">Nombre</p>
                    <p className="font-semibold text-gray-900">{selectedProduct.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Precio Unitario</p>
                    <p className="font-semibold text-orange-600">${selectedProduct.price?.toLocaleString()} / {selectedProduct.unit}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Stock Disponible</p>
                    <p className="font-semibold text-gray-900">{selectedProduct.stock} {selectedProduct.unit}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Categoría</p>
                    <p className="font-semibold text-gray-900">{selectedProduct.category || 'Sin categoría'}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Cantidad */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-4 flex items-center">
                <Calculator className="h-5 w-5 mr-2 text-orange-600" />
                Cantidad
              </label>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
                >
                  <Minus className="h-5 w-5 text-gray-600" />
                </button>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                  className="w-24 text-center px-4 py-3 bg-white/80 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  min="1"
                />
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
                >
                  <Plus className="h-5 w-5 text-gray-600" />
                </button>
                {selectedProduct && (
                  <span className="text-sm text-gray-600">
                    {selectedProduct.unit || 'kg'}
                  </span>
                )}
              </div>
              
              {/* Validación de stock */}
              {selectedProduct && !validateStock() && (
                <div className="mt-2 flex items-center text-red-600">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  <span className="text-sm">Stock insuficiente. Disponible: {selectedProduct.stock} {selectedProduct.unit}</span>
                </div>
              )}
            </div>

            {/* Medio de pago */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-4 flex items-center">
                <CreditCard className="h-5 w-5 mr-2 text-orange-600" />
                Medio de Pago
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { value: 'efectivo', label: 'Efectivo', icon: DollarSign },
                  { value: 'tarjeta', label: 'Tarjeta', icon: CreditCard },
                  { value: 'transferencia', label: 'Transferencia', icon: Receipt },
                  { value: 'mercadopago', label: 'MercadoPago', icon: CreditCard }
                ].map(method => (
                  <button
                    key={method.value}
                    onClick={() => setPaymentMethod(method.value)}
                    className={`p-4 rounded-2xl border-2 transition-all duration-200 flex flex-col items-center ${
                      paymentMethod === method.value
                        ? 'border-orange-500 bg-orange-50 text-orange-700 shadow-lg'
                        : 'border-gray-200 hover:border-orange-300 bg-white/80 hover:bg-orange-50/50'
                    }`}
                  >
                    <method.icon className="h-6 w-6 mb-2" />
                    <span className="text-sm font-medium">{method.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Resumen */}
            {selectedProduct && (
              <div className="bg-gradient-to-r from-gray-50 to-orange-50 rounded-2xl p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Resumen de Venta</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Producto:</span>
                    <span className="font-medium">{selectedProduct.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Cantidad:</span>
                    <span className="font-medium">{quantity} {selectedProduct.unit}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Precio Unitario:</span>
                    <span className="font-medium">${selectedProduct.price?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Medio de Pago:</span>
                    <span className="font-medium capitalize">{paymentMethod}</span>
                  </div>
                  <div className="border-t pt-3">
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total:</span>
                      <span className="text-orange-600">${calculateSubtotal().toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Botón de confirmar */}
            <button
              onClick={processSale}
              disabled={!selectedProduct || !validateStock() || isProcessing}
              className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold py-4 px-6 rounded-2xl hover:from-orange-600 hover:to-red-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-lg hover:shadow-xl"
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                  Procesando...
                </>
              ) : (
                <>
                  <ShoppingCart className="h-5 w-5 mr-3" />
                  Confirmar Venta
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Ventas;
