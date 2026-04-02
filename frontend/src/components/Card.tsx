import { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  onClick?: () => void
}

export function Card({ children, className = '', onClick }: CardProps) {
  const clickableClasses = onClick ? 'cursor-pointer hover:shadow-md hover:-translate-y-1' : ''

  return (
    <div
      className={`bg-white rounded-lg border border-gray-200 p-6 shadow-sm transition-all duration-200 ${clickableClasses} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  )
}