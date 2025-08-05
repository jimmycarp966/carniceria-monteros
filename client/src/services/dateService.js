// Servicio de fecha para simular la fecha actual
// Configurado para martes 5 de agosto de 2025

// Fecha base simulada: martes 5 de agosto de 2025
const SIMULATED_DATE = new Date(2025, 7, 5); // Mes 7 = agosto (0-indexed)

// Función para obtener la fecha actual simulada
export const getCurrentDate = () => {
  return new Date(SIMULATED_DATE);
};

// Función para obtener la fecha actual como string
export const getCurrentDateString = () => {
  return SIMULATED_DATE.toISOString().split('T')[0];
};

// Función para obtener la fecha y hora actual simulada
export const getCurrentDateTime = () => {
  return new Date(SIMULATED_DATE);
};

// Función para formatear fecha
export const formatDate = (date) => {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  });
};

// Función para calcular días entre dos fechas
export const calculateDaysBetween = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end - start);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

// Función para verificar si una fecha es hoy
export const isToday = (date) => {
  const today = getCurrentDate();
  const checkDate = new Date(date);
  return today.toDateString() === checkDate.toDateString();
};

// Función para obtener el día de la semana
export const getDayOfWeek = (date) => {
  const d = new Date(date);
  const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  return days[d.getDay()];
};

// Función para obtener el mes
export const getMonth = (date) => {
  const d = new Date(date);
  const months = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  return months[d.getMonth()];
};

// Función para obtener información completa de la fecha actual
export const getCurrentDateInfo = () => {
  return {
    date: SIMULATED_DATE,
    dayOfWeek: getDayOfWeek(SIMULATED_DATE),
    day: SIMULATED_DATE.getDate(),
    month: getMonth(SIMULATED_DATE),
    year: SIMULATED_DATE.getFullYear(),
    formatted: formatDate(SIMULATED_DATE)
  };
};

// Función para avanzar la fecha simulada (para testing)
export const advanceSimulatedDate = (days = 1) => {
  SIMULATED_DATE.setDate(SIMULATED_DATE.getDate() + days);
};

// Función para resetear la fecha simulada
export const resetSimulatedDate = () => {
  SIMULATED_DATE.setTime(new Date(2025, 7, 5).getTime());
};

// Función para obtener la fecha actual en formato para Firebase
export const getCurrentTimestamp = () => {
  return new Date(SIMULATED_DATE);
};

// Función para calcular días de atraso basado en la fecha simulada
export const calculateOverdueDays = (lastPurchase, creditDays = 7) => {
  if (!lastPurchase) return 0;
  
  const purchaseDate = new Date(lastPurchase);
  const dueDate = new Date(purchaseDate);
  dueDate.setDate(purchaseDate.getDate() + creditDays);
  
  const today = getCurrentDate();
  const daysDiff = Math.floor((today - dueDate) / (1000 * 60 * 60 * 24));
  
  return Math.max(0, daysDiff);
}; 