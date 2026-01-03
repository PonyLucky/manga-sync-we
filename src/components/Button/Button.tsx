import { ButtonHTMLAttributes, forwardRef } from 'react';
import './Button.scss';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  fullWidth?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      loading = false,
      fullWidth = false,
      disabled,
      className = '',
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        className={`button button--${variant} button--${size} ${
          fullWidth ? 'button--full-width' : ''
        } ${loading ? 'button--loading' : ''} ${className}`}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <span className="button__spinner">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray="31.4 31.4"
              />
            </svg>
          </span>
        )}
        <span className={`button__content ${loading ? 'button__content--hidden' : ''}`}>
          {children}
        </span>
      </button>
    );
  }
);

Button.displayName = 'Button';
