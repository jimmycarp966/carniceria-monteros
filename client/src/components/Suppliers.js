import React, { useState, useEffect } from 'react';
import { supplierCategories, supplierStatuses } from '../data/suppliers';
import { suppliersService } from '../services/firebaseService';
import { Truck, Plus, Edit, Trash2, Search, DollarSign, AlertTriangle, Package } from 'lucide-react';
import { toast } from 'react-toastify';
import LoadingSpinner from './LoadingSpinner';

const Suppliers = () => {
  const [supplierList, setSupplierList] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [loading, setLoading] = useState(true);

  // Cargar proveedores desde Firestore
  useEffect(() => {
    const loadSuppliers = async () => {
      try {
        setLoading(true);
        const list = await suppliersService.getAllSuppliers();
        setSupplierList(list);
      } catch (e) {
        console.error('Error cargando proveedores:', e);
        toast.error('Error al cargar proveedores');
      } finally {
        setLoading(false);
      }
    };
    loadSuppliers();
  }, []);

  // Filtrar proveedores
  const filteredSuppliers = supplierList.filter(supplier => {
    const matchesSearch = supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         supplier.contact.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !categoryFilter || supplier.category === categoryFilter;
    const matchesStatus = !statusFilter || supplier.status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Estadísticas
  const stats = {
    total: supplierList.length,
    active: supplierList.filter(s => s.status === 'active').length,
    overdue: supplierList.filter(s => s.status === 'overdue').length,
    totalOrdered: supplierList.reduce((sum, s) => sum + s.totalOrdered, 0),
    totalPaid: supplierList.reduce((sum, s) => sum + s.totalPaid, 0),
    totalOwed: supplierList.reduce((sum, s) => sum + s.totalOwed, 0)
  };

  const handleAddSupplier = async (newSupplier) => {
    try {
      const supplierData = {
        ...newSupplier,
        status: 'active',
        totalOrdered: 0,
        totalPaid: 0,
        totalOwed: 0,
        lastOrder: new Date().toISOString().split('T')[0]
      };
      const id = await suppliersService.addSupplier(supplierData);
      setSupplierList(prev => [{ ...supplierData, id }, ...prev]);
      setShowAddModal(false);
      toast.success('Proveedor agregado exitosamente');
    } catch (e) {
      console.error('Error agregando proveedor:', e);
      toast.error('Error agregando proveedor');
    }
  };

  const handleEditSupplier = async (updatedSupplier) => {
    try {
      await suppliersService.updateSupplier(updatedSupplier.id, updatedSupplier);
      setSupplierList(prev => 
        prev.map(s => s.id === updatedSupplier.id ? updatedSupplier : s)
      );
      setShowEditModal(false);
      setSelectedSupplier(null);
      toast.success('Proveedor actualizado exitosamente');
    } catch (e) {
      console.error('Error actualizando proveedor:', e);
      toast.error('Error actualizando proveedor');
    }
  };

  const handleDeleteSupplier = async (id) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este proveedor?')) {
      try {
        await suppliersService.deleteSupplier(id);
        setSupplierList(prev => prev.filter(s => s.id !== id));
        toast.success('Proveedor eliminado exitosamente');
      } catch (e) {
        console.error('Error eliminando proveedor:', e);
        toast.error('Error eliminando proveedor');
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'green';
      case 'overdue': return 'red';
      case 'inactive': return 'gray';
      default: return 'gray';
    }
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'carnes': return 'red';
      case 'embutidos': return 'orange';
      case 'verduras': return 'green';
      case 'lacteos': return 'blue';
      case 'especias': return 'purple';
      default: return 'gray';
    }
  };

  if (loading) {
    return <LoadingSpinner text="Cargando proveedores..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gradient">
            Proveedores
          </h1>
          <p className="text-gray-600 mt-1">
            Gestiona los proveedores de la carnicería
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="btn btn-primary"
        >
          <Plus className="h-4 w-4 mr-2" />
          Agregar Proveedor
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 lg:gap-6">
        <div className="stats-card">
          <div className="flex items-center">
            <Truck className="h-5 w-5 lg:h-6 lg:w-6 text-blue-600" />
            <div className="ml-2 lg:ml-3">
              <p className="stats-label text-xs lg:text-sm">Total</p>
              <p className="stats-value text-lg lg:text-xl">{stats.total}</p>
            </div>
          </div>
        </div>
        <div className="stats-card">
          <div className="flex items-center">
            <Package className="h-5 w-5 lg:h-6 lg:w-6 text-green-600" />
            <div className="ml-2 lg:ml-3">
              <p className="stats-label text-xs lg:text-sm">Activos</p>
              <p className="stats-value text-lg lg:text-xl">{stats.active}</p>
            </div>
          </div>
        </div>
        <div className="stats-card">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 lg:h-6 lg:w-6 text-red-600" />
            <div className="ml-2 lg:ml-3">
              <p className="stats-label text-xs lg:text-sm">Atrasados</p>
              <p className="stats-value text-lg lg:text-xl">{stats.overdue}</p>
            </div>
          </div>
        </div>
        <div className="stats-card">
          <div className="flex items-center">
            <DollarSign className="h-5 w-5 lg:h-6 lg:w-6 text-purple-600" />
            <div className="ml-2 lg:ml-3">
              <p className="stats-label text-xs lg:text-sm">Pedidos</p>
              <p className="stats-value text-lg lg:text-xl">
                ${(stats.totalOrdered / 1000).toFixed(0)}k
              </p>
            </div>
          </div>
        </div>
        <div className="stats-card">
          <div className="flex items-center">
            <DollarSign className="h-5 w-5 lg:h-6 lg:w-6 text-green-600" />
            <div className="ml-2 lg:ml-3">
              <p className="stats-label text-xs lg:text-sm">Pagado</p>
              <p className="stats-value text-lg lg:text-xl">
                ${(stats.totalPaid / 1000).toFixed(0)}k
              </p>
            </div>
          </div>
        </div>
        <div className="stats-card">
          <div className="flex items-center">
            <DollarSign className="h-5 w-5 lg:h-6 lg:w-6 text-orange-600" />
            <div className="ml-2 lg:ml-3">
              <p className="stats-label text-xs lg:text-sm">Deuda</p>
              <p className="stats-value text-lg lg:text-xl">
                ${(stats.totalOwed / 1000).toFixed(0)}k
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4 lg:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="form-label text-sm lg:text-base">Buscar Proveedor</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nombre o contacto..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="form-input pl-10 text-sm lg:text-base"
              />
            </div>
          </div>
          <div>
            <label className="form-label text-sm lg:text-base">Categoría</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="form-select text-sm lg:text-base"
            >
              <option value="">Todas las categorías</option>
              {supplierCategories.map(category => (
                <option key={category.id} value={category.name}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="form-label text-sm lg:text-base">Estado</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="form-select text-sm lg:text-base"
            >
              <option value="">Todos los estados</option>
              {supplierStatuses.map(status => (
                <option key={status.id} value={status.id}>
                  {status.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <button
              onClick={() => {
                setSearchTerm('');
                setCategoryFilter('');
                setStatusFilter('');
              }}
              className="btn btn-secondary w-full text-sm lg:text-base"
            >
              Limpiar Filtros
            </button>
          </div>
        </div>
      </div>

      {/* Suppliers List */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6">
        {filteredSuppliers.map(supplier => (
          <div key={supplier.id} className="card hover:shadow-lg transition-all duration-300 group p-5 lg:p-6">
            {/* Header del card */}
            <div className="flex items-start justify-between mb-4 lg:mb-5">
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-3 lg:space-x-4 mb-3">
                  <div className="text-3xl lg:text-4xl flex-shrink-0">🚚</div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg lg:text-xl font-semibold text-gray-900 truncate mb-1">{supplier.name}</h3>
                    <p className="text-sm lg:text-base text-gray-500 truncate leading-relaxed">{supplier.contact}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className={`inline-flex px-3 py-1.5 text-xs font-semibold rounded-full bg-${getCategoryColor(supplier.category)}-100 text-${getCategoryColor(supplier.category)}-800`}>
                    {supplier.category}
                  </span>
                  <span className={`inline-flex px-3 py-1.5 text-xs font-semibold rounded-full bg-${getStatusColor(supplier.status)}-100 text-${getStatusColor(supplier.status)}-800`}>
                    {supplierStatuses.find(s => s.id === supplier.status)?.name || supplier.status}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Información del proveedor */}
            <div className="space-y-4 mb-5 lg:mb-6">
              <div className="flex justify-between items-center py-2">
                <span className="text-sm lg:text-base text-gray-600 font-medium">Teléfono:</span>
                <span className="text-sm lg:text-base text-gray-700 truncate max-w-[120px] lg:max-w-[150px]">{supplier.phone}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm lg:text-base text-gray-600 font-medium">Pedidos:</span>
                <span className="text-sm lg:text-base font-semibold text-purple-600">
                  ${supplier.totalOrdered?.toLocaleString() || 0}
                </span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm lg:text-base text-gray-600 font-medium">Pagado:</span>
                <span className="text-sm lg:text-base font-semibold text-green-600">
                  ${supplier.totalPaid?.toLocaleString() || 0}
                </span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm lg:text-base text-gray-600 font-medium">Deuda:</span>
                <span className={`text-sm lg:text-base font-semibold ${supplier.totalOwed > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  ${supplier.totalOwed?.toLocaleString() || 0}
                </span>
              </div>
              {supplier.lastOrder && (
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm lg:text-base text-gray-600 font-medium">Último Pedido:</span>
                  <span className="text-sm lg:text-base text-gray-700">
                    {new Date(supplier.lastOrder).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>

            {/* Acciones */}
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setSelectedSupplier(supplier);
                  setShowEditModal(true);
                }}
                className="flex-1 btn btn-secondary text-sm lg:text-base py-3 flex items-center justify-center font-medium"
              >
                <Edit className="h-4 w-4 lg:h-5 lg:w-5 mr-2" />
                Editar
              </button>
              <button
                onClick={() => handleDeleteSupplier(supplier.id)}
                className="btn btn-danger text-sm lg:text-base py-3 px-4 lg:px-5 flex items-center justify-center font-medium"
              >
                <Trash2 className="h-4 w-4 lg:h-5 lg:w-5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredSuppliers.length === 0 && (
        <div className="text-center py-8 lg:py-12">
          <Truck className="h-12 w-12 lg:h-16 lg:w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg lg:text-xl font-medium text-gray-900 mb-2">No se encontraron proveedores</h3>
          <p className="text-sm lg:text-base text-gray-500 mb-4 px-4">Intenta ajustar los filtros de búsqueda</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn btn-primary text-sm lg:text-base"
          >
            <Plus className="h-4 w-4 mr-2" />
            Agregar Primer Proveedor
          </button>
        </div>
      )}

      {/* Modals */}
      {showAddModal && (
        <SupplierModal
          onSave={handleAddSupplier}
          onCancel={() => setShowAddModal(false)}
        />
      )}

      {showEditModal && selectedSupplier && (
        <SupplierModal
          supplier={selectedSupplier}
          onSave={handleEditSupplier}
          onCancel={() => {
            setShowEditModal(false);
            setSelectedSupplier(null);
          }}
        />
      )}
    </div>
  );
};

const SupplierModal = ({ supplier, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    name: supplier?.name || '',
    contact: supplier?.contact || '',
    email: supplier?.email || '',
    phone: supplier?.phone || '',
    address: supplier?.address || '',
    category: supplier?.category || '',
    notes: supplier?.notes || ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content p-5">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {supplier ? 'Editar Proveedor' : 'Agregar Proveedor'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre de la Empresa
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contacto
              </label>
              <input
                type="text"
                required
                value={formData.contact}
                onChange={(e) => setFormData({...formData, contact: e.target.value})}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Teléfono
              </label>
              <input
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Dirección
              </label>
              <input
                type="text"
                required
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Categoría
              </label>
              <select
                required
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">Seleccionar categoría</option>
                {supplierCategories.map(category => (
                  <option key={category.id} value={category.name}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notas
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                rows="3"
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
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
                {supplier ? 'Actualizar' : 'Agregar'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Suppliers; 