import React, { useState, useEffect } from 'react';
import { customers, customerStatuses } from '../data/customers';
import { Users, Plus, Edit, Trash2, Search, DollarSign, AlertTriangle, UserCheck } from 'lucide-react';
import { toast } from 'react-toastify';
import { getCurrentDate, calculateOverdueDays as calculateOverdueDaysFromService } from '../services/dateService';
import { processCustomerPayment, validateCustomerPayment } from '../services/paymentService';
import { shiftService, customerService } from '../services/firebaseService';
import LoadingSpinner from './LoadingSpinner';

const Customers = () => {
  const [customerList, setCustomerList] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Estados para fiado
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [selectedCustomerForCredit, setSelectedCustomerForCredit] = useState(null);
  const [creditAmount, setCreditAmount] = useState(0);
  const [creditDays, setCreditDays] = useState(7);

  // Estados para pago de clientes atrasados
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedCustomerForPayment, setSelectedCustomerForPayment] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Estado para el turno actual
  const [currentShift, setCurrentShift] = useState(null);

  // Cargar clientes desde Firebase
  useEffect(() => {
    const loadCustomers = async () => {
      try {
        setLoading(true);
        console.log('🔄 Cargando clientes desde Firebase...');
        const customersFromFirebase = await customerService.getAllCustomers();
        console.log('👥 Clientes cargados de Firebase:', customersFromFirebase.length);
        setCustomerList(customersFromFirebase);
      } catch (error) {
        console.error('❌ Error cargando clientes de Firebase:', error);
        // Fallback a datos locales solo si hay error
        setCustomerList(customers);
      } finally {
        setLoading(false);
      }
    };
    loadCustomers();
  }, []);

  // Cargar turno actual al montar el componente
  useEffect(() => {
    const loadCurrentShift = async () => {
      try {
        const activeShift = await shiftService.getActiveShift();
        setCurrentShift(activeShift);
      } catch (error) {
        console.error('Error cargando turno actual:', error);
      }
    };
    loadCurrentShift();
  }, []);

  // Filtrar clientes
  const filteredCustomers = customerList.filter(customer => {
    const nameStr = (customer.name || '').toLowerCase();
    const phoneStr = (customer.phone || '').toLowerCase();
    const addressStr = (customer.address || '').toLowerCase();
    const matchesSearch = nameStr.includes(searchTerm.toLowerCase()) ||
                          phoneStr.includes(searchTerm.toLowerCase()) ||
                          addressStr.includes(searchTerm.toLowerCase());
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

  const handleAddCustomer = async (newCustomer) => {
    try {
      console.log('🔄 Agregando cliente desde componente Customers...');
      const customerData = {
        ...newCustomer,
        status: 'active',
        currentBalance: 0,
        lastPurchase: getCurrentDate().toISOString().split('T')[0]
      };
      
      const customerId = await customerService.addCustomer(customerData);
      console.log('✅ Cliente agregado a Firebase con ID:', customerId);
      
      // Actualizar el estado local con el nuevo cliente
      const customerWithId = { ...customerData, id: customerId };
      setCustomerList([customerWithId, ...customerList]);
      setShowAddModal(false);
      toast.success('Cliente agregado exitosamente');
    } catch (error) {
      console.error('❌ Error agregando cliente:', error);
      toast.error('Error al agregar cliente');
    }
  };

  const handleEditCustomer = async (updatedCustomer) => {
    try {
      console.log('🔄 Actualizando cliente desde componente Customers...');
      await customerService.updateCustomer(updatedCustomer.id, updatedCustomer);
      
      // Actualizar el estado local
      setCustomerList(prev => 
        prev.map(c => c.id === updatedCustomer.id ? updatedCustomer : c)
      );
      setShowEditModal(false);
      setSelectedCustomer(null);
      toast.success('Cliente actualizado exitosamente');
    } catch (error) {
      console.error('❌ Error actualizando cliente:', error);
      toast.error('Error al actualizar cliente');
    }
  };

  const handleDeleteCustomer = async (id) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este cliente?')) {
      try {
        await customerService.deleteCustomer(id);
        setCustomerList(prev => prev.filter(c => c.id !== id));
        toast.success('Cliente eliminado exitosamente');
      } catch (error) {
        console.error('❌ Error eliminando cliente:', error);
        toast.error('Error al eliminar cliente');
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







  const processCredit = () => {
    if (!selectedCustomerForCredit) return;

    const updatedCustomer = {
      ...selectedCustomerForCredit,
      creditLimit: creditAmount,
      creditDays: creditDays
    };

    handleEditCustomer(updatedCustomer);
    setShowCreditModal(false);
    setSelectedCustomerForCredit(null);
    setCreditAmount(0);
    setCreditDays(7);
  };



  const processPayment = async () => {
    if (!selectedCustomerForPayment || !currentShift) return;

    try {
      setIsProcessingPayment(true);
      
      // Validar el pago
      const validation = validateCustomerPayment(selectedCustomerForPayment, paymentAmount);
      if (!validation.isValid) {
        toast.error(validation.message);
        return;
      }

      // Procesar el pago
      await processCustomerPayment(selectedCustomerForPayment, paymentAmount, currentShift);
      
      // Actualizar el cliente en la lista
      const updatedCustomer = {
        ...selectedCustomerForPayment,
        currentBalance: Math.max(0, selectedCustomerForPayment.currentBalance - paymentAmount),
        status: Math.max(0, selectedCustomerForPayment.currentBalance - paymentAmount) === 0 ? 'active' : 'overdue'
      };
      
      setCustomerList(prev => 
        prev.map(c => c.id === updatedCustomer.id ? updatedCustomer : c)
      );
      
      setShowPaymentModal(false);
      setSelectedCustomerForPayment(null);
      setPaymentAmount(0);
      toast.success('Pago procesado exitosamente');
    } catch (error) {
      console.error('Error procesando pago:', error);
      toast.error('Error al procesar el pago');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Cargando clientes..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gradient">
            Clientes
          </h1>
          <p className="text-gray-600 mt-1">
            Gestiona clientes con cuenta corriente
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="btn btn-primary"
        >
          <Plus className="h-4 w-4 mr-2" />
          Agregar Cliente
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 lg:gap-6">
        <div className="stats-card">
          <div className="flex items-center">
            <Users className="h-5 w-5 lg:h-6 lg:w-6 text-blue-600" />
            <div className="ml-2 lg:ml-3">
              <p className="stats-label text-xs lg:text-sm">Total Clientes</p>
              <p className="stats-value text-lg lg:text-xl">{stats.total}</p>
            </div>
          </div>
        </div>
        <div className="stats-card">
          <div className="flex items-center">
            <UserCheck className="h-5 w-5 lg:h-6 lg:w-6 text-green-600" />
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
              <p className="stats-label text-xs lg:text-sm">Crédito Total</p>
              <p className="stats-value text-lg lg:text-xl">
                ${(stats.totalCredit / 1000).toFixed(0)}k
              </p>
            </div>
          </div>
        </div>
        <div className="stats-card lg:col-span-1">
          <div className="flex items-center">
            <DollarSign className="h-5 w-5 lg:h-6 lg:w-6 text-orange-600" />
            <div className="ml-2 lg:ml-3">
              <p className="stats-label text-xs lg:text-sm">Deuda Total</p>
              <p className="stats-value text-lg lg:text-xl">
                ${(stats.totalOwed / 1000).toFixed(0)}k
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4 lg:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="form-label text-sm lg:text-base">Buscar Cliente</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nombre o email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="form-input pl-10 text-sm lg:text-base"
              />
            </div>
          </div>
          <div>
            <label className="form-label text-sm lg:text-base">Estado</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="form-select text-sm lg:text-base"
            >
              <option value="">Todos los estados</option>
              {customerStatuses.map(status => (
                <option key={status.id} value={status.id}>
                  {status.name}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2 lg:col-span-1">
            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('');
              }}
              className="btn btn-secondary w-full text-sm lg:text-base"
            >
              Limpiar Filtros
            </button>
          </div>
        </div>
      </div>

      {/* Customers List */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6">
        {filteredCustomers.map(customer => (
          <div key={customer.id} className="card hover:shadow-lg transition-all duration-300 group p-5 lg:p-6">
            {/* Header del card */}
            <div className="flex items-start justify-between mb-4 lg:mb-5">
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-3 lg:space-x-4 mb-3">
                  <div className="text-3xl lg:text-4xl flex-shrink-0">👤</div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg lg:text-xl font-semibold text-gray-900 truncate mb-1">{customer.name}</h3>
                    <p className="text-sm lg:text-base text-gray-500 truncate leading-relaxed">{customer.email}</p>
                  </div>
                </div>
                <span className={`inline-flex px-3 py-1.5 text-xs font-semibold rounded-full bg-${getStatusColor(customer.status)}-100 text-${getStatusColor(customer.status)}-800`}>
                  {customerStatuses.find(s => s.id === customer.status)?.name || customer.status}
                </span>
              </div>
            </div>
            
            {/* Información del cliente */}
            <div className="space-y-4 mb-5 lg:mb-6">
              <div className="flex justify-between items-center py-2">
                <span className="text-sm lg:text-base text-gray-600 font-medium">Teléfono:</span>
                <span className="text-sm lg:text-base text-gray-700 truncate max-w-[120px] lg:max-w-[150px]">{customer.phone}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm lg:text-base text-gray-600 font-medium">Crédito:</span>
                <span className="text-sm lg:text-base font-semibold text-green-600">
                  ${customer.creditLimit?.toLocaleString() || 0}
                </span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm lg:text-base text-gray-600 font-medium">Deuda:</span>
                <span className={`text-sm lg:text-base font-semibold ${customer.currentBalance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  ${customer.currentBalance?.toLocaleString() || 0}
                </span>
              </div>
              {customer.lastPurchase && (
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm lg:text-base text-gray-600 font-medium">Última Compra:</span>
                  <span className="text-sm lg:text-base text-gray-700">
                    {new Date(customer.lastPurchase).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>

            {/* Acciones */}
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setSelectedCustomer(customer);
                  setShowEditModal(true);
                }}
                className="flex-1 btn btn-secondary text-sm lg:text-base py-3 flex items-center justify-center font-medium"
              >
                <Edit className="h-4 w-4 lg:h-5 lg:w-5 mr-2" />
                Editar
              </button>
              <button
                onClick={() => handleDeleteCustomer(customer.id)}
                className="btn btn-danger text-sm lg:text-base py-3 px-4 lg:px-5 flex items-center justify-center font-medium"
              >
                <Trash2 className="h-4 w-4 lg:h-5 lg:w-5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredCustomers.length === 0 && (
        <div className="text-center py-8 lg:py-12">
          <Users className="h-12 w-12 lg:h-16 lg:w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg lg:text-xl font-medium text-gray-900 mb-2">No se encontraron clientes</h3>
          <p className="text-sm lg:text-base text-gray-500 mb-4 px-4">Intenta ajustar los filtros de búsqueda</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn btn-primary text-sm lg:text-base"
          >
            <Plus className="h-4 w-4 mr-2" />
            Agregar Primer Cliente
          </button>
        </div>
      )}

      {/* Modals */}
      {showAddModal && (
        <CustomerModal
          onSave={handleAddCustomer}
          onCancel={() => setShowAddModal(false)}
        />
      )}

      {showEditModal && selectedCustomer && (
        <CustomerModal
          customer={selectedCustomer}
          onSave={handleEditCustomer}
          onCancel={() => {
            setShowEditModal(false);
            setSelectedCustomer(null);
          }}
        />
      )}

      {/* Credit Modal */}
      {showCreditModal && selectedCustomerForCredit && (
        <div className="modal-overlay">
          <div className="modal-content p-4 lg:p-6 max-w-md mx-4">
            <div className="flex items-center justify-between mb-4 lg:mb-6">
              <h3 className="text-lg lg:text-xl font-bold text-gray-900">Configurar Crédito</h3>
              <button
                onClick={() => setShowCreditModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <svg className="h-5 w-5 lg:h-6 lg:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="form-label text-sm lg:text-base">Monto de Crédito</label>
                <input
                  type="number"
                  value={creditAmount}
                  onChange={(e) => setCreditAmount(Number(e.target.value))}
                  className="form-input text-sm lg:text-base"
                  placeholder="0"
                  min="0"
                />
              </div>
              <div>
                <label className="form-label text-sm lg:text-base">Días de Crédito</label>
                <input
                  type="number"
                  value={creditDays}
                  onChange={(e) => setCreditDays(Number(e.target.value))}
                  className="form-input text-sm lg:text-base"
                  placeholder="7"
                  min="1"
                />
              </div>
              
              <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 pt-4">
                <button
                  onClick={() => setShowCreditModal(false)}
                  className="btn btn-secondary text-sm lg:text-base order-2 sm:order-1"
                >
                  Cancelar
                </button>
                <button
                  onClick={processCredit}
                  className="btn btn-primary text-sm lg:text-base order-1 sm:order-2"
                >
                  Guardar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && selectedCustomerForPayment && (
        <div className="modal-overlay">
          <div className="modal-content p-4 lg:p-6 max-w-md mx-4">
            <div className="flex items-center justify-between mb-4 lg:mb-6">
              <h3 className="text-lg lg:text-xl font-bold text-gray-900">Procesar Pago</h3>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <svg className="h-5 w-5 lg:h-6 lg:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="form-label text-sm lg:text-base">Cliente</label>
                <p className="text-sm lg:text-base text-gray-700 font-medium">{selectedCustomerForPayment.name}</p>
              </div>
              <div>
                <label className="form-label text-sm lg:text-base">Deuda Actual</label>
                <p className="text-sm lg:text-base text-red-600 font-semibold">
                  ${selectedCustomerForPayment.currentBalance?.toLocaleString() || 0}
                </p>
              </div>
              <div>
                <label className="form-label text-sm lg:text-base">Monto a Pagar</label>
                <input
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(Number(e.target.value))}
                  className="form-input text-sm lg:text-base"
                  placeholder="0"
                  min="0"
                  max={selectedCustomerForPayment.currentBalance}
                />
              </div>
              
              <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 pt-4">
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="btn btn-secondary text-sm lg:text-base order-2 sm:order-1"
                  disabled={isProcessingPayment}
                >
                  Cancelar
                </button>
                <button
                  onClick={processPayment}
                  className="btn btn-primary text-sm lg:text-base order-1 sm:order-2"
                  disabled={isProcessingPayment}
                >
                  {isProcessingPayment ? 'Procesando...' : 'Procesar Pago'}
                </button>
              </div>
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
    <div className="modal-overlay">
      <div className="modal-content p-4 lg:p-6 max-w-md mx-4">
        <div className="flex items-center justify-between mb-4 lg:mb-6">
          <h3 className="text-lg lg:text-xl font-bold text-gray-900">
            {customer ? 'Editar Cliente' : 'Agregar Cliente'}
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
            <label className="form-label text-sm lg:text-base">Teléfono</label>
            <input
              type="tel"
              required
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
              className="form-input text-sm lg:text-base"
            />
          </div>
          <div>
            <label className="form-label text-sm lg:text-base">Dirección</label>
            <input
              type="text"
              required
              value={formData.address}
              onChange={(e) => setFormData({...formData, address: e.target.value})}
              className="form-input text-sm lg:text-base"
            />
          </div>
          <div>
            <label className="form-label text-sm lg:text-base">Límite de Crédito</label>
            <input
              type="number"
              required
              value={formData.creditLimit}
              onChange={(e) => setFormData({...formData, creditLimit: Number(e.target.value)})}
              className="form-input text-sm lg:text-base"
            />
          </div>
          <div>
            <label className="form-label text-sm lg:text-base">Notas</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              rows="3"
              className="form-input text-sm lg:text-base"
            />
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
              {customer ? 'Actualizar' : 'Agregar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Customers; 