import React from 'react';
import { motion } from 'motion/react';

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
}

export function PageContainer({ children, className = '' }: PageContainerProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className={`container mx-auto px-4 py-8 max-w-none transition-colors duration-300 ${className}`}
    >
      {children}
    </motion.div>
  );
}
