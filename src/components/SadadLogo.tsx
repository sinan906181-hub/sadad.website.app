import React from 'react';
import sadadOriginalPhoto from '../assets/images/sadad_logo_1784862732263.jpg';

export interface SadadLogoProps {
  className?: string;
  size?: number | string;
  alt?: string;
  rounded?: boolean;
  src?: string;
}

export const SadadLogo: React.FC<SadadLogoProps> = ({
  className = 'w-full h-full',
  size,
  alt = 'SADAD Class Union Emblem Logo',
  rounded = true,
  src,
}) => {
  return (
    <div
      className={`relative inline-flex items-center justify-center overflow-hidden bg-white ${rounded ? 'rounded-full' : 'rounded-xl'} shadow-sm ${className}`}
      style={size ? { width: size, height: size } : undefined}
    >
      <img
        src={src || sadadOriginalPhoto}
        alt={alt}
        className="w-full h-full object-contain p-0.5 transition-transform duration-300 hover:scale-105"
      />
    </div>
  );
};







