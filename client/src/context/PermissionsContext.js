import React, { createContext, useContext } from 'react';

export const PermissionsContext = createContext([]);

export const PermissionsProvider = ({ permissions, children }) => {
  return (
    <PermissionsContext.Provider value={permissions || []}>
      {children}
    </PermissionsContext.Provider>
  );
};

export const usePermissions = () => {
  return useContext(PermissionsContext);
};


