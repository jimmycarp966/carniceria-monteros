import React, { useState, useEffect } from 'react';
import { inventoryStatuses, movementTypes } from '../data/inventory';
import { Building, Search, AlertTriangle, TrendingUp, Package } from 'lucide-react';
import toast from 'react-hot-toast';
import { inventoryMovementsService } from '../services/firebaseService';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db } from '../firebase';

const Inventory = () => {
  const [inventoryList, setInventoryList] = useState([]);
  const [movementsList, setMovementsList] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showMovementModal, setShowMovementModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Inventario en tiempo real (onSnapshot)
  useEffect(() => {
    setIsLoading(true);
    const unsub = onSnapshot(
      query(collection(db, 'inventory'), orderBy('productName')),
      (snap) => {
        const inventoryData = snap.docs.map(doc => {
          const item = doc.data() || {};
          return {
            id: doc.id,
            productId: item.productId,
            productName: item.productName || item.name || 'Producto',
            category: item.category || 'Sin categoría',
            currentStock: item.stock ?? item.currentStock ?? 0,
            minStock: item.minStock ?? 10,
            cost: item.cost ?? 0,
            status: getStockStatus(item.stock ?? item.currentStock ?? 0, item.minStock ?? 10),
            lastUpdated: item.lastUpdated || new Date().toISOString(),
            unit: item.unit || 'unidad',
            location: item.location || '-',
            supplier: item.supplier || ''
          };
        });
        setInventoryList(inventoryData);
        setIsLoading(false);
        setHasError(false);
      },
      (error) => {
        console.error('❌ Error onSnapshot inventario:', error);
        setIsLoading(false);
        setHasError(true);
        setInventoryList([]);
      }
    );
    return () => { try { unsub(); } catch {} };
  }, []);

  const retryLoad = () => {
    // onSnapshot actualiza solo
  };

  // Función para determinar el estado del stock
  const getStockStatus = (currentStock, minStock) => {
    if (currentStock === 0) return 'critical';
    if (currentStock <= minStock) return 'low';
    return 'normal';
  };

  // Filtrar inventario
  const filteredInventory = inventoryList.filter(item => {
    const matchesSearch = item.productName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !categoryFilter || item.category === categoryFilter;
    const matchesStatus = !statusFilter || item.status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Estadísticas
  const stats = {
    total: inventoryList.length,
    normal: inventoryList.filter(i => i.status === 'normal').length,
    low: inventoryList.filter(i => i.status === 'low').length,
    critical: inventoryList.filter(i => i.status === 'critical').length,
    totalValue: inventoryList.reduce((sum, i) => sum + (i.currentStock * i.cost), 0),
    totalStock: inventoryList.reduce((sum, i) => sum + i.currentStock, 0)
  };

  const handleAddMovement = async (newMovement) => {
    try {
      console.log('🔄 Registrando movimiento de inventario...');
      
      const movement = {
        ...newMovement,
        id: Date.now(),
        date: new Date().toISOString().split('T')[0],
        timestamp: new Date().toISOString()
      };
      
      // Guardar movimiento en Firestore y ajustar inventario real
      await inventoryMovementsService.addMovement({
        productId: movement.productId,
        productName: movement.productName,
        type: movement.type,
        quantity: Number(movement.quantity) || 0,
        unit: movement.unit,
        reason: movement.reason,
        supplier: movement.supplier,
        customer: movement.customer,
        notes: movement.notes
      });

      setMovementsList([movement, ...movementsList]);
      setShowMovementModal(false);
      toast.success('Movimiento registrado');
    } catch (error) {
      console.error('❌ Error registrando movimiento:', error);
      toast.error('Error al registrar movimiento');
    }
  };

  const getStatusColor = (status) => {
    const statusObj = inventoryStatuses.find(s => s.id === status);
    return statusObj?.color || 'gray';
  };

  const getMovementColor = (type) => {
    const typeObj = movementTypes.find(t => t.id === type);
    return typeObj?.color || 'gray';
  };

  return (
    <div className="space-y-6">
      {isLoading && (
        <div className="bg-white rounded-lg shadow p-6 text-gray-600">Cargando inventario...</div>
      )}
      {(!isLoading && hasError) && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-yellow-800 flex items-center justify-between">
          <span>No se pudo cargar el inventario. Intentá nuevamente.</span>
          <button onClick={retryLoad} className="btn btn-secondary">Reintentar</button>
        </div>
      )}
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Inventario</h1>
          <p className="mt-1 text-sm text-gray-500">
            Gestiona el stock y movimientos de inventario
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowMovementModal(true)}
            className="btn btn-secondary flex items-center"
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            Registrar Movimiento
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <Building className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Productos</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <Package className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Stock Normal</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.normal}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <AlertTriangle className="h-8 w-8 text-yellow-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Stock Bajo</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.low}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <AlertTriangle className="h-8 w-8 text-red-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Crítico</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.critical}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <TrendingUp className="h-8 w-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Valor Total</p>
              <p className="text-2xl font-semibold text-gray-900">
               ${(Number(stats.totalValue) || 0).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <Package className="h-8 w-8 text-orange-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Stock</p>
              <p className="text-2xl font-semibold text-gray-900">
                {(Number(stats.totalStock) || 0).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Buscar
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar producto..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Categoría
            </label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">Todas las categorías</option>
              <option value="Carnes Rojas">Carnes Rojas</option>
              <option value="Carnes Blancas">Carnes Blancas</option>
              <option value="Embutidos">Embutidos</option>
              <option value="Preparados">Preparados</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Estado
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">Todos los estados</option>
              {inventoryStatuses.map(status => (
                <option key={status.id} value={status.id}>
                  {status.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Inventory List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
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
                  Stock Actual
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock Mínimo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Costo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Valor Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ubicación
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredInventory.map(item => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {item.productName}
                      </div>
                      <div className="text-sm text-gray-500">
                        {item.supplier}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                      {item.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {item.currentStock} {item.unit}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {item.minStock} {item.unit}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      ${(Number(item.cost) || 0).toLocaleString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {((Number(item.currentStock) || 0) * (Number(item.cost) || 0)).toLocaleString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-${getStatusColor(item.status)}-100 text-${getStatusColor(item.status)}-800`}>
                      {inventoryStatuses.find(s => s.id === item.status)?.name}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.location}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Movements */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Movimientos Recientes</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Producto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cantidad
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Motivo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Monto
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {movementsList.slice(0, 10).map(movement => (
                <tr key={movement.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(movement.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {movement.productName}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-${getMovementColor(movement.type)}-100 text-${getMovementColor(movement.type)}-800`}>
                      {movementTypes.find(t => t.id === movement.type)?.name}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {movement.quantity} {movement.unit}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {movement.reason}
                    </div>
                    <div className="text-sm text-gray-500">
                      {movement.supplier || movement.customer}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`text-sm font-medium ${
                      movement.type === 'entrada' ? 'text-red-600' : 'text-green-600'
                    }`}>
                      ${movement.cost || movement.revenue || 0}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Movement Modal */}
      {showMovementModal && (
        <MovementModal
          onSave={handleAddMovement}
          onCancel={() => setShowMovementModal(false)}
        />
      )}
    </div>
  );
};

const MovementModal = ({ onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    productId: '',
    productName: '',
    type: 'entrada',
    quantity: 0,
    unit: 'kg',
    reason: '',
    supplier: '',
    customer: '',
    cost: 0,
    revenue: 0,
    notes: ''
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
            Registrar Movimiento
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Producto
              </label>
              <input
                type="text"
                required
                value={formData.productName}
                onChange={(e) => setFormData({...formData, productName: e.target.value})}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo de Movimiento
              </label>
              <select
                required
                value={formData.type}
                onChange={(e) => setFormData({...formData, type: e.target.value})}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                {movementTypes.map(type => (
                  <option key={type.id} value={type.id}>
                    {type.name}
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
                required
                value={formData.quantity}
                onChange={(e) => setFormData({...formData, quantity: parseInt(e.target.value)})}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Unidad
              </label>
              <select
                required
                value={formData.unit}
                onChange={(e) => setFormData({...formData, unit: e.target.value})}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="kg">kg</option>
                <option value="unidad">unidad</option>
                <option value="litro">litro</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Motivo
              </label>
              <input
                type="text"
                required
                value={formData.reason}
                onChange={(e) => setFormData({...formData, reason: e.target.value})}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            {formData.type === 'entrada' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Proveedor
                </label>
                <input
                  type="text"
                  value={formData.supplier}
                  onChange={(e) => setFormData({...formData, supplier: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            )}
            {formData.type === 'salida' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cliente
                </label>
                <input
                  type="text"
                  value={formData.customer}
                  onChange={(e) => setFormData({...formData, customer: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Monto
              </label>
              <input
                type="number"
                value={formData.type === 'entrada' ? formData.cost : formData.revenue}
                onChange={(e) => setFormData({
                  ...formData, 
                  [formData.type === 'entrada' ? 'cost' : 'revenue']: parseInt(e.target.value)
                })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
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
                Registrar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Inventory; 