import { createContext } from 'react';

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  return <AppContext.Provider value='hello'>{children}</AppContext.Provider>;
};
