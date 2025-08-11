import { useEffect, useRef, useCallback, useState } from 'react';
import realtimeService from '../services/realtimeService';

// Hook para optimizar re-renders
export const useOptimizedCallback = (callback, deps) => {
  const callbackRef = useRef();
  callbackRef.current = callback;
  
  return useCallback((...args) => {
    if (callbackRef.current) {
      return callbackRef.current(...args);
    }
  }, deps);
};

// Hook para debouncing
export const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Hook para throttling
export const useThrottle = (callback, delay) => {
  const lastRun = useRef(Date.now());

  return useCallback((...args) => {
    if (Date.now() - lastRun.current >= delay) {
      callback(...args);
      lastRun.current = Date.now();
    }
  }, [callback, delay]);
};

// Hook para lazy loading de imágenes
export const useLazyImage = (src, placeholder) => {
  const [imageSrc, setImageSrc] = useState(placeholder);
  const [imageRef, setImageRef] = useState();

  useEffect(() => {
    let observer;
    let didCancel = false;

    if (imageRef && imageSrc === placeholder) {
      if (IntersectionObserver) {
        observer = new IntersectionObserver(
          entries => {
            entries.forEach(entry => {
              if (
                !didCancel &&
                (entry.intersectionRatio > 0 || entry.isIntersecting)
              ) {
                setImageSrc(src);
                observer.unobserve(imageRef);
              }
            });
          },
          {
            threshold: 0.01,
            rootMargin: '75%',
          }
        );
        observer.observe(imageRef);
      } else {
        // Fallback para navegadores que no soportan IntersectionObserver
        setImageSrc(src);
      }
    }
    return () => {
      didCancel = true;
      if (observer && observer.unobserve) {
        observer.unobserve(imageRef);
      }
    };
  }, [src, imageSrc, imageRef, placeholder]);

  return [imageSrc, setImageRef];
};

// Hook para optimizar scroll
export const useScrollOptimization = (callback, delay = 16) => {
  const ticking = useRef(false);

  const updateScroll = useCallback(() => {
    callback();
    ticking.current = false;
  }, [callback]);

  const onScroll = useCallback(() => {
    if (!ticking.current) {
      requestAnimationFrame(updateScroll);
      ticking.current = true;
    }
  }, [updateScroll]);

  useEffect(() => {
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [onScroll]);
};

// Hook para optimizar resize
export const useResizeOptimization = (callback, delay = 16) => {
  const ticking = useRef(false);

  const updateSize = useCallback(() => {
    callback();
    ticking.current = false;
  }, [callback]);

  const onResize = useCallback(() => {
    if (!ticking.current) {
      requestAnimationFrame(updateSize);
      ticking.current = true;
    }
  }, [updateSize]);

  useEffect(() => {
    window.addEventListener('resize', onResize, { passive: true });
    return () => window.removeEventListener('resize', onResize);
  }, [onResize]);
};

// Hook para memoria virtual
export const useVirtualMemory = (items, itemHeight, containerHeight) => {
  const [scrollTop, setScrollTop] = useState(0);
  
  const visibleItemCount = Math.ceil(containerHeight / itemHeight);
  const startIndex = Math.floor(scrollTop / itemHeight);
  const endIndex = Math.min(startIndex + visibleItemCount + 1, items.length);
  
  const visibleItems = items.slice(startIndex, endIndex);
  const totalHeight = items.length * itemHeight;
  const offsetY = startIndex * itemHeight;
  
  return {
    visibleItems,
    totalHeight,
    offsetY,
    setScrollTop
  };
};

// Hook para optimizar Firebase listeners
export const useFirebaseOptimization = (listeners, dependencies = []) => {
  useEffect(() => {
    const cleanupFunctions = [];
    
    listeners.forEach(({ event, callback }) => {
      // Implementar debouncing para eventos frecuentes
      const debouncedCallback = debounce(callback, 300);
      realtimeService.on(event, debouncedCallback);
      cleanupFunctions.push(() => realtimeService.off(event, debouncedCallback));
    });
    
    return () => {
      cleanupFunctions.forEach(cleanup => cleanup());
    };
  }, dependencies);
};

// Función de debouncing
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Hook para optimizar animaciones
export const useAnimationOptimization = (animationCallback, dependencies = []) => {
  const animationRef = useRef();
  
  const animate = useCallback(() => {
    animationCallback();
    animationRef.current = requestAnimationFrame(animate);
  }, [animationCallback]);
  
  useEffect(() => {
    animationRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, dependencies);
};

// Hook para optimizar cache
export const useCacheOptimization = (key, data, ttl = 5 * 60 * 1000) => {
  const cache = useRef(new Map());
  
  const getCachedData = useCallback((cacheKey) => {
    const cached = cache.current.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < ttl) {
      return cached.data;
    }
    return null;
  }, [ttl]);
  
  const setCachedData = useCallback((cacheKey, cacheData) => {
    // Limpiar cache si está lleno
    if (cache.current.size > 100) {
      const firstKey = cache.current.keys().next().value;
      cache.current.delete(firstKey);
    }
    
    cache.current.set(cacheKey, {
      data: cacheData,
      timestamp: Date.now()
    });
  }, []);
  
  useEffect(() => {
    if (data && key) {
      setCachedData(key, data);
    }
  }, [key, data, setCachedData]);
  
  return { getCachedData, setCachedData };
}; 