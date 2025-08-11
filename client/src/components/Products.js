import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { categories } from '../data/products';
import { 
  Package, 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  Filter, 
  Grid, 
  List, 
  RefreshCw, 
  AlertTriangle, 
  TrendingUp, 
  DollarSign,
  Eye,
  MoreVertical
} from 'lucide-react';
import { toast } from 'react-toastify';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db } from '../firebase';
import { productService } from '../services/firebaseService';
import LoadingSpinner from './LoadingSpinner';

// Componente de producto optimizado con memo
const ProductCard = memo(({ product, onEdit, onDelete, onView, getCategoryColor, getStockStatus }) => {
  const stockStatus = getStockStatus(product.stock, product.minStock);
  
  return (
    <div className="card hover:shadow-lg transition-all duration-300 group">
      {/* Header del card */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-3 mb-2">
            <div className="text-3xl">{product.image}</div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-gray-900 truncate">{product.name}</h3>
              <p className="text-sm text-gray-500 truncate">{product.description}</p>
            </div>
          </div>
          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-${getCategoryColor(product.category)}-100 text-${getCategoryColor(product.category)}-800`}>
            {product.category}
          </span>
        </div>
        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="dropdown relative">
            <button className="p-1 rounded-full hover:bg-gray-100">
              <MoreVertical className="h-4 w-4 text-gray-500" />
            </button>
            <div className="dropdown-menu absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-10">
              <button
                onClick={() => onView(product)}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
              >
                <Eye className="h-4 w-4 mr-2" />
                Ver detalles
              </button>
              <button
                onClick={() => onEdit(product)}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
              >
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </button>
              <button
                onClick={() => onDelete(product.id)}
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Eliminar
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Información del producto */}
      <div className="space-y-3 mb-4">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-500">Precio:</span>
          <span className="text-xl font-bold text-gray-900">${(Number(product.price) || 0).toLocaleString()}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-500">Stock:</span>
          <div className="flex items-center space-x-2">
            <span className={`text-sm font-medium text-${stockStatus.color}-600`}>
              {(Number(product.stock) || 0)} {product.unit || ''}
            </span>
            <div className={`w-2 h-2 rounded-full bg-${stockStatus.color}-500`}></div>
          </div>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-500">Origen:</span>
          <span className="text-sm text-gray-700">{product.origin}</span>
        </div>
        {product.salesCount > 0 && (
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500">Ventas:</span>
            <span className="text-sm text-blue-600 font-medium">{product.salesCount}</span>
          </div>
        )}
      </div>

      {/* Acciones rápidas */}
      <div className="flex space-x-2">
        <button
          onClick={() => onEdit(product)}
          className="flex-1 btn btn-secondary text-sm py-2 flex items-center justify-center"
        >
          <Edit className="h-4 w-4 mr-1" />
          Editar
        </button>
        <button
          onClick={() => onDelete(product.id)}
          className="btn btn-danger text-sm py-2 px-3 flex items-center justify-center"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
});

// Componente de tabla optimizado con memo
const ProductTable = memo(({ products, onEdit, onDelete, onView, getCategoryColor, getStockStatus }) => {
  return (
    <div className="card">
      <div className="overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              <th>Producto</th>
              <th>Categoría</th>
              <th>Precio</th>
              <th>Stock</th>
              <th>Ventas</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {products.map(product => {
              const stockStatus = getStockStatus(product.stock, product.minStock);
              return (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td>
                    <div className="flex items-center">
                      <div className="text-2xl mr-3">{product.image}</div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{product.name}</div>
                        <div className="text-sm text-gray-500">{product.description}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={`badge badge-${getCategoryColor(product.category)}`}>
                      {product.category}
                    </span>
                  </td>
                  <td className="font-medium text-gray-900">
                    ${(Number(product.price) || 0).toLocaleString()}
                  </td>
                  <td>
                    <div className="flex items-center space-x-2">
                      <span className={`text-sm font-medium text-${stockStatus.color}-600`}>
                        {(Number(product.stock) || 0)} {product.unit || ''}
                      </span>
                      <div className={`w-2 h-2 rounded-full bg-${stockStatus.color}-500`}></div>
                    </div>
                  </td>
                  <td className="text-sm text-gray-500">
                    {Number(product.salesCount) || 0}
                  </td>
                  <td>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => onView(product)}
                        className="p-1 text-gray-400 hover:text-gray-600"
                        title="Ver detalles"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => onEdit(product)}
                        className="p-1 text-blue-400 hover:text-blue-600"
                        title="Editar"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => onDelete(product.id)}
                        className="p-1 text-red-400 hover:text-red-600"
                        title="Eliminar"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
});

// Componente de estadísticas optimizado con memo
const StatsCards = memo(({ stats }) => {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
      <div className="stats-card">
        <div className="flex items-center">
          <Package className="h-6 w-6 text-orange-600" />
          <div className="ml-3">
            <p className="stats-label">Total</p>
            <p className="stats-value">{stats.total}</p>
          </div>
        </div>
      </div>
      <div className="stats-card">
        <div className="flex items-center">
          <TrendingUp className="h-6 w-6 text-green-600" />
          <div className="ml-3">
            <p className="stats-label">En Stock</p>
            <p className="stats-value">{stats.inStock}</p>
          </div>
        </div>
      </div>
      <div className="stats-card">
        <div className="flex items-center">
          <AlertTriangle className="h-6 w-6 text-yellow-600" />
          <div className="ml-3">
            <p className="stats-label">Stock Bajo</p>
            <p className="stats-value">{stats.lowStock}</p>
          </div>
        </div>
      </div>
      <div className="stats-card">
        <div className="flex items-center">
          <Package className="h-6 w-6 text-red-600" />
          <div className="ml-3">
            <p className="stats-label">Sin Stock</p>
            <p className="stats-value">{stats.outOfStock}</p>
          </div>
        </div>
      </div>
      <div className="stats-card">
        <div className="flex items-center">
          <Filter className="h-6 w-6 text-purple-600" />
          <div className="ml-3">
            <p className="stats-label">Categorías</p>
            <p className="stats-value">{stats.categories}</p>
          </div>
        </div>
      </div>
      <div className="stats-card">
        <div className="flex items-center">
          <DollarSign className="h-6 w-6 text-blue-600" />
          <div className="ml-3">
            <p className="stats-label">Valor Total</p>
            <p className="stats-value">
              ${(stats.totalValue / 1000).toFixed(0)}k
            </p>
          </div>
        </div>
      </div>
    </div>
  );
});

// Componente de filtros optimizado con memo
const Filters = memo(({ searchTerm, setSearchTerm, categoryFilter, setCategoryFilter, categories, onClearFilters }) => {
  return (
    <div className="card">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div>
          <label className="form-label">Buscar Producto</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nombre o descripción..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-input pl-10"
            />
          </div>
        </div>
        <div>
          <label className="form-label">Filtrar por Categoría</label>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="form-select"
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
            onClick={onClearFilters}
            className="btn btn-secondary w-full flex items-center justify-center"
          >
            <Filter className="h-4 w-4 mr-2" />
            Limpiar Filtros
          </button>
        </div>
      </div>
    </div>
  );
});

const Products = () => {
  const [productList, setProductList] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [viewingProduct, setViewingProduct] = useState(null);
  const [viewMode, setViewMode] = useState('grid');
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  // Cargar productos en tiempo real
  useEffect(() => {
    setLoading(true);
    const unsub = onSnapshot(query(collection(db, 'products'), orderBy('name')), (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setProductList(Array.isArray(list) ? list : []);
      setLoading(false);
    }, (err) => {
      console.error('❌ Error onSnapshot productos:', err);
      toast.error('No se pudieron cargar productos');
      setProductList([]);
      setLoading(false);
    });
    return () => { try { unsub(); } catch {} };
  }, []);

  // Filtrar productos con useMemo para mejor rendimiento
  const filteredProducts = useMemo(() => {
    return productList.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          product.description?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = !categoryFilter || product.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [productList, searchTerm, categoryFilter]);

  // Estadísticas optimizadas
  const stats = useMemo(() => {
    const inStock = productList.filter(p => p.stock > 0).length;
    const lowStock = productList.filter(p => p.stock <= 10 && p.stock > 0).length;
    const outOfStock = productList.filter(p => p.stock === 0).length;
    const totalValue = productList.reduce((sum, p) => sum + (p.price * p.stock), 0);

    return {
      total: productList.length,
      categories: categories.length,
      inStock,
      lowStock,
      outOfStock,
      totalValue
    };
  }, [productList]);

  // Handlers optimizados con useCallback
  const handleAddProduct = useCallback(async (newProduct) => {
    try {
      setSyncing(true);
      console.log('🔄 Agregando producto...');
      
      const productData = {
        ...newProduct,
        stock: parseInt(newProduct.stock),
        price: parseFloat(newProduct.price),
        minStock: parseInt(newProduct.minStock) || 10,
        salesCount: 0
      };
      
      const productId = await productService.addProduct(productData);
      console.log('✅ Producto agregado con ID:', productId);
      
      setShowAddModal(false);
      toast.success('Producto agregado exitosamente');
    } catch (error) {
      console.error('❌ Error agregando producto:', error);
      toast.error('Error al agregar producto');
    } finally {
      setSyncing(false);
    }
  }, []);

  const handleEditProduct = useCallback(async (updatedProduct) => {
    try {
      setSyncing(true);
      console.log('🔄 Actualizando producto...');
      
      const productData = {
        ...updatedProduct,
        stock: parseInt(updatedProduct.stock),
        price: parseFloat(updatedProduct.price),
        minStock: parseInt(updatedProduct.minStock) || 10
      };
      
      await productService.updateProduct(updatedProduct.id, productData);
      
      setEditingProduct(null);
      toast.success('Producto actualizado exitosamente');
    } catch (error) {
      console.error('❌ Error actualizando producto:', error);
      toast.error('Error al actualizar producto');
    } finally {
      setSyncing(false);
    }
  }, []);

  const handleDeleteProduct = useCallback(async (id) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este producto?')) {
      try {
        setSyncing(true);
        console.log('🔄 Eliminando producto...');
        
        await productService.deleteProduct(id);
        
        toast.success('Producto eliminado exitosamente');
      } catch (error) {
        console.error('❌ Error eliminando producto:', error);
        toast.error('Error al eliminar producto');
      } finally {
        setSyncing(false);
      }
    }
  }, []);

  // Handler para refrescar productos
  const handleRefresh = useCallback(async () => {
    toast.success('Productos actualizados');
  }, []);

  // Funciones de utilidad memoizadas
  const getCategoryColor = useCallback((category) => {
    const colors = {
      'Carnes Rojas': 'red',
      'Carnes Blancas': 'blue',
      'Embutidos': 'purple',
      'Aves': 'green',
      'Pescados': 'cyan',
      'Otros': 'gray'
    };
    return colors[category] || 'gray';
  }, []);

  const getStockStatus = useCallback((stock, minStock) => {
    if (stock === 0) return { color: 'red', text: 'Sin stock' };
    if (stock <= minStock) return { color: 'yellow', text: 'Stock bajo' };
    return { color: 'green', text: 'En stock' };
  }, []);

  const handleClearFilters = useCallback(() => {
    setSearchTerm('');
    setCategoryFilter('');
  }, []);

  const handleViewModeToggle = useCallback(() => {
    setViewMode(prev => prev === 'grid' ? 'list' : 'grid');
  }, []);

  const handleShowAddModal = useCallback(() => {
    setShowAddModal(true);
  }, []);

  const handleEditClick = useCallback((product) => {
    setEditingProduct(product);
  }, []);

  const handleViewClick = useCallback((product) => {
    setViewingProduct(product);
  }, []);

  const handleDeleteClick = useCallback((id) => {
    handleDeleteProduct(id);
  }, [handleDeleteProduct]);

  if (loading) {
    return (
      <div className="p-4 lg:p-6">
        <LoadingSpinner size="lg" text="Cargando productos..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Mejorado */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gradient">
            Productos
          </h1>
          <p className="text-gray-600 mt-1">
            Gestiona el catálogo de productos de la carnicería
          </p>
        </div>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <button
            onClick={handleRefresh}
            disabled={syncing}
            className="btn btn-secondary"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
          <button
            onClick={handleViewModeToggle}
            className="btn btn-secondary"
          >
            {viewMode === 'grid' ? <List className="h-4 w-4 mr-2" /> : <Grid className="h-4 w-4 mr-2" />}
            {viewMode === 'grid' ? 'Lista' : 'Grid'}
          </button>
          <button
            onClick={handleShowAddModal}
            className="btn btn-primary"
          >
            <Plus className="h-4 w-4 mr-2" />
            Agregar Producto
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <StatsCards stats={stats} />

      {/* Filters */}
      <Filters 
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        categoryFilter={categoryFilter}
        setCategoryFilter={setCategoryFilter}
        categories={categories}
        onClearFilters={handleClearFilters}
      />

      {/* Products Display */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6">
          {filteredProducts.map(product => (
            <ProductCard
              key={product.id}
              product={product}
              onEdit={handleEditClick}
              onDelete={handleDeleteClick}
              onView={handleViewClick}
              getCategoryColor={getCategoryColor}
              getStockStatus={getStockStatus}
            />
          ))}
        </div>
      ) : (
        <ProductTable
          products={filteredProducts}
          onEdit={handleEditClick}
          onDelete={handleDeleteClick}
          onView={handleViewClick}
          getCategoryColor={getCategoryColor}
          getStockStatus={getStockStatus}
        />
      )}

      {/* Empty State */}
      {filteredProducts.length === 0 && (
        <div className="text-center py-12">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron productos</h3>
          <p className="text-gray-500 mb-4">Intenta ajustar los filtros de búsqueda</p>
          <button
            onClick={handleShowAddModal}
            className="btn btn-primary"
          >
            <Plus className="h-4 w-4 mr-2" />
            Agregar Primer Producto
          </button>
        </div>
      )}

      {/* Modals */}
      {(showAddModal || editingProduct) && (
        <ProductModal
          product={editingProduct}
          onSave={editingProduct ? handleEditProduct : handleAddProduct}
          onCancel={() => {
            setShowAddModal(false);
            setEditingProduct(null);
          }}
          categories={categories}
          syncing={syncing}
        />
      )}

      {viewingProduct && (
        <ProductViewModal
          product={viewingProduct}
          onClose={() => setViewingProduct(null)}
          getCategoryColor={getCategoryColor}
          getStockStatus={getStockStatus}
        />
      )}
    </div>
  );
};

// ProductModal optimizado
const ProductModal = memo(({ product, onSave, onCancel, categories, syncing }) => {
  const [formData, setFormData] = useState({
    name: product?.name || '',
    description: product?.description || '',
    category: product?.category || '',
    price: product?.price || '',
    stock: product?.stock || '',
    minStock: product?.minStock || 10,
    unit: product?.unit || 'kg',
    origin: product?.origin || 'Tucumán',
    image: product?.image || '🥩'
  });

  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    onSave(formData);
  }, [formData, onSave]);

  const handleInputChange = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  return (
    <div className="modal-overlay">
      <div className="modal-content p-6 max-w-2xl">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900">
            {product ? 'Editar Producto' : 'Agregar Producto'}
          </h3>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="form-label">Nombre del Producto</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="form-input"
                placeholder="Ej: Asado de Tira"
              />
            </div>
            <div>
              <label className="form-label">Categoría</label>
              <select
                required
                value={formData.category}
                onChange={(e) => handleInputChange('category', e.target.value)}
                className="form-select"
              >
                <option value="">Seleccionar categoría</option>
                {categories.map(category => (
                  <option key={category.id} value={category.name}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="form-label">Descripción</label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows="3"
              className="form-input"
              placeholder="Descripción del producto..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="form-label">Precio</label>
              <input
                type="number"
                required
                value={formData.price}
                onChange={(e) => handleInputChange('price', e.target.value)}
                className="form-input"
                placeholder="0"
                min="0"
                step="0.01"
              />
            </div>
            <div>
              <label className="form-label">Stock</label>
              <input
                type="number"
                required
                value={formData.stock}
                onChange={(e) => handleInputChange('stock', e.target.value)}
                className="form-input"
                placeholder="0"
                min="0"
              />
            </div>
            <div>
              <label className="form-label">Stock Mínimo</label>
              <input
                type="number"
                required
                value={formData.minStock}
                onChange={(e) => handleInputChange('minStock', e.target.value)}
                className="form-input"
                placeholder="10"
                min="0"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="form-label">Unidad</label>
              <select
                required
                value={formData.unit}
                onChange={(e) => handleInputChange('unit', e.target.value)}
                className="form-select"
              >
                <option value="kg">kg</option>
                <option value="unidad">unidad</option>
                <option value="litro">litro</option>
                <option value="gramo">gramo</option>
              </select>
            </div>
            <div>
              <label className="form-label">Origen</label>
              <input
                type="text"
                value={formData.origin}
                onChange={(e) => handleInputChange('origin', e.target.value)}
                className="form-input"
                placeholder="Tucumán"
              />
            </div>
            <div>
              <label className="form-label">Emoji/Ícono</label>
              <input
                type="text"
                value={formData.image}
                onChange={(e) => handleInputChange('image', e.target.value)}
                className="form-input"
                placeholder="🥩"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="btn btn-secondary"
              disabled={syncing}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={syncing}
            >
              {syncing ? (
                <>
                  <LoadingSpinner size="sm" text="" showIcon={false} />
                  <span className="ml-2">{product ? 'Actualizando...' : 'Agregando...'}</span>
                </>
              ) : (
                product ? 'Actualizar' : 'Agregar'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
});

// ProductViewModal para ver detalles del producto
const ProductViewModal = memo(({ product, onClose, getCategoryColor, getStockStatus }) => {
  const stockStatus = getStockStatus(product.stock, product.minStock);
  
  return (
    <div className="modal-overlay">
      <div className="modal-content p-6 max-w-lg">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900">Detalles del Producto</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center space-x-4">
            <div className="text-4xl">{product.image}</div>
            <div>
              <h4 className="text-xl font-semibold text-gray-900">{product.name}</h4>
              <span className={`badge badge-${getCategoryColor(product.category)}`}>
                {product.category}
              </span>
            </div>
          </div>
          
          <div>
            <p className="text-gray-600">{product.description}</p>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Precio</label>
              <p className="text-lg font-bold text-gray-900">${(Number(product.price) || 0).toLocaleString()}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Stock</label>
              <p className={`text-lg font-bold text-${stockStatus.color}-600`}>
                {(Number(product.stock) || 0)} {product.unit || ''}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Stock Mínimo</label>
              <p className="text-lg font-medium text-gray-900">{product.minStock || 10}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Unidad</label>
              <p className="text-lg font-medium text-gray-900">{product.unit || 'kg'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Origen</label>
              <p className="text-lg font-medium text-gray-900">{product.origin}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Ventas</label>
              <p className="text-lg font-medium text-blue-600">{product.salesCount || 0}</p>
            </div>
          </div>
          
          <div className="flex justify-end pt-4">
            <button
              onClick={onClose}
              className="btn btn-secondary"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

export default Products; 