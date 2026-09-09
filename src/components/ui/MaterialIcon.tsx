import React from 'react';

export interface MaterialIconProps {
  name: string;
  className?: string;
  fill?: boolean;
  weight?: 100 | 200 | 300 | 400 | 500 | 600 | 700;
  grade?: -25 | 0 | 200;
  opticalSize?: 20 | 24 | 40 | 48;
  size?: number | string;
  style?: React.CSSProperties;
}

export const MaterialIcon: React.FC<MaterialIconProps> = ({
  name,
  className = '',
  fill = false,
  weight,
  grade,
  opticalSize,
  size,
  style,
}) => {
  const fontVariation = [
    fill ? `'FILL' 1` : `'FILL' 0`,
    weight ? `'wght' ${weight}` : null,
    grade ? `'GRAD' ${grade}` : null,
    opticalSize ? `'opsz' ${opticalSize}` : null,
  ]
    .filter(Boolean)
    .join(', ');

  const inlineStyle: React.CSSProperties = {
    ...(fontVariation ? { fontVariationSettings: fontVariation } : {}),
    ...(size !== undefined
      ? { fontSize: typeof size === 'number' ? `${size}px` : size }
      : {}),
    ...style,
  };

  return (
    <span
      className={`material-symbols-outlined select-none inline-flex items-center justify-center leading-none shrink-0 ${className}`}
      style={inlineStyle}
      aria-hidden="true"
    >
      {name}
    </span>
  );
};

// Brand icons styled consistently with Material Symbols 24px grid
export const GithubIcon: React.FC<{ className?: string; size?: number }> = ({
  className = 'w-4 h-4',
  size,
}) => (
  <svg
    viewBox="0 0 24 24"
    width={size || '1em'}
    height={size || '1em'}
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`inline-block shrink-0 ${className}`}
    aria-hidden="true"
  >
    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
  </svg>
);

export const LinkedinIcon: React.FC<{ className?: string; size?: number }> = ({
  className = 'w-4 h-4',
  size,
}) => (
  <svg
    viewBox="0 0 24 24"
    width={size || '1em'}
    height={size || '1em'}
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`inline-block shrink-0 ${className}`}
    aria-hidden="true"
  >
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect x="2" y="9" width="4" height="12" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);
