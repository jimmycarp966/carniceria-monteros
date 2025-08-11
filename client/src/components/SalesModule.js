import React, { useState, useEffect } from 'react';
import { 
  ShoppingCart, 
  Plus, 
  Minus, 
  Trash2, 
  DollarSign, 
  CreditCard, 
  Receipt, 
  Search,
  Calculator,
  CheckCircle,
  AlertTriangle,
  Package,
  X,
  UserPlus,
  Edit,
  Phone,
  Mail,
  MapPin
} from 'lucide-react';
import { productService, saleService, customerService, shiftService } from '../services/firebaseService';
import realtimeService from '../services/realtimeService';
import { useCashRegisterAccess } from '../hooks/useCashRegisterAccess';
import toast from 'react-hot-toast';

const SalesModule = () => {
  // Estados principales
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [cart, setCart] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [currentShift, setCurrentShift] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Estados de selección de producto
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [weight, setWeight] = useState(0); // Para productos por peso
  const [isWeightMode, setIsWeightMode] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);

  // Estados del pago
  const [paymentMethod, setPaymentMethod] = useState('efectivo');
  const [receivedAmount, setReceivedAmount] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [discountType, setDiscountType] = useState('percentage'); // 'percentage' or 'fixed'
  const [notes, setNotes] = useState('');

  // Estados de UI
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);

  // Estados de gestión de clientes
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [customerForm, setCustomerForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    notes: ''
  });
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');

  // Hook de acceso
  const { currentUser } = useCashRegisterAccess();

  // Función para simular lectura de balanza (se puede conectar a balanza real)
  const readFromScale = () => {
    if (selectedProduct && isWeightMode) {
      // Simular lectura de balanza (0.5 a 2.5 kg)
      const simulatedWeight = (Math.random() * 2 + 0.5).toFixed(2);
      setWeight(parseFloat(simulatedWeight));
      toast.success(`Peso leído: ${simulatedWeight} ${selectedProduct.unit}`);
    }
  };

  // Cargar datos iniciales
  useEffect(() => {
    loadInitialData();
    
    // Listener para reset forzado de turnos
    const handleForceResetShifts = () => {
      console.log('🔄 SalesModule: Recibido evento de reset forzado de turnos');
      setCurrentShift(null);
      toast.success('Turnos reseteados - No hay turno activo para ventas');
    };
    
    window.addEventListener('forceResetShifts', handleForceResetShifts);
    
    return () => {
      window.removeEventListener('forceResetShifts', handleForceResetShifts);
    };
  }, []);

  const loadInitialData = async () => {
    try {
      setIsLoading(true);
      
      // Cargar productos (sin paginación para el POS)
      const productsData = await productService.getAllProducts(1, 1000); // Cargar hasta 1000 productos
      setProducts(productsData.filter(p => p.status === 'active' && p.stock > 0));
      
      // Cargar clientes
      const customersData = await customerService.getAllCustomers();
      setCustomers(customersData);
      
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

  // Filtrar clientes
  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(customerSearchTerm.toLowerCase()) ||
    customer.email?.toLowerCase().includes(customerSearchTerm.toLowerCase()) ||
    customer.phone?.includes(customerSearchTerm)
  );

  // Gestión de clientes
  const openCustomerModal = (customer = null) => {
    if (customer) {
      setEditingCustomer(customer);
      setCustomerForm({
        name: customer.name || '',
        email: customer.email || '',
        phone: customer.phone || '',
        address: customer.address || '',
        notes: customer.notes || ''
      });
    } else {
      setEditingCustomer(null);
      setCustomerForm({
        name: '',
        email: '',
        phone: '',
        address: '',
        notes: ''
      });
    }
    setShowCustomerModal(true);
  };

  const saveCustomer = async () => {
    if (!customerForm.name.trim()) {
      toast.error('El nombre del cliente es obligatorio');
      return;
    }

    try {
      if (editingCustomer) {
        await customerService.updateCustomer(editingCustomer.id, customerForm);
        toast.success('Cliente actualizado exitosamente');
      } else {
        const customerId = await customerService.addCustomer(customerForm);
        toast.success('Cliente creado exitosamente');
        
        // Recargar clientes para incluir el nuevo
        const updatedCustomers = await customerService.getAllCustomers();
        setCustomers(updatedCustomers);
        
        // Seleccionar automáticamente el nuevo cliente
        const newCustomer = updatedCustomers.find(c => c.id === customerId);
        if (newCustomer) {
          setSelectedCustomer(newCustomer);
        }
      }
      
      setShowCustomerModal(false);
      setEditingCustomer(null);
      setCustomerForm({ name: '', email: '', phone: '', address: '', notes: '' });
      
    } catch (error) {
      console.error('Error guardando cliente:', error);
      toast.error('Error al guardar el cliente');
    }
  };

  const deleteCustomer = async (customerId) => {
    if (!window.confirm('¿Está seguro de que desea eliminar este cliente?')) {
      return;
    }

    try {
      await customerService.deleteCustomer(customerId);
      
      // Remover de la lista local
      setCustomers(customers.filter(c => c.id !== customerId));
      
      // Si era el cliente seleccionado, deseleccionarlo
      if (selectedCustomer?.id === customerId) {
        setSelectedCustomer(null);
      }
      
      toast.success('Cliente eliminado exitosamente');
    } catch (error) {
      console.error('Error eliminando cliente:', error);
      toast.error('Error al eliminar el cliente');
    }
  };

  // Seleccionar producto para agregar al carrito
  const selectProduct = (product) => {
    setSelectedProduct(product);
    setQuantity(1);
    setWeight(0);
    setIsWeightMode(product.unit === 'kg' || product.unit === 'g');
    setShowProductModal(true);
  };

  // Agregar producto al carrito con cantidad específica
  const addToCart = () => {
    if (!selectedProduct) return;

    const finalQuantity = isWeightMode ? weight : quantity;
    const finalPrice = isWeightMode ? (selectedProduct.price * weight) : (selectedProduct.price * quantity);

    if (finalQuantity <= 0) {
      toast.error('La cantidad debe ser mayor a 0');
      return;
    }

    if (finalQuantity > selectedProduct.stock) {
      toast.error(`Stock insuficiente. Disponible: ${selectedProduct.stock} ${selectedProduct.unit}`);
      return;
    }

    const existingItem = cart.find(item => item.id === selectedProduct.id);
    
    if (existingItem) {
      setCart(cart.map(item =>
        item.id === selectedProduct.id
          ? { 
              ...item, 
              quantity: item.quantity + finalQuantity,
              total: (item.quantity + finalQuantity) * selectedProduct.price
            }
          : item
      ));
    } else {
      setCart([...cart, {
        id: selectedProduct.id,
        name: selectedProduct.name,
        price: selectedProduct.price,
        unit: selectedProduct.unit || 'kg',
        quantity: finalQuantity,
        total: finalPrice,
        stock: selectedProduct.stock
      }]);
    }
    
    toast.success(`${selectedProduct.name} agregado al carrito`);
    setShowProductModal(false);
    setSelectedProduct(null);
  };

  // Actualizar cantidad en carrito
  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }
    
    const product = cart.find(item => item.id === productId);
    if (product && newQuantity > product.stock) {
      toast.error(`Stock insuficiente. Disponible: ${product.stock}`);
      return;
    }
    
    setCart(cart.map(item =>
      item.id === productId
        ? { ...item, quantity: newQuantity }
        : item
    ));
  };

  // Remover del carrito
  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.id !== productId));
  };

  // Limpiar carrito
  const clearCart = () => {
    setCart([]);
    setSelectedCustomer(null);
    setDiscount(0);
    setNotes('');
    setReceivedAmount(0);
  };

  // Calcular totales
  const calculateTotals = () => {
    const subtotal = cart.reduce((sum, item) => sum + (item.total || (item.price * item.quantity)), 0);
    const discountAmount = discountType === 'percentage' 
      ? (subtotal * discount / 100)
      : discount;
    const total = Math.max(0, subtotal - discountAmount);
    
    return { subtotal, discountAmount, total };
  };

  // Procesar venta
  const processSale = async () => {
    if (!currentShift) {
      toast.error('No hay turno activo');
      return;
    }
    
    if (cart.length === 0) {
      toast.error('El carrito está vacío');
      return;
    }
    
    const { total } = calculateTotals();
    
    if (paymentMethod === 'efectivo' && receivedAmount < total) {
      toast.error('El monto recibido es insuficiente');
      return;
    }
    
    setProcessingPayment(true);
    
    try {
      const saleData = {
        products: cart.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          unit: item.unit,
          total: item.price * item.quantity
        })),
        subtotal: calculateTotals().subtotal,
        discount: calculateTotals().discountAmount,
        total: total,
        paymentMethod,
        receivedAmount: paymentMethod === 'efectivo' ? receivedAmount : total,
        change: paymentMethod === 'efectivo' ? Math.max(0, receivedAmount - total) : 0,
        customerId: selectedCustomer?.id,
        customerName: selectedCustomer?.name,
        shiftId: currentShift.id,
        employeeName: currentUser?.name,
        employeeId: currentUser?.employeeId || currentUser?.id,
        employeeRole: currentUser?.role || 'ayudante',
        notes,
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
      
      // Actualizar stock de productos
      for (const item of cart) {
        const product = products.find(p => p.id === item.id);
        if (product) {
          await productService.updateProduct(item.id, {
            stock: product.stock - item.quantity
          });
        }
      }
      
      // Sincronizar en tiempo real
      await realtimeService.syncSale(saleData);
      
      // Notificar a la caja sobre la nueva venta
      await realtimeService.notifySaleCompleted({
        saleId,
        shiftId: currentShift.id,
        total: total,
        employeeName: currentUser?.name
      });
      
      toast.success(`Venta procesada exitosamente - ID: ${saleId}`);
      
      // Limpiar formulario
      clearCart();
      setShowPaymentModal(false);
      
      // Recargar productos para actualizar stock
      loadInitialData();
      
    } catch (error) {
      console.error('Error procesando venta:', error);
      toast.error('Error al procesar la venta');
    } finally {
      setProcessingPayment(false);
    }
  };

  // Modal de gestión de clientes
  const CustomerModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900">
            {editingCustomer ? 'Editar Cliente' : 'Nuevo Cliente'}
          </h3>
          <button
            onClick={() => {
              setShowCustomerModal(false);
              setEditingCustomer(null);
              setCustomerForm({ name: '', email: '', phone: '', address: '', notes: '' });
            }}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nombre * <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={customerForm.name}
              onChange={(e) => setCustomerForm({...customerForm, name: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              placeholder="Nombre completo del cliente"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Phone className="h-4 w-4 inline mr-1" />
                Teléfono
              </label>
              <input
                type="tel"
                value={customerForm.phone}
                onChange={(e) => setCustomerForm({...customerForm, phone: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                placeholder="+54 9 11 1234-5678"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Mail className="h-4 w-4 inline mr-1" />
                Email
              </label>
              <input
                type="email"
                value={customerForm.email}
                onChange={(e) => setCustomerForm({...customerForm, email: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                placeholder="cliente@email.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <MapPin className="h-4 w-4 inline mr-1" />
              Dirección
            </label>
            <input
              type="text"
              value={customerForm.address}
              onChange={(e) => setCustomerForm({...customerForm, address: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              placeholder="Dirección completa"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notas
            </label>
            <textarea
              value={customerForm.notes}
              onChange={(e) => setCustomerForm({...customerForm, notes: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              rows="3"
              placeholder="Información adicional del cliente..."
            />
          </div>
        </div>

        <div className="flex space-x-3 mt-6">
          <button
            onClick={() => {
              setShowCustomerModal(false);
              setEditingCustomer(null);
              setCustomerForm({ name: '', email: '', phone: '', address: '', notes: '' });
            }}
            className="flex-1 bg-gray-200 text-gray-800 py-3 px-4 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={saveCustomer}
            className="flex-1 bg-primary-600 text-white py-3 px-4 rounded-lg hover:bg-primary-700 transition-colors"
          >
            {editingCustomer ? 'Actualizar Cliente' : 'Crear Cliente'}
          </button>
        </div>
      </div>
    </div>
  );

  // Modal de selección de producto y cantidad
  const ProductSelectionModal = () => {
    const totalPrice = isWeightMode ? (selectedProduct?.price * weight) : (selectedProduct?.price * quantity);
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-6 w-full max-w-md">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900">Agregar Producto</h3>
            <button
              onClick={() => {
                setShowProductModal(false);
                setSelectedProduct(null);
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {selectedProduct && (
            <>
              {/* Información del producto */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h4 className="font-medium text-gray-900 mb-2">{selectedProduct.name}</h4>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Precio: ${selectedProduct.price?.toLocaleString()} / {selectedProduct.unit}</span>
                  <span>Stock: {selectedProduct.stock} {selectedProduct.unit}</span>
                </div>
              </div>

              {/* Selección de cantidad/peso */}
              <div className="space-y-4 mb-6">
                {isWeightMode ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Peso ({selectedProduct.unit}):
                    </label>
                    <div className="flex space-x-2">
                      <div className="relative flex-1">
                        <input
                          type="number"
                          step="0.01"
                          value={weight}
                          onChange={(e) => setWeight(parseFloat(e.target.value) || 0)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                          placeholder="0.00"
                        />
                        <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                          {selectedProduct.unit}
                        </span>
                      </div>
                      <button
                        onClick={readFromScale}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        title="Leer de balanza"
                      >
                        ⚖️
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cantidad:
                    </label>
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <input
                        type="number"
                        value={quantity}
                        onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                        className="w-20 text-center px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                        min="1"
                      />
                      <button
                        onClick={() => setQuantity(quantity + 1)}
                        className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Precio total */}
                <div className="bg-primary-50 rounded-lg p-3">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-900">Precio Total:</span>
                    <span className="text-lg font-bold text-primary-600">
                      ${totalPrice.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Botones */}
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowProductModal(false);
                    setSelectedProduct(null);
                  }}
                  className="flex-1 bg-gray-200 text-gray-800 py-3 px-4 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={addToCart}
                  className="flex-1 bg-primary-600 text-white py-3 px-4 rounded-lg hover:bg-primary-700 transition-colors"
                >
                  Agregar al Carrito
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  };

  // Modal de pago
  const PaymentModal = () => {
    const { subtotal, discountAmount, total } = calculateTotals();
    const change = paymentMethod === 'efectivo' ? Math.max(0, receivedAmount - total) : 0;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900">Procesar Pago</h3>
            <button
              onClick={() => setShowPaymentModal(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Resumen del carrito */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h4 className="font-medium text-gray-900 mb-3">Resumen de Compra</h4>
            <div className="space-y-2">
              {cart.map(item => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span>{item.name} x {item.quantity} {item.unit}</span>
                  <span>${(item.total || (item.price * item.quantity)).toLocaleString()}</span>
                </div>
              ))}
            </div>
            
            <div className="border-t mt-3 pt-3 space-y-1">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>${subtotal.toLocaleString()}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Descuento:</span>
                  <span>-${discountAmount.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-lg">
                <span>Total:</span>
                <span>${total.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Método de pago */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">Método de Pago:</label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: 'efectivo', label: 'Efectivo', icon: DollarSign },
                { value: 'tarjeta', label: 'Tarjeta', icon: CreditCard },
                { value: 'transferencia', label: 'Transferencia', icon: Receipt }
              ].map(method => (
                <button
                  key={method.value}
                  onClick={() => setPaymentMethod(method.value)}
                  className={`p-3 rounded-lg border-2 transition-colors flex flex-col items-center ${
                    paymentMethod === method.value
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <method.icon className="h-6 w-6 mb-1" />
                  <span className="text-sm font-medium">{method.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Monto recibido (solo para efectivo) */}
          {paymentMethod === 'efectivo' && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Monto Recibido:</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                <input
                  type="number"
                  value={receivedAmount}
                  onChange={(e) => setReceivedAmount(parseFloat(e.target.value) || 0)}
                  className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  placeholder="0"
                />
              </div>
              {change > 0 && (
                <p className="mt-2 text-sm text-green-600 font-medium">
                  Cambio: ${change.toLocaleString()}
                </p>
              )}
            </div>
          )}

          {/* Notas */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Notas (opcional):</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              rows="2"
              placeholder="Observaciones de la venta..."
            />
          </div>

          {/* Botones */}
          <div className="flex space-x-3">
            <button
              onClick={() => setShowPaymentModal(false)}
              className="flex-1 bg-gray-200 text-gray-800 py-3 px-4 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={processSale}
              disabled={processingPayment || (paymentMethod === 'efectivo' && receivedAmount < total)}
              className="flex-1 bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {processingPayment ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Procesando...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Confirmar Venta
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Punto de Venta - Carnicería Monteros</h1>
          <p className="text-gray-600">Sistema POS completo con gestión de clientes, balanza y múltiples formas de pago</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Panel izquierdo - Productos */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Productos</h2>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Buscar productos..."
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 w-64"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredProducts.map(product => (
                  <div
                    key={product.id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => selectProduct(product)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-gray-900 truncate">{product.name}</h3>
                      <Package className="h-4 w-4 text-gray-400" />
                    </div>
                    <p className="text-sm text-gray-600 mb-1">
                      Stock: {product.stock} {product.unit || 'kg'}
                    </p>
                    <p className="text-lg font-bold text-primary-600">
                      ${product.price?.toLocaleString()} / {product.unit || 'kg'}
                    </p>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        selectProduct(product);
                      }}
                      className="w-full mt-3 bg-primary-600 text-white py-2 px-3 rounded-lg hover:bg-primary-700 transition-colors flex items-center justify-center"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Seleccionar
                    </button>
                  </div>
                ))}
              </div>

              {filteredProducts.length === 0 && (
                <div className="text-center py-12">
                  <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">
                    {searchTerm ? 'No se encontraron productos' : 'No hay productos disponibles'}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Panel derecho - Carrito */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 sticky top-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  Carrito ({cart.length})
                </h2>
                {cart.length > 0 && (
                  <button
                    onClick={clearCart}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>

              {cart.length === 0 ? (
                <div className="text-center py-8">
                  <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">El carrito está vacío</p>
                </div>
              ) : (
                <>
                  <div className="space-y-3 mb-6 max-h-64 overflow-y-auto">
                    {cart.map(item => (
                      <div key={item.id} className="border border-gray-200 rounded-lg p-3">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-medium text-gray-900 text-sm">{item.name}</h4>
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300"
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="text-sm font-medium w-8 text-center">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>
                          <span className="text-sm font-bold text-primary-600">
                            ${(item.price * item.quantity).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Descuento */}
                  <div className="mb-4 p-3 border border-gray-200 rounded-lg">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Descuento:</label>
                    <div className="flex space-x-2">
                      <input
                        type="number"
                        value={discount}
                        onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                        className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-primary-500"
                        placeholder="0"
                      />
                      <select
                        value={discountType}
                        onChange={(e) => setDiscountType(e.target.value)}
                        className="px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-primary-500"
                      >
                        <option value="percentage">%</option>
                        <option value="fixed">$</option>
                      </select>
                    </div>
                  </div>

                  {/* Cliente */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Cliente:</label>
                    <div className="space-y-2">
                      <div className="flex space-x-2">
                        <select
                          value={selectedCustomer?.id || ''}
                          onChange={(e) => {
                            const customer = customers.find(c => c.id === e.target.value);
                            setSelectedCustomer(customer || null);
                          }}
                          className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-primary-500"
                        >
                          <option value="">Cliente General</option>
                          {filteredCustomers.map(customer => (
                            <option key={customer.id} value={customer.id}>
                              {customer.name}
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={() => openCustomerModal()}
                          className="px-2 py-1 bg-primary-600 text-white rounded hover:bg-primary-700"
                          title="Nuevo cliente"
                        >
                          <UserPlus className="h-4 w-4" />
                        </button>
                      </div>
                      
                      {/* Búsqueda de clientes */}
                      <div className="relative">
                        <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 h-3 w-3" />
                        <input
                          type="text"
                          value={customerSearchTerm}
                          onChange={(e) => setCustomerSearchTerm(e.target.value)}
                          placeholder="Buscar clientes..."
                          className="w-full pl-8 pr-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-primary-500"
                        />
                      </div>

                      {/* Lista de clientes filtrados */}
                      {customerSearchTerm && filteredCustomers.length > 0 && (
                        <div className="max-h-32 overflow-y-auto border border-gray-200 rounded bg-white">
                          {filteredCustomers.map(customer => (
                            <div
                              key={customer.id}
                              className="p-2 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                              onClick={() => {
                                setSelectedCustomer(customer);
                                setCustomerSearchTerm('');
                              }}
                            >
                              <div className="flex justify-between items-center">
                                <div>
                                  <p className="text-sm font-medium text-gray-900">{customer.name}</p>
                                  {customer.phone && (
                                    <p className="text-xs text-gray-600">{customer.phone}</p>
                                  )}
                                </div>
                                <div className="flex space-x-1">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      openCustomerModal(customer);
                                    }}
                                    className="text-blue-600 hover:text-blue-700"
                                    title="Editar"
                                  >
                                    <Edit className="h-3 w-3" />
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      deleteCustomer(customer.id);
                                    }}
                                    className="text-red-600 hover:text-red-700"
                                    title="Eliminar"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Cliente seleccionado */}
                      {selectedCustomer && (
                        <div className="p-2 bg-primary-50 rounded border border-primary-200">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="text-sm font-medium text-primary-900">{selectedCustomer.name}</p>
                              {selectedCustomer.phone && (
                                <p className="text-xs text-primary-700">{selectedCustomer.phone}</p>
                              )}
                              {selectedCustomer.email && (
                                <p className="text-xs text-primary-700">{selectedCustomer.email}</p>
                              )}
                            </div>
                            <button
                              onClick={() => setSelectedCustomer(null)}
                              className="text-primary-600 hover:text-primary-700"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Totales */}
                  <div className="border-t pt-4 mb-6">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Subtotal:</span>
                        <span>${calculateTotals().subtotal.toLocaleString()}</span>
                      </div>
                      {calculateTotals().discountAmount > 0 && (
                        <div className="flex justify-between text-sm text-green-600">
                          <span>Descuento:</span>
                          <span>-${calculateTotals().discountAmount.toLocaleString()}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-lg font-bold">
                        <span>Total:</span>
                        <span>${calculateTotals().total.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Botón de pago */}
                  <button
                    onClick={() => setShowPaymentModal(true)}
                    className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center font-medium"
                  >
                    <Calculator className="h-4 w-4 mr-2" />
                    Proceder al Pago
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modales */}
      {showPaymentModal && <PaymentModal />}
      {showProductModal && <ProductSelectionModal />}
      {showCustomerModal && <CustomerModal />}
    </div>
  );
};

export default SalesModule;
