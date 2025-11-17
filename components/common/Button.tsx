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
  const baseClasses = 'font-bold rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background dark:focus:ring-offset-dark-background transition-all duration-200 ease-in-out inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed';

  const variantClasses = {
    primary: 'bg-primary text-primary-text hover:bg-primary-hover focus:ring-primary dark:bg-dark-primary dark:text-dark-primary-text dark:hover:bg-dark-primary-hover dark:focus:ring-dark-primary',
    secondary: 'bg-surface-secondary text-text-primary hover:bg-border-color focus:ring-primary dark:bg-dark-surface-secondary dark:text-dark-text-primary dark:hover:bg-dark-border-color dark:focus:ring-dark-primary',
    danger: 'bg-accent-red text-white hover:bg-accent-red-light focus:ring-accent-red dark:bg-dark-accent-red dark:hover:bg-dark-accent-red-light dark:focus:ring-dark-accent-red',
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
