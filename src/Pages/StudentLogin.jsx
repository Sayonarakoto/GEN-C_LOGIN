import LoginPage from '../components/auth/LoginPage';

const personIcon = (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="#0f172a" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
  </svg>
);

const studentConfig = {
  role: 'student',
  title: 'Student Login',
  subtitle: 'Sign in to continue to your academic workspace.',
  icon: personIcon,
  fields: [
    { name: 'studentId', label: 'Student ID', placeholder: 'Enter your student ID' },
    { name: 'password', label: 'Password', type: 'password' },
  ],
  submitLabel: 'Sign In',
  redirectTo: '/student',
  visual: {
    illustration: '/images/Students-rafiki.svg',
    alt: 'Students illustration',
  },
};

const StudentLogin = () => <LoginPage config={studentConfig} />;

export default StudentLogin;