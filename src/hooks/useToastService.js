import { useToast } from './useToast';

const useToastService = () => {
  const { showToast } = useToast();

  return {
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
  };
};

export default useToastService;
