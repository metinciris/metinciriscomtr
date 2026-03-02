import React from 'react';

interface MetroTileProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  color: string;
  size?: 'small' | 'medium' | 'large' | 'wide' | 'tall';
  onClick?: () => void;
  className?: string;
  children?: React.ReactNode;
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
    <div
      className={`${sizeClasses[size]} ${color} ${className} rounded-2xl cursor-pointer overflow-hidden relative group shadow-lg hover:shadow-2xl hover:-translate-y-2 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300`}
      onClick={onClick}
      style={style}
    >
      {/* Glassmorphism overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none z-[1]" />

      <div className="w-full h-full p-6 flex flex-col justify-between relative z-10">
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
    </div>
  );
}
