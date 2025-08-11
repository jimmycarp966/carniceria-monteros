import React, { useState, useEffect } from 'react';
import { employees, positions, employeeStatuses } from '../data/employees';
import { UserCheck, Plus, Edit, Trash2, Search, DollarSign, Users, KeyRound } from 'lucide-react';
import { toast } from 'react-toastify';
import { employeeService, loadSampleData } from '../services/firebaseService';
import { usePermissions } from '../context/PermissionsContext';
import LoadingSpinner from './LoadingSpinner';

const Employees = () => {
  const permissions = usePermissions();
  const [employeeList, setEmployeeList] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [positionFilter, setPositionFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [loading, setLoading] = useState(true);

  // Cargar empleados desde Firebase
  useEffect(() => {
    const loadEmployees = async () => {
      try {
        setLoading(true);
        console.log('🔄 Cargando empleados desde Firebase...');
        
        // Intentar cargar datos simulados si Firebase está vacío
        await loadSampleData();
        
        const employeesFromFirebase = await employeeService.getAllEmployees();
        console.log('👥 Empleados cargados desde Firebase:', employeesFromFirebase.length);
        setEmployeeList(employeesFromFirebase);
      } catch (error) {
        console.error('❌ Error cargando empleados:', error);
        // Fallback a datos locales
        setEmployeeList(employees);
      } finally {
        setLoading(false);
      }
    };
    loadEmployees();
  }, []);

  // Filtrar empleados
  const filteredEmployees = employeeList.filter(employee => {
    const matchesSearch = employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         employee.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPosition = !positionFilter || employee.position === positionFilter;
    const matchesStatus = !statusFilter || employee.status === statusFilter;
    return matchesSearch && matchesPosition && matchesStatus;
  });

  // Estadísticas
  const stats = {
    total: employeeList.length,
    active: employeeList.filter(e => e.status === 'active').length,
    totalSalary: employeeList.reduce((sum, e) => sum + e.salary, 0),
    averageSalary: employeeList.length > 0 ? employeeList.reduce((sum, e) => sum + e.salary, 0) / employeeList.length : 0
  };

  const handleAddEmployee = async (newEmployee) => {
    try {
      console.log('🔄 Agregando empleado desde componente Employees...');
      
      const employeeData = {
        ...newEmployee,
        status: 'active',
        hireDate: new Date().toISOString().split('T')[0],
        salary: parseFloat(newEmployee.salary),
        permissions: Array.isArray(newEmployee.permissions) ? newEmployee.permissions : []
      };
      
      const employeeId = await employeeService.addEmployee(employeeData);
      console.log('✅ Empleado agregado a Firebase con ID:', employeeId);
      
      const employeeWithId = { ...employeeData, id: employeeId };
      setEmployeeList([employeeWithId, ...employeeList]);
      setShowAddModal(false);
      toast.success('Empleado agregado exitosamente');
    } catch (error) {
      console.error('❌ Error agregando empleado:', error);
      toast.error('Error al agregar empleado');
    }
  };

  const handleEditEmployee = async (updatedEmployee) => {
    try {
      console.log('🔄 Actualizando empleado desde componente Employees...');
      
      await employeeService.updateEmployee(updatedEmployee.id, updatedEmployee);
      console.log('✅ Empleado actualizado en Firebase');
      
      setEmployeeList(prev => 
        prev.map(e => e.id === updatedEmployee.id ? updatedEmployee : e)
      );
      setShowEditModal(false);
      setSelectedEmployee(null);
      toast.success('Empleado actualizado exitosamente');
    } catch (error) {
      console.error('❌ Error actualizando empleado:', error);
      toast.error('Error al actualizar empleado');
    }
  };

  const handleDeleteEmployee = async (id) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este empleado?')) {
      try {
        await employeeService.deleteEmployee(id);
        setEmployeeList(prev => prev.filter(e => e.id !== id));
        toast.success('Empleado eliminado exitosamente');
      } catch (error) {
        console.error('❌ Error eliminando empleado:', error);
        toast.error('Error al eliminar empleado');
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'green';
      case 'inactive': return 'red';
      case 'on_leave': return 'yellow';
      default: return 'gray';
    }
  };

  const getPositionColor = (position) => {
    switch (position) {
      case 'manager': return 'purple';
      case 'cashier': return 'blue';
      case 'butcher': return 'orange';
      case 'assistant': return 'green';
      default: return 'gray';
    }
  };

  if (loading) {
    return <LoadingSpinner text="Cargando empleados..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gradient">
            Empleados
          </h1>
          <p className="text-gray-600 mt-1">
            Gestiona el personal de la carnicería
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="btn btn-primary"
        >
          <Plus className="h-4 w-4 mr-2" />
          Agregar Empleado
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <div className="stats-card">
          <div className="flex items-center">
            <Users className="h-5 w-5 lg:h-6 lg:w-6 text-blue-600" />
            <div className="ml-2 lg:ml-3">
              <p className="stats-label text-xs lg:text-sm">Total Empleados</p>
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
            <DollarSign className="h-5 w-5 lg:h-6 lg:w-6 text-purple-600" />
            <div className="ml-2 lg:ml-3">
              <p className="stats-label text-xs lg:text-sm">Salario Total</p>
              <p className="stats-value text-lg lg:text-xl">
                ${(stats.totalSalary / 1000).toFixed(0)}k
              </p>
            </div>
          </div>
        </div>
        <div className="stats-card">
          <div className="flex items-center">
            <DollarSign className="h-5 w-5 lg:h-6 lg:w-6 text-orange-600" />
            <div className="ml-2 lg:ml-3">
              <p className="stats-label text-xs lg:text-sm">Promedio</p>
              <p className="stats-value text-lg lg:text-xl">
                ${stats.averageSalary.toFixed(0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4 lg:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="form-label text-sm lg:text-base">Buscar Empleado</label>
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
            <label className="form-label text-sm lg:text-base">Posición</label>
            <select
              value={positionFilter}
              onChange={(e) => setPositionFilter(e.target.value)}
              className="form-select text-sm lg:text-base"
            >
              <option value="">Todas las posiciones</option>
              {positions.map(position => (
                <option key={position.id} value={position.id}>
                  {position.name}
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
              {employeeStatuses.map(status => (
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
                setPositionFilter('');
                setStatusFilter('');
              }}
              className="btn btn-secondary w-full text-sm lg:text-base"
            >
              Limpiar Filtros
            </button>
          </div>
        </div>
      </div>

      {/* Employees List */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6">
        {filteredEmployees.map(employee => (
          <div key={employee.id} className="card hover:shadow-lg transition-all duration-300 group p-5 lg:p-6">
            {/* Header del card */}
            <div className="flex items-start justify-between mb-4 lg:mb-5">
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-3 lg:space-x-4 mb-3">
                  <div className="text-3xl lg:text-4xl flex-shrink-0">👨‍💼</div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg lg:text-xl font-semibold text-gray-900 truncate mb-1">{employee.name}</h3>
                    <p className="text-sm lg:text-base text-gray-500 truncate leading-relaxed">{employee.email}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className={`inline-flex px-3 py-1.5 text-xs font-semibold rounded-full bg-${getPositionColor(employee.position)}-100 text-${getPositionColor(employee.position)}-800`}>
                    {positions.find(p => p.id === employee.position)?.name || employee.position}
                  </span>
                  <span className={`inline-flex px-3 py-1.5 text-xs font-semibold rounded-full bg-${getStatusColor(employee.status)}-100 text-${getStatusColor(employee.status)}-800`}>
                    {employeeStatuses.find(s => s.id === employee.status)?.name || employee.status}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Información del empleado */}
            <div className="space-y-4 mb-5 lg:mb-6">
              <div className="flex justify-between items-center py-2">
                <span className="text-sm lg:text-base text-gray-600 font-medium">Teléfono:</span>
                <span className="text-sm lg:text-base text-gray-700 truncate max-w-[120px] lg:max-w-[150px]">{employee.phone}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm lg:text-base text-gray-600 font-medium">Salario:</span>
                <span className="text-sm lg:text-base font-semibold text-green-600">
                  ${employee.salary?.toLocaleString() || 0}
                </span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm lg:text-base text-gray-600 font-medium">Fecha Contrato:</span>
                <span className="text-sm lg:text-base text-gray-700">
                  {employee.hireDate ? new Date(employee.hireDate).toLocaleDateString() : 'N/A'}
                </span>
              </div>
              {employee.permissions && employee.permissions.length > 0 && (
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm lg:text-base text-gray-600 font-medium">Permisos:</span>
                  <span className="text-sm lg:text-base text-blue-600 font-medium">
                    {employee.permissions.length}
                  </span>
                </div>
              )}
            </div>

            {/* Acciones */}
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setSelectedEmployee(employee);
                  setShowEditModal(true);
                }}
                className="flex-1 btn btn-secondary text-sm lg:text-base py-3 flex items-center justify-center font-medium"
              >
                <Edit className="h-4 w-4 lg:h-5 lg:w-5 mr-2" />
                Editar
              </button>
              <button
                onClick={() => handleDeleteEmployee(employee.id)}
                className="btn btn-danger text-sm lg:text-base py-3 px-4 lg:px-5 flex items-center justify-center font-medium"
              >
                <Trash2 className="h-4 w-4 lg:h-5 lg:w-5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredEmployees.length === 0 && (
        <div className="text-center py-8 lg:py-12">
          <Users className="h-12 w-12 lg:h-16 lg:w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg lg:text-xl font-medium text-gray-900 mb-2">No se encontraron empleados</h3>
          <p className="text-sm lg:text-base text-gray-500 mb-4 px-4">Intenta ajustar los filtros de búsqueda</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn btn-primary text-sm lg:text-base"
          >
            <Plus className="h-4 w-4 mr-2" />
            Agregar Primer Empleado
          </button>
        </div>
      )}

      {/* Modals */}
      {showAddModal && (
        <EmployeeModal
          onSave={handleAddEmployee}
          onCancel={() => setShowAddModal(false)}
        />
      )}

      {showEditModal && selectedEmployee && (
        <EmployeeModal
          employee={selectedEmployee}
          onSave={handleEditEmployee}
          onCancel={() => {
            setShowEditModal(false);
            setSelectedEmployee(null);
          }}
        />
      )}
    </div>
  );
};

const EmployeeModal = ({ employee, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    name: employee?.name || '',
    position: employee?.position || '',
    email: employee?.email || '',
    phone: employee?.phone || '',
    address: employee?.address || '',
    salary: employee?.salary || 0,
    notes: employee?.notes || '',
    permissions: Array.isArray(employee?.permissions) ? employee.permissions : []
  });

  const availablePermissions = [
    { id: 'admin', label: 'Administrador (todo)' },
    { id: 'sales', label: 'Ventas' },
    { id: 'inventory', label: 'Inventario' },
    { id: 'products', label: 'Productos' },
    { id: 'purchases', label: 'Compras' },
    { id: 'expenses', label: 'Gastos' },
    { id: 'reports', label: 'Reportes' },
    { id: 'customers', label: 'Clientes' },
    { id: 'suppliers', label: 'Proveedores' },
  ];

  const rolePresets = [
    { id: 'none', name: 'Personalizado', permissions: [] },
    { id: 'admin', name: 'Administrador', permissions: ['admin'] },
    { id: 'cashier', name: 'Cajero/a', permissions: ['sales', 'customers'] },
    { id: 'inventory', name: 'Encargado de Inventario', permissions: ['inventory', 'products', 'purchases', 'suppliers'] },
    { id: 'supervisor', name: 'Supervisor', permissions: ['sales', 'reports', 'customers'] },
  ];

  const [selectedRole, setSelectedRole] = useState(() => {
    if (formData.permissions.includes('admin')) return 'admin';
    return 'none';
  });

  const applyClaims = async () => {
    try {
      const body = {
        email: formData.email,
        role: selectedRole === 'admin' ? 'admin' : undefined,
        permissions: formData.permissions
      };
      const res = await fetch('/api/admin/set-claims', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error aplicando claims');
      toast.success('Claims aplicados. Pedir re-login para reflejar permisos');
    } catch (e) {
      console.error(e);
      toast.error('No se pudieron aplicar claims');
    }
  };

  const createFirebaseAccount = async () => {
    try {
      if (!formData.email) {
        toast.error('Primero ingresá el email');
        return;
      }
      const res = await fetch('/api/admin/create-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          displayName: formData.name,
          role: selectedRole === 'admin' ? 'admin' : undefined,
          permissions: formData.permissions,
          tempPasswordLength: 12,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo crear la cuenta');
      toast.success('Cuenta creada. Copiá la contraseña temporal.');
      try {
        await navigator.clipboard.writeText(data.tempPassword);
        toast.success('Contraseña temporal copiada al portapapeles');
      } catch {}
      console.log('Temp password para', data.email, ':', data.tempPassword);
    } catch (e) {
      console.error(e);
      toast.error(e.message || 'Error creando cuenta');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {employee ? 'Editar Empleado' : 'Agregar Empleado'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre Completo
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
                Rol
              </label>
              <select
                value={selectedRole}
                onChange={(e) => {
                  const role = e.target.value;
                  setSelectedRole(role);
                  const preset = rolePresets.find(r => r.id === role);
                  if (preset) {
                    setFormData(prev => ({ ...prev, permissions: preset.permissions }));
                  }
                }}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                {rolePresets.map(r => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">Seleccioná un rol predefinido o dejá "Personalizado" para elegir permisos manualmente</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Permisos
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 border border-gray-200 rounded-md">
                {availablePermissions.map(p => (
                  <label key={p.id} className="inline-flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.permissions.includes(p.id)}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setSelectedRole('none');
                        setFormData(prev => ({
                          ...prev,
                          permissions: checked
                            ? Array.from(new Set([...(prev.permissions || []), p.id]))
                            : (prev.permissions || []).filter(x => x !== p.id)
                        }));
                      }}
                    />
                    <span className="text-sm text-gray-700">{p.label}</span>
                  </label>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-1">Nota: si asignás "Administrador" no necesitás marcar el resto</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cargo
              </label>
              <select
                required
                value={formData.position}
                onChange={(e) => setFormData({...formData, position: e.target.value})}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">Seleccionar cargo</option>
                {positions.map(position => (
                  <option key={position.id} value={position.name}>
                    {position.name}
                  </option>
                ))}
              </select>
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
                Salario
              </label>
              <input
                type="number"
                required
                value={formData.salary}
                onChange={(e) => setFormData({...formData, salary: parseInt(e.target.value)})}
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
            <div className="flex justify-between items-center pt-4 space-x-2">
              <button
                type="button"
                onClick={createFirebaseAccount}
                className="btn btn-secondary flex items-center"
                title="Crear cuenta en Firebase con contraseña temporal y forzar cambio al primer ingreso"
              >
                <KeyRound className="h-4 w-4 mr-2" />
                Crear cuenta Firebase
              </button>
              <button
                type="button"
                onClick={applyClaims}
                className="btn btn-secondary"
              >
                Aplicar claims
              </button>
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
                {employee ? 'Actualizar' : 'Agregar'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Employees; 