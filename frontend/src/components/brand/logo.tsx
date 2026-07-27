import { cn } from '@/lib/utils';

export const APP_NAME = 'Progrexa';

/**
 * Marca "P" de Progrexa con el degradado verde → azul.
 * (Aproximación en SVG; reemplazable por el PNG oficial si se desea.)
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} role="img" aria-label="Progrexa">
      <defs>
        <linearGradient id="progrexa-p" x1="0.15" y1="0" x2="0.5" y2="1">
          <stop offset="0" stopColor="#3fc46b" />
          <stop offset="0.5" stopColor="#12a3b6" />
          <stop offset="1" stopColor="#1b46b8" />
        </linearGradient>
      </defs>
      {/* Stem de la P con base tipo cinta */}
      <path
        d="M30 10 H44 V78 L37 72 L30 78 Z"
        fill="url(#progrexa-p)"
      />
      {/* Bowl de la P */}
      <path
        d="M44 10 H60 A24 24 0 0 1 60 58 H44 V44 H58 A10 10 0 0 0 58 24 H44 Z"
        fill="url(#progrexa-p)"
      />
    </svg>
  );
}

interface LogoProps {
  className?: string;
  markClassName?: string;
  textClassName?: string;
  showText?: boolean;
}

/** Logo completo: marca + palabra "Progrexa". */
export function Logo({ className, markClassName, textClassName, showText = true }: LogoProps) {
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <LogoMark className={cn('h-8 w-8', markClassName)} />
      {showText && (
        <span className={cn('text-xl font-extrabold tracking-tight', textClassName)}>
          {APP_NAME}
        </span>
      )}
    </span>
  );
}
