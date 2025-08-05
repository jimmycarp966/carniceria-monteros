// Clientes con cuenta corriente - Carnicería Monteros
export const customers = [
  {
    id: 1,
    name: "María González",
    email: "maria.gonzalez@email.com",
    phone: "381-456-7890",
    address: "Av. Sarmiento 123, Monteros",
    creditLimit: 50000,
    currentBalance: 12500,
    lastPurchase: "2024-01-15",
    status: "active",
    notes: "Cliente frecuente, prefiere cortes premium"
  },
  {
    id: 2,
    name: "Carlos Rodríguez",
    email: "carlos.rodriguez@email.com",
    phone: "381-234-5678",
    address: "San Martín 456, Monteros",
    creditLimit: 30000,
    currentBalance: 0,
    lastPurchase: "2024-01-20",
    status: "active",
    notes: "Compra para restaurante familiar"
  },
  {
    id: 3,
    name: "Ana Martínez",
    email: "ana.martinez@email.com",
    phone: "381-345-6789",
    address: "Belgrano 789, Monteros",
    creditLimit: 25000,
    currentBalance: 8500,
    lastPurchase: "2024-01-18",
    status: "active",
    notes: "Cliente desde hace 5 años"
  },
  {
    id: 4,
    name: "Roberto Silva",
    email: "roberto.silva@email.com",
    phone: "381-567-8901",
    address: "Mitre 321, Monteros",
    creditLimit: 40000,
    currentBalance: 15000,
    lastPurchase: "2024-01-12",
    status: "overdue",
    notes: "Pago atrasado, contactar"
  },
  {
    id: 5,
    name: "Lucía Fernández",
    email: "lucia.fernandez@email.com",
    phone: "381-678-9012",
    address: "Rivadavia 654, Monteros",
    creditLimit: 20000,
    currentBalance: 0,
    lastPurchase: "2024-01-22",
    status: "active",
    notes: "Nueva cliente, recomendada por María"
  },
  {
    id: 6,
    name: "Miguel Torres",
    email: "miguel.torres@email.com",
    phone: "381-789-0123",
    address: "Independencia 987, Monteros",
    creditLimit: 35000,
    currentBalance: 22000,
    lastPurchase: "2024-01-10",
    status: "overdue",
    notes: "Cliente mayorista, pago pendiente"
  },
  {
    id: 7,
    name: "Elena Vargas",
    email: "elena.vargas@email.com",
    phone: "381-890-1234",
    address: "25 de Mayo 147, Monteros",
    creditLimit: 15000,
    currentBalance: 0,
    lastPurchase: "2024-01-25",
    status: "active",
    notes: "Compra para eventos familiares"
  },
  {
    id: 8,
    name: "José Mendoza",
    email: "jose.mendoza@email.com",
    phone: "381-901-2345",
    address: "Libertad 258, Monteros",
    creditLimit: 45000,
    currentBalance: 18000,
    lastPurchase: "2024-01-14",
    status: "active",
    notes: "Dueño de parrilla local"
  }
];

export const customerStatuses = [
  { id: "active", name: "Activo", color: "green" },
  { id: "overdue", name: "Atrasado", color: "red" },
  { id: "inactive", name: "Inactivo", color: "gray" }
]; 