import { useState } from 'react';
import FormError from "../components/ui/FormError.jsx";
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import AuthCard from '../components/AuthCard.jsx';
import Button from '../components/ui/Button.jsx';
import { Field, Input } from '../components/ui/Field.jsx';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    fullName: '',
    organizationName: '',
    email: '',
    password: '',
  });
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const payload = {
        email: form.email,
        password: form.password,
        ...(form.fullName ? { fullName: form.fullName } : {}),
        ...(form.organizationName ? { organizationName: form.organizationName } : {}),
      };
      await register(payload);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      const data = err.response?.data;
      setError(data?.issues?.[0]?.message || data?.message || 'Registration failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthCard
      title="Create your account"
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-brand-600 hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        <FormError message={error} />
        <Field label="Full name">
          <Input type="text" value={form.fullName} onChange={update('fullName')} autoComplete="name" />
        </Field>
        <Field label="Company / workspace">
          <Input type="text" value={form.organizationName} onChange={update('organizationName')} placeholder="Optional" />
        </Field>
        <Field label="Email">
          <Input type="email" value={form.email} onChange={update('email')} autoComplete="email" required />
        </Field>
        <Field label="Password" hint="At least 8 characters.">
          <Input type="password" value={form.password} onChange={update('password')} autoComplete="new-password" minLength={8} required />
        </Field>
        <Button type="submit" loading={submitting} className="w-full" size="lg">
          {submitting ? 'Creating…' : 'Create account'}
        </Button>
      </form>
    </AuthCard>
  );
}
