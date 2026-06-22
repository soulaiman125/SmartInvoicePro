import { useState } from 'react';
import FormError from "../components/ui/FormError.jsx";
import { Link } from 'react-router-dom';
import { forgotPassword } from '../services/auth.service.js';
import AuthCard from '../components/AuthCard.jsx';
import Button from '../components/ui/Button.jsx';
import { Field, Input } from '../components/ui/Field.jsx';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const data = await forgotPassword(email);
      setResult(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthCard
      title="Reset your password"
      subtitle="Enter your email and we'll send a reset link."
      footer={
        <Link to="/login" className="font-medium text-brand-600 hover:underline">
          Back to sign in
        </Link>
      }
    >
      {result ? (
        <div className="text-sm text-ink-600 dark:text-ink-300">
          <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-400">
            {result.message}
          </p>
          {/* In development the backend returns the token so the flow is testable. */}
          {result.devResetToken && (
            <p className="mt-4">
              Dev shortcut:{' '}
              <Link
                to={`/reset-password?token=${result.devResetToken}`}
                className="font-medium text-brand-600 hover:underline"
              >
                set a new password
              </Link>
            </p>
          )}
        </div>
      ) : (
        <form onSubmit={onSubmit} noValidate className="space-y-4">
          <FormError message={error} />
          <Field label="Email">
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
          </Field>
          <Button type="submit" loading={submitting} className="w-full" size="lg">
            {submitting ? 'Sending…' : 'Send reset link'}
          </Button>
        </form>
      )}
    </AuthCard>
  );
}
