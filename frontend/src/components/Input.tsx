import { forwardRef } from 'react'

interface InputProps {
  type?: string
  placeholder?: string
  value?: string
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
  className?: string
  required?: boolean
  disabled?: boolean
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ type = 'text', placeholder, value, onChange, className = '', required, disabled }, ref) => {
    return (
      <input
        ref={ref}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        disabled={disabled}
        className={`w-full border-2 border-gray-200 rounded-lg px-4 py-3 text-sm font-normal outline-none transition-all duration-200 focus:border-teal-500 text-gray-900 disabled:opacity-50 ${className}`}
      />
    )
  }
)

Input.displayName = 'Input'