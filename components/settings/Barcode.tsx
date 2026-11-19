
import React from 'react';
import ProductQrCode from '../inventory/ProductQrCode';

interface BarcodeProps {
  value: string;
  size?: number;
}

const Barcode: React.FC<BarcodeProps> = ({ value, size = 60 }) => {
  if (!value) {
    return null;
  }

  return (
    <ProductQrCode 
      value={value} 
      size={size} 
      alt={`QR Code for ${value}`} 
    />
  );
};

export default Barcode;

