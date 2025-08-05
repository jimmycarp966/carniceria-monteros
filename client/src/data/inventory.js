// Inventario - Carnicería Monteros
export const inventoryItems = [
  {
    id: 1,
    productId: 1,
    productName: "Asado de Tira",
    category: "Carnes Rojas",
    currentStock: 45,
    minStock: 20,
    maxStock: 100,
    unit: "kg",
    cost: 2200,
    price: 2800,
    lastUpdated: "2024-01-25",
    status: "normal",
    location: "Heladera Principal",
    supplier: "Frigorífico Tucumán S.A."
  },
  {
    id: 2,
    productId: 2,
    productName: "Vacío",
    category: "Carnes Rojas",
    currentStock: 15,
    minStock: 10,
    maxStock: 50,
    unit: "kg",
    cost: 2600,
    price: 3200,
    lastUpdated: "2024-01-25",
    status: "low",
    location: "Heladera Principal",
    supplier: "Frigorífico Tucumán S.A."
  },
  {
    id: 3,
    productId: 7,
    productName: "Pollo Entero",
    category: "Carnes Blancas",
    currentStock: 25,
    minStock: 15,
    maxStock: 60,
    unit: "kg",
    cost: 1400,
    price: 1800,
    lastUpdated: "2024-01-25",
    status: "normal",
    location: "Heladera Secundaria",
    supplier: "Granja Avícola Monteros"
  },
  {
    id: 4,
    productId: 11,
    productName: "Chorizo Parrillero",
    category: "Embutidos",
    currentStock: 35,
    minStock: 20,
    maxStock: 80,
    unit: "kg",
    cost: 900,
    price: 1200,
    lastUpdated: "2024-01-25",
    status: "normal",
    location: "Heladera Embutidos",
    supplier: "Embutidos del Norte"
  },
  {
    id: 5,
    productId: 16,
    productName: "Hamburguesa de Res",
    category: "Preparados",
    currentStock: 80,
    minStock: 50,
    maxStock: 150,
    unit: "unidad",
    cost: 600,
    price: 800,
    lastUpdated: "2024-01-25",
    status: "normal",
    location: "Freezer",
    supplier: "Carnes Premium del Valle"
  },
  {
    id: 6,
    productId: 3,
    productName: "Bife de Chorizo",
    category: "Carnes Rojas",
    currentStock: 8,
    minStock: 10,
    maxStock: 40,
    unit: "kg",
    cost: 2800,
    price: 3500,
    lastUpdated: "2024-01-25",
    status: "critical",
    location: "Heladera Principal",
    supplier: "Frigorífico Tucumán S.A."
  },
  {
    id: 7,
    productId: 8,
    productName: "Pechuga de Pollo",
    category: "Carnes Blancas",
    currentStock: 18,
    minStock: 15,
    maxStock: 45,
    unit: "kg",
    cost: 1800,
    price: 2200,
    lastUpdated: "2024-01-25",
    status: "normal",
    location: "Heladera Secundaria",
    supplier: "Granja Avícola Monteros"
  },
  {
    id: 8,
    productId: 13,
    productName: "Jamón Cocido",
    category: "Embutidos",
    currentStock: 12,
    minStock: 10,
    maxStock: 30,
    unit: "kg",
    cost: 1400,
    price: 1800,
    lastUpdated: "2024-01-25",
    status: "low",
    location: "Heladera Embutidos",
    supplier: "Embutidos del Norte"
  }
];

export const inventoryMovements = [
  {
    id: 1,
    productId: 1,
    productName: "Asado de Tira",
    type: "entrada",
    quantity: 50,
    unit: "kg",
    date: "2024-01-25",
    reason: "Compra proveedor",
    supplier: "Frigorífico Tucumán S.A.",
    cost: 110000,
    notes: "Pedido semanal"
  },
  {
    id: 2,
    productId: 1,
    productName: "Asado de Tira",
    type: "salida",
    quantity: 5,
    unit: "kg",
    date: "2024-01-25",
    reason: "Venta",
    customer: "María González",
    revenue: 14000,
    notes: "Venta al contado"
  },
  {
    id: 3,
    productId: 2,
    productName: "Vacío",
    type: "entrada",
    quantity: 30,
    unit: "kg",
    date: "2024-01-24",
    reason: "Compra proveedor",
    supplier: "Frigorífico Tucumán S.A.",
    cost: 78000,
    notes: "Pedido especial"
  },
  {
    id: 4,
    productId: 7,
    productName: "Pollo Entero",
    type: "entrada",
    quantity: 40,
    unit: "kg",
    date: "2024-01-25",
    reason: "Compra proveedor",
    supplier: "Granja Avícola Monteros",
    cost: 56000,
    notes: "Pedido diario"
  },
  {
    id: 5,
    productId: 3,
    productName: "Bife de Chorizo",
    type: "salida",
    quantity: 12,
    unit: "kg",
    date: "2024-01-25",
    reason: "Venta",
    customer: "Carlos Rodríguez",
    revenue: 42000,
    notes: "Venta con descuento"
  }
];

export const inventoryStatuses = [
  { id: "normal", name: "Normal", color: "green" },
  { id: "low", name: "Stock Bajo", color: "yellow" },
  { id: "critical", name: "Crítico", color: "red" },
  { id: "out", name: "Sin Stock", color: "gray" }
];

export const movementTypes = [
  { id: "entrada", name: "Entrada", color: "green" },
  { id: "salida", name: "Salida", color: "red" },
  { id: "ajuste", name: "Ajuste", color: "blue" },
  { id: "merma", name: "Merma", color: "orange" }
]; 