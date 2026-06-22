/**
 * Form field primitives sharing the premium `.field-*` styles from index.css.
 * Use <Field label>…</Field> to wrap any control, or the Input/Select/Textarea
 * shortcuts for the common cases. `error` shows inline validation messaging.
 */
export function Field({ label, hint, error, required, className = '', children }) {
  return (
    <label className={`block ${className}`}>
      {label && (
        <span className="field-label">
          {label}
          {required && <span className="ml-0.5 text-red-500">*</span>}
        </span>
      )}
      {children}
      {error ? (
        <span className="mt-1 block text-xs font-medium text-red-600 dark:text-red-400">
          {error}
        </span>
      ) : hint ? (
        <span className="mt-1 block text-xs text-ink-400">{hint}</span>
      ) : null}
    </label>
  );
}

export function Input({ error, className = '', ...props }) {
  return (
    <input
      className={`field-input ${error ? 'field-input-error' : ''} ${className}`}
      {...props}
    />
  );
}

export function Select({ error, className = '', children, ...props }) {
  return (
    <select
      className={`field-input cursor-pointer ${error ? 'field-input-error' : ''} ${className}`}
      {...props}
    >
      {children}
    </select>
  );
}

export function Textarea({ error, className = '', ...props }) {
  return (
    <textarea
      className={`field-input ${error ? 'field-input-error' : ''} ${className}`}
      {...props}
    />
  );
}

export default Field;
