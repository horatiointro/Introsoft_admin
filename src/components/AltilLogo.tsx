import React, { useState, useEffect } from 'react';
import emblemImg from '../assets/images/altil_shield_combined_logo_1788013911530.jpg';

interface AltilLogoProps {
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'custom';
  width?: number | string;
  height?: number | string;
  showText?: boolean;
  textClassName?: string;
  subtitle?: string;
}

export const AltilLogo: React.FC<AltilLogoProps> = ({
  className = '',
  size = 'md',
  width,
  height,
  showText = false,
  textClassName = '',
  subtitle
}) => {
  const [processedSrc, setProcessedSrc] = useState<string | null>(null);

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = emblemImg;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(img, 0, 0);
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imgData.data;
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        // If pixel is white or very light background (> 205 in all channels)
        if (r > 205 && g > 205 && b > 205) {
          data[i + 3] = 0; // Transparent
        } else if (r > 175 && g > 175 && b > 175) {
          // Feather alpha for soft edges
          const avg = (r + g + b) / 3;
          const alpha = Math.max(0, 255 - (avg - 175) * (255 / 30));
          data[i + 3] = Math.min(data[i + 3], alpha);
        }
      }
      ctx.putImageData(imgData, 0, 0);
      setProcessedSrc(canvas.toDataURL('image/png'));
    };
  }, []);

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
      {processedSrc ? (
        <img
          src={processedSrc}
          alt="ALTIL Secure AI Logo"
          className={`${imgHeight} w-auto object-contain filter drop-shadow-[0_2px_8px_rgba(37,99,235,0.4)]`}
          style={width ? { width } : height ? { height } : undefined}
        />
      ) : (
        <img
          src={emblemImg}
          alt="ALTIL Secure AI Logo Loading"
          className={`${imgHeight} w-auto object-contain`}
          style={width ? { width } : height ? { height } : undefined}
        />
      )}

      {showText && (
        <div className={`flex flex-col ${textClassName}`}>
          <span className="font-bold text-xs tracking-tight text-white">ALTIL Secure AI</span>
          {subtitle && (
            <span className="text-[9px] font-mono text-[#888888] tracking-wider uppercase mt-0.5">
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
