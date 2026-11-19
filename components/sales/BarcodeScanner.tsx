import React, { useRef, useEffect, useState } from 'react';

// BarcodeDetector might not be in the default TS DOM libs
declare global {
  interface Window {
    BarcodeDetector: any;
  }
}

interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
  onClose: () => void;
}

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ onScan, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    let animationFrameId: number;

    const startScan = async () => {
      if (!('BarcodeDetector' in window)) {
        setError('Barcode Detector API is not supported in this browser.');
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
        });
        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        const barcodeDetector = new window.BarcodeDetector({
          formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_39', 'code_128', 'qr_code'],
        });

        const detect = async () => {
          if (videoRef.current && barcodeDetector && videoRef.current.readyState >= 2) {
            try {
              const barcodes = await barcodeDetector.detect(videoRef.current);
              if (barcodes.length > 0) {
                onScan(barcodes[0].rawValue);
              } else {
                animationFrameId = requestAnimationFrame(detect);
              }
            } catch (e) {
              console.error('Barcode detection failed:', e);
              animationFrameId = requestAnimationFrame(detect);
            }
          } else {
             animationFrameId = requestAnimationFrame(detect);
          }
        };
        detect();

      } catch (err) {
        console.error('Camera access error:', err);
        setError('Could not access the camera. Please grant permission.');
      }
    };

    startScan();

    return () => {
      cancelAnimationFrame(animationFrameId);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [onScan]);

  return (
    <div className="fixed inset-0 bg-black z-[60] flex flex-col items-center justify-center" onClick={onClose}>
      <div className="relative w-full max-w-lg h-auto" onClick={e => e.stopPropagation()}>
        <video ref={videoRef} className="w-full h-full rounded-lg" playsInline />
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-4/5 h-1/3 border-2 border-red-500 rounded-lg shadow-lg" style={{ boxShadow: '0 0 0 9999px rgba(0,0,0,0.5)' }}></div>
            <div className="absolute w-4/5 h-px bg-red-500 animate-scan"></div>
        </div>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 bg-white/20 text-white rounded-full p-2 leading-none text-2xl"
          aria-label="Close scanner"
        >
          &times;
        </button>
      </div>
      {error && <p className="mt-4 text-white bg-red-500 p-2 rounded">{error}</p>}
      <style>{`
        @keyframes scan-animation {
          0% { top: 33.33%; }
          100% { top: 66.67%; }
        }
        .animate-scan {
          animation: scan-animation 2.5s ease-in-out infinite alternate;
        }
      `}</style>
    </div>
  );
};

export default BarcodeScanner;
