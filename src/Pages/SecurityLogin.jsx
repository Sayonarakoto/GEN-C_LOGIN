import LoginPage from '../components/auth/LoginPage';
import { ROLE_HOME } from '../utils/rolePaths';

const shieldIcon = (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="#0f172a" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

const securityConfig = {
  role: 'security',
  compact: true,
  title: 'Security Portal',
  subtitle: 'Please enter the security passkey to proceed.',
  icon: shieldIcon,
  fields: [
    { name: 'passkey', label: 'Security Passkey', type: 'password', placeholder: 'Enter security passkey' },
  ],
  submitLabel: 'Login',
  loadingText: 'Logging in...',
  redirectTo: ROLE_HOME.security,
  redirectDelay: 0,
  showForgotLink: false,
  timeout: 10000,
  invalidMessage: 'Invalid passkey. Please try again.',
};

const SecurityLogin = () => <LoginPage config={securityConfig} />;

export default SecurityLogin;
