import LoginPage from '../components/auth/LoginPage';
import { ROLE_HOME } from '../utils/rolePaths';

const gearIcon = (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="#0f172a" xmlns="http://www.w3.org/2000/svg">
    <path d="M19.4 13a7.6 7.6 0 0 0 .1-1 7.6 7.6 0 0 0-.1-1l2.1-1.7a.5.5 0 0 0 .1-.6l-2-3.5a.5.5 0 0 0-.6-.2l-2.5 1a7.7 7.7 0 0 0-1.7-1l-.4-2.6a.5.5 0 0 0-.5-.4h-4a.5.5 0 0 0-.5.4l-.4 2.6a7.7 7.7 0 0 0-1.7 1l-2.5-1a.5.5 0 0 0-.6.2l-2 3.5a.5.5 0 0 0 .1.6L5.5 11a7.6 7.6 0 0 0-.1 1 7.6 7.6 0 0 0 .1 1l-2.1 1.7a.5.5 0 0 0-.1.6l2 3.5c.1.2.4.3.6.2l2.5-1a7.7 7.7 0 0 0 1.7 1l.4 2.6c0 .2.2.4.5.4h4c.2 0 .5-.2.5-.4l.4-2.6a7.7 7.7 0 0 0 1.7-1l2.5 1c.2.1.5 0 .6-.2l2-3.5a.5.5 0 0 0-.1-.6L19.4 13zM12 15.5A3.5 3.5 0 1 1 12 8.5a3.5 3.5 0 0 1 0 7z" />
  </svg>
);

const adminConfig = {
  role: 'admin',
  title: 'Admin Console',
  subtitle: 'Sign in to manage application settings.',
  icon: gearIcon,
  fields: [
    { name: 'identifier', label: 'Admin ID', placeholder: 'Enter admin ID or email' },
    { name: 'password', label: 'Password', type: 'password' },
  ],
  submitLabel: 'Sign In',
  redirectTo: ROLE_HOME.admin,
  visual: {
    kicker: 'GEN C',
    title: 'Configure with confidence',
    description: 'Manage app-wide time settings and platform preferences from one place.',
    icons: (
      <>
        <svg className="anim-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 15.5A3.5 3.5 0 1 1 12 8.5a3.5 3.5 0 0 1 0 7z" /><path d="M19.4 13a7.6 7.6 0 0 0 .1-1 7.6 7.6 0 0 0-.1-1l2.1-1.7a.5.5 0 0 0 .1-.6l-2-3.5a.5.5 0 0 0-.6-.2l-2.5 1a7.7 7.7 0 0 0-1.7-1l-.4-2.6a.5.5 0 0 0-.5-.4h-4a.5.5 0 0 0-.5.4l-.4 2.6a7.7 7.7 0 0 0-1.7 1l-2.5-1a.5.5 0 0 0-.6.2l-2 3.5a.5.5 0 0 0 .1.6L5.5 11a7.6 7.6 0 0 0-.1 1 7.6 7.6 0 0 0 .1 1l-2.1 1.7a.5.5 0 0 0-.1.6l2 3.5c.1.2.4.3.6.2l2.5-1a7.7 7.7 0 0 0 1.7 1l.4 2.6c0 .2.2.4.5.4h4c.2 0 .5-.2.5-.4l.4-2.6a7.7 7.7 0 0 0 1.7-1l2.5 1c.2.1.5 0 .6-.2l2-3.5a.5.5 0 0 0-.1-.6L19.4 13z" /></svg>
        <svg className="anim-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 6h16M4 12h16M4 18h10" /></svg>
      </>
    ),
  },
};

const AdminLogin = () => <LoginPage config={adminConfig} />;

export default AdminLogin;
