import { ReactNode } from 'react'

interface ButtonProps {
  children: ReactNode
  variant?: 'primary' | 'secondary'
  onClick?: () => void
  type?: 'button' | 'submit'
  disabled?: boolean
  className?: string
}

export function Button({
  children,
  variant = 'primary',
  onClick,
  type = 'button',
  disabled = false,
  className = ''
}: ButtonProps) {
  const baseClasses = 'px-6 py-3 rounded-lg font-bold text-sm cursor-pointer transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed'
  const variantClasses = {
    primary: 'bg-teal-500 text-white border-none hover:bg-teal-600 hover:-translate-y-0.5',
    secondary: 'bg-white text-teal-500 border-2 border-teal-500 hover:bg-teal-50'
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
    >
      {children}
    </button>
  )
}