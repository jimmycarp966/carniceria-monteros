import React from 'react';
import { AlertTriangle, RefreshCw, Bug, X } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      showDetails: false 
    };
  }

  static getDerivedStateFromError(error) {
    // Actualizar el estado para que el siguiente render muestre la UI de error
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log del error para debugging
    console.error('Error capturado por ErrorBoundary:', error, errorInfo);
    
    this.setState({
      error: error,
      errorInfo: errorInfo
    });

    // También puedes enviar el error a un servicio de logging
    // logErrorToService(error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ 
      hasError: false, 
      error: null, 
      errorInfo: null,
      showDetails: false 
    });
  };

  toggleDetails = () => {
    this.setState(prev => ({ showDetails: !prev.showDetails }));
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-8">
            {/* Header */}
            <div className="flex items-center space-x-4 mb-6">
              <div className="p-3 bg-red-100 rounded-full">
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">¡Ups! Algo salió mal</h1>
                <p className="text-gray-600">Se ha producido un error inesperado</p>
              </div>
            </div>

            {/* Mensaje de error */}
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
              <p className="text-red-800 font-medium mb-2">
                Error: {this.state.error?.message || 'Error desconocido'}
              </p>
              <p className="text-red-700 text-sm">
                El componente ha fallado al renderizar. Esto puede ser debido a un problema temporal.
              </p>
            </div>

            {/* Información técnica */}
            {this.state.showDetails && this.state.errorInfo && (
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-6">
                <h3 className="font-semibold text-gray-900 mb-2">Información técnica:</h3>
                <details className="text-sm text-gray-700">
                  <summary className="cursor-pointer hover:text-gray-900 mb-2">
                    Stack trace
                  </summary>
                  <pre className="bg-gray-100 p-3 rounded-lg overflow-x-auto text-xs">
                    {this.state.errorInfo.componentStack}
                  </pre>
                </details>
              </div>
            )}

            {/* Acciones */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={this.handleRetry}
                className="flex-1 btn btn-primary flex items-center justify-center space-x-2"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Reintentar</span>
              </button>
              
              <button
                onClick={this.toggleDetails}
                className="flex-1 btn btn-secondary flex items-center justify-center space-x-2"
              >
                <Bug className="h-4 w-4" />
                <span>{this.state.showDetails ? 'Ocultar' : 'Mostrar'} detalles</span>
              </button>
            </div>

            {/* Información adicional */}
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
              <h4 className="font-medium text-blue-900 mb-2">¿Qué puedes hacer?</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Recarga la página (F5)</li>
                <li>• Verifica tu conexión a internet</li>
                <li>• Limpia el caché del navegador</li>
                <li>• Contacta al administrador si el problema persiste</li>
              </ul>
            </div>

            {/* Botón para cerrar */}
            <button
              onClick={() => window.location.reload()}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
