import React from 'react';

const LogoIcon = ({ isDark }) => {
  return (
    <svg width="36" height="36" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="gradOrangePink" x1="20" y1="80" x2="60" y2="20" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#f43f5e" />
        </linearGradient>
        <linearGradient id="gradBlueCyan" x1="40" y1="80" x2="80" y2="20" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={isDark ? "#2563eb" : "#1d4ed8"} />
          <stop offset="100%" stopColor="#38bdf8" />
        </linearGradient>
      </defs>
      
      <g transform="translate(0, 5)">
        <path 
          d="M 25 70 L 60 35" 
          stroke="url(#gradOrangePink)" 
          strokeWidth="26" 
          strokeLinecap="round" 
        />
        <path 
          d="M 50 70 L 85 35" 
          stroke="url(#gradBlueCyan)" 
          strokeWidth="26" 
          strokeLinecap="round" 
          style={{ mixBlendMode: isDark ? 'screen' : 'multiply', opacity: 0.9 }}
        />
      </g>
    </svg>
  );
};

export default LogoIcon;
