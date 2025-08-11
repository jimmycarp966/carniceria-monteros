import React, { useEffect, useState } from 'react';
import { CreditCard, Check, DollarSign, Receipt } from 'lucide-react';
import toast from 'react-hot-toast';
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="form-label">Monto</label>
                <input type="number" min="0" step="0.01" value={amount} onChange={(e) => setAmount(Number(e.target.value) || 0)} className="form-input" />
              </div>
              <div>
                <label className="form-label">Motivo</label>
                <input value={reason} onChange={(e) => setReason(e.target.value)} className="form-input" placeholder="Ej: Limpieza" />
              </div>
            </div>

            {/* Método de Pago */}
            <div className="mb-4">
              <label className="form-label">Método de Pago</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { value: 'efectivo', label: 'Efectivo', icon: DollarSign },
                  { value: 'tarjeta', label: 'Tarjeta', icon: CreditCard },
                  { value: 'transferencia', label: 'Transferencia', icon: Receipt },
                  { value: 'mercadopago', label: 'MercadoPago', icon: CreditCard }
                ].map(method => (
                  <button
                    key={method.value}
                    onClick={() => setPaymentMethod(method.value)}
                    className={`p-3 rounded-xl border-2 transition-all duration-200 flex flex-col items-center ${
                      paymentMethod === method.value
                        ? 'border-purple-500 bg-purple-50 text-purple-700'
                        : 'border-gray-200 hover:border-purple-300 bg-white hover:bg-purple-50/50'
                    }`}
                  >
                    <method.icon className="h-5 w-5 mb-1" />
                    <span className="text-xs font-medium">{method.label}</span>
                  </button>
                ))}
              </div>

              {/* Selector de tipo de tarjeta */}
              {paymentMethod === 'tarjeta' && (
                <div className="mt-3">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Tarjeta:</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setCardType('debito')}
                      className={`p-2 rounded-lg border-2 transition-all duration-200 flex items-center justify-center ${
                        cardType === 'debito'
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-blue-300 bg-white'
                      }`}
                    >
                      <CreditCard className="h-4 w-4 mr-1" />
                      <span className="text-sm font-medium">Débito</span>
                    </button>
                    <button
                      onClick={() => setCardType('credito')}
                      className={`p-2 rounded-lg border-2 transition-all duration-200 flex items-center justify-center ${
                        cardType === 'credito'
                          ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                          : 'border-gray-200 hover:border-indigo-300 bg-white'
                      }`}
                    >
                      <CreditCard className="h-4 w-4 mr-1" />
                      <span className="text-sm font-medium">Crédito</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <button onClick={addExpense} disabled={saving} className="btn btn-primary flex items-center">
                <Check className="h-4 w-4 mr-2" /> 
                {saving ? 'Guardando...' : 'Agregar Gasto'}
              </button>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-semibold text-gray-900">Gastos del Turno</h2>
              <div className="text-sm text-gray-700">Total: ${(Number(total) || 0).toLocaleString()}</div>
            </div>

            {expenses.length === 0 ? (
              <div className="text-gray-500">No hay gastos registrados</div>
            ) : (
              <div className="space-y-2">
                {expenses.map((e) => (
                  <div key={e.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <div>
                      <div className="font-medium text-gray-900">${(Number(e.amount) || 0).toLocaleString()}</div>
                      <div className="text-sm text-gray-600">{e.reason || 'Gasto'}</div>
                      <div className="text-xs text-purple-600 capitalize">
                        {e.paymentMethod === 'tarjetaDebito' ? 'Tarjeta Débito' :
                         e.paymentMethod === 'tarjetaCredito' ? 'Tarjeta Crédito' :
                         e.paymentMethod || 'Efectivo'}
                      </div>
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
