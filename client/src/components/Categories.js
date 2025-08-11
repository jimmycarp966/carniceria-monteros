import React, { useState } from 'react';
import { categories } from '../data/products';
import { Tag, Plus, Edit, Trash2, Search, Package } from 'lucide-react';
import { toast } from 'react-toastify';

const Categories = () => {
  const [categoryList, setCategoryList] = useState(categories);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);

  // Filtrar categorías
  const filteredCategories = categoryList.filter(category => {
    return category.name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Estadísticas
  const stats = {
    total: categoryList.length,
    totalProducts: categoryList.reduce((sum, c) => sum + (c.productCount || 0), 0),
    activeCategories: categoryList.filter(c => c.active !== false).length,
    topCategory: categoryList.reduce((max, c) => 
      (c.productCount || 0) > (max.productCount || 0) ? c : max
    , categoryList[0] || {})
  };

  const handleAddCategory = (newCategory) => {
    const category = {
      ...newCategory,
      id: Date.now(),
      productCount: 0
    };
    setCategoryList(prev => [category, ...prev]);
    setShowAddModal(false);
    toast.success('Categoría agregada exitosamente');
  };

  const handleEditCategory = (updatedCategory) => {
    setCategoryList(prev => 
      prev.map(c => c.id === updatedCategory.id ? updatedCategory : c)
    );
    setShowEditModal(false);
    setSelectedCategory(null);
    toast.success('Categoría actualizada exitosamente');
  };

  const handleDeleteCategory = (id) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta categoría?')) {
      setCategoryList(prev => prev.filter(c => c.id !== id));
      toast.success('Categoría eliminada exitosamente');
    }
  };

  const getColorClass = (color) => {
    const colorMap = {
      red: 'bg-red-100 text-red-800',
      blue: 'bg-blue-100 text-blue-800',
      green: 'bg-green-100 text-green-800',
      yellow: 'bg-yellow-100 text-yellow-800',
      purple: 'bg-purple-100 text-purple-800',
      orange: 'bg-orange-100 text-orange-800',
      gray: 'bg-gray-100 text-gray-800'
    };
    return colorMap[color] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gradient">
            Categorías
          </h1>
          <p className="text-gray-600 mt-1">
            Gestiona las categorías de productos
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="btn btn-primary"
        >
          <Plus className="h-4 w-4 mr-2" />
          Agregar Categoría
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <div className="stats-card">
          <div className="flex items-center">
            <Tag className="h-5 w-5 lg:h-6 lg:w-6 text-blue-600" />
            <div className="ml-2 lg:ml-3">
              <p className="stats-label text-xs lg:text-sm">Total Categorías</p>
              <p className="stats-value text-lg lg:text-xl">{stats.total}</p>
            </div>
          </div>
        </div>
        <div className="stats-card">
          <div className="flex items-center">
            <Package className="h-5 w-5 lg:h-6 lg:w-6 text-green-600" />
            <div className="ml-2 lg:ml-3">
              <p className="stats-label text-xs lg:text-sm">Total Productos</p>
              <p className="stats-value text-lg lg:text-xl">{stats.totalProducts}</p>
            </div>
          </div>
        </div>
        <div className="stats-card">
          <div className="flex items-center">
            <Tag className="h-5 w-5 lg:h-6 lg:w-6 text-purple-600" />
            <div className="ml-2 lg:ml-3">
              <p className="stats-label text-xs lg:text-sm">Activas</p>
              <p className="stats-value text-lg lg:text-xl">{stats.activeCategories}</p>
            </div>
          </div>
        </div>
        <div className="stats-card">
          <div className="flex items-center">
            <Package className="h-5 w-5 lg:h-6 lg:w-6 text-orange-600" />
            <div className="ml-2 lg:ml-3">
              <p className="stats-label text-xs lg:text-sm">Top Categoría</p>
              <p className="stats-value text-lg lg:text-xl">{stats.topCategory?.name || 'N/A'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4 lg:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="form-label text-sm lg:text-base">Buscar Categoría</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nombre..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="form-input pl-10 text-sm lg:text-base"
              />
            </div>
          </div>
          <div className="sm:col-span-2 lg:col-span-2">
            <button
              onClick={() => setSearchTerm('')}
              className="btn btn-secondary w-full text-sm lg:text-base"
            >
              Limpiar Filtros
            </button>
          </div>
        </div>
      </div>

      {/* Categories List */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6">
        {filteredCategories.map(category => (
          <div key={category.id} className="card hover:shadow-lg transition-all duration-300 group p-5 lg:p-6">
            {/* Header del card */}
            <div className="flex items-start justify-between mb-4 lg:mb-5">
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-3 lg:space-x-4 mb-3">
                  <div className="text-3xl lg:text-4xl flex-shrink-0">🏷️</div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg lg:text-xl font-semibold text-gray-900 truncate mb-1">{category.name}</h3>
                    <p className="text-sm lg:text-base text-gray-500 truncate leading-relaxed">{category.description}</p>
                  </div>
                </div>
                <span className={`inline-flex px-3 py-1.5 text-xs font-semibold rounded-full ${getColorClass(category.color)}`}>
                  {category.active !== false ? 'Activa' : 'Inactiva'}
                </span>
              </div>
            </div>
            
            {/* Información de la categoría */}
            <div className="space-y-4 mb-5 lg:mb-6">
              <div className="flex justify-between items-center py-2">
                <span className="text-sm lg:text-base text-gray-600 font-medium">Productos:</span>
                <span className="text-sm lg:text-base font-semibold text-blue-600">
                  {category.productCount || 0}
                </span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm lg:text-base text-gray-600 font-medium">Color:</span>
                <div className="flex items-center space-x-2">
                  <div className={`w-4 h-4 rounded-full bg-${category.color}-500`}></div>
                  <span className="text-sm lg:text-base text-gray-700 capitalize">{category.color}</span>
                </div>
              </div>
              {category.createdAt && (
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm lg:text-base text-gray-600 font-medium">Creada:</span>
                  <span className="text-sm lg:text-base text-gray-700">
                    {new Date(category.createdAt).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>

            {/* Acciones */}
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setSelectedCategory(category);
                  setShowEditModal(true);
                }}
                className="flex-1 btn btn-secondary text-sm lg:text-base py-3 flex items-center justify-center font-medium"
              >
                <Edit className="h-4 w-4 lg:h-5 lg:w-5 mr-2" />
                Editar
              </button>
              <button
                onClick={() => handleDeleteCategory(category.id)}
                className="btn btn-danger text-sm lg:text-base py-3 px-4 lg:px-5 flex items-center justify-center font-medium"
              >
                <Trash2 className="h-4 w-4 lg:h-5 lg:w-5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredCategories.length === 0 && (
        <div className="text-center py-8 lg:py-12">
          <Tag className="h-12 w-12 lg:h-16 lg:w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg lg:text-xl font-medium text-gray-900 mb-2">No se encontraron categorías</h3>
          <p className="text-sm lg:text-base text-gray-500 mb-4 px-4">Intenta ajustar los filtros de búsqueda</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn btn-primary text-sm lg:text-base"
          >
            <Plus className="h-4 w-4 mr-2" />
            Agregar Primera Categoría
          </button>
        </div>
      )}

      {/* Modals */}
      {showAddModal && (
        <CategoryModal
          onSave={handleAddCategory}
          onCancel={() => setShowAddModal(false)}
        />
      )}

      {showEditModal && selectedCategory && (
        <CategoryModal
          category={selectedCategory}
          onSave={handleEditCategory}
          onCancel={() => {
            setShowEditModal(false);
            setSelectedCategory(null);
          }}
        />
      )}
    </div>
  );
};

const CategoryModal = ({ category, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    name: category?.name || '',
    description: category?.description || '',
    color: category?.color || 'blue',
    active: category?.active !== false
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const colors = [
    { name: 'Azul', value: 'blue' },
    { name: 'Verde', value: 'green' },
    { name: 'Rojo', value: 'red' },
    { name: 'Amarillo', value: 'yellow' },
    { name: 'Púrpura', value: 'purple' },
    { name: 'Naranja', value: 'orange' },
    { name: 'Gris', value: 'gray' }
  ];

  return (
    <div className="modal-overlay">
      <div className="modal-content p-4 lg:p-6 max-w-md mx-4">
        <div className="flex items-center justify-between mb-4 lg:mb-6">
          <h3 className="text-lg lg:text-xl font-bold text-gray-900">
            {category ? 'Editar Categoría' : 'Agregar Categoría'}
          </h3>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 p-1"
          >
            <svg className="h-5 w-5 lg:h-6 lg:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="form-label text-sm lg:text-base">Nombre</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="form-input text-sm lg:text-base"
            />
          </div>
          <div>
            <label className="form-label text-sm lg:text-base">Descripción</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              rows="3"
              className="form-input text-sm lg:text-base"
            />
          </div>
          <div>
            <label className="form-label text-sm lg:text-base">Color</label>
            <select
              value={formData.color}
              onChange={(e) => setFormData({...formData, color: e.target.value})}
              className="form-select text-sm lg:text-base"
            >
              {colors.map(color => (
                <option key={color.value} value={color.value}>
                  {color.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="active"
              checked={formData.active}
              onChange={(e) => setFormData({...formData, active: e.target.checked})}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <label htmlFor="active" className="ml-2 text-sm lg:text-base text-gray-700">
              Categoría activa
            </label>
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="btn btn-secondary text-sm lg:text-base"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn btn-primary text-sm lg:text-base"
            >
              {category ? 'Actualizar' : 'Agregar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Categories; 