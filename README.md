# 🥩 Sistema de Gestión para Carnicería

Un sistema completo de gestión empresarial diseñado específicamente para carnicerías, con funcionalidades avanzadas de ventas, inventario, empleados, clientes y reportes.

## 🚀 Características Principales

### 💰 **Gestión de Ventas**
- Caja registradora avanzada con múltiples métodos de pago
- Gestión de turnos y arqueos de caja
- Historial completo de transacciones
- Sistema de descuentos y promociones
- Integración con clientes y cuenta corriente

### 📦 **Control de Inventario**
- Gestión de productos con categorías personalizables
- Control de stock mínimo y máximo
- Alertas automáticas de stock bajo
- Trazabilidad de productos desde proveedores
- Valorización automática del inventario

### 👥 **Gestión de Personal**
- Control de empleados con permisos granulares
- Gestión de turnos y horarios
- Sistema de comisiones y bonificaciones
- Historial de actividades por empleado

### 👤 **Gestión de Clientes**
- Base de datos completa de clientes
- Sistema de cuenta corriente
- Historial de compras y preferencias
- Alertas de pagos pendientes
- Segmentación de clientes

### 🏢 **Gestión de Proveedores**
- Catálogo de proveedores con categorías
- Control de órdenes de compra
- Seguimiento de pagos y deudas
- Evaluación de proveedores

### 📊 **Reportes y Analytics**
- Dashboard ejecutivo con KPIs
- Reportes de ventas por período
- Análisis de rentabilidad por producto
- Reportes de inventario y stock
- Exportación de datos

## 🛠️ Tecnologías Utilizadas

### **Frontend**
- **React 18** - Biblioteca de interfaz de usuario
- **Tailwind CSS** - Framework de estilos utility-first
- **React Router** - Enrutamiento de la aplicación
- **React Hook Form** - Manejo de formularios
- **React Query** - Gestión de estado del servidor
- **Lucide React** - Iconografía moderna

### **Backend & Base de Datos**
- **Firebase Firestore** - Base de datos NoSQL en tiempo real
- **Firebase Authentication** - Sistema de autenticación
- **Firebase Hosting** - Hosting de la aplicación
- **Firebase Functions** - Funciones serverless (opcional)

### **Herramientas de Desarrollo**
- **Vite** - Build tool y dev server
- **ESLint** - Linting de código
- **Prettier** - Formateo de código
- **PostCSS** - Procesamiento de CSS

## 📱 Características Responsive

- **Mobile First** - Diseño optimizado para móviles
- **Tablet Ready** - Interfaz adaptada para tablets
- **Desktop Optimized** - Experiencia completa en escritorio
- **Touch Friendly** - Interfaz táctil optimizada
- **Offline Capable** - Funcionalidad básica sin conexión

## 🚀 Instalación y Configuración

### **Prerrequisitos**
- Node.js 18+ 
- npm o yarn
- Cuenta de Firebase

### **1. Clonar el Repositorio**
```bash
git clone https://github.com/tu-usuario/carniceria-sistema.git
cd carniceria-sistema
```

### **2. Instalar Dependencias**
```bash
# Instalar dependencias del cliente
cd client
npm install

# Instalar dependencias del servidor (opcional)
cd ../server
npm install
```

### **3. Configurar Firebase**
1. Crear proyecto en [Firebase Console](https://console.firebase.google.com)
2. Habilitar Firestore Database
3. Configurar reglas de seguridad
4. Copiar configuración a `client/src/firebase.js`

### **4. Variables de Entorno**
Crear archivo `.env` en la carpeta `client`:
```env
VITE_FIREBASE_API_KEY=tu_api_key
VITE_FIREBASE_AUTH_DOMAIN=tu_proyecto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=tu_proyecto_id
VITE_FIREBASE_STORAGE_BUCKET=tu_proyecto.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=tu_sender_id
VITE_FIREBASE_APP_ID=tu_app_id
```

### **5. Ejecutar en Desarrollo**
```bash
# Cliente
cd client
npm run dev

# Servidor (opcional)
cd ../server
npm run dev
```

## 🏗️ Estructura del Proyecto

```
carniceria-sistema/
├── client/                 # Frontend React
│   ├── public/            # Archivos públicos
│   ├── src/
│   │   ├── components/    # Componentes React
│   │   ├── context/       # Contextos de React
│   │   ├── data/          # Datos estáticos
│   │   ├── hooks/         # Custom hooks
│   │   ├── services/      # Servicios de Firebase
│   │   └── utils/         # Utilidades
│   ├── package.json
│   └── tailwind.config.js
├── server/                # Backend (opcional)
├── firebase.json          # Configuración Firebase
├── firestore.rules        # Reglas de seguridad
└── README.md
```

## 📊 Módulos del Sistema

### **1. Dashboard Principal**
- Resumen ejecutivo de ventas
- KPIs principales del negocio
- Gráficos de tendencias
- Alertas y notificaciones

### **2. Caja Registradora**
- Interfaz de ventas intuitiva
- Múltiples métodos de pago
- Gestión de descuentos
- Impresión de tickets
- Arqueo de caja

### **3. Gestión de Productos**
- Catálogo de productos
- Categorías personalizables
- Control de precios y stock
- Imágenes y descripciones
- Códigos de barras

### **4. Control de Inventario**
- Movimientos de stock
- Alertas automáticas
- Valorización
- Reportes de inventario
- Trazabilidad

### **5. Gestión de Clientes**
- Base de datos de clientes
- Cuenta corriente
- Historial de compras
- Segmentación
- Comunicaciones

### **6. Gestión de Empleados**
- Control de personal
- Permisos granulares
- Turnos y horarios
- Comisiones
- Actividades

### **7. Gestión de Proveedores**
- Catálogo de proveedores
- Órdenes de compra
- Control de pagos
- Evaluaciones
- Contactos

### **8. Reportes y Analytics**
- Reportes de ventas
- Análisis de rentabilidad
- Reportes de inventario
- KPIs del negocio
- Exportación de datos

## 🔐 Seguridad y Permisos

### **Niveles de Acceso**
- **Administrador**: Acceso completo al sistema
- **Gerente**: Gestión de ventas, inventario y reportes
- **Cajero**: Operaciones de venta y caja
- **Carnicero**: Gestión de productos e inventario
- **Ayudante**: Operaciones básicas

### **Reglas de Seguridad**
- Autenticación obligatoria
- Validación de permisos por módulo
- Auditoría de acciones críticas
- Backup automático de datos

## 📱 Características Móviles

### **Optimizaciones Mobile**
- Interfaz táctil optimizada
- Botones de tamaño adecuado
- Navegación simplificada
- Carga rápida en conexiones lentas
- Modo offline básico

### **Funcionalidades Móviles**
- Escaneo de códigos de barras
- Captura de fotos de productos
- Firma digital en entregas
- Notificaciones push
- Sincronización automática

## 🚀 Despliegue

### **Firebase Hosting**
```bash
# Construir para producción
cd client
npm run build

# Desplegar
firebase deploy
```

### **Vercel (Recomendado)**
```bash
# Conectar repositorio a Vercel
# Configurar variables de entorno
# Despliegue automático en cada push
```

### **Netlify**
```bash
# Conectar repositorio a Netlify
# Configurar build settings
# Desplegar automáticamente
```

## 🔧 Configuración Avanzada

### **Personalización de Temas**
- Colores personalizables
- Logo de la empresa
- Configuración de impresoras
- Formatos de tickets

### **Integraciones**
- APIs de proveedores
- Sistemas de pago
- Servicios de delivery
- Herramientas de contabilidad

### **Backup y Restauración**
- Backup automático diario
- Exportación de datos
- Restauración desde backup
- Migración entre entornos

## 📈 Métricas y KPIs

### **Ventas**
- Ventas diarias/mensuales/anuales
- Productos más vendidos
- Horarios pico de ventas
- Tasa de conversión

### **Inventario**
- Rotación de stock
- Productos con bajo movimiento
- Valor del inventario
- Pérdidas por vencimiento

### **Clientes**
- Clientes nuevos vs recurrentes
- Valor promedio por cliente
- Frecuencia de compra
- Satisfacción del cliente

### **Empleados**
- Productividad por empleado
- Ventas por empleado
- Horas trabajadas
- Comisiones generadas

## 🐛 Solución de Problemas

### **Problemas Comunes**
1. **Error de conexión a Firebase**
   - Verificar configuración
   - Revisar reglas de seguridad
   - Comprobar credenciales

2. **Problemas de sincronización**
   - Verificar conexión a internet
   - Revisar logs de Firebase
   - Forzar recarga de datos

3. **Errores de permisos**
   - Verificar rol del usuario
   - Revisar configuración de permisos
   - Contactar administrador

### **Logs y Debugging**
- Consola del navegador
- Firebase Console
- Herramientas de desarrollo
- Logs del servidor

## 🤝 Contribución

### **Cómo Contribuir**
1. Fork del repositorio
2. Crear rama para feature
3. Implementar cambios
4. Ejecutar tests
5. Crear Pull Request

### **Estándares de Código**
- ESLint configuration
- Prettier formatting
- Conventional commits
- Code review obligatorio

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 📞 Soporte

### **Canales de Soporte**
- **Email**: soporte@carniceria-sistema.com
- **Documentación**: [docs.carniceria-sistema.com](https://docs.carniceria-sistema.com)
- **Issues**: [GitHub Issues](https://github.com/tu-usuario/carniceria-sistema/issues)

### **Horarios de Soporte**
- **Lunes a Viernes**: 9:00 - 18:00 (GMT-3)
- **Sábados**: 9:00 - 13:00 (GMT-3)
- **Emergencias**: 24/7 para clientes premium

## 🔄 Changelog

### **v2.0.0** - Actualización Mayor
- ✨ Nueva interfaz responsive
- 🚀 Mejoras de performance
- 🔧 Refactorización completa
- 📱 Optimización móvil
- 🎨 Nuevo diseño UI/UX

### **v1.5.0** - Mejoras de Funcionalidad
- 📊 Nuevos reportes
- 🔐 Mejoras de seguridad
- 📱 Funcionalidades móviles
- 🐛 Correcciones de bugs

### **v1.0.0** - Lanzamiento Inicial
- 🎉 Primera versión estable
- 💰 Sistema de ventas
- 📦 Control de inventario
- 👥 Gestión de empleados

---

**Desarrollado con ❤️ para carnicerías de todo el mundo**
