import type { ReactNode, ButtonHTMLAttributes, InputHTMLAttributes } from 'react';

// ==================== BUTTON ====================

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  children: ReactNode;
}

const variantClass: Record<string, string> = {
  primary: 'bg-indigo-600 text-white hover:bg-indigo-700 disabled:bg-indigo-300',
  secondary: 'bg-white text-indigo-600 border border-indigo-600 hover:bg-indigo-50',
  ghost: 'bg-transparent text-gray-600 hover:bg-gray-100',
  danger: 'bg-red-600 text-white hover:bg-red-700',
};

const sizeClass: Record<string, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-3 text-lg',
};

export const Button = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  children,
  className = '',
  disabled,
  ...props
}: ButtonProps) => (
  <button
    className={`inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed ${variantClass[variant]} ${sizeClass[size]} ${className}`}
    disabled={disabled ?? loading}
    {...props}
  >
    {loading && (
      <svg className="mr-2 h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
    )}
    {children}
  </button>
);

// ==================== CARD ====================

export interface CardProps {
  children: ReactNode;
  className?: string;
  header?: ReactNode;
  footer?: ReactNode;
}

export const Card = ({ children, className = '', header, footer }: CardProps) => (
  <div className={`rounded-xl border border-gray-200 bg-white shadow-sm ${className}`}>
    {header && <div className="border-b border-gray-200 px-6 py-4">{header}</div>}
    <div className="px-6 py-4">{children}</div>
    {footer && <div className="border-t border-gray-200 px-6 py-4">{footer}</div>}
  </div>
);

// ==================== INPUT ====================

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = ({ label, error, helperText, className = '', id, ...props }: InputProps) => (
  <div className="flex flex-col gap-1">
    {label && (
      <label htmlFor={id} className="text-sm font-medium text-gray-700">
        {label}
      </label>
    )}
    <input
      id={id}
      className={`rounded-lg border px-3 py-2 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 ${error ? 'border-red-500' : 'border-gray-300'} ${className}`}
      {...props}
    />
    {error && <p className="text-xs text-red-600">{error}</p>}
    {helperText && !error && <p className="text-xs text-gray-500">{helperText}</p>}
  </div>
);

// ==================== BADGE ====================

export interface BadgeProps {
  children: ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  className?: string;
}

const badgeVariant: Record<string, string> = {
  default: 'bg-gray-100 text-gray-800',
  success: 'bg-green-100 text-green-800',
  warning: 'bg-yellow-100 text-yellow-800',
  danger: 'bg-red-100 text-red-800',
  info: 'bg-blue-100 text-blue-800',
};

export const Badge = ({ children, variant = 'default', className = '' }: BadgeProps) => (
  <span
    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${badgeVariant[variant]} ${className}`}
  >
    {children}
  </span>
);

// ==================== SPINNER ====================

export interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const spinnerSize: Record<string, string> = { sm: 'h-4 w-4', md: 'h-8 w-8', lg: 'h-12 w-12' };

export const Spinner = ({ size = 'md', className = '' }: SpinnerProps) => (
  <div
    className={`animate-spin rounded-full border-2 border-gray-300 border-t-indigo-600 ${spinnerSize[size]} ${className}`}
    role="status"
    aria-label="Loading"
  />
);

// ==================== AVATAR ====================

export interface AvatarProps {
  src?: string | null;
  name?: string | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const avatarSize: Record<string, string> = { sm: 'h-8 w-8 text-xs', md: 'h-10 w-10 text-sm', lg: 'h-14 w-14 text-base' };

const getInitials = (name: string | null | undefined): string => {
  if (!name) return '?';
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
};

export const Avatar = ({ src, name, size = 'md', className = '' }: AvatarProps) =>
  src ? (
    <img
      src={src}
      alt={name ?? 'User avatar'}
      className={`rounded-full object-cover ${avatarSize[size]} ${className}`}
    />
  ) : (
    <div
      className={`flex items-center justify-center rounded-full bg-indigo-100 font-semibold text-indigo-700 ${avatarSize[size]} ${className}`}
    >
      {getInitials(name)}
    </div>
  );
