import type { ReactNode } from 'react';

interface CardProps {
  title?: string;
  subtitle?: string;
  rightSlot?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function Card({ title, subtitle, rightSlot, children, className }: CardProps) {
  return (
    <section
      className={`bg-white border border-gray-100 rounded-2xl shadow-sm px-5 py-4 ${className ?? ''}`}
    >
      {(title || subtitle || rightSlot) && (
        <header className="flex items-start justify-between mb-3 gap-3">
          <div>
            {title && <h3 className="text-sm font-medium text-gray-900">{title}</h3>}
            {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
          </div>
          {rightSlot && <div className="shrink-0">{rightSlot}</div>}
        </header>
      )}
      {children}
    </section>
  );
}

