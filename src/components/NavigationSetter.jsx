import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { setNavigateFunction } from '../utils/authRedirect';

const NavigationSetter = () => {
  const navigate = useNavigate();

  useEffect(() => {
    setNavigateFunction(navigate);
  }, [navigate]);

  return null; // This component doesn't render anything
};

export default NavigationSetter;