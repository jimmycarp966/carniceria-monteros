// Proveedores - Carnicería Monteros
export const suppliers = [
  {
    id: 1,
    name: "Frigorífico Tucumán S.A.",
    contact: "Ing. Carlos Mendoza",
    email: "ventas@frigorificotucuman.com",
    phone: "381-123-4567",
    address: "Ruta 38 Km 45, Tucumán",
    category: "Carnes",
    totalOrdered: 2500000,
    totalPaid: 2300000,
    totalOwed: 200000,
    lastOrder: "2024-01-20",
    status: "active",
    notes: "Proveedor principal de carnes vacunas"
  },
  {
    id: 2,
    name: "Granja Avícola Monteros",
    contact: "Sra. María González",
    email: "info@granjamonteros.com",
    phone: "381-234-5678",
    address: "Camino Rural 123, Monteros",
    category: "Aves",
    totalOrdered: 800000,
    totalPaid: 750000,
    totalOwed: 50000,
    lastOrder: "2024-01-22",
    status: "active",
    notes: "Pollo fresco de granja local"
  },
  {
    id: 3,
    name: "Embutidos del Norte",
    contact: "Sr. Roberto Silva",
    email: "pedidos@embutidosdelnorte.com",
    phone: "381-345-6789",
    address: "Zona Industrial 456, Tucumán",
    category: "Embutidos",
    totalOrdered: 600000,
    totalPaid: 600000,
    totalOwed: 0,
    lastOrder: "2024-01-18",
    status: "active",
    notes: "Chorizos y salchichas artesanales"
  },
  {
    id: 4,
    name: "Distribuidora de Especias López",
    contact: "Lic. Ana Martínez",
    email: "ventas@especiaslopez.com",
    phone: "381-456-7890",
    address: "Centro Comercial 789, Tucumán",
    category: "Especias",
    totalOrdered: 150000,
    totalPaid: 120000,
    totalOwed: 30000,
    lastOrder: "2024-01-15",
    status: "active",
    notes: "Especias para marinados y condimentos"
  },
  {
    id: 5,
    name: "Frigorífico Regional",
    contact: "Dr. Miguel Torres",
    email: "compras@frigorificoregional.com",
    phone: "381-567-8901",
    address: "Ruta 9 Km 120, Tucumán",
    category: "Carnes",
    totalOrdered: 1800000,
    totalPaid: 1600000,
    totalOwed: 200000,
    lastOrder: "2024-01-12",
    status: "overdue",
    notes: "Pago atrasado, contactar urgente"
  },
  {
    id: 6,
    name: "Proveedora de Envases S.R.L.",
    contact: "Ing. Lucía Fernández",
    email: "info@envasespro.com",
    phone: "381-678-9012",
    address: "Parque Industrial 321, Tucumán",
    category: "Envases",
    totalOrdered: 300000,
    totalPaid: 300000,
    totalOwed: 0,
    lastOrder: "2024-01-25",
    status: "active",
    notes: "Bolsas y envases para productos"
  },
  {
    id: 7,
    name: "Distribuidora de Hielo Frío",
    contact: "Sr. José Mendoza",
    email: "pedidos@hielofrio.com",
    phone: "381-789-0123",
    address: "Av. Industrial 654, Monteros",
    category: "Hielo",
    totalOrdered: 200000,
    totalPaid: 180000,
    totalOwed: 20000,
    lastOrder: "2024-01-24",
    status: "active",
    notes: "Hielo para conservación"
  },
  {
    id: 8,
    name: "Carnes Premium del Valle",
    contact: "Lic. Elena Vargas",
    email: "ventas@carnespremium.com",
    phone: "381-890-1234",
    address: "Valle de Tafí 147, Tucumán",
    category: "Carnes Premium",
    totalOrdered: 1200000,
    totalPaid: 1100000,
    totalOwed: 100000,
    lastOrder: "2024-01-19",
    status: "active",
    notes: "Cortes premium y especiales"
  }
];

export const supplierCategories = [
  { id: "carnes", name: "Carnes", color: "red" },
  { id: "aves", name: "Aves", color: "orange" },
  { id: "embutidos", name: "Embutidos", color: "purple" },
  { id: "especias", name: "Especias", color: "yellow" },
  { id: "envases", name: "Envases", color: "blue" },
  { id: "hielo", name: "Hielo", color: "cyan" },
  { id: "premium", name: "Premium", color: "gold" }
];

export const supplierStatuses = [
  { id: "active", name: "Activo", color: "green" },
  { id: "overdue", name: "Atrasado", color: "red" },
  { id: "inactive", name: "Inactivo", color: "gray" }
]; 