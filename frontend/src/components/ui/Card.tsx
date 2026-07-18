import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean;
}

export function Card({ className = '', hoverable = false, children, ...props }: CardProps) {
  const Component = hoverable ? motion.div : 'div';
  const hoverProps: any = hoverable ? {
    whileHover: { y: -2, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01)' },
    transition: { type: 'spring', stiffness: 300, damping: 20 }
  } : {};

  return (
    <Component
      className={`bg-card border border-border rounded-xl shadow-sm overflow-hidden ${className}`}
      {...hoverProps}
      {...(hoverable ? (props as HTMLMotionProps<"div">) : props)}
    >
      {children}
    </Component>
  );
}

export function CardHeader({ className = '', children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={`px-6 py-4 border-b border-border/50 flex items-center justify-between ${className}`} {...props}>{children}</div>;
}

export function CardTitle({ className = '', children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={`text-lg font-semibold tracking-tight text-foreground ${className}`} {...props}>{children}</h3>;
}

export function CardContent({ className = '', children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={`p-6 ${className}`} {...props}>{children}</div>;
}
