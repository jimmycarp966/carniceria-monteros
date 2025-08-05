import React, { useState } from 'react';
import { products } from '../data/products';
import { ShoppingCart, Plus, Minus, Trash2, DollarSign, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';

const Sales = () => {
  const [cart, setCart] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [sales, setSales] = useState([]);
  const [showSalesHistory, setShowSalesHistory] = useState(false);

  // Calcular total del carrito
  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  // Agregar producto al carrito
  const addToCart = () => {
    if (!selectedProduct) {
      toast.error('Selecciona un producto');
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

  // Remover producto del carrito
  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.id !== productId));
    toast.success('Producto removido del carrito');
  };

  // Actualizar cantidad en carrito
  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }
    
    setCart(cart.map(item => 
      item.id === productId 
        ? { ...item, quantity: newQuantity }
        : item
    ));
  };

  // Finalizar venta
  const completeSale = () => {
    if (cart.length === 0) {
      toast.error('El carrito está vacío');
      return;
    }

    const sale = {
      id: Date.now(),
      items: [...cart],
      total: cartTotal,
      date: new Date().toISOString(),
      customer: 'Cliente General'
    };

    setSales([sale, ...sales]);
    setCart([]);
    toast.success(`Venta completada por $${cartTotal.toLocaleString()}`);
  };

  // Estadísticas de ventas
  const stats = {
    totalSales: sales.length,
    totalRevenue: sales.reduce((sum, sale) => sum + sale.total, 0),
    averageSale: sales.length > 0 ? sales.reduce((sum, sale) => sum + sale.total, 0) / sales.length : 0
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Ventas</h1>
          <p className="mt-1 text-sm text-gray-500">
            Gestiona las ventas y el carrito de compras
          </p>
        </div>
        <button
          onClick={() => setShowSalesHistory(!showSalesHistory)}
          className="btn btn-secondary flex items-center"
        >
          <Calendar className="h-4 w-4 mr-2" />
          Historial de Ventas
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <ShoppingCart className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Ventas</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalSales}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <DollarSign className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Ingresos Totales</p>
              <p className="text-2xl font-semibold text-gray-900">
                ${stats.totalRevenue.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <DollarSign className="h-8 w-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Venta Promedio</p>
              <p className="text-2xl font-semibold text-gray-900">
                ${stats.averageSale.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Product Selection */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Agregar Productos</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Producto
              </label>
              <select
                value={selectedProduct}
                onChange={(e) => setSelectedProduct(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">Seleccionar producto</option>
                {products.map(product => (
                  <option key={product.id} value={product.id}>
                    {product.name} - ${product.price.toLocaleString()}/{product.unit}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cantidad
              </label>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
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
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Carrito de Compras</h2>
          
          {cart.length === 0 ? (
            <p className="text-gray-500 text-center py-8">El carrito está vacío</p>
          ) : (
            <div className="space-y-4">
              {cart.map(item => (
                <div key={item.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{item.image}</span>
                    <div>
                      <h3 className="font-medium text-gray-900">{item.name}</h3>
                      <p className="text-sm text-gray-500">${item.price.toLocaleString()}/{item.unit}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="p-1 text-gray-400 hover:text-red-600"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="font-medium text-gray-900 min-w-[2rem] text-center">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="p-1 text-gray-400 hover:text-green-600"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="p-1 text-gray-400 hover:text-red-600 ml-2"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
              
              <div className="border-t pt-4">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-lg font-semibold text-gray-900">Total:</span>
                  <span className="text-2xl font-bold text-green-600">
                    ${cartTotal.toLocaleString()}
                  </span>
                </div>
                
                <button
                  onClick={completeSale}
                  className="w-full btn btn-success flex items-center justify-center"
                >
                  <DollarSign className="h-4 w-4 mr-2" />
                  Finalizar Venta
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sales History */}
      {showSalesHistory && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Historial de Ventas</h2>
          
          {sales.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No hay ventas registradas</p>
          ) : (
            <div className="space-y-4">
              {sales.map(sale => (
                <div key={sale.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-medium text-gray-900">
                        Venta #{sale.id}
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(sale.date).toLocaleString()}
                      </p>
                    </div>
                    <span className="text-lg font-bold text-green-600">
                      ${sale.total.toLocaleString()}
                    </span>
                  </div>
                  
                  <div className="space-y-1">
                    {sale.items.map(item => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span>{item.name} x{item.quantity}</span>
                        <span>${(item.price * item.quantity).toLocaleString()}</span>
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

export default Sales; 