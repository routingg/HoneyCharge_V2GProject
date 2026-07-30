import { forwardRef, useId, type InputHTMLAttributes } from 'react';
import { cn } from '@/utils/cn';

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  rightSlot?: React.ReactNode;
}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(
  ({ label, error, rightSlot, className, id, ...rest }, ref) => {
    const generatedId = useId();
    const fieldId = id ?? generatedId;
    return (
      <div>
        <label htmlFor={fieldId} className="mb-1.5 block text-[13px] font-semibold text-text">
          {label}
        </label>
        <div className="relative">
          <input
            id={fieldId}
            ref={ref}
            aria-invalid={!!error}
            aria-describedby={error ? `${fieldId}-error` : undefined}
            className={cn(
              'min-h-[48px] w-full rounded-button border bg-card px-4 text-[15px] text-text placeholder:text-[#B7BAC0] focus:border-info',
              error ? 'border-danger' : 'border-border',
              !!rightSlot && 'pr-11',
              className
            )}
            {...rest}
          />
          {rightSlot && <div className="absolute right-3 top-1/2 -translate-y-1/2">{rightSlot}</div>}
        </div>
        {error && (
          <p id={`${fieldId}-error`} className="mt-1 text-xs font-medium text-danger">
            {error}
          </p>
        )}
      </div>
    );
  }
);
TextField.displayName = 'TextField';
