import React, { useState, useEffect, useCallback } from 'react';
import { 
  Clock, 
  Sun, 
  Moon, 
  Plus, 
  X, 
  AlertTriangle,
  User,
  Shield
} from 'lucide-react';
import realtimeService from '../services/realtimeService';
import { shiftService, expensesService } from '../services/firebaseService';
import { useCashRegisterAccess } from '../hooks/useCashRegisterAccess';
import toast from 'react-hot-toast';

const ShiftManagement = ({ onShiftChange, currentShift }) => {
  // Hook de control de acceso
  const { 
    currentUser, 
    userRole, 
    canOpenShift, 
    canCloseShift 
  } = useCashRegisterAccess();

  // Estados principales
  const [shifts, setShifts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showOpenShiftModal, setShowOpenShiftModal] = useState(false);
  const [showCloseShiftModal, setShowCloseShiftModal] = useState(false);
  const [selectedShift, setSelectedShift] = useState(null);
  
  // Estados para abrir turno (empleado automático desde usuario logueado)
  const [shiftType, setShiftType] = useState('morning');
  const [shiftDate, setShiftDate] = useState(new Date().toISOString().split('T')[0]);
  const [openingAmount, setOpeningAmount] = useState(0);
  const [notes, setNotes] = useState('');
  
  // Estados para cerrar turno
  const [closingAmount, setClosingAmount] = useState(0);
  const [closingNotes, setClosingNotes] = useState('');
  const [expenseAmount, setExpenseAmount] = useState(0);
  const [expenseReason, setExpenseReason] = useState('');
  const net = (selectedShift?.total || 0) - (Number(expenseAmount) || 0);
  
  // Estados para validaciones
  const [validationErrors, setValidationErrors] = useState({});
  const [canOpenAfternoon, setCanOpenAfternoon] = useState(false);
  
  // Cargar turnos
  const loadShifts = useCallback(async () => {
    try {
      setIsLoading(true);
      const allShifts = await shiftService.getAllShifts();
      setShifts(allShifts);
      
      // Verificar si se puede abrir turno tarde
      const today = new Date().toISOString().split('T')[0];
      const todayShifts = allShifts.filter(shift => {
        const d = shift.date || (shift.startTime?.toDate?.()?.toISOString()?.split('T')[0]);
        return d === today;
      });
      
      const morningShift = todayShifts.find(shift => shift.type === 'morning');
      const afternoonShift = todayShifts.find(shift => shift.type === 'afternoon');
      
      setCanOpenAfternoon(
        morningShift && 
        morningShift.status === 'closed' && 
        !afternoonShift
      );
      
    } catch (error) {
      console.error('Error cargando turnos:', error);
      toast.error('Error cargando turnos');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Validar apertura de turno
  const validateShiftOpening = useCallback(() => {
    const errors = {};
    
    if (!shiftDate) {
      errors.date = 'La fecha es requerida';
    }
    
    if (openingAmount < 0) {
      errors.openingAmount = 'El monto de apertura no puede ser negativo';
    }
    
    if (!employeeName.trim()) {
      errors.employeeName = 'El nombre del empleado es requerido';
    }
    
    // Verificar que no haya un turno activo del mismo tipo hoy
    const today = new Date().toISOString().split('T')[0];
    const todayShifts = shifts.filter(shift => {
      const shiftDate = shift.date || (shift.startTime?.toDate?.()?.toISOString()?.split('T')[0]);
      return shiftDate === today;
    });
    
    const existingShift = todayShifts.find(shift => shift.type === shiftType);
    if (existingShift) {
      errors.existingShift = `Ya existe un turno ${shiftType === 'morning' ? 'mañana' : 'tarde'} para hoy`;
    }
    
    // Validar reglas específicas para turno tarde
    if (shiftType === 'afternoon') {
      const morningShift = todayShifts.find(shift => shift.type === 'morning');
      const afternoonShift = todayShifts.find(shift => shift.type === 'afternoon');
      
      if (!morningShift) {
        errors.morningShift = 'Debe abrirse el turno mañana primero';
      } else if (morningShift.status !== 'closed') {
        errors.morningShift = 'El turno mañana debe estar cerrado';
      } else if (afternoonShift) {
        errors.afternoonShift = 'El turno tarde ya está abierto';
      }
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [shiftType, shiftDate, openingAmount, employeeName, shifts]);

  // Abrir turno
  const openShift = async () => {
    // Verificar permisos
    if (!canOpenShift) {
      toast.error(`Su rol de ${userRole?.displayName} no puede abrir turnos`);
      return;
    }

    if (!validateShiftOpening()) {
      return;
    }
    
    try {
      setIsLoading(true);
      
      const shiftData = {
        type: shiftType,
        date: shiftDate,
        openingAmount: parseFloat(openingAmount),
        employeeName: currentUser?.name || 'Usuario',
        employeeEmail: currentUser?.email,
        employeeId: currentUser?.employeeId || currentUser?.id,
        employeeRole: currentUser?.role,
        employeePosition: currentUser?.position,
        notes: notes.trim(),
        status: 'active',
        startTime: new Date(),
        total: 0,
        salesCount: 0,
        createdAt: new Date(),
        openedBy: {
          id: currentUser?.id,
          name: currentUser?.name,
          email: currentUser?.email,
          role: currentUser?.role,
          position: currentUser?.position,
          timestamp: new Date()
        }
      };
      
      const shiftId = await shiftService.addShift(shiftData);
      
      // Actualizar estado local
      const newShift = { id: shiftId, ...shiftData };
      setShifts(prev => [...prev, newShift]);
      
      // Notificar cambio de turno
      if (onShiftChange) {
        onShiftChange(newShift);
      }
      
      // Limpiar formulario
      setShiftType('morning');
      setShiftDate(new Date().toISOString().split('T')[0]);
      setOpeningAmount(0);
      // Usuario automático desde login
      setNotes('');
      setShowOpenShiftModal(false);
      
      toast.success(`Turno ${shiftType === 'morning' ? 'mañana' : 'tarde'} abierto exitosamente`);
      
    } catch (error) {
      console.error('Error abriendo turno:', error);
      toast.error('Error abriendo turno');
    } finally {
      setIsLoading(false);
    }
  };

  // Cerrar turno
  const closeShift = async () => {
    if (!selectedShift) return;
    
    try {
      setIsLoading(true);
      
      const closingData = {
        closingAmount: parseFloat(closingAmount),
        closingNotes: closingNotes.trim(),
        endTime: new Date(),
        finalTotal: selectedShift.total,
        finalSalesCount: selectedShift.salesCount
      };
      
      await shiftService.closeShift(selectedShift.id, closingData);
      
      // Registrar gasto opcional asociado al cierre
      if (expenseAmount > 0) {
        try {
          await expensesService.addExpense({
            shiftId: selectedShift.id,
            amount: Number(expenseAmount),
            reason: expenseReason || 'Gasto de cierre',
            type: 'operational'
          });
        } catch (e) {
          console.warn('No se pudo registrar gasto de cierre:', e);
        }
      }
      
      // Actualizar estado local
      setShifts(prev => prev.map(shift => 
        shift.id === selectedShift.id 
          ? { ...shift, ...closingData, status: 'closed' }
          : shift
      ));
      
      // Notificar cambio de turno
      if (onShiftChange) {
        onShiftChange(null);
      }
      
      // Limpiar formulario
      setClosingAmount(0);
      setClosingNotes('');
      setExpenseAmount(0);
      setExpenseReason('');
      setSelectedShift(null);
      setShowCloseShiftModal(false);
      
      toast.success('Turno cerrado exitosamente');
      
    } catch (error) {
      console.error('Error cerrando turno:', error);
      toast.error('Error cerrando turno');
    } finally {
      setIsLoading(false);
    }
  };

  // Cargar datos iniciales
  useEffect(() => {
    loadShifts();
    
    // Escuchar cambios en tiempo real
    realtimeService.on('shifts_updated', (data) => {
      setShifts(data.shifts);
    });
    
    return () => {
      realtimeService.off('shifts_updated');
    };
  }, [loadShifts]);

  // Formatear fecha
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'N/A';
      return date.toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return 'N/A';
    }
  };

  // Formatear hora
  const formatTime = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'N/A';
      return date.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'N/A';
    }
  };

  // Obtener estado del turno
  const getShiftStatus = (shift) => {
    if (shift.status === 'active') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <div className="w-2 h-2 bg-green-400 rounded-full mr-1"></div>
          Activo
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
        <div className="w-2 h-2 bg-gray-400 rounded-full mr-1"></div>
        Cerrado
      </span>
    );
  };

  // Obtener icono del turno
  const getShiftIcon = (type) => {
    return type === 'morning' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />;
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Clock className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900">Gestión de Turnos</h2>
        </div>
        
        <button
          onClick={() => setShowOpenShiftModal(true)}
          disabled={isLoading}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          <Plus className="w-4 h-4 mr-2" />
          Abrir Turno
        </button>
      </div>

      {/* Turno Actual */}
      {currentShift && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {getShiftIcon(currentShift.type)}
              <div>
                <h3 className="text-lg font-medium text-blue-900">
                  Turno {currentShift.type === 'morning' ? 'Mañana' : 'Tarde'} Activo
                </h3>
                <p className="text-sm text-blue-700">
                                      Empleado: {currentShift.employeeName || 'N/A'} | 
                                      Apertura: ${(currentShift.openingAmount || 0).toFixed(2)} |
                    Total: ${(currentShift.total || 0).toFixed(2)}
                </p>
              </div>
            </div>
            
            <button
              onClick={() => {
                setSelectedShift(currentShift);
                setClosingAmount(currentShift.total);
                setShowCloseShiftModal(true);
              }}
              className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              <X className="w-4 h-4 mr-1" />
              Cerrar Turno
            </button>
          </div>
        </div>
      )}

      {/* Lista de Turnos */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Historial de Turnos</h3>
        
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-sm text-gray-600">Cargando turnos...</p>
          </div>
        ) : shifts.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No hay turnos registrados</p>
          </div>
        ) : (
          <div className="space-y-3">
            {shifts.map((shift) => (
              <div
                key={shift.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
              >
                <div className="flex items-center space-x-3">
                  {getShiftIcon(shift.type)}
                  <div>
                    <div className="flex items-center space-x-2">
                      <h4 className="font-medium text-gray-900">
                        Turno {shift.type === 'morning' ? 'Mañana' : 'Tarde'}
                      </h4>
                      {getShiftStatus(shift)}
                    </div>
                    <p className="text-sm text-gray-600">
                      {formatDate(shift.date)} | {formatTime(shift.startTime)}
                    </p>
                    <p className="text-sm text-gray-600">
                      Empleado: {shift.employeeName || 'N/A'} | 
                      Apertura: ${(shift.openingAmount || 0).toFixed(2)} | 
                      Total: ${(shift.total || 0).toFixed(2)}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {shift.status === 'active' && (
                    <button
                      onClick={() => {
                        setSelectedShift(shift);
                        setClosingAmount(shift.total);
                        setShowCloseShiftModal(true);
                      }}
                      className="inline-flex items-center px-2 py-1 text-xs font-medium rounded text-red-700 bg-red-100 hover:bg-red-200"
                    >
                      <X className="w-3 h-3 mr-1" />
                      Cerrar
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Abrir Turno */}
      {showOpenShiftModal && (
        <div className="modal-overlay">
          <div className="modal-content p-5">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Abrir Turno</h3>
                <button
                  onClick={() => setShowOpenShiftModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Tipo de Turno */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de Turno
                  </label>
                  <div className="flex space-x-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="morning"
                        checked={shiftType === 'morning'}
                        onChange={(e) => setShiftType(e.target.value)}
                        className="mr-2"
                      />
                      <Sun className="w-4 h-4 mr-1" />
                      Mañana
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="afternoon"
                        checked={shiftType === 'afternoon'}
                        onChange={(e) => setShiftType(e.target.value)}
                        className="mr-2"
                        disabled={!canOpenAfternoon}
                      />
                      <Moon className="w-4 h-4 mr-1" />
                      Tarde
                    </label>
                  </div>
                  {shiftType === 'afternoon' && !canOpenAfternoon && (
                    <p className="text-sm text-red-600 mt-1">
                      <AlertTriangle className="w-4 h-4 inline mr-1" />
                      El turno mañana debe estar abierto y cerrado primero
                    </p>
                  )}
                </div>

                {/* Fecha */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha
                  </label>
                  <input
                    type="date"
                    value={shiftDate}
                    onChange={(e) => setShiftDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {validationErrors.date && (
                    <p className="text-sm text-red-600 mt-1">{validationErrors.date}</p>
                  )}
                </div>

                {/* Monto de Apertura */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Monto de Apertura
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={openingAmount}
                    onChange={(e) => setOpeningAmount(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0.00"
                  />
                  {validationErrors.openingAmount && (
                    <p className="text-sm text-red-600 mt-1">{validationErrors.openingAmount}</p>
                  )}
                </div>

                {/* Empleado */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Empleado
                  </label>
                  <input
                    type="text"
                    value={employeeName}
                    onChange={(e) => setEmployeeName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Nombre del empleado"
                  />
                  {validationErrors.employeeName && (
                    <p className="text-sm text-red-600 mt-1">{validationErrors.employeeName}</p>
                  )}
                </div>

                {/* Notas */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notas (opcional)
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Notas adicionales..."
                  />
                </div>

                {/* Errores de validación */}
                {validationErrors.morningShift && (
                  <p className="text-sm text-red-600">
                    <AlertTriangle className="w-4 h-4 inline mr-1" />
                    {validationErrors.morningShift}
                  </p>
                )}
                {validationErrors.afternoonShift && (
                  <p className="text-sm text-red-600">
                    <AlertTriangle className="w-4 h-4 inline mr-1" />
                    {validationErrors.afternoonShift}
                  </p>
                )}

                {/* Botones */}
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    onClick={() => setShowOpenShiftModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={openShift}
                    disabled={isLoading}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    {isLoading ? 'Abriendo...' : 'Abrir Turno'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Cerrar Turno */}
      {showCloseShiftModal && selectedShift && (
        <div className="modal-overlay">
          <div className="modal-content p-5">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Cerrar Turno</h3>
                <button
                  onClick={() => setShowCloseShiftModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Información del turno */}
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">
                    <strong>Turno:</strong> {selectedShift.type === 'morning' ? 'Mañana' : 'Tarde'}
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>Empleado:</strong> {selectedShift.employeeName || 'N/A'}
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>Total de Ventas:</strong> ${(selectedShift.total || 0).toFixed(2)}
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>Cantidad de Ventas:</strong> {selectedShift.salesCount || 0}
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>Gasto de Cierre:</strong> ${(Number(expenseAmount) || 0).toFixed(2)}
                  </p>
                  <p className="text-sm text-gray-900">
                    <strong>Caja Neta:</strong> ${net.toFixed(2)}
                  </p>
                </div>

                {/* Monto de Cierre */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Monto de Cierre
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={closingAmount}
                    onChange={(e) => setClosingAmount(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0.00"
                  />
                </div>

                {/* Gasto de Cierre (opcional) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Gasto de Cierre (opcional)
                  </label>
                  <div className="grid grid-cols-1 gap-2">
                    <input
                      type="number"
                      step="0.01"
                      value={expenseAmount}
                      onChange={(e) => setExpenseAmount(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0.00"
                    />
                    <input
                      type="text"
                      value={expenseReason}
                      onChange={(e) => setExpenseReason(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Motivo del gasto"
                    />
                  </div>
                </div>

                {/* Notas de Cierre */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notas de Cierre (opcional)
                  </label>
                  <textarea
                    value={closingNotes}
                    onChange={(e) => setClosingNotes(e.target.value)}
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Notas del cierre..."
                  />
                </div>

                {/* Botones */}
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    onClick={() => setShowCloseShiftModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={closeShift}
                    disabled={isLoading}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                  >
                    {isLoading ? 'Cerrando...' : 'Cerrar Turno'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShiftManagement; 