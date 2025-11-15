import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

type ButtonProps = {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
} & HTMLMotionProps<'button'>;


const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  children,
  className,
  ...props
}) => {
  const baseClasses = 'font-bold rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-iaev-background transition-all duration-200 ease-in-out inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed';

  const variantClasses = {
    primary: 'bg-iaev-blue-dark text-white hover:bg-iaev-blue-darker focus:ring-iaev-blue',
    secondary: 'bg-slate-200/70 text-iaev-text-primary hover:bg-slate-300/70 focus:ring-iaev-text-secondary',
    danger: 'bg-iaev-red-dark text-white hover:bg-red-700 focus:ring-iaev-red-dark',
  };

  const sizeClasses = {
    sm: 'py-1.5 px-3 text-sm',
    md: 'py-2 px-4 text-base',
    lg: 'py-3 px-6 text-lg',
  };

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {children}
    </motion.button>
  );
};

export default Button;