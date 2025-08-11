import React, { useState, useEffect, memo } from 'react';
import { 
  Calendar, 
  DollarSign, 
  TrendingUp, 
  BarChart3, 
  Eye, 
  Clock,
  ArrowLeft,
  Search,
  Filter,
  Download,
  Printer
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { dayService } from '../services/firebaseService';


const CashHistory = ({ onBack }) => {
  const [days, setDays] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(null);
  const [showDayDetail, setShowDayDetail] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');


  // Cargar historial de días
  const loadDays = async () => {
    try {
      setIsLoading(true);
      const daysData = await dayService.getAllDays(50);
      setDays(daysData);
      console.log(`📊 Historial cargado: ${daysData.length} días`);
    } catch (error) {
      console.error('Error cargando historial:', error);
      toast.error('Error cargando historial de cajas');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDays();
  }, []);

  // Filtrar días
  const filteredDays = days.filter(day => {
    const matchesSearch = day.date?.includes(searchTerm) || 
                         day.totalRevenue?.toString().includes(searchTerm);
    const matchesFilter = filterStatus === 'all' || day.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  // Ver detalle de un día
  const viewDayDetail = (day) => {
    setSelectedDay(day);
    setShowDayDetail(true);
  };

  // Exportar resumen del día
  const exportDaySummary = (day) => {
    const summary = `
RESUMEN DEL DÍA - ${new Date(day.date).toLocaleDateString('es-AR')}

📊 ESTADÍSTICAS GENERALES:
• Total Turnos: ${day.totalShifts}
• Total Ventas: ${day.totalSales}
• Ingresos Totales: $${day.totalRevenue?.toLocaleString() || 0}
• Gastos Totales: $${day.totalExpenses?.toLocaleString() || 0}
• Balance Neto: $${((day.totalRevenue || 0) - (day.totalExpenses || 0)).toLocaleString()}

💳 MÉTODOS DE PAGO:
${day.salesByPaymentMethod ? `
• Efectivo: $${day.salesByPaymentMethod.efectivo?.toLocaleString() || 0}
• Débito: $${day.salesByPaymentMethod.tarjetaDebito?.toLocaleString() || 0}
• Crédito: $${day.salesByPaymentMethod.tarjetaCredito?.toLocaleString() || 0}
• Transferencia: $${day.salesByPaymentMethod.transferencia?.toLocaleString() || 0}
• MercadoPago: $${day.salesByPaymentMethod.mercadopago?.toLocaleString() || 0}
` : 'No disponible'}

👥 TURNOS:
${day.shifts?.map(shift => `
• ${shift.type === 'morning' ? 'Mañana' : 'Tarde'} - ${shift.employeeName}
  Ventas: ${shift.totalSales} | Total: $${shift.totalRevenue?.toLocaleString() || 0}
`).join('') || 'No disponible'}

📅 Fecha de cierre: ${day.closedAt?.toDate?.()?.toLocaleString('es-AR') || 'N/A'}
    `;

    // Crear archivo de texto para descargar
    const blob = new Blob([summary], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `resumen_dia_${day.date}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success('Resumen exportado exitosamente');
  };



  // Imprimir resumen del día
  const printDaySummary = (day) => {
    const printWindow = window.open('', '_blank');
    const printContent = `
      <html>
        <head>
          <title>Resumen del Día - ${day.date}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
            .section { margin: 20px 0; }
            .stats { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
            .stat { border: 1px solid #ddd; padding: 10px; text-align: center; }
            .payment-methods { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin: 20px 0; }
            .shift { border: 1px solid #ddd; padding: 10px; margin: 10px 0; }
            @media print { body { margin: 0; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Resumen del Día</h1>
            <h2>${new Date(day.date).toLocaleDateString('es-AR')}</h2>
          </div>
          
          <div class="section">
            <h3>Estadísticas Generales</h3>
            <div class="stats">
              <div class="stat">
                <strong>Total Turnos</strong><br>
                ${day.totalShifts}
              </div>
              <div class="stat">
                <strong>Total Ventas</strong><br>
                ${day.totalSales}
              </div>
              <div class="stat">
                <strong>Ingresos Totales</strong><br>
                $${day.totalRevenue?.toLocaleString() || 0}
              </div>
              <div class="stat">
                <strong>Balance Neto</strong><br>
                $${((day.totalRevenue || 0) - (day.totalExpenses || 0)).toLocaleString()}
              </div>
            </div>
          </div>
          
          ${day.salesByPaymentMethod ? `
          <div class="section">
            <h3>Métodos de Pago</h3>
            <div class="payment-methods">
              <div class="stat">Efectivo<br>$${day.salesByPaymentMethod.efectivo?.toLocaleString() || 0}</div>
              <div class="stat">Débito<br>$${day.salesByPaymentMethod.tarjetaDebito?.toLocaleString() || 0}</div>
              <div class="stat">Crédito<br>$${day.salesByPaymentMethod.tarjetaCredito?.toLocaleString() || 0}</div>
              <div class="stat">Transferencia<br>$${day.salesByPaymentMethod.transferencia?.toLocaleString() || 0}</div>
              <div class="stat">MercadoPago<br>$${day.salesByPaymentMethod.mercadopago?.toLocaleString() || 0}</div>
            </div>
          </div>
          ` : ''}
          
          ${day.shifts ? `
          <div class="section">
            <h3>Detalle de Turnos</h3>
            ${day.shifts.map(shift => `
              <div class="shift">
                <strong>${shift.type === 'morning' ? 'Mañana' : 'Tarde'} - ${shift.employeeName}</strong><br>
                Ventas: ${shift.totalSales} | Total: $${shift.totalRevenue?.toLocaleString() || 0}
              </div>
            `).join('')}
          </div>
          ` : ''}
          
          <div class="section">
            <p><strong>Fecha de cierre:</strong> ${day.closedAt?.toDate?.()?.toLocaleString('es-AR') || 'N/A'}</p>
          </div>
        </body>
      </html>
    `;
    
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
  };

  if (showDayDetail && selectedDay) {
    return (
      <DayDetailModal 
        day={selectedDay} 
        onClose={() => {
          setShowDayDetail(false);
          setSelectedDay(null);
        }}
        onExport={exportDaySummary}
        onPrint={printDaySummary}
      />
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <button
            onClick={onBack}
            className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Historial de Cajas</h1>
            <p className="text-sm text-gray-600">Resúmenes de días finalizados</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={loadDays}
            className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            title="Actualizar"
          >
            <Clock className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por fecha o monto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Filter className="h-4 w-4 text-gray-400" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Todos los días</option>
            <option value="closed">Días cerrados</option>
          </select>
        </div>
      </div>

      {/* Lista de días */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Cargando historial...</span>
        </div>
      ) : filteredDays.length === 0 ? (
        <div className="text-center py-12">
          <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No hay días finalizados</h3>
          <p className="text-gray-600 mb-6">
            {searchTerm || filterStatus !== 'all' 
              ? 'No se encontraron días que coincidan con los filtros'
              : 'Aún no se han finalizado días en el sistema'
            }
          </p>
          

        </div>
      ) : (
        <div className="space-y-4">
          {filteredDays.map((day) => (
            <div
              key={day.id}
              className="bg-gray-50 rounded-xl p-6 hover:bg-gray-100 transition-colors cursor-pointer border border-gray-200"
              onClick={() => viewDayDetail(day)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-blue-100 rounded-full">
                    <Calendar className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {new Date(day.date).toLocaleDateString('es-AR', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {day.totalShifts} turnos • {day.totalSales} ventas
                    </p>
                  </div>
                </div>
                
                <div className="text-right">
                  <p className="text-xl font-bold text-green-600">
                    $${day.totalRevenue?.toLocaleString() || 0}
                  </p>
                  <p className="text-sm text-gray-600">
                    Balance: ${((day.totalRevenue || 0) - (day.totalExpenses || 0)).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Métodos de pago rápidos */}
              {day.salesByPaymentMethod && (
                <div className="mt-4 grid grid-cols-5 gap-2">
                  <div className="text-center">
                    <p className="text-xs text-gray-600">Efectivo</p>
                    <p className="text-sm font-semibold text-green-600">
                      ${day.salesByPaymentMethod.efectivo?.toLocaleString() || 0}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-600">Débito</p>
                    <p className="text-sm font-semibold text-blue-600">
                      ${day.salesByPaymentMethod.tarjetaDebito?.toLocaleString() || 0}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-600">Crédito</p>
                    <p className="text-sm font-semibold text-purple-600">
                      ${day.salesByPaymentMethod.tarjetaCredito?.toLocaleString() || 0}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-600">Transfer.</p>
                    <p className="text-sm font-semibold text-orange-600">
                      ${day.salesByPaymentMethod.transferencia?.toLocaleString() || 0}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-600">MP</p>
                    <p className="text-sm font-semibold text-yellow-600">
                      ${day.salesByPaymentMethod.mercadopago?.toLocaleString() || 0}
                    </p>
                  </div>
                </div>
              )}

              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Finalizado
                  </span>
                  <span className="text-xs text-gray-500">
                    {day.closedAt?.toDate?.()?.toLocaleString('es-AR') || 'N/A'}
                  </span>
                </div>
                <Eye className="h-4 w-4 text-gray-400" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Modal de detalle del día
const DayDetailModal = memo(({ day, onClose, onExport, onPrint }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl p-8 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-blue-100 rounded-full">
              <Calendar className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Resumen del Día
              </h2>
              <p className="text-sm text-gray-600">
                {new Date(day.date).toLocaleDateString('es-AR', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onPrint(day)}
              className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
              title="Imprimir"
            >
              <Printer className="h-5 w-5" />
            </button>
            <button
              onClick={() => onExport(day)}
              className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
              title="Exportar"
            >
              <Download className="h-5 w-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Estadísticas principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-blue-50 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Total Turnos</p>
                <p className="text-2xl font-bold text-blue-900">{day.totalShifts}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-green-50 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Total Ventas</p>
                <p className="text-2xl font-bold text-green-900">{day.totalSales}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </div>

          <div className="bg-purple-50 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">Ingresos Totales</p>
                <p className="text-2xl font-bold text-purple-900">${day.totalRevenue?.toLocaleString() || 0}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-600" />
            </div>
          </div>

          <div className="bg-emerald-50 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-emerald-600">Balance Neto</p>
                <p className={`text-2xl font-bold ${((day.totalRevenue || 0) - (day.totalExpenses || 0)) >= 0 ? 'text-emerald-900' : 'text-red-900'}`}>
                  ${((day.totalRevenue || 0) - (day.totalExpenses || 0)).toLocaleString()}
                </p>
              </div>
              <BarChart3 className="h-8 w-8 text-emerald-600" />
            </div>
          </div>
        </div>

        {/* Métodos de pago */}
        {day.salesByPaymentMethod && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Métodos de Pago</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="bg-green-50 rounded-lg p-4">
                <p className="text-sm font-medium text-green-600">Efectivo</p>
                <p className="text-lg font-bold text-green-900">${day.salesByPaymentMethod.efectivo?.toLocaleString() || 0}</p>
              </div>
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-sm font-medium text-blue-600">Débito</p>
                <p className="text-lg font-bold text-blue-900">${day.salesByPaymentMethod.tarjetaDebito?.toLocaleString() || 0}</p>
              </div>
              <div className="bg-purple-50 rounded-lg p-4">
                <p className="text-sm font-medium text-purple-600">Crédito</p>
                <p className="text-lg font-bold text-purple-900">${day.salesByPaymentMethod.tarjetaCredito?.toLocaleString() || 0}</p>
              </div>
              <div className="bg-orange-50 rounded-lg p-4">
                <p className="text-sm font-medium text-orange-600">Transferencia</p>
                <p className="text-lg font-bold text-orange-900">${day.salesByPaymentMethod.transferencia?.toLocaleString() || 0}</p>
              </div>
              <div className="bg-yellow-50 rounded-lg p-4">
                <p className="text-sm font-medium text-yellow-600">MercadoPago</p>
                <p className="text-lg font-bold text-yellow-900">${day.salesByPaymentMethod.mercadopago?.toLocaleString() || 0}</p>
              </div>
            </div>
          </div>
        )}

        {/* Detalle de turnos */}
        {day.shifts && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Detalle de Turnos</h3>
            <div className="space-y-3">
              {day.shifts.map((shift) => (
                <div key={shift.id} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">
                        Turno {shift.type === 'morning' ? 'Mañana' : 'Tarde'} - {shift.employeeName}
                      </p>
                      <p className="text-sm text-gray-600">
                        {shift.startTime?.toDate?.()?.toLocaleTimeString() || 'N/A'} - {shift.endTime?.toDate?.()?.toLocaleTimeString() || 'En curso'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-green-600">${shift.totalRevenue?.toLocaleString() || 0}</p>
                      <p className="text-sm text-gray-500">{shift.totalSales} ventas</p>
                      <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        Cerrado
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Información de cierre */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Información de Cierre</p>
              <p className="text-sm text-gray-600">
                Día finalizado el {day.closedAt?.toDate?.()?.toLocaleString('es-AR') || 'N/A'}
              </p>
            </div>
            <div className="text-right">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                Finalizado
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

export default CashHistory;
