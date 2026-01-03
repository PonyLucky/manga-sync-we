import { InputHTMLAttributes, forwardRef, ReactNode } from 'react';
import './Input.scss';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: ReactNode;
  fullWidth?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, fullWidth = false, className = '', id, ...props }, ref) => {
    const inputId = id || `input-${Math.random().toString(36).slice(2, 9)}`;

    return (
      <div className={`input-wrapper ${fullWidth ? 'input-wrapper--full-width' : ''} ${className}`}>
        {label && (
          <label htmlFor={inputId} className="input-wrapper__label">
            {label}
          </label>
        )}
        <div className={`input-container ${error ? 'input-container--error' : ''}`}>
          {icon && <span className="input-container__icon">{icon}</span>}
          <input
            ref={ref}
            id={inputId}
            className={`input ${icon ? 'input--with-icon' : ''}`}
            {...props}
          />
        </div>
        {error && <span className="input-wrapper__error">{error}</span>}
      </div>
    );
  }
);

Input.displayName = 'Input';
