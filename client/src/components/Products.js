import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { categories } from '../data/products';
import { Package, Plus, Edit, Trash2, Search, Filter, Grid, List, RefreshCw, AlertTriangle, TrendingUp, DollarSign, ChevronLeft, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db } from '../firebase';
import { productService } from '../services/firebaseService';

// Componente de producto optimizado con memo
const ProductCard = memo(({ product, onEdit, onDelete, getCategoryColor, getStockStatus }) => {
  const stockStatus = getStockStatus(product.stock, product.minStock);
  
  return (
    <div className="card hover:transform hover:scale-105 transition-all duration-300">
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
          <span className="text-lg font-bold text-gray-900">${(Number(product.price) || 0).toLocaleString()}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-500">Stock:</span>
          <span className={`text-sm font-medium text-${stockStatus.color}-600`}>
            {(Number(product.stock) || 0)} {product.unit || ''}
          </span>
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

      <div className="flex space-x-2">
        <button
          onClick={() => onEdit(product)}
          className="flex-1 btn btn-secondary text-xs py-2 flex items-center justify-center"
        >
          <Edit className="h-3 w-3 mr-1" />
          Editar
        </button>
        <button
          onClick={() => onDelete(product.id)}
          className="flex-1 btn btn-danger text-xs py-2 flex items-center justify-center"
        >
          <Trash2 className="h-3 w-3 mr-1" />
          Eliminar
        </button>
      </div>
    </div>
  );
});

// Componente de tabla optimizado con memo
const ProductTable = memo(({ products, onEdit, onDelete, getCategoryColor, getStockStatus }) => {
  return (
    <div className="table-container">
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
                Ventas
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {products.map(product => {
              const stockStatus = getStockStatus(product.stock, product.minStock);
              return (
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
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    ${(Number(product.price) || 0).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`text-sm font-medium text-${stockStatus.color}-600`}>
                      {(Number(product.stock) || 0)} {product.unit || ''}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                     {Number(product.salesCount) || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => onEdit(product)}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => onDelete(product.id)}
                        className="text-red-600 hover:text-red-900"
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

// Componente de paginación optimizado
const Pagination = memo(({ currentPage, totalPages, onPageChange }) => {
  const pages = useMemo(() => {
    const pagesArray = [];
    const maxVisible = 5;
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pagesArray.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pagesArray.push(i);
        }
        pagesArray.push('...');
        pagesArray.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pagesArray.push(1);
        pagesArray.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pagesArray.push(i);
        }
      } else {
        pagesArray.push(1);
        pagesArray.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pagesArray.push(i);
        }
        pagesArray.push('...');
        pagesArray.push(totalPages);
      }
    }
    
    return pagesArray;
  }, [currentPage, totalPages]);

  return (
    <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200 sm:px-6">
      <div className="flex-1 flex justify-between sm:hidden">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Anterior
        </button>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Siguiente
        </button>
      </div>
      <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-gray-700">
            Página <span className="font-medium">{currentPage}</span> de{' '}
            <span className="font-medium">{totalPages}</span>
          </p>
        </div>
        <div>
          <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            
            {pages.map((page, index) => (
              <button
                key={index}
                onClick={() => typeof page === 'number' && onPageChange(page)}
                disabled={typeof page !== 'number'}
                className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                  page === currentPage
                    ? 'z-10 bg-orange-50 border-orange-500 text-orange-600'
                    : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                } ${typeof page !== 'number' ? 'cursor-default' : 'cursor-pointer'}`}
              >
                {page}
              </button>
            ))}
            
            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </nav>
        </div>
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
  const [viewMode, setViewMode] = useState('grid');
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  
  // Estados para paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Cargar productos en tiempo real sin cache local ni servicios
  useEffect(() => {
    setLoading(true);
    const unsub = onSnapshot(query(collection(db, 'products'), orderBy('name')), (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setProductList(Array.isArray(list) ? list : []);
      setTotalPages(1);
      setLoading(false);
    }, (err) => {
      console.error('❌ Error onSnapshot productos:', err);
      toast.error('No se pudieron cargar productos');
      setProductList([]);
      setTotalPages(1);
      setLoading(false);
    });
    return () => { try { unsub(); } catch {} };
  }, []);

  // Filtrar productos con useMemo para mejor rendimiento
  const filteredProducts = useMemo(() => {
    return productList.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          product.description.toLowerCase().includes(searchTerm.toLowerCase());
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
      
      // No forzar estado local; onSnapshot actualizará la lista
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
      
      // No forzar estado local; onSnapshot actualizará la lista
      
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
    try {
      setSyncing(true);
      console.log('🔄 Eliminando producto...');
      
      await productService.deleteProduct(id);
      
      // No forzar estado local; onSnapshot actualizará la lista
      toast.success('Producto eliminado exitosamente');
    } catch (error) {
      console.error('❌ Error eliminando producto:', error);
      toast.error('Error al eliminar producto');
    } finally {
      setSyncing(false);
    }
  }, []);

  // Handlers de paginación
  const handlePageChange = useCallback((page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Handler para refrescar productos
  const handleRefresh = useCallback(async () => {
    toast.success('Productos actualizados');
  }, []);

  // Handler para forzar recarga de datos
  const handleForceReload = useCallback(async () => {
    try {
      setSyncing(true);
      console.log('🔄 Forzando recarga de datos...');
      setProductList([]);
      setCurrentPage(1);
      toast.success('Datos recargados exitosamente');
    } finally {
      setSyncing(false);
    }
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

  const handleDeleteClick = useCallback((id) => {
    handleDeleteProduct(id);
  }, [handleDeleteProduct]);

  if (loading) {
    return (
      <div className="p-4 lg:p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="loading-spinner mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando productos...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 space-y-4">
      {/* Header Mejorado */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
            Productos
          </h1>
          <p className="mt-2 text-gray-600">Gestiona el catálogo de productos de la carnicería</p>
        </div>
        <div className="flex space-x-2 w-full sm:w-auto">
          <button
            onClick={handleRefresh}
            disabled={syncing}
            className="btn btn-secondary flex items-center justify-center"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
          <button
            onClick={handleForceReload}
            disabled={syncing}
            className="btn btn-secondary flex items-center justify-center"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
            Recargar Datos
          </button>
          <button
            onClick={handleViewModeToggle}
            className="btn btn-secondary flex items-center justify-center"
          >
            {viewMode === 'grid' ? <List className="h-4 w-4 mr-2" /> : <Grid className="h-4 w-4 mr-2" />}
            {viewMode === 'grid' ? 'Lista' : 'Grid'}
          </button>
          <button
            onClick={handleShowAddModal}
            className="btn btn-primary flex items-center w-full sm:w-auto justify-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Agregar Producto
          </button>
        </div>
      </div>

      {/* Stats Cards Optimizadas */}
      <StatsCards stats={stats} />

      {/* Filters Optimizados */}
      <Filters 
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        categoryFilter={categoryFilter}
        setCategoryFilter={setCategoryFilter}
        categories={categories}
        onClearFilters={handleClearFilters}
      />

      {/* Products Display Optimizado */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6">
          {filteredProducts.map(product => (
            <ProductCard
              key={product.id}
              product={product}
              onEdit={handleEditClick}
              onDelete={handleDeleteClick}
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
          getCategoryColor={getCategoryColor}
          getStockStatus={getStockStatus}
        />
      )}

      {/* Pagination Optimizada */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
      />

      {/* Empty State Mejorado */}
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
          syncing={syncing}
        />
      )}
    </div>
  );
};

// ProductModal optimizado con memo
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
      <div className="modal-content p-6">
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
                  <div className="loading-spinner mr-2"></div>
                  {product ? 'Actualizando...' : 'Agregando...'}
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

export default Products; 