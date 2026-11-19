import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';

interface ProductQrCodeProps {
  value: string;
  size?: number;
  className?: string;
  alt?: string;
  onClick?: () => void;
  title?: string;
  margin?: number;
}

export const ProductQrCode: React.FC<ProductQrCodeProps> = ({
  value,
  size = 64,
  className = '',
  alt,
  onClick,
  title,
  margin = 1
}) => {
  const [dataUrl, setDataUrl] = useState<string>('');

  useEffect(() => {
    let isMounted = true;
    if (!value) {
      setDataUrl('');
      return;
    }

    QRCode.toDataURL(value, {
      width: size * 2, // 2x for sharp retina/high-DPI display
      margin,
      color: {
        dark: '#000000',
        light: '#ffffff'
      },
      errorCorrectionLevel: 'M'
    })
      .then((url) => {
        if (isMounted) {
          setDataUrl(url);
        }
      })
      .catch((err) => {
        console.error('Failed to generate local QR code, falling back to QR service', err);
        if (isMounted) {
          setDataUrl(`https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(value)}&size=${size * 2}x${size * 2}&margin=${margin}`);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [value, size, margin]);

  if (!value) {
    return (
      <div 
        className={`inline-flex items-center justify-center bg-gray-100 dark:bg-gray-800 text-gray-400 text-xs rounded border border-gray-200 dark:border-gray-700 ${className}`}
        style={{ width: size, height: size }}
      >
        <span className="text-[10px] font-mono">N/A</span>
      </div>
    );
  }

  return (
    <div 
      className={`inline-block select-none ${onClick ? 'cursor-pointer transition-transform hover:scale-105 active:scale-95' : ''} ${className}`}
      onClick={onClick}
      title={title || `QR: ${value}`}
    >
      {dataUrl ? (
        <img
          src={dataUrl}
          alt={alt || `QR Code for ${value}`}
          width={size}
          height={size}
          className="rounded border border-gray-200 dark:border-gray-700 bg-white p-0.5 object-contain shadow-xs"
          loading="lazy"
        />
      ) : (
        <div 
          className="animate-pulse bg-gray-200 dark:bg-gray-700 rounded" 
          style={{ width: size, height: size }} 
        />
      )}
    </div>
  );
};

export default ProductQrCode;
