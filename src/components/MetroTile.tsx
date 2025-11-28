import React from 'react';
import { motion } from 'motion/react';

interface MetroTileProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  color: string;
  size?: 'small' | 'medium' | 'large' | 'wide' | 'tall';
  onClick?: () => void;
  className?: string;
  children?: React.ReactNode;
}

export function MetroTile({
  title,
  subtitle,
  icon,
  color,
  size = 'medium',
  onClick,
  className = '',
  children,
}: MetroTileProps) {
  const sizeClasses = {
    small: 'col-span-1 row-span-1 h-32',
    medium: 'col-span-1 row-span-1 h-40',
    large: 'col-span-2 row-span-2 h-80',
    wide: 'col-span-2 row-span-1 h-40',
    tall: 'col-span-1 row-span-2 h-80',
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`${sizeClasses[size]} ${color} ${className} rounded-none cursor-pointer overflow-hidden relative group`}
      onClick={onClick}
    >
      <div className="w-full h-full p-6 flex flex-col justify-between relative z-10">
        <div className="flex-1 flex items-start justify-between">
          <div className="flex flex-col justify-between h-full">
            {icon && <div className="text-white/90 mb-auto">{icon}</div>}
          </div>
          {children}
        </div>
        <div>
          <h3 className="text-white m-0">{title}</h3>
          {subtitle && <p className="text-white/80 mt-1 m-0">{subtitle}</p>}
        </div>
      </div>
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
    </motion.div>
  );
}
