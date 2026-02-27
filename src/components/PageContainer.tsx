import React from 'react';

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
}

export function PageContainer({ children, className = '' }: PageContainerProps) {
  return (
    <div
      className={`container mx-auto px-4 py-8 max-w-none transition-colors duration-300 animate-fade-in ${className}`}
    >
      {children}
    </div>
  );
}
