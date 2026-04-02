import { forwardRef } from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={`w-full border-2 border-gray-200 rounded-lg px-4 py-3 text-sm font-normal outline-none transition-all duration-200 focus:border-teal-500 text-gray-900 disabled:opacity-50 ${className}`}
        {...props}
      />
    )
  }
)

Input.displayName = 'Input'