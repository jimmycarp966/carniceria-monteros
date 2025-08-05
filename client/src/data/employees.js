// Empleados - Carnicería Monteros
export const employees = [
  {
    id: 1,
    name: "Juan Carlos López",
    position: "Dueño",
    email: "juan.lopez@carniceria.com",
    phone: "381-123-4567",
    address: "Av. Libertad 123, Monteros",
    salary: 80000,
    hireDate: "2020-01-15",
    status: "active",
    permissions: ["admin", "sales", "inventory", "reports"],
    notes: "Fundador de la carnicería"
  },
  {
    id: 2,
    name: "María Elena Gómez",
    position: "Cajera",
    email: "maria.gomez@carniceria.com",
    phone: "381-234-5678",
    address: "San Martín 456, Monteros",
    salary: 45000,
    hireDate: "2021-03-20",
    status: "active",
    permissions: ["sales", "customers"],
    notes: "Experiencia en atención al cliente"
  },
  {
    id: 3,
    name: "Roberto Fernández",
    position: "Carnicero",
    email: "roberto.fernandez@carniceria.com",
    phone: "381-345-6789",
    address: "Belgrano 789, Monteros",
    salary: 55000,
    hireDate: "2020-06-10",
    status: "active",
    permissions: ["inventory", "preparation"],
    notes: "Especialista en cortes premium"
  },
  {
    id: 4,
    name: "Ana Sofía Ruiz",
    position: "Cajera",
    email: "ana.ruiz@carniceria.com",
    phone: "381-456-7890",
    address: "Mitre 321, Monteros",
    salary: 42000,
    hireDate: "2022-01-15",
    status: "active",
    permissions: ["sales", "customers"],
    notes: "Estudiante de administración"
  },
  {
    id: 5,
    name: "Carlos Alberto Torres",
    position: "Ayudante",
    email: "carlos.torres@carniceria.com",
    phone: "381-567-8901",
    address: "Rivadavia 654, Monteros",
    salary: 35000,
    hireDate: "2022-08-05",
    status: "active",
    permissions: ["inventory", "cleaning"],
    notes: "Encargado de limpieza y mantenimiento"
  },
  {
    id: 6,
    name: "Lucía Martínez",
    position: "Cajera",
    email: "lucia.martinez@carniceria.com",
    phone: "381-678-9012",
    address: "Independencia 987, Monteros",
    salary: 43000,
    hireDate: "2021-11-12",
    status: "inactive",
    permissions: ["sales"],
    notes: "Renunció en diciembre 2023"
  }
];

export const positions = [
  { id: "owner", name: "Dueño", color: "purple" },
  { id: "cashier", name: "Cajero/a", color: "blue" },
  { id: "butcher", name: "Carnicero", color: "red" },
  { id: "assistant", name: "Ayudante", color: "green" }
];

export const employeeStatuses = [
  { id: "active", name: "Activo", color: "green" },
  { id: "inactive", name: "Inactivo", color: "gray" },
  { id: "vacation", name: "Vacaciones", color: "yellow" }
]; 