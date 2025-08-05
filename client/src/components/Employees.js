import React, { useState, useEffect } from 'react';
import { employees, positions, employeeStatuses } from '../data/employees';
import { UserCheck, Plus, Edit, Trash2, Search, DollarSign, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import { employeeService, loadSampleData } from '../services/firebaseService';

const Employees = () => {
  const [employeeList, setEmployeeList] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [positionFilter, setPositionFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  // Cargar empleados desde Firebase
  useEffect(() => {
    const loadEmployees = async () => {
      try {
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
        salary: parseFloat(newEmployee.salary)
      };
      
      const employeeId = await employeeService.addEmployee(employeeData);
      console.log('✅ Empleado agregado a Firebase con ID:', employeeId);
      
      const employeeWithId = { ...employeeData, id: employeeId };
      setEmployeeList([employeeWithId, ...employeeList]);
      setShowAddModal(false);
      toast.success('Empleado agregado exitosamente');
    } catch (error) {
      console.error('❌ Error agregando empleado desde Employees:', error);
      toast.error('Error al agregar empleado');
    }
  };

  const handleEditEmployee = async (updatedEmployee) => {
    try {
      console.log('🔄 Actualizando empleado desde componente Employees...');
      
      await employeeService.updateEmployee(updatedEmployee.id, updatedEmployee);
      console.log('✅ Empleado actualizado en Firebase');
      
      setEmployeeList(employeeList.map(e => 
        e.id === updatedEmployee.id ? updatedEmployee : e
      ));
      setShowEditModal(false);
      setSelectedEmployee(null);
      toast.success('Empleado actualizado exitosamente');
    } catch (error) {
      console.error('❌ Error actualizando empleado desde Employees:', error);
      toast.error('Error al actualizar empleado');
    }
  };

  const handleDeleteEmployee = async (id) => {
    try {
      console.log('🔄 Eliminando empleado desde componente Employees...');
      
      await employeeService.deleteEmployee(id);
      console.log('✅ Empleado eliminado de Firebase');
      
      setEmployeeList(employeeList.filter(e => e.id !== id));
      toast.success('Empleado eliminado exitosamente');
    } catch (error) {
      console.error('❌ Error eliminando empleado desde Employees:', error);
      toast.error('Error al eliminar empleado');
    }
  };

  const getStatusColor = (status) => {
    const statusObj = employeeStatuses.find(s => s.id === status);
    return statusObj?.color || 'gray';
  };

  const getPositionColor = (position) => {
    const positionObj = positions.find(p => p.name === position);
    return positionObj?.color || 'gray';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Empleados</h1>
          <p className="mt-1 text-sm text-gray-500">
            Gestiona el personal de la carnicería
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="btn btn-primary flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          Agregar Empleado
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Empleados</p>
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
            <DollarSign className="h-8 w-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Salarios</p>
              <p className="text-2xl font-semibold text-gray-900">
                ${stats.totalSalary.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <DollarSign className="h-8 w-8 text-orange-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Salario Promedio</p>
              <p className="text-2xl font-semibold text-gray-900">
                ${Math.round(stats.averageSalary).toLocaleString()}
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
                placeholder="Buscar por nombre o email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cargo
            </label>
            <select
              value={positionFilter}
              onChange={(e) => setPositionFilter(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">Todos los cargos</option>
              {positions.map(position => (
                <option key={position.id} value={position.name}>
                  {position.name}
                </option>
              ))}
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
              {employeeStatuses.map(status => (
                <option key={status.id} value={status.id}>
                  {status.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Employees List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Empleado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cargo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contacto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Salario
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha Contratación
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredEmployees.map(employee => (
                <tr key={employee.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {employee.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {employee.address}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-${getPositionColor(employee.position)}-100 text-${getPositionColor(employee.position)}-800`}>
                      {employee.position}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm text-gray-900">{employee.email}</div>
                      <div className="text-sm text-gray-500">{employee.phone}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      ${employee.salary.toLocaleString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(employee.hireDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-${getStatusColor(employee.status)}-100 text-${getStatusColor(employee.status)}-800`}>
                      {employeeStatuses.find(s => s.id === employee.status)?.name}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => {
                        setSelectedEmployee(employee);
                        setShowEditModal(true);
                      }}
                      className="text-primary-600 hover:text-primary-900 mr-3"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteEmployee(employee.id)}
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
        <EmployeeModal
          employee={selectedEmployee}
          onSave={showAddModal ? handleAddEmployee : handleEditEmployee}
          onCancel={() => {
            setShowAddModal(false);
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
    notes: employee?.notes || ''
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