import React, { useEffect, useState } from 'react';
import { CreditCard, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { expensesService, shiftService } from '../services/firebaseService';
import { usePermissions } from '../context/PermissionsContext';

const Expenses = () => {
  const permissions = usePermissions();
  const [currentShift, setCurrentShift] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [amount, setAmount] = useState(0);
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      if (!(permissions.includes('expenses') || permissions.includes('admin'))) return;
      try {
        const shift = await shiftService.getActiveShift();
        setCurrentShift(shift);
        if (shift) {
          const list = await expensesService.getExpensesByShift(shift.id);
          setExpenses(list);
        }
      } catch (e) {
        console.error('Error cargando gastos:', e);
      }
    })();
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
      const id = await expensesService.addExpense({
        shiftId: currentShift.id,
        amount: Number(amount) || 0,
        reason: reason || 'Gasto operativo',
        type: 'operational'
      });
      setExpenses([{ id, amount: Number(amount) || 0, reason, createdAt: new Date() }, ...expenses]);
      setAmount(0);
      setReason('');
      toast.success('Gasto registrado');
    } catch (e) {
      console.error('Error agregando gasto:', e);
      toast.error('Error agregando gasto');
    } finally {
      setSaving(false);
    }
  };

  const total = expenses.reduce((s, e) => s + (e.amount || 0), 0);

  return (
    <div className="p-4 lg:p-6 space-y-4">
      {!(permissions.includes('expenses') || permissions.includes('admin')) ? (
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Acceso restringido</h2>
          <p className="text-gray-600">No tenés permisos para registrar gastos. Contactá a un administrador.</p>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CreditCard className="h-6 w-6 text-purple-600" />
              <h1 className="text-2xl font-bold text-gray-900">Gastos</h1>
            </div>
            <div className="text-sm text-gray-600">Turno: {currentShift ? (currentShift.type === 'morning' ? 'Mañana' : 'Tarde') : 'N/A'}</div>
          </div>

          <div className="card">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
              <div>
                <label className="form-label">Monto</label>
                <input type="number" min="0" step="0.01" value={amount} onChange={(e) => setAmount(Number(e.target.value) || 0)} className="form-input" />
              </div>
              <div>
                <label className="form-label">Motivo</label>
                <input value={reason} onChange={(e) => setReason(e.target.value)} className="form-input" placeholder="Ej: Limpieza" />
              </div>
              <div className="flex justify-end">
                <button onClick={addExpense} disabled={saving} className="btn btn-primary flex items-center"><Check className="h-4 w-4 mr-2" /> {saving ? 'Guardando...' : 'Agregar Gasto'}</button>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-semibold text-gray-900">Gastos del Turno</h2>
              <div className="text-sm text-gray-700">Total: ${total.toLocaleString()}</div>
            </div>

            {expenses.length === 0 ? (
              <div className="text-gray-500">No hay gastos registrados</div>
            ) : (
              <div className="space-y-2">
                {expenses.map((e) => (
                  <div key={e.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <div>
                      <div className="font-medium text-gray-900">${(e.amount || 0).toLocaleString()}</div>
                      <div className="text-sm text-gray-600">{e.reason || 'Gasto'}</div>
                    </div>
                    <div className="text-xs text-gray-500">{e.createdAt?.toDate?.()?.toLocaleString?.() || ''}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Expenses;
