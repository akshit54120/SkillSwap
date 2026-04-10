import React from 'react';
import { Award } from 'lucide-react';

const MentorBadge = ({ credits, size = 16, showLabel = true, style = {} }) => {
  if (credits === undefined || credits === null || credits < 20) return null;

  let config = {
    label: 'Bronze Mentor',
    color: '#CD7F32', // Bronze
    bgColor: 'rgba(205, 127, 50, 0.1)',
    description: 'Earned for reaching 20+ credits'
  };

  if (credits >= 100) {
    config = {
      label: 'Gold Mentor',
      color: '#FFD700', // Gold
      bgColor: 'rgba(255, 215, 0, 0.15)',
      description: 'Earned for reaching 100+ credits',
      className: 'badge-gold-pulse'
    };
  } else if (credits >= 50) {
    config = {
      label: 'Silver Mentor',
      color: '#C0C0C0', // Silver
      bgColor: 'rgba(192, 192, 192, 0.1)',
      description: 'Earned for reaching 50+ credits'
    };
  }

  return (
    <>
      <style>
        {`
          .badge-gold-pulse {
            animation: gold-pulse 2s infinite;
          }
          @keyframes gold-pulse {
            0% { transform: scale(1); filter: drop-shadow(0 0 0 rgba(255, 215, 0, 0)); }
            50% { transform: scale(1.05); filter: drop-shadow(0 0 8px rgba(255, 215, 0, 0.5)); }
            100% { transform: scale(1); filter: drop-shadow(0 0 0 rgba(255, 215, 0, 0)); }
          }
          .mentor-badge-container {
            position: relative;
            display: inline-flex;
            align-items: center;
          }
          .mentor-badge-tooltip {
            visibility: hidden;
            background-color: var(--color-surface);
            color: var(--color-text-primary);
            text-align: center;
            border-radius: 6px;
            padding: 5px 10px;
            position: absolute;
            z-index: 100;
            bottom: 125%;
            left: 50%;
            transform: translateX(-50%);
            opacity: 0;
            transition: opacity 0.3s;
            font-size: 0.75rem;
            white-space: nowrap;
            box-shadow: var(--shadow-md);
            border: 1px solid var(--color-border);
          }
          .mentor-badge-container:hover .mentor-badge-tooltip {
            visibility: visible;
            opacity: 1;
          }
        `}
      </style>
      <div className="mentor-badge-container" style={style}>
        <span 
          className={config.className || ''}
          style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '0.25rem', 
            fontSize: size === 16 ? '0.75rem' : '0.85rem', 
            backgroundColor: config.bgColor, 
            color: config.color, 
            padding: showLabel ? '0.2rem 0.6rem' : '0.2rem', 
            borderRadius: '1rem', 
            fontWeight: 700,
            border: `1px solid ${config.color}33`,
            transition: 'all 0.3s ease'
          }}
        >
          <Award size={size} />
          {showLabel && config.label}
        </span>
        <div className="mentor-badge-tooltip">
          {config.description}
        </div>
      </div>
    </>
  );
};

export default MentorBadge;
