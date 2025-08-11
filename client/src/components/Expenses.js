import React, { useEffect, useState } from 'react';
import { CreditCard, DollarSign, Receipt, Plus, Trash2 } from 'lucide-react';
import { toast } from 'react-toastify';
import { expensesService, shiftService } from '../services/firebaseService';
import { collection, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import { usePermissions } from '../context/PermissionsContext';

const Expenses = () => {
  const permissions = usePermissions();
  const [currentShift, setCurrentShift] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [amount, setAmount] = useState(0);
  const [reason, setReason] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('efectivo');
  const [cardType, setCardType] = useState('debito');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!(permissions.includes('expenses') || permissions.includes('admin'))) return;
    let unsub = null;
    (async () => {
      try {
        const shift = await shiftService.getActiveShift();
        setCurrentShift(shift);
        if (shift?.id) {
          unsub = onSnapshot(
            query(collection(db, 'expenses'), where('shiftId', '==', shift.id), orderBy('createdAt', 'desc')),
            (snap) => {
              const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
              setExpenses(list);
            },
            (err) => console.error('Error onSnapshot gastos:', err)
          );
        } else {
          setExpenses([]);
        }
      } catch (e) {
        console.error('Error cargando gastos:', e);
      }
    })();
    return () => { try { unsub && unsub(); } catch {} };
  }, [permissions]);

  const addExpense = async () => {
    if (!currentShift) {
      toast.error('No hay turno activo');
      return;
    }
    if (amount <= 0) {
      toast.error('Monto inválido');
      return;
    }
    setSaving(true);
    try {
      // Determinar el método de pago final
      let finalPaymentMethod = paymentMethod;
      if (paymentMethod === 'tarjeta') {
        finalPaymentMethod = cardType === 'credito' ? 'tarjetaCredito' : 'tarjetaDebito';
      }

      await expensesService.addExpense({
        shiftId: currentShift.id,
        amount: Number(amount) || 0,
        reason: reason || 'Gasto operativo',
        paymentMethod: finalPaymentMethod,
        type: 'operational'
      });
      // onSnapshot actualizará la lista
      setAmount(0);
      setReason('');
      setPaymentMethod('efectivo');
      setCardType('debito');
      toast.success('Gasto registrado');
    } catch (e) {
      console.error('Error agregando gasto:', e);
      toast.error('Error agregando gasto');
    } finally {
      setSaving(false);
    }
  };

  const deleteExpense = async (expenseId) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este gasto?')) {
      try {
        await expensesService.deleteExpense(expenseId);
        toast.success('Gasto eliminado');
      } catch (e) {
        console.error('Error eliminando gasto:', e);
        toast.error('Error eliminando gasto');
      }
    }
  };

  const total = expenses.reduce((s, e) => s + (e.amount || 0), 0);

  const getPaymentMethodLabel = (method) => {
    switch (method) {
      case 'efectivo': return 'Efectivo';
      case 'tarjetaDebito': return 'Tarjeta Débito';
      case 'tarjetaCredito': return 'Tarjeta Crédito';
      case 'transferencia': return 'Transferencia';
      default: return method;
    }
  };

  const getPaymentMethodColor = (method) => {
    switch (method) {
      case 'efectivo': return 'green';
      case 'tarjetaDebito': return 'blue';
      case 'tarjetaCredito': return 'purple';
      case 'transferencia': return 'orange';
      default: return 'gray';
    }
  };

  return (
    <div className="space-y-6">
      {!(permissions.includes('expenses') || permissions.includes('admin')) ? (
        <div className="card p-6">
          <div className="text-center">
            <CreditCard className="h-12 w-12 lg:h-16 lg:w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-lg lg:text-xl font-semibold text-gray-900 mb-2">Acceso restringido</h2>
            <p className="text-sm lg:text-base text-gray-600">No tenés permisos para registrar gastos. Contactá a un administrador.</p>
          </div>
        </div>
      ) : (
        <>
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-gradient">
                Gastos
              </h1>
              <p className="text-gray-600 mt-1">
                Registra y gestiona los gastos del turno
              </p>
            </div>
            <div className="text-sm lg:text-base text-gray-600 bg-gray-100 px-3 py-2 rounded-lg">
              Turno: {currentShift ? (currentShift.type === 'morning' ? 'Mañana' : 'Tarde') : 'N/A'}
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
            <div className="stats-card">
              <div className="flex items-center">
                <DollarSign className="h-5 w-5 lg:h-6 lg:w-6 text-red-600" />
                <div className="ml-2 lg:ml-3">
                  <p className="stats-label text-xs lg:text-sm">Total Gastos</p>
                  <p className="stats-value text-lg lg:text-xl">${total.toLocaleString()}</p>
                </div>
              </div>
            </div>
            <div className="stats-card">
              <div className="flex items-center">
                <Receipt className="h-5 w-5 lg:h-6 lg:w-6 text-blue-600" />
                <div className="ml-2 lg:ml-3">
                  <p className="stats-label text-xs lg:text-sm">Cantidad</p>
                  <p className="stats-value text-lg lg:text-xl">{expenses.length}</p>
                </div>
              </div>
            </div>
            <div className="stats-card lg:col-span-1">
              <div className="flex items-center">
                <CreditCard className="h-5 w-5 lg:h-6 lg:w-6 text-purple-600" />
                <div className="ml-2 lg:ml-3">
                  <p className="stats-label text-xs lg:text-sm">Promedio</p>
                  <p className="stats-value text-lg lg:text-xl">
                    ${expenses.length > 0 ? (total / expenses.length).toFixed(0) : 0}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Add Expense Form */}
          <div className="card p-4 lg:p-6">
            <h3 className="text-lg lg:text-xl font-semibold text-gray-900 mb-4 lg:mb-6">Registrar Nuevo Gasto</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="form-label text-sm lg:text-base">Monto</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="form-input text-sm lg:text-base"
                  placeholder="0"
                  min="0"
                  step="0.01"
                />
              </div>
              <div>
                <label className="form-label text-sm lg:text-base">Motivo</label>
                <input
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="form-input text-sm lg:text-base"
                  placeholder="Descripción del gasto"
                />
              </div>
              <div>
                <label className="form-label text-sm lg:text-base">Método de Pago</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="form-select text-sm lg:text-base"
                >
                  <option value="efectivo">Efectivo</option>
                  <option value="tarjeta">Tarjeta</option>
                  <option value="transferencia">Transferencia</option>
                </select>
              </div>
              <div className="flex items-end">
                <button
                  onClick={addExpense}
                  disabled={saving || !currentShift}
                  className="btn btn-primary w-full text-sm lg:text-base"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Agregar Gasto
                    </>
                  )}
                </button>
              </div>
            </div>
            
            {paymentMethod === 'tarjeta' && (
              <div className="mt-4">
                <label className="form-label text-sm lg:text-base">Tipo de Tarjeta</label>
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="debito"
                      checked={cardType === 'debito'}
                      onChange={(e) => setCardType(e.target.value)}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                    />
                    <span className="ml-2 text-sm lg:text-base text-gray-700">Débito</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="credito"
                      checked={cardType === 'credito'}
                      onChange={(e) => setCardType(e.target.value)}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                    />
                    <span className="ml-2 text-sm lg:text-base text-gray-700">Crédito</span>
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Expenses List */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6">
            {expenses.map(expense => (
              <div key={expense.id} className="card hover:shadow-lg transition-all duration-300 group p-5 lg:p-6">
                {/* Header del card */}
                <div className="flex items-start justify-between mb-4 lg:mb-5">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3 lg:space-x-4 mb-3">
                      <div className="text-3xl lg:text-4xl flex-shrink-0">💸</div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg lg:text-xl font-semibold text-gray-900 truncate mb-1">
                          ${expense.amount?.toLocaleString() || 0}
                        </h3>
                        <p className="text-sm lg:text-base text-gray-500 truncate leading-relaxed">
                          {expense.reason || 'Gasto operativo'}
                        </p>
                      </div>
                    </div>
                    <span className={`inline-flex px-3 py-1.5 text-xs font-semibold rounded-full bg-${getPaymentMethodColor(expense.paymentMethod)}-100 text-${getPaymentMethodColor(expense.paymentMethod)}-800`}>
                      {getPaymentMethodLabel(expense.paymentMethod)}
                    </span>
                  </div>
                </div>
                
                {/* Información del gasto */}
                <div className="space-y-4 mb-5 lg:mb-6">
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm lg:text-base text-gray-600 font-medium">Método:</span>
                    <span className="text-sm lg:text-base text-gray-700">
                      {getPaymentMethodLabel(expense.paymentMethod)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm lg:text-base text-gray-600 font-medium">Tipo:</span>
                    <span className="text-sm lg:text-base text-gray-700 capitalize">
                      {expense.type || 'operational'}
                    </span>
                  </div>
                  {expense.createdAt && (
                    <div className="flex justify-between items-center py-2">
                      <span className="text-sm lg:text-base text-gray-600 font-medium">Fecha:</span>
                      <span className="text-sm lg:text-base text-gray-700">
                        {expense.createdAt.toDate ? 
                          expense.createdAt.toDate().toLocaleDateString() : 
                          new Date(expense.createdAt).toLocaleDateString()
                        }
                      </span>
                    </div>
                  )}
                </div>

                {/* Acciones */}
                <div className="flex space-x-3">
                  <button
                    onClick={() => deleteExpense(expense.id)}
                    className="btn btn-danger w-full text-sm lg:text-base py-3 flex items-center justify-center font-medium"
                  >
                    <Trash2 className="h-4 w-4 lg:h-5 lg:w-5 mr-2" />
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Empty State */}
          {expenses.length === 0 && (
            <div className="text-center py-8 lg:py-12">
              <Receipt className="h-12 w-12 lg:h-16 lg:w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg lg:text-xl font-medium text-gray-900 mb-2">No hay gastos registrados</h3>
              <p className="text-sm lg:text-base text-gray-500 mb-4 px-4">Comienza registrando el primer gasto del turno</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Expenses;
