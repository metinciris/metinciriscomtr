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
  innerClassName?: string;
  style?: React.CSSProperties;
  textColor?: string;
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
  innerClassName = '',
  style,
  textColor = 'text-white',
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
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
      }}
      whileHover={{ scale: 1.05, y: -8 }}
      whileTap={{ scale: 0.98 }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 20,
        duration: 0.3
      }}
      className={`${sizeClasses[size]} ${color} ${className} rounded-2xl cursor-pointer overflow-hidden relative group shadow-lg hover:shadow-2xl dark:shadow-black/50 dark:hover:shadow-black/70 transition-shadow duration-300`}
      onClick={onClick}
      style={style}
    >
      {/* Glassmorphism overlay - optimized for dark mode */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent dark:from-white/5 dark:to-black/20 pointer-events-none z-[1]" />

      {/* Glow effect on hover - adjusted for dark mode */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none z-[2]">
        <div className="absolute inset-0 bg-gradient-to-t from-white/20 via-transparent to-transparent dark:from-white/10 dark:via-transparent dark:to-transparent" />
      </div>

      <div className={`w-full h-full p-6 flex flex-col justify-between relative z-10 ${innerClassName}`}>
        <div className="flex-1 flex items-center justify-between">
          <div className="flex flex-col justify-between h-full">
            {icon && <div className={`${textColor} opacity-90 mb-auto transition-transform duration-300 group-hover:scale-110`}>{icon}</div>}
          </div>
          {children}
        </div>
        <div>
          <div>
            <h3 className={`${textColor} m-0 font-semibold transition-transform duration-300 group-hover:translate-x-1`}>{title}</h3>
            {subtitle && <p className={`${textColor}/80 mt-1 m-0 text-sm transition-all duration-300 group-hover:translate-x-1`}>{subtitle}</p>}
          </div>
        </div>
      </div>

      {/* Subtle hover overlay */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300 z-[3]" />
    </motion.div>
  );
}
