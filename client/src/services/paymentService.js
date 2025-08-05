// Servicio para manejar pagos de clientes atrasados
import { getCurrentDate } from './dateService';
import { saleService } from './firebaseService';

// Función para procesar pago de cliente atrasado
export const processCustomerPayment = async (customer, paymentAmount, currentShift) => {
  try {
    // Crear objeto de pago
    const payment = {
      customerId: customer.id,
      customerName: customer.name,
      amount: paymentAmount,
      previousBalance: customer.currentBalance,
      newBalance: customer.currentBalance - paymentAmount,
      date: getCurrentDate(),
      shiftId: currentShift?.id,
      shiftType: currentShift?.type,
      type: 'customer_payment',
      notes: `Pago de cliente atrasado - ${customer.name}`
    };

    // Guardar pago en Firebase como una venta especial
    const paymentId = await saleService.addSale({
      ...payment,
      items: [],
      total: paymentAmount,
      paymentMethod: 'cash', // Por defecto en efectivo
      cashAmount: paymentAmount,
      change: 0,
      isCustomerPayment: true
    });

    return {
      success: true,
      paymentId,
      payment
    };
  } catch (error) {
    console.error('Error procesando pago de cliente:', error);
    throw error;
  }
};

// Función para obtener historial de pagos de un cliente
export const getCustomerPaymentHistory = async (customerId) => {
  try {
    // Aquí se implementaría la lógica para obtener el historial
    // Por ahora retornamos un array vacío
    return [];
  } catch (error) {
    console.error('Error obteniendo historial de pagos:', error);
    return [];
  }
};

// Función para validar si un cliente puede hacer un pago
export const validateCustomerPayment = (customer, amount) => {
  if (!customer) {
    return { valid: false, message: 'Cliente no válido' };
  }

  if (amount <= 0) {
    return { valid: false, message: 'El monto debe ser mayor a 0' };
  }

  if (amount > customer.currentBalance) {
    return { valid: false, message: 'El monto no puede ser mayor al saldo pendiente' };
  }

  if (customer.currentBalance <= 0) {
    return { valid: false, message: 'Este cliente no tiene saldo pendiente' };
  }

  return { valid: true, message: 'Pago válido' };
}; 