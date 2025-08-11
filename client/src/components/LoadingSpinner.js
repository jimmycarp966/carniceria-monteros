import React from 'react';
import { Store } from 'lucide-react';

const LoadingSpinner = ({ 
  size = 'default', 
  text = 'Cargando...', 
  showIcon = true,
  className = '' 
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    default: 'h-6 w-6',
    lg: 'h-8 w-8',
    xl: 'h-12 w-12'
  };

  const textSizes = {
    sm: 'text-xs',
    default: 'text-sm',
    lg: 'text-base',
    xl: 'text-lg'
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    default: 'h-4 w-4',
    lg: 'h-5 w-5',
    xl: 'h-6 w-6'
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className="text-center">
        {showIcon && (
          <div className="flex items-center justify-center mb-3">
            <div className="relative">
              <div className={`${sizeClasses[size]} border-2 border-gray-300 border-t-orange-600 rounded-full animate-spin`}></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Store className={`${iconSizes[size]} text-orange-600 animate-pulse`} />
              </div>
            </div>
          </div>
        )}
        {text && (
          <p className={`${textSizes[size]} text-gray-600 font-medium`}>
            {text}
          </p>
        )}
      </div>
    </div>
  );
};

// Variantes predefinidas
export const PageLoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <LoadingSpinner size="xl" text="Cargando página..." />
  </div>
);

export const ComponentLoadingSpinner = () => (
  <div className="flex items-center justify-center py-12">
    <LoadingSpinner size="lg" text="Cargando componente..." />
  </div>
);

export const ButtonLoadingSpinner = () => (
  <LoadingSpinner size="sm" text="" showIcon={false} />
);

export const TableLoadingSpinner = () => (
  <div className="flex items-center justify-center py-8">
    <LoadingSpinner size="default" text="Cargando datos..." />
  </div>
);

export const ModalLoadingSpinner = () => (
  <div className="flex items-center justify-center py-6">
    <LoadingSpinner size="lg" text="Procesando..." />
  </div>
);

export default LoadingSpinner;
