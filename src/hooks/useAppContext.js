import { useContext } from 'react';
import { AppContext } from '../AppContext';

export const useAppContext = () => {
  return useContext(AppContext);
};
