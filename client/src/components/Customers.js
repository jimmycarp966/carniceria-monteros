import React, { useState } from 'react';
import { customers, customerStatuses } from '../data/customers';
import { Users, Plus, Edit, Trash2, Search, DollarSign, AlertTriangle, UserCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { getCurrentDate, calculateOverdueDays as calculateOverdueDaysFromService } from '../services/dateService';

const Customers = () => {
  const [customerList, setCustomerList] = useState(customers);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  
  // Estados para fiado
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [selectedCustomerForCredit, setSelectedCustomerForCredit] = useState(null);
  const [creditAmount, setCreditAmount] = useState(0);
  const [creditDays, setCreditDays] = useState(7);

  // Filtrar clientes
  const filteredCustomers = customerList.filter(customer => {
    const matchesSearch = customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !statusFilter || customer.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Estadísticas
  const stats = {
    total: customerList.length,
    active: customerList.filter(c => c.status === 'active').length,
    overdue: customerList.filter(c => c.status === 'overdue').length,
    totalCredit: customerList.reduce((sum, c) => sum + c.creditLimit, 0),
    totalOwed: customerList.reduce((sum, c) => sum + c.currentBalance, 0)
  };

  const handleAddCustomer = (newCustomer) => {
    const customer = {
      ...newCustomer,
      id: Date.now(),
      status: 'active',
      currentBalance: 0,
      lastPurchase: getCurrentDate().toISOString().split('T')[0]
    };
    setCustomerList([customer, ...customerList]);
    setShowAddModal(false);
    toast.success('Cliente agregado exitosamente');
  };

  const handleEditCustomer = (updatedCustomer) => {
    setCustomerList(customerList.map(c => 
      c.id === updatedCustomer.id ? updatedCustomer : c
    ));
    setShowEditModal(false);
    setSelectedCustomer(null);
    toast.success('Cliente actualizado exitosamente');
  };

  const handleDeleteCustomer = (id) => {
    setCustomerList(customerList.filter(c => c.id !== id));
    toast.success('Cliente eliminado exitosamente');
  };

  const getStatusColor = (status) => {
    const statusObj = customerStatuses.find(s => s.id === status);
    return statusObj?.color || 'gray';
  };

  // Función para calcular días de atraso usando el servicio de fecha
  const calculateOverdueDays = (customer) => {
    // Si no hay saldo pendiente, no hay atraso
    if (customer.currentBalance <= 0) return 0;
    
    // Usar el servicio de fecha para calcular días de atraso
    return calculateOverdueDaysFromService(customer.lastPurchase, customer.creditDays || 7);
  };

  // Función para verificar si un cliente está atrasado
  const isCustomerOverdue = (customer) => {
    return calculateOverdueDays(customer) > 0;
  };

  // Función para agregar fiado
  const handleAddCredit = (customer) => {
    setSelectedCustomerForCredit(customer);
    setCreditAmount(0);
    setCreditDays(customer.creditDays || 7);
    setShowCreditModal(true);
  };

  // Función para procesar el fiado
  const processCredit = () => {
    if (!selectedCustomerForCredit || creditAmount <= 0) {
      toast.error('Monto inválido');
      return;
    }

    const updatedCustomer = {
      ...selectedCustomerForCredit,
      currentBalance: selectedCustomerForCredit.currentBalance + creditAmount,
      creditDays: creditDays,
      lastPurchase: new Date().toISOString().split('T')[0],
      status: 'active'
    };

    setCustomerList(customerList.map(c => 
      c.id === updatedCustomer.id ? updatedCustomer : c
    ));
    
    setShowCreditModal(false);
    setSelectedCustomerForCredit(null);
    toast.success(`Fiado agregado: $${creditAmount.toLocaleString()} - ${creditDays} días`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Clientes</h1>
          <p className="mt-1 text-sm text-gray-500">
            Gestiona clientes con cuenta corriente
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="btn btn-primary flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          Agregar Cliente
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Clientes</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <UserCheck className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Activos</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.active}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <AlertTriangle className="h-8 w-8 text-red-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Atrasados</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.overdue}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <DollarSign className="h-8 w-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Crédito Total</p>
              <p className="text-2xl font-semibold text-gray-900">
                ${stats.totalCredit.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <DollarSign className="h-8 w-8 text-orange-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Deuda Total</p>
              <p className="text-2xl font-semibold text-gray-900">
                ${stats.totalOwed.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Buscar
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nombre o email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
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
              {customerStatuses.map(status => (
                <option key={status.id} value={status.id}>
                  {status.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Customers List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contacto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Límite Crédito
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Saldo Actual
                </th>

                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Días Atraso
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Última Compra
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCustomers.map(customer => (
                <tr key={customer.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {customer.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {customer.address}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm text-gray-900">{customer.email}</div>
                      <div className="text-sm text-gray-500">{customer.phone}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      ${customer.creditLimit.toLocaleString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`text-sm font-medium ${
                      customer.currentBalance > 0 ? 'text-red-600' : 'text-green-600'
                    }`}>
                      ${customer.currentBalance.toLocaleString()}
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`text-sm font-medium ${
                      isCustomerOverdue(customer) ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {calculateOverdueDays(customer)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-${getStatusColor(customer.status)}-100 text-${getStatusColor(customer.status)}-800`}>
                      {customerStatuses.find(s => s.id === customer.status)?.name}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(customer.lastPurchase).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => {
                        setSelectedCustomer(customer);
                        setShowEditModal(true);
                      }}
                      className="text-primary-600 hover:text-primary-900 mr-3"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleAddCredit(customer)}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      <DollarSign className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteCustomer(customer.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {(showAddModal || showEditModal) && (
        <CustomerModal
          customer={selectedCustomer}
          onSave={showAddModal ? handleAddCustomer : handleEditCustomer}
          onCancel={() => {
            setShowAddModal(false);
            setShowEditModal(false);
            setSelectedCustomer(null);
          }}
        />
      )}

      {/* Credit Modal */}
      {showCreditModal && selectedCustomerForCredit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Agregar Fiado - {selectedCustomerForCredit.name}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Monto del Fiado
                </label>
                <input
                  type="number"
                  value={creditAmount}
                  onChange={(e) => setCreditAmount(parseFloat(e.target.value) || 0)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="0.00"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Días de Margen
                </label>
                <input
                  type="number"
                  value={creditDays}
                  onChange={(e) => setCreditDays(parseInt(e.target.value) || 7)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="7"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Días que tiene el cliente para pagar antes de considerarse atrasado
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-sm text-gray-600">
                  <strong>Saldo actual:</strong> ${selectedCustomerForCredit.currentBalance.toLocaleString()}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Nuevo saldo:</strong> ${(selectedCustomerForCredit.currentBalance + creditAmount).toLocaleString()}
                </p>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={processCredit}
                className="flex-1 btn btn-primary"
              >
                Confirmar Fiado
              </button>
              <button
                onClick={() => {
                  setShowCreditModal(false);
                  setSelectedCustomerForCredit(null);
                }}
                className="flex-1 btn btn-secondary"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const CustomerModal = ({ customer, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    name: customer?.name || '',
    email: customer?.email || '',
    phone: customer?.phone || '',
    address: customer?.address || '',
    creditLimit: customer?.creditLimit || 0,
    notes: customer?.notes || ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {customer ? 'Editar Cliente' : 'Agregar Cliente'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre
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
                Límite de Crédito
              </label>
              <input
                type="number"
                required
                value={formData.creditLimit}
                onChange={(e) => setFormData({...formData, creditLimit: parseInt(e.target.value)})}
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
                {customer ? 'Actualizar' : 'Agregar'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Customers; 