import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, X } from 'lucide-react';

const OfflineIndicator = ({ isOnline }) => {
  const [show, setShow] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!isOnline) {
      setMessage('Sin conexión a internet');
      setShow(true);
    } else {
      setMessage('Conexión restaurada');
      setShow(true);
      
      // Ocultar después de 3 segundos cuando se restaura la conexión
      const timer = setTimeout(() => {
        setShow(false);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [isOnline]);

  if (!show) return null;

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50">
      <div className={`
        flex items-center px-4 py-3 rounded-lg shadow-lg border transition-all duration-300
        ${isOnline 
          ? 'bg-green-50 border-green-200 text-green-800' 
          : 'bg-red-50 border-red-200 text-red-800'
        }
      `}>
        <div className="flex items-center">
          {isOnline ? (
            <Wifi className="h-5 w-5 mr-2 text-green-600" />
          ) : (
            <WifiOff className="h-5 w-5 mr-2 text-red-600" />
          )}
          <span className="text-sm font-medium">
            {message}
          </span>
        </div>
        
        <button
          onClick={() => setShow(false)}
          className="ml-4 p-1 rounded-full hover:bg-black hover:bg-opacity-10 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default OfflineIndicator;
