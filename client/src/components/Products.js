import React, { useState, useEffect } from 'react';
import { products, categories } from '../data/products';
import { Package, Plus, Edit, Trash2, Search, Filter, Grid, List } from 'lucide-react';
import toast from 'react-hot-toast';
import { productService } from '../services/firebaseService';

const Products = () => {
  const [productList, setProductList] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [loading, setLoading] = useState(true);

  // Cargar productos desde Firebase
  useEffect(() => {
    const loadProducts = async () => {
      try {
        console.log('🔄 Cargando productos en componente Products...');
        const productsFromFirebase = await productService.getAllProducts();
        console.log('📦 Productos cargados en Products:', productsFromFirebase.length);
        setProductList(productsFromFirebase);
      } catch (error) {
        console.error('❌ Error cargando productos en Products:', error);
        // Fallback a datos locales solo si hay error
        setProductList(products);
      } finally {
        setLoading(false);
      }
    };
    loadProducts();
  }, []);

  // Filtrar productos
  const filteredProducts = productList.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !categoryFilter || product.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Estadísticas
  const stats = {
    total: productList.length,
    categories: categories.length,
    inStock: productList.filter(p => p.stock > 0).length,
    lowStock: productList.filter(p => p.stock <= 10 && p.stock > 0).length,
    outOfStock: productList.filter(p => p.stock === 0).length,
    totalValue: productList.reduce((sum, p) => sum + (p.price * p.stock), 0)
  };

  const handleAddProduct = async (newProduct) => {
    try {
      console.log('🔄 Agregando producto desde componente Products...');
      const productData = {
        ...newProduct,
        stock: parseInt(newProduct.stock),
        price: parseFloat(newProduct.price),
        minStock: 10 // Stock mínimo por defecto
      };
      
      const productId = await productService.addProduct(productData);
      console.log('✅ Producto agregado a Firebase con ID:', productId);
      
      // Actualizar el estado local con el nuevo producto
      const productWithId = { ...productData, id: productId };
      setProductList([productWithId, ...productList]);
      setShowAddModal(false);
      toast.success('Producto agregado exitosamente');
    } catch (error) {
      console.error('❌ Error agregando producto desde Products:', error);
      toast.error('Error al agregar producto');
    }
  };

  const handleEditProduct = (updatedProduct) => {
    setProductList(productList.map(p => 
      p.id === updatedProduct.id ? { ...updatedProduct, stock: parseInt(updatedProduct.stock), price: parseFloat(updatedProduct.price) } : p
    ));
    setEditingProduct(null);
    toast.success('Producto actualizado exitosamente');
  };

  const handleDeleteProduct = (id) => {
    setProductList(productList.filter(p => p.id !== id));
    toast.success('Producto eliminado exitosamente');
  };

  const getCategoryColor = (categoryName) => {
    const category = categories.find(c => c.name === categoryName);
    return category?.color || 'gray';
  };

  return (
    <div className="p-4 lg:p-6 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Productos</h1>
          <p className="mt-2 text-gray-600">Gestiona el catálogo de productos de la carnicería</p>
        </div>
        <div className="flex space-x-2 w-full sm:w-auto">
          <button
            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            className="btn btn-secondary flex items-center justify-center"
          >
            {viewMode === 'grid' ? <List className="h-4 w-4 mr-2" /> : <Grid className="h-4 w-4 mr-2" />}
            {viewMode === 'grid' ? 'Lista' : 'Grid'}
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn btn-primary flex items-center w-full sm:w-auto justify-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Agregar Producto
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 lg:p-6">
          <div className="flex items-center">
            <Package className="h-6 w-6 text-primary-600" />
            <div className="ml-3">
              <p className="text-xs lg:text-sm font-medium text-gray-500">Total</p>
              <p className="text-lg lg:text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 lg:p-6">
          <div className="flex items-center">
            <Package className="h-6 w-6 text-green-600" />
            <div className="ml-3">
              <p className="text-xs lg:text-sm font-medium text-gray-500">En Stock</p>
              <p className="text-lg lg:text-2xl font-bold text-gray-900">{stats.inStock}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 lg:p-6">
          <div className="flex items-center">
            <Package className="h-6 w-6 text-yellow-600" />
            <div className="ml-3">
              <p className="text-xs lg:text-sm font-medium text-gray-500">Stock Bajo</p>
              <p className="text-lg lg:text-2xl font-bold text-gray-900">{stats.lowStock}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 lg:p-6">
          <div className="flex items-center">
            <Package className="h-6 w-6 text-red-600" />
            <div className="ml-3">
              <p className="text-xs lg:text-sm font-medium text-gray-500">Sin Stock</p>
              <p className="text-lg lg:text-2xl font-bold text-gray-900">{stats.outOfStock}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 lg:p-6">
          <div className="flex items-center">
            <Package className="h-6 w-6 text-purple-600" />
            <div className="ml-3">
              <p className="text-xs lg:text-sm font-medium text-gray-500">Categorías</p>
              <p className="text-lg lg:text-2xl font-bold text-gray-900">{stats.categories}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 lg:p-6">
          <div className="flex items-center">
            <Package className="h-6 w-6 text-blue-600" />
            <div className="ml-3">
              <p className="text-xs lg:text-sm font-medium text-gray-500">Valor Total</p>
              <p className="text-lg lg:text-2xl font-bold text-gray-900">
                ${(stats.totalValue / 1000).toFixed(0)}k
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 lg:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Buscar Producto
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nombre..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filtrar por Categoría
            </label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">Todas las categorías</option>
              {categories.map(category => (
                <option key={category.id} value={category.name}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => {
                setSearchTerm('');
                setCategoryFilter('');
              }}
              className="w-full btn btn-secondary flex items-center justify-center"
            >
              <Filter className="h-4 w-4 mr-2" />
              Limpiar Filtros
            </button>
          </div>
        </div>
      </div>

      {/* Products Display */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6">
          {filteredProducts.map(product => (
            <div key={product.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
              <div className="p-4 lg:p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">{product.name}</h3>
                    <p className="text-sm text-gray-600 mb-2 line-clamp-2">{product.description}</p>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-${getCategoryColor(product.category)}-100 text-${getCategoryColor(product.category)}-800`}>
                      {product.category}
                    </span>
                  </div>
                  <div className="text-2xl">{product.image}</div>
                </div>
                
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Precio:</span>
                    <span className="text-lg font-bold text-gray-900">${product.price.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Stock:</span>
                    <span className={`text-sm font-medium ${
                      product.stock === 0 ? 'text-red-600' : 
                      product.stock <= 10 ? 'text-yellow-600' : 'text-green-600'
                    }`}>
                      {product.stock} {product.unit}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Origen:</span>
                    <span className="text-sm text-gray-700">{product.origin}</span>
                  </div>
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={() => setEditingProduct(product)}
                    className="flex-1 btn btn-secondary text-xs py-2 flex items-center justify-center"
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    Editar
                  </button>
                  <button
                    onClick={() => handleDeleteProduct(product.id)}
                    className="flex-1 btn btn-danger text-xs py-2 flex items-center justify-center"
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Eliminar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Producto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Categoría
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Precio
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stock
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredProducts.map(product => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="text-2xl mr-3">{product.image}</div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{product.name}</div>
                          <div className="text-sm text-gray-500">{product.description}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-${getCategoryColor(product.category)}-100 text-${getCategoryColor(product.category)}-800`}>
                        {product.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-gray-900">${product.price.toLocaleString()}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-sm font-medium ${
                        product.stock === 0 ? 'text-red-600' : 
                        product.stock <= 10 ? 'text-yellow-600' : 'text-green-600'
                      }`}>
                        {product.stock} {product.unit}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setEditingProduct(product)}
                          className="text-primary-600 hover:text-primary-900"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(product.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty State */}
      {filteredProducts.length === 0 && (
        <div className="text-center py-12">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron productos</h3>
          <p className="text-gray-500">Intenta ajustar los filtros de búsqueda</p>
        </div>
      )}

      {/* Add/Edit Modal */}
      {(showAddModal || editingProduct) && (
        <ProductModal
          product={editingProduct}
          onSave={editingProduct ? handleEditProduct : handleAddProduct}
          onCancel={() => {
            setShowAddModal(false);
            setEditingProduct(null);
          }}
          categories={categories}
        />
      )}
    </div>
  );
};

const ProductModal = ({ product, onSave, onCancel, categories }) => {
  const [formData, setFormData] = useState({
    name: product?.name || '',
    description: product?.description || '',
    category: product?.category || '',
    price: product?.price || '',
    stock: product?.stock || '',
    unit: product?.unit || 'kg',
    origin: product?.origin || 'Tucumán',
    image: product?.image || '🥩'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-4 mx-auto p-5 border w-11/12 md:w-96 shadow-lg rounded-xl bg-white">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {product ? 'Editar Producto' : 'Agregar Producto'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre del Producto
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descripción
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                rows="3"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Categoría
                </label>
                <select
                  required
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">Seleccionar categoría</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.name}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Unidad
                </label>
                <select
                  required
                  value={formData.unit}
                  onChange={(e) => setFormData({...formData, unit: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="kg">kg</option>
                  <option value="unidad">unidad</option>
                  <option value="litro">litro</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Precio
                </label>
                <input
                  type="number"
                  required
                  value={formData.price}
                  onChange={(e) => setFormData({...formData, price: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Stock
                </label>
                <input
                  type="number"
                  required
                  value={formData.stock}
                  onChange={(e) => setFormData({...formData, stock: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Origen
              </label>
              <input
                type="text"
                value={formData.origin}
                onChange={(e) => setFormData({...formData, origin: e.target.value})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Emoji/Ícono
              </label>
              <input
                type="text"
                value={formData.image}
                onChange={(e) => setFormData({...formData, image: e.target.value})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="🥩"
              />
            </div>
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onCancel}
                className="btn btn-secondary"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="btn btn-primary"
              >
                {product ? 'Actualizar' : 'Agregar'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Products; 