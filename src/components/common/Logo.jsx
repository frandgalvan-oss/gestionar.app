import React from 'react'

const Logo = ({ size = 'md', className = '' }) => {
  const sizes = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-3xl'
  }

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      {/* Icono */}
      <div className="w-6 h-6 bg-neutral-950 rounded-[6px] flex items-center justify-center flex-shrink-0">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M2 12L7 2L12 12" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M4 8.5H10" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
        </svg>
      </div>
      {/* Wordmark */}
      <span className={`${sizes[size]} font-semibold tracking-tight text-neutral-950`}>
        gestionar
      </span>
    </div>
  )
}

export default Logo
