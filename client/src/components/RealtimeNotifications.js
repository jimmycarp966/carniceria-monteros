import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  X, 
  CheckCircle, 
  Info, 
  DollarSign,
  Package,
  Users,
  TrendingUp
} from 'lucide-react';
import { realtimeService } from '../services/realtimeService';
import toast from 'react-hot-toast';

const RealtimeNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [isVisible, setIsVisible] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // Escuchar notificaciones en tiempo real
    const handleNotification = (notification) => {
      addNotification(notification);
    };
    
    realtimeService.on('notification_received', handleNotification);

    // Escuchar alertas de stock
    realtimeService.on('stock_alert', (data) => {
      if (data.items && data.items.length > 0) {
        const stockNotification = {
          id: Date.now(),
          type: 'stock_alert',
          title: 'Alerta de Stock',
          message: `${data.items.length} productos con stock bajo`,
          priority: 'high',
          timestamp: new Date(),
          data: data.items
        };
        addNotification(stockNotification);
      }
    });

    // Escuchar ventas completadas
    realtimeService.on('sale_synced', (data) => {
      const saleNotification = {
        id: Date.now(),
        type: 'sale_completed',
        title: 'Venta Completada',
        message: `Nueva venta de $${data.saleData.finalTotal.toLocaleString()}`,
        priority: 'medium',
        timestamp: new Date(),
        data: data.saleData
      };
      addNotification(saleNotification);
    });

    return () => {
      realtimeService.off('notification_received', handleNotification);
      realtimeService.off('stock_alert');
      realtimeService.off('sale_synced');
    };
  }, [addNotification]);

  const addNotification = (notification) => {
    setNotifications(prev => [notification, ...prev.slice(0, 19)]); // Máximo 20 notificaciones
    setUnreadCount(prev => prev + 1);
    
    // Mostrar toast
    const icon = getNotificationIcon(notification.type);
    const color = getNotificationColor(notification.priority);
    
    toast.success(
      <div className="flex items-center">
        {icon}
        <div className="ml-2">
          <div className="font-medium">{notification.title}</div>
          <div className="text-sm text-gray-600">{notification.message}</div>
        </div>
      </div>,
      {
        duration: 4000,
        style: {
          background: color.background,
          color: color.text,
          borderRadius: '12px',
          border: `1px solid ${color.border}`,
        },
      }
    );
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'sale_completed':
        return <DollarSign className="h-5 w-5 text-green-600" />;
      case 'stock_alert':
        return <Package className="h-5 w-5 text-red-600" />;
      case 'customer_added':
        return <Users className="h-5 w-5 text-blue-600" />;
      case 'product_added':
        return <Package className="h-5 w-5 text-purple-600" />;
      case 'shift_opened':
        return <TrendingUp className="h-5 w-5 text-orange-600" />;
      case 'shift_closed':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      default:
        return <Info className="h-5 w-5 text-gray-600" />;
    }
  };

  const getNotificationColor = (priority) => {
    switch (priority) {
      case 'high':
        return {
          background: '#fef2f2',
          text: '#991b1b',
          border: '#fecaca'
        };
      case 'medium':
        return {
          background: '#fffbeb',
          text: '#92400e',
          border: '#fed7aa'
        };
      default:
        return {
          background: '#f0f9ff',
          text: '#1e40af',
          border: '#bfdbfe'
        };
    }
  };

  const markAsRead = (notificationId) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId 
          ? { ...notif, read: true }
          : notif
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notif => ({ ...notif, read: true }))
    );
    setUnreadCount(0);
  };

  const removeNotification = (notificationId) => {
    setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const clearAll = () => {
    setNotifications([]);
    setUnreadCount(0);
  };

  const formatTime = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now - time) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Ahora';
    if (diffInMinutes < 60) return `Hace ${diffInMinutes} min`;
    if (diffInMinutes < 1440) return `Hace ${Math.floor(diffInMinutes / 60)}h`;
    return time.toLocaleDateString();
  };

  return (
    <div className="relative">
      {/* Botón de notificaciones */}
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="relative p-2 bg-white/90 backdrop-blur-sm shadow-xl border border-gray-200/50 hover:shadow-2xl transition-all duration-300 transform hover:scale-105 hover:bg-white/95 rounded-2xl"
        aria-label="Notificaciones"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Panel de notificaciones */}
      {isVisible && (
        <div className="absolute right-0 top-12 w-80 bg-white rounded-2xl shadow-2xl border border-gray-200/50 z-50 max-h-96 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200/50">
            <h3 className="text-lg font-semibold">Notificaciones</h3>
            <div className="flex items-center space-x-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                >
                  Marcar como leídas
                </button>
              )}
              <button
                onClick={clearAll}
                className="text-xs text-red-600 hover:text-red-700 font-medium"
              >
                Limpiar
              </button>
              <button
                onClick={() => setIsVisible(false)}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Lista de notificaciones */}
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                <Bell className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                <p>No hay notificaciones</p>
                <p className="text-sm">Las notificaciones aparecerán aquí</p>
              </div>
            ) : (
              <div className="space-y-1">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 border-b border-gray-100 last:border-b-0 transition-colors ${
                      !notification.read ? 'bg-blue-50/50' : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3 flex-1">
                        <div className="mt-1">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-medium text-gray-900">
                              {notification.title}
                            </h4>
                            {!notification.read && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {formatTime(notification.timestamp)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1 ml-2">
                        {!notification.read && (
                          <button
                            onClick={() => markAsRead(notification.id)}
                            className="p-1 hover:bg-green-100 rounded transition-colors"
                            title="Marcar como leída"
                          >
                            <CheckCircle className="h-3 w-3 text-green-600" />
                          </button>
                        )}
                        <button
                          onClick={() => removeNotification(notification.id)}
                          className="p-1 hover:bg-red-100 rounded transition-colors"
                          title="Eliminar"
                        >
                          <X className="h-3 w-3 text-red-600" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-3 border-t border-gray-200/50 bg-gray-50/50">
              <div className="flex items-center justify-between text-xs text-gray-600">
                <span>{notifications.length} notificación{notifications.length !== 1 ? 'es' : ''}</span>
                <span>{unreadCount} sin leer</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Overlay para cerrar al hacer clic fuera */}
      {isVisible && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsVisible(false)}
        />
      )}
    </div>
  );
};

export default RealtimeNotifications; 