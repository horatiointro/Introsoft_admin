import React from 'react';
import emblemImg from '../assets/images/altil_shield_combined_logo_1788013911530.jpg';

interface AltilLogoProps {
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'custom';
  width?: number | string;
  height?: number | string;
  showText?: boolean;
  showTagline?: boolean;
  textClassName?: string;
  subtitle?: string;
}

export const AltilLogo: React.FC<AltilLogoProps> = ({
  className = '',
  size = 'md',
  width,
  height,
  showText = false,
  showTagline = false,
  textClassName = '',
  subtitle
}) => {
  const heightMap = {
    xs: 'h-6',
    sm: 'h-8',
    md: 'h-10',
    lg: 'h-12',
    xl: 'h-16',
    custom: 'h-10'
  };

  const imgHeight = heightMap[size] || 'h-10';

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      <img
        src={emblemImg}
        alt="ALTIL Secure AI Logo"
        className={`${imgHeight} w-auto object-contain rounded-lg filter drop-shadow-[0_2px_8px_rgba(37,99,235,0.4)]`}
        style={width ? { width } : height ? { height } : undefined}
      />

      {(showText || showTagline) && (
        <div className={`flex flex-col ${textClassName}`}>
          <span className="font-bold text-xs tracking-tight text-white">ALTIL Secure AI</span>
          {(subtitle || showTagline) && (
            <span className="text-[9px] font-mono text-[#888888] tracking-wider uppercase mt-0.5">
              {subtitle || 'Powered by Introsoft International'}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
