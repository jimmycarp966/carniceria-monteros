import React, { useState, useEffect, memo } from 'react';
import { 
  DollarSign, 
  CreditCard, 
  Receipt, 
  Plus, 
  Minus, 
  X, 
  AlertTriangle,
  CheckCircle,
  Calculator,
  Save,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { cashCountService } from '../services/cashCountService';
import { expensesService } from '../services/firebaseService';

const CashCountModal = memo(({ 
  currentShift, 
  currentUser, 
  onCashCountComplete, 
  onClose 
}) => {
  // Estados principales
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [salesByMethod, setSalesByMethod] = useState({});
  
  // Estados de métodos de pago
  const [paymentMethods, setPaymentMethods] = useState({
    efectivo: { expected: 0, counted: 0 },
    tarjetaDebito: { expected: 0, counted: 0 },
    tarjetaCredito: { expected: 0, counted: 0 },
    transferencia: { expected: 0, counted: 0 },
    mercadopago: { expected: 0, counted: 0 }
  });

  // Estados de ingresos y egresos adicionales
  const [additionalIncomes, setAdditionalIncomes] = useState([]);
  const [additionalExpenses, setAdditionalExpenses] = useState([]);
  
  // Estados para agregar ingresos/egresos
  const [newIncome, setNewIncome] = useState({ amount: '', description: '' });
  const [newExpense, setNewExpense] = useState({ amount: '', description: '' });

  // Estados de validación
  const [validationErrors, setValidationErrors] = useState([]);

  // Cargar datos iniciales
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setIsLoading(true);
        
        if (currentShift?.id) {
          // Cargar ventas del turno por método de pago
          const salesData = await cashCountService.getSalesByPaymentMethod(currentShift.id);
          setSalesByMethod(salesData);
          
          // Pre-cargar montos esperados
          const expectedMethods = {
            efectivo: { expected: salesData.efectivo.expected, counted: 0 },
            tarjetaDebito: { expected: salesData.tarjetaDebito.expected, counted: 0 },
            tarjetaCredito: { expected: salesData.tarjetaCredito.expected, counted: 0 },
            transferencia: { expected: salesData.transferencia.expected, counted: 0 },
            mercadopago: { expected: salesData.mercadopago.expected, counted: 0 }
          };
          setPaymentMethods(expectedMethods);
        }
      } catch (error) {
        console.error('Error cargando datos iniciales:', error);
        toast.error('Error cargando datos del turno');
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialData();
  }, [currentShift]);

  // Actualizar método de pago
  const updatePaymentMethod = (method, field, value) => {
    setPaymentMethods(prev => ({
      ...prev,
      [method]: {
        ...prev[method],
        [field]: parseFloat(value) || 0
      }
    }));
  };

  // Agregar ingreso adicional
  const addIncome = () => {
    if (!newIncome.amount || !newIncome.description.trim()) {
      toast.error('Complete todos los campos del ingreso');
      return;
    }

    const income = {
      id: Date.now(),
      amount: parseFloat(newIncome.amount),
      description: newIncome.description.trim(),
      timestamp: new Date()
    };

    setAdditionalIncomes(prev => [...prev, income]);
    setNewIncome({ amount: '', description: '' });
    toast.success('Ingreso agregado');
  };

  // Agregar egreso adicional
  const addExpense = () => {
    if (!newExpense.amount || !newExpense.description.trim()) {
      toast.error('Complete todos los campos del egreso');
      return;
    }

    const expense = {
      id: Date.now(),
      amount: parseFloat(newExpense.amount),
      description: newExpense.description.trim(),
      timestamp: new Date()
    };

    setAdditionalExpenses(prev => [...prev, expense]);
    setNewExpense({ amount: '', description: '' });
    toast.success('Egreso agregado');
  };

  // Remover ingreso
  const removeIncome = (id) => {
    setAdditionalIncomes(prev => prev.filter(income => income.id !== id));
  };

  // Remover egreso
  const removeExpense = (id) => {
    setAdditionalExpenses(prev => prev.filter(expense => expense.id !== id));
  };

  // Calcular diferencias
  const calculateDifferences = () => {
    const differences = {};
    let totalDifference = 0;

    Object.entries(paymentMethods).forEach(([method, data]) => {
      const difference = (data.counted || 0) - (data.expected || 0);
      differences[method] = {
        expected: data.expected || 0,
        counted: data.counted || 0,
        difference: difference,
        hasDifference: Math.abs(difference) > 0
      };
      totalDifference += difference;
    });

    return { differences, totalDifference };
  };

  // Calcular totales
  const calculateTotals = () => {
    const { differences } = calculateDifferences();
    
    const totalExpected = Object.values(paymentMethods)
      .reduce((sum, data) => sum + (data.expected || 0), 0);
    
    const totalCounted = Object.values(paymentMethods)
      .reduce((sum, data) => sum + (data.counted || 0), 0);

    const totalAdditionalIncomes = additionalIncomes.reduce((sum, income) => sum + (income.amount || 0), 0);
    const totalAdditionalExpenses = additionalExpenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);

    const finalTotal = totalCounted + totalAdditionalIncomes - totalAdditionalExpenses;
    const finalExpected = totalExpected + totalAdditionalIncomes - totalAdditionalExpenses;
    const finalDifference = finalTotal - finalExpected;

    return {
      totalExpected,
      totalCounted,
      totalAdditionalIncomes,
      totalAdditionalExpenses,
      finalTotal,
      finalExpected,
      finalDifference,
      hasDifference: Math.abs(finalDifference) > 0
    };
  };

  // Guardar arqueo
  const saveCashCount = async () => {
    try {
      setIsSaving(true);
      setValidationErrors([]);

      // Preparar datos del arqueo
      const cashCountData = {
        shiftId: currentShift.id,
        shiftType: currentShift.type,
        employeeName: currentUser?.name,
        employeeId: currentUser?.id,
        paymentMethods,
        additionalIncomes,
        additionalExpenses,
        notes: '',
        timestamp: new Date()
      };

      // Validar datos
      const validation = cashCountService.validateCashCount(cashCountData);
      if (!validation.isValid) {
        setValidationErrors(validation.errors);
        toast.error('Por favor corrija los errores antes de continuar');
        return;
      }

      // Calcular diferencias
      const differences = cashCountService.calculateDifferences(cashCountData);
      cashCountData.differences = differences;

      // Crear egresos en el módulo de Gastos
      const expensePromises = additionalExpenses.map(async (expense) => {
        try {
          const expenseData = {
            shiftId: currentShift.id,
            amount: expense.amount,
            reason: expense.description,
            type: 'cash_count',
            category: 'arqueo_caja',
            cashCountId: null // Se actualizará después
          };
          
          const expenseId = await expensesService.addExpense(expenseData);
          return { ...expense, expenseId };
        } catch (error) {
          console.error('Error creando gasto:', error);
          return expense;
        }
      });

      const expensesWithIds = await Promise.all(expensePromises);
      cashCountData.additionalExpenses = expensesWithIds;

      // Guardar arqueo
      const cashCountId = await cashCountService.createCashCount(cashCountData);

      // Actualizar IDs de gastos con el ID del arqueo
      for (const expense of expensesWithIds) {
        if (expense.expenseId) {
          try {
            await expensesService.updateExpense(expense.expenseId, {
              cashCountId: cashCountId
            });
          } catch (error) {
            console.warn('No se pudo actualizar gasto con ID de arqueo:', error);
          }
        }
      }

      toast.success('Arqueo de caja guardado exitosamente');
      
      // Llamar callback de completado
      if (onCashCountComplete) {
        onCashCountComplete(cashCountData, differences);
      }
      
    } catch (error) {
      console.error('Error guardando arqueo:', error);
      toast.error('Error guardando arqueo de caja');
    } finally {
      setIsSaving(false);
    }
  };

  const { differences } = calculateDifferences();
  const totals = calculateTotals();

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando datos del turno...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl p-6 w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Calculator className="h-8 w-8 text-primary-600" />
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Arqueo de Caja</h2>
              <p className="text-sm text-gray-600">
                Turno {currentShift?.type === 'morning' ? 'Mañana' : 'Tarde'} - {currentUser?.name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Errores de validación */}
        {validationErrors.length > 0 && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <h3 className="font-medium text-red-800">Errores de validación:</h3>
            </div>
            <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
              {validationErrors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Métodos de Pago */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <DollarSign className="h-5 w-5 mr-2 text-green-600" />
              Métodos de Pago
            </h3>
            
            {Object.entries(paymentMethods).map(([method, data]) => {
              const difference = differences[method];
              const methodLabels = {
                efectivo: 'Efectivo',
                tarjetaDebito: 'Tarjeta Débito',
                tarjetaCredito: 'Tarjeta Crédito',
                transferencia: 'Transferencia',
                mercadopago: 'MercadoPago'
              };

              return (
                <div key={method} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-gray-900">{methodLabels[method]}</h4>
                    {difference?.hasDifference && (
                      <div className={`flex items-center space-x-1 text-sm ${
                        difference.difference > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {difference.difference > 0 ? (
                          <TrendingUp className="h-4 w-4" />
                        ) : (
                          <TrendingDown className="h-4 w-4" />
                        )}
                        <span>${Math.abs(difference.difference).toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Esperado
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                        <input
                          type="number"
                          value={data.expected.toLocaleString()}
                          disabled
                          className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Contado
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                        <input
                          type="number"
                          value={data.counted || ''}
                          onChange={(e) => updatePaymentMethod(method, 'counted', e.target.value)}
                          className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                          placeholder="0"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Ingresos y Egresos Adicionales */}
          <div className="space-y-6">
            {/* Ingresos Adicionales */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 flex items-center mb-4">
                <TrendingUp className="h-5 w-5 mr-2 text-green-600" />
                Ingresos Adicionales
              </h3>
              
              <div className="space-y-3">
                {additionalIncomes.map((income) => (
                  <div key={income.id} className="flex items-center justify-between bg-green-50 rounded-lg p-3">
                    <div>
                      <p className="font-medium text-green-800">{income.description}</p>
                      <p className="text-sm text-green-600">${income.amount.toLocaleString()}</p>
                    </div>
                    <button
                      onClick={() => removeIncome(income.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Monto</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                        <input
                          type="number"
                          value={newIncome.amount}
                          onChange={(e) => setNewIncome(prev => ({ ...prev, amount: e.target.value }))}
                          className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                          placeholder="0"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                      <input
                        type="text"
                        value={newIncome.description}
                        onChange={(e) => setNewIncome(prev => ({ ...prev, description: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                        placeholder="Ej: Reposición de cambio"
                      />
                    </div>
                  </div>
                  <button
                    onClick={addIncome}
                    className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 flex items-center justify-center"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar Ingreso
                  </button>
                </div>
              </div>
            </div>

            {/* Egresos Adicionales */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 flex items-center mb-4">
                <TrendingDown className="h-5 w-5 mr-2 text-red-600" />
                Egresos Adicionales
              </h3>
              
              <div className="space-y-3">
                {additionalExpenses.map((expense) => (
                  <div key={expense.id} className="flex items-center justify-between bg-red-50 rounded-lg p-3">
                    <div>
                      <p className="font-medium text-red-800">{expense.description}</p>
                      <p className="text-sm text-red-600">${expense.amount.toLocaleString()}</p>
                    </div>
                    <button
                      onClick={() => removeExpense(expense.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Monto</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                        <input
                          type="number"
                          value={newExpense.amount}
                          onChange={(e) => setNewExpense(prev => ({ ...prev, amount: e.target.value }))}
                          className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                          placeholder="0"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                      <input
                        type="text"
                        value={newExpense.description}
                        onChange={(e) => setNewExpense(prev => ({ ...prev, description: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                        placeholder="Ej: Compra de insumos"
                      />
                    </div>
                  </div>
                  <button
                    onClick={addExpense}
                    className="w-full bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 flex items-center justify-center"
                  >
                    <Minus className="h-4 w-4 mr-2" />
                    Agregar Egreso
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Resumen y Totales */}
        <div className="mt-8 bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Resumen del Arqueo</h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="text-center">
              <p className="text-sm text-gray-600">Total Esperado</p>
              <p className="text-lg font-bold text-gray-900">${totals.totalExpected.toLocaleString()}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Total Contado</p>
              <p className="text-lg font-bold text-blue-600">${totals.totalCounted.toLocaleString()}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Ingresos Adicionales</p>
              <p className="text-lg font-bold text-green-600">${totals.totalAdditionalIncomes.toLocaleString()}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Egresos Adicionales</p>
              <p className="text-lg font-bold text-red-600">${totals.totalAdditionalExpenses.toLocaleString()}</p>
            </div>
          </div>
          
          <div className="border-t pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-semibold text-gray-900">Total Final</p>
                <p className="text-sm text-gray-600">
                  {totals.hasDifference ? 'Hay diferencia en el arqueo' : 'Arqueo balanceado'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-gray-900">${totals.finalTotal.toLocaleString()}</p>
                {totals.hasDifference && (
                  <p className={`text-sm font-medium ${
                    totals.finalDifference > 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    Diferencia: ${Math.abs(totals.finalDifference).toLocaleString()}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex space-x-3 mt-6">
          <button
            onClick={onClose}
            disabled={isSaving}
            className="flex-1 bg-gray-200 text-gray-800 py-3 px-4 rounded-lg hover:bg-gray-300 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={saveCashCount}
            disabled={isSaving}
            className="flex-1 bg-primary-600 text-white py-3 px-4 rounded-lg hover:bg-primary-700 disabled:opacity-50 flex items-center justify-center"
          >
            {isSaving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Guardando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Guardar Arqueo y Continuar
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
});

export default CashCountModal;
