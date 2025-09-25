import useAxiosInterceptor from '../hooks/useAxiosInterceptor';

const InterceptorWrapper = ({ children }) => {
  // The hook is now safely executed inside the AuthProvider's scope
  useAxiosInterceptor(); 
  
  // Render the rest of your application (the Routes)
  return children; 
};

export default InterceptorWrapper;
