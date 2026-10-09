import LoginPage from '../components/auth/LoginPage';
import { ROLE_HOME } from '../utils/rolePaths';

const layersIcon = (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="#0f172a" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
  </svg>
);

const facultyConfig = {
  role: 'faculty',
  title: 'Faculty Access',
  subtitle: 'Sign in to manage your academic department.',
  icon: layersIcon,
  fields: [
    { name: 'employeeId', label: 'Faculty ID', placeholder: 'Enter your faculty ID' },
    { name: 'password', label: 'Password', type: 'password' },
  ],
  submitLabel: 'Sign In',
  redirectTo: (user) => {
    const designation = (user?.designation || '').toUpperCase();
    return designation === 'HOD' || designation === 'FACULTY' ? ROLE_HOME.faculty : '/';
  },
  visual: {
    illustration: '/images/Students-rafiki.svg',
    alt: 'Campus illustration',
  },
};

const FacultyLogin = () => <LoginPage config={facultyConfig} />;

export default FacultyLogin;
