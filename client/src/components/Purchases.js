import React, { useState, useEffect } from 'react';
import { Truck, Plus, Trash2, DollarSign, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { purchasesService, suppliersService, productService } from '../services/firebaseService';
import { usePermissions } from '../context/PermissionsContext';

const Purchases = () => {
  const permissions = usePermissions();
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [items, setItems] = useState([{ productId: '', quantity: 1, unitCost: 0 }]);
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!(permissions.includes('purchases') || permissions.includes('admin'))) return;
    (async () => {
      try {
        const [sups, prods] = await Promise.all([
          suppliersService.getAllSuppliers().catch(() => []),
          productService.getAllProducts(1, 200).catch(() => [])
        ]);
        setSuppliers(sups);
        setProducts(prods);
      } catch (e) {
        console.error('Error cargando datos de compras:', e);
      }
    })();
  }, [permissions]);

  const addItemRow = () => setItems([...items, { productId: '', quantity: 1, unitCost: 0 }]);
  const removeItemRow = (idx) => setItems(items.filter((_, i) => i !== idx));
  const updateItem = (idx, field, value) => {
    setItems(items.map((it, i) => (i === idx ? { ...it, [field]: value } : it)));
  };

  const total = items.reduce((sum, it) => sum + (Number(it.quantity) || 0) * (Number(it.unitCost) || 0), 0);

  const savePurchase = async () => {
    if (!selectedSupplier) {
      toast.error('Selecciona un proveedor');
      return;
    }
    if (items.length === 0 || items.some(it => !it.productId || it.quantity <= 0)) {
      toast.error('Agrega al menos un ítem válido');
      return;
    }
    setIsSaving(true);
    try {
      const purchaseData = {
        supplierId: selectedSupplier,
        items: items.map(it => ({
          productId: it.productId,
          quantity: Number(it.quantity) || 0,
          unitCost: Number(it.unitCost) || 0
        })),
        total,
        notes
      };
      await purchasesService.addPurchase(purchaseData);
      toast.success('Compra registrada');
      // reset
      setSelectedSupplier('');
      setItems([{ productId: '', quantity: 1, unitCost: 0 }]);
      setNotes('');
    } catch (e) {
      console.error('Error registrando compra:', e);
      toast.error('Error registrando compra');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-4 lg:p-6 space-y-4">
      {!(permissions.includes('purchases') || permissions.includes('admin')) ? (
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Acceso restringido</h2>
          <p className="text-gray-600">No tenés permisos para registrar compras. Contactá a un administrador.</p>
        </div>
      ) : null}
      {!(permissions.includes('purchases') || permissions.includes('admin')) ? null : (
      <>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Truck className="h-6 w-6 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">Registrar Compra</h1>
        </div>
        <button onClick={savePurchase} disabled={isSaving} className="btn btn-primary flex items-center">
          <Check className="h-4 w-4 mr-2" />
          {isSaving ? 'Guardando...' : 'Guardar Compra'}
        </button>
      </div>

      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="form-label">Proveedor</label>
            <select value={selectedSupplier} onChange={(e) => setSelectedSupplier(e.target.value)} className="form-select">
              <option value="">Seleccionar proveedor</option>
              {suppliers.map(s => (
                <option key={s.id} value={s.id}>{s.name || s.nombre}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="form-label">Notas</label>
            <input value={notes} onChange={(e) => setNotes(e.target.value)} className="form-input" placeholder="Opcional" />
          </div>
          <div>
            <label className="form-label">Total</label>
            <div className="form-input">${total.toLocaleString()}</div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold text-gray-900">Ítems</h2>
          <button onClick={addItemRow} className="btn btn-secondary flex items-center"><Plus className="h-4 w-4 mr-1" /> Agregar Ítem</button>
        </div>

        <div className="space-y-3">
          {items.map((it, idx) => (
            <div key={idx} className="grid grid-cols-1 md:grid-cols-4 gap-2 items-end">
              <div>
                <label className="form-label">Producto</label>
                <select value={it.productId} onChange={(e) => updateItem(idx, 'productId', e.target.value)} className="form-select">
                  <option value="">Seleccionar producto</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="form-label">Cantidad</label>
                <input type="number" min="1" value={it.quantity} onChange={(e) => updateItem(idx, 'quantity', Number(e.target.value) || 0)} className="form-input" />
              </div>
              <div>
                <label className="form-label">Costo Unitario</label>
                <input type="number" min="0" step="0.01" value={it.unitCost} onChange={(e) => updateItem(idx, 'unitCost', Number(e.target.value) || 0)} className="form-input" />
              </div>
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700 flex items-center"><DollarSign className="h-4 w-4 mr-1" />{((Number(it.quantity)||0)*(Number(it.unitCost)||0)).toLocaleString()}</div>
                <button onClick={() => removeItemRow(idx)} className="p-2 text-red-600 hover:bg-red-50 rounded-xl"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
          ))}
        </div>
      </div>
      </>
      )}
    </div>
  );
};

export default Purchases;
