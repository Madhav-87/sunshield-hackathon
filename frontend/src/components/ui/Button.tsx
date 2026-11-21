import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { buttonStyles } from './buttonStyles';
import type { ButtonVariant } from './buttonStyles';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  children: ReactNode;
}

export function Button({ variant = 'primary', className = '', children, ...props }: ButtonProps) {
  return (
    <button className={`${buttonStyles(variant)} ${className}`} {...props}>
      {children}
    </button>
  );
}

interface ButtonLinkProps {
  href: string;
  variant?: ButtonVariant;
  children: ReactNode;
  className?: string;
}

export function ButtonLink({
  href,
  variant = 'primary',
  children,
  className = '',
}: ButtonLinkProps) {
  return (
    <a className={`${buttonStyles(variant)} no-underline ${className}`} href={href}>
      {children}
    </a>
  );
}
