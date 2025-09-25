import { useToast } from './useToast';
import { useMemo } from 'react';

const useToastService = () => {
  const { showToast } = useToast();

  return useMemo(() => ({
    success: (content, duration = 3) => {
      showToast(content, 'success', duration * 1000);
    },
    error: (content, duration = 3) => {
      showToast(content, 'danger', duration * 1000);
    },
    info: (content, duration = 3) => {
      showToast(content, 'info', duration * 1000);
    },
    warning: (content, duration = 3) => {
      showToast(content, 'warning', duration * 1000);
    },
  }), [showToast]);
};

export default useToastService;
