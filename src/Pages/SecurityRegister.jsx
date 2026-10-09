import RegisterPage from '../components/auth/RegisterPage';

const securityConfig = {
  title: 'Security Register',
  endpoint: '/auth/register/security',
  narrow: true,
  fields: [
    { name: 'name', label: 'Name', type: 'text' },
    { name: 'securityId', label: 'Security ID', type: 'text' },
    {
      name: 'passkey',
      label: 'Passkey (6 digits)',
      type: 'password',
      maxLength: 6,
      validate: (value) => (/^\d{6}$/.test(value) ? null : 'Passkey must be exactly 6 digits!'),
    },
  ],
};

const SecurityRegister = () => <RegisterPage config={securityConfig} />;

export default SecurityRegister;
