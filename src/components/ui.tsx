import type { ReactNode, ButtonHTMLAttributes, SelectHTMLAttributes, InputHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md';
  children: ReactNode;
}

export function Button({ variant = 'secondary', size = 'md', children, className = '', type = 'button', ...props }: ButtonProps) {
  const base = 'inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed';
  const sizes = { sm: 'h-8 px-3.5 text-sm', md: 'h-10 px-4 text-sm' };
  const variants = {
    primary: 'btn-primary',
    secondary: 'surface text-[var(--color-text)] hover:surface-2',
    ghost: 'text-muted hover:text-[var(--color-text)]',
    danger: 'bg-[var(--color-danger)] text-white hover:opacity-90',
  };
  return (
    <button type={type} className={`${base} ${sizes[size]} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}

interface CardProps {
  children: ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
  action?: ReactNode;
}

export function Card({ children, className = '', title, subtitle, action }: CardProps) {
  return (
    <div className={`surface rounded-3xl ${className}`}>
      {(title || action) && (
        <div className="flex items-center justify-between gap-3 px-6 pt-5 pb-1">
          <div>
            {title && <h3 className="text-[17px] font-semibold text-[var(--color-text)]">{title}</h3>}
            {subtitle && <p className="text-sm text-muted mt-0.5">{subtitle}</p>}
          </div>
          {action}
        </div>
      )}
      <div className={title || action ? "px-6 pb-6 pt-4" : "p-6"}>{children}</div>
    </div>
  );
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  children: ReactNode;
}

export function Select({ label, children, className = '', ...props }: SelectProps) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-xs font-semibold text-muted">{label}</label>}
      <select className={`input-base rounded-xl h-10 px-3 text-sm ${className}`} {...props}>
        {children}
      </select>
    </div>
  );
}

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export function Input({ label, className = '', ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-xs font-semibold text-muted">{label}</label>}
      <input className={`input-base rounded-xl h-10 px-3 text-sm ${className}`} {...props} />
    </div>
  );
}

export function Badge({ children, variant = 'default' }: { children: ReactNode; variant?: 'default' | 'primary' | 'warning' | 'danger' }) {
  const variants = {
    default: 'surface-2 text-muted',
    primary: 'text-primary bg-[var(--color-primary-light)]',
    warning: 'bg-[var(--color-warn-bg)] text-[var(--color-warn)]',
    danger: 'bg-[var(--color-danger-bg)] text-[var(--color-danger)]',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${variants[variant]}`}>
      {children}
    </span>
  );
}

export function EmptyState({ icon, title, description, action }: { icon: ReactNode; title: string; description: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
      <div className="w-16 h-16 rounded-full bg-[var(--color-primary-light)] flex items-center justify-center mb-4 text-primary">
        {icon}
      </div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-muted text-sm max-w-md mb-6">{description}</p>
      {action}
    </div>
  );
}

export function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="surface rounded-3xl p-5">
      <p className="text-xs font-bold text-muted uppercase tracking-[0.1em]">{label}</p>
      <p className="font-display text-[26px] font-semibold mt-1.5 leading-tight text-[var(--color-text)]">{value}</p>
      {sub && <p className="text-xs text-muted mt-1">{sub}</p>}
    </div>
  );
}

export function ProgressBar({ value, max, color }: { value: number; max: number; color?: string }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className="h-2 rounded-full surface-2 overflow-hidden">
      <div className="h-full rounded-full transition-all duration-300" style={{ width: `${pct}%`, backgroundColor: color || 'var(--color-primary)' }} />
    </div>
  );
}
