import React from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface LogoProps {
  className?: string;
  showText?: boolean;
  textColorClass?: string;
  textSizeClass?: string;
}

export const Logo: React.FC<LogoProps> = ({ 
  className = "h-12 w-auto", 
  showText = true,
  textColorClass = "text-text-primary dark:text-dark-text-primary",
  textSizeClass = "text-[11px] sm:text-[12px] font-extrabold tracking-[0.16em]"
}) => {
  return (
    <div className={`flex flex-row items-center justify-center gap-2.5 ${className}`}>
      <svg 
        id="modern-house-logo-svg"
        viewBox="0 0 400 360" 
        className="h-full w-auto aspect-[10/9]"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Golden Pyramid */}
        {/* Left Face - Light Gold */}
        <polygon 
          points="200,30 70,250 200,250" 
          fill="#dfb175" 
          stroke="#dfb175"
          strokeWidth="1"
        />
        {/* Right Face - Dark Gold (Shadow Side) */}
        <polygon 
          points="200,30 200,250 330,250" 
          fill="#bc955d" 
          stroke="#bc955d"
          strokeWidth="1"
        />

        {/* Highlight/Divider Line */}
        <line 
          x1="200" y1="30" 
          x2="200" y2="250" 
          stroke="#a47d47" 
          strokeWidth="2" 
          opacity="0.2"
        />

        {/* 3D Base Shadow under Pyramid */}
        <polygon 
          points="70,251 200,251 330,251 200,254" 
          fill="#3e2d14" 
          opacity="0.3"
        />

        {/* Stylized MH Letters group */}
        <g>
          {/* Stylized M with clean white fill and thick black outline */}
          <path 
            d="M 132,215 L 132,142 L 158,170 L 184,142 L 184,215 L 172,215 L 172,168 L 158,182 L 144,168 L 144,215 Z"
            fill="#ffffff"
            stroke="#111111"
            strokeWidth="5"
            strokeLinejoin="miter"
          />

          {/* Stylized H (connected house, crossbar, and right leg) */}
          <path 
            d="M 196,215 L 196,155 L 210,135 L 224,155 L 224,185 L 238,185 L 238,142 L 250,142 L 250,215 L 238,215 L 238,197 L 224,197 L 224,215 Z"
            fill="#ffffff"
            stroke="#111111"
            strokeWidth="5"
            strokeLinejoin="miter"
          />

          {/* 4-paned window inside H's house leg */}
          <rect 
            x="203" 
            y="160" 
            width="14" 
            height="14" 
            fill="#ffffff" 
            stroke="#111111" 
            strokeWidth="2.5" 
          />
          {/* Inner divider cross of the window */}
          <line x1="210" y1="160" x2="210" y2="174" stroke="#111111" strokeWidth="1.5" />
          <line x1="203" y1="167" x2="217" y2="167" stroke="#111111" strokeWidth="1.5" />
        </g>
      </svg>
      <AnimatePresence mode="wait">
        {showText && (
          <motion.span 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.3 }}
            className={`${textSizeClass} uppercase whitespace-nowrap ${textColorClass}`}
          >
            Modern House
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Logo;
