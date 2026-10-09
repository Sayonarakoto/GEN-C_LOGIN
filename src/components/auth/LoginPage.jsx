import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import useToastService from '../../hooks/useToastService';
import api from '../../api/client';
import AuthShell from './AuthShell';
import BrandMark from './BrandMark';
import FormField from './FormField';
import SubmitButton from './SubmitButton';
import VisualPanel from './VisualPanel';

const LoginPage = ({ config }) => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const toast = useToastService();

  const [loading, setLoading] = useState(false);
  const [values, setValues] = useState(() => {
    const initial = {};
    config.fields.forEach((f) => { initial[f.name] = ''; });
    return initial;
  });
  const [revealed, setRevealed] = useState({});

  const setField = (name, value) => {
    setValues((prev) => ({ ...prev, [name]: value }));
  };

  const toggleReveal = (name) => setRevealed((prev) => ({ ...prev, [name]: !prev[name] }));

  const onFinish = async (event) => {
    event.preventDefault();

    const missing = config.fields.find((f) => !String(values[f.name] || '').trim());
    if (missing) {
      toast.warning(`${missing.label} is required.`);
      return;
    }

    setLoading(true);

    try {
      const requestConfig = { headers: { 'X-Skip-Interceptor': true } };
      if (config.timeout) requestConfig.timeout = config.timeout;

      const response = await api.post(
        '/auth/login',
        { role: config.role, ...values },
        requestConfig
      );

      const { token, user, refreshToken } = response.data;
      if (!token) throw new Error('No token received from server');

      const safeUser = user ? { ...user } : user;
      delete safeUser.password;
      delete safeUser.tempPassword;

      login(token, safeUser, refreshToken);

      const target = typeof config.redirectTo === 'function'
        ? config.redirectTo(user, values)
        : config.redirectTo;

      setTimeout(() => navigate(target), config.redirectDelay ?? 900);
    } catch (error) {
      console.error('Login error:', error);
      const message = error.response?.status === 401 && config.invalidMessage
        ? config.invalidMessage
        : (error.response?.data?.message || 'Login failed. Please try again.');
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const form = (
    <form onSubmit={onFinish} noValidate>
      {config.fields.map((field) => (
        <FormField
          key={field.name}
          field={field}
          value={values[field.name]}
          onChange={setField}
          revealed={!!revealed[field.name]}
          onToggleReveal={() => toggleReveal(field.name)}
          disabled={loading}
        />
      ))}

      {config.showForgotLink !== false && (
        <div className="form-helpers">
          <Link to="/forgot-password" className="forgot-link">Forgot Password?</Link>
        </div>
      )}

      <SubmitButton
        text={loading ? (config.loadingText || 'Signing In...') : (config.submitLabel || 'Sign In')}
        loading={loading}
      />
    </form>
  );

  return (
    <AuthShell
      compact={config.compact}
      brand={<BrandMark icon={config.icon} title={config.title} subtitle={config.subtitle} />}
      form={form}
      visual={config.visual && <VisualPanel visual={config.visual} />}
    />
  );
};

export default LoginPage;
