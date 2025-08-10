# 🧪 Guía de Pruebas Manuales - Sistema de Carnicería

## 📋 Lista de Verificación Completa

### 🚀 **PASO 1: Verificar que la aplicación arranca**
```bash
cd client
npm start
```
✅ **Verificar**: La aplicación se abre en el navegador  
✅ **Verificar**: No hay errores en la consola del navegador (F12)

---

### 📊 **PASO 2: Probar Dashboard en Tiempo Real**

#### 2.1 Abrir Dashboard
1. Ir a la página principal (Dashboard)
2. **Verificar que se ven las 4 tarjetas**:
   - Ventas Hoy
   - Productos Vendidos  
   - Clientes Nuevos
   - Stock Bajo

#### 2.2 Probar Panel de Debug
1. **Buscar botón 🐛** en la esquina inferior derecha
2. **Hacer clic** para abrir el Panel de Debug
3. **Hacer clic en "Ejecutar Pruebas"**
4. **Verificar**: Se ejecutan pruebas automáticas
5. **Hacer clic en "Probar Tiempo Real"**
6. **Verificar**: Se ven eventos en la sección "Eventos de Tiempo Real"

#### 2.3 Verificar Estado de Salud
En el Panel de Debug, verificar que todo esté verde:
- ✅ Conexión Internet: Conectado
- ✅ Firebase: Conectado  
- ✅ Tiempo Real: Activo
- ✅ Cache: Activo

---

### 💰 **PASO 3: Probar Sistema de Ventas**

#### 3.1 Ir al Módulo de Ventas
1. **Hacer clic en "Ventas"** en el menú lateral
2. **Verificar que se ve**:
   - Selector de fecha (calendario)
   - 4 tarjetas de estadísticas
   - Formulario para agregar productos
   - Carrito de compras

#### 3.2 Probar Filtro por Fecha
1. **Cambiar la fecha** en el selector de fecha
2. **Verificar**: Las estadísticas cambian según la fecha
3. **Verificar**: El historial muestra ventas de esa fecha
4. **Volver a la fecha de hoy**

#### 3.3 Probar Historial de Ventas
1. **Hacer clic en "Mostrar Historial"**
2. **Verificar**: Se muestra lista de ventas del día
3. **Verificar**: Se muestran turnos del día (si los hay)

---

### 🛒 **PASO 4: Probar Caja Registradora**

#### 4.1 Ir a la Caja
1. **Hacer clic en "Caja"** en el menú lateral
2. **Verificar que se ve**:
   - Interfaz de caja registradora
   - Búsqueda de productos
   - Carrito
   - Métodos de pago

#### 4.2 Abrir un Turno (si es necesario)
1. Si no hay turno activo, **hacer clic en "Gestión de Turnos"**
2. **Abrir un nuevo turno**
3. **Verificar**: El turno aparece como activo

#### 4.3 Realizar una Venta de Prueba
1. **Buscar un producto** en el buscador
2. **Agregarlo al carrito**
3. **Completar la venta**
4. **Verificar**: Se muestra mensaje de éxito
5. **Verificar**: Se limpia el carrito

---

### ⚡ **PASO 5: Verificar Tiempo Real**

#### 5.1 Abrir Dashboard en otra pestaña
1. **Abrir nueva pestaña** del navegador
2. **Ir al Dashboard**
3. **Tener ambas pestañas visibles**

#### 5.2 Realizar Venta y Verificar Actualización
1. **En la pestaña de Caja**: Realizar otra venta
2. **En la pestaña de Dashboard**: Verificar que las estadísticas se actualizan automáticamente
3. **Verificar**: "Ventas Hoy" aumenta
4. **Verificar**: "Productos Vendidos" aumenta

#### 5.3 Verificar Panel de Debug
1. **Abrir Panel de Debug** mientras realizas ventas
2. **Verificar**: Aparecen eventos en "Eventos de Tiempo Real"
3. **Verificar**: Se ven eventos como "sales_updated", "sale_synced"

---

### 📦 **PASO 6: Probar Inventario**

#### 6.1 Ir a Inventario
1. **Hacer clic en "Inventario"** en el menú lateral
2. **Verificar**: Se cargan productos con stock
3. **Verificar**: Se ven alertas de stock bajo (si las hay)

#### 6.2 Verificar Actualización de Stock
1. **Anotar el stock** de un producto antes de vender
2. **Realizar venta** de ese producto en la caja
3. **Volver a Inventario**
4. **Verificar**: El stock disminuyó automáticamente

---

### 🔔 **PASO 7: Probar Notificaciones**

#### 7.1 Verificar Notificaciones en Dashboard
1. **Ir al Dashboard**
2. **Buscar el botón de notificaciones** (campana 🔔)
3. **Hacer clic** para ver notificaciones
4. **Realizar una venta**
5. **Verificar**: Aparece notificación de nueva venta

---

### 📱 **PASO 8: Probar en Móvil**

#### 8.1 Abrir en Dispositivo Móvil
1. **Obtener la URL** de la aplicación (ej: localhost:3000)
2. **Abrir en teléfono móvil**
3. **Verificar**: La interfaz se adapta al móvil
4. **Probar**: Navegación y funciones básicas

---

## ✅ **Lista de Verificación Final**

### Dashboard
- [ ] Se cargan estadísticas correctamente
- [ ] Panel de Debug funciona
- [ ] Tiempo real se actualiza automáticamente
- [ ] Conexión a Firebase OK

### Sales  
- [ ] Selector de fecha funciona
- [ ] Filtros por fecha funcionan
- [ ] Estadísticas cambian según fecha
- [ ] Historial muestra ventas correctas
- [ ] Turnos del día se muestran

### Caja Registradora
- [ ] Se pueden buscar productos
- [ ] Se pueden agregar al carrito
- [ ] Se pueden completar ventas
- [ ] Turnos funcionan correctamente

### Tiempo Real
- [ ] Dashboard se actualiza automáticamente
- [ ] Sales se actualiza automáticamente  
- [ ] Inventario se actualiza automáticamente
- [ ] Notificaciones aparecen

### Dispositivos
- [ ] Funciona en escritorio
- [ ] Funciona en móvil
- [ ] Funciona en diferentes navegadores

---

## 🚨 **Si Algo No Funciona**

### 1. Revisar Consola del Navegador
- Presionar **F12**
- Ir a **Console**
- Buscar errores en rojo

### 2. Verificar Panel de Debug
- Abrir Panel de Debug (🐛)
- Ejecutar pruebas automáticas
- Revisar estado de salud del sistema

### 3. Verificar Conexión
- Verificar internet
- Verificar que Firebase esté configurado

### 4. Reiniciar Aplicación
```bash
Ctrl+C (para detener)
npm start (para reiniciar)
```

---

## 📞 **Reportar Problemas**

Si encuentras algún problema, anota:
1. **Qué estabas haciendo** cuando ocurrió
2. **Qué esperabas** que pasara
3. **Qué pasó** en realidad
4. **Errores en consola** (F12)
5. **Capturas de pantalla** si es posible

---

**¡Usa esta guía para probar todas las funcionalidades paso a paso!** 🧪✅
