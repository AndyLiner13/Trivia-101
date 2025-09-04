import React from 'react';

export interface SectionHeaderProps {
  /** Section title text */
  title: string;
  
  /** Additional CSS classes - USE SPARINGLY, styling should be consistent */
  className?: string;
}

export function SectionHeader({
  title,
  className = ''
}: SectionHeaderProps) {
  
  // FIXED STYLING - All section headers use these exact values
  const FIXED_STYLES = {
    // Container styling
    padding: 'clamp(0.75rem, 4cqw, 1rem)',
    
    // Text styling
    titleSize: 'clamp(0.75rem, 4cqw, 0.875rem)',
    titleColor: 'text-gray-500',
    titleWeight: 'font-medium',
    titleTransform: 'uppercase',
    titleTracking: 'tracking-wide',
    
    // Background styling
    bg: 'bg-gray-50',
    border: 'border-b'
  };

  return (
    <div
      className={`w-full flex items-center ${FIXED_STYLES.bg} ${FIXED_STYLES.border} ${className}`}
      style={{ 
        padding: FIXED_STYLES.padding
      }}
    >
      {/* Section Title */}
      <div className="flex-1">
        <h4 
          className={`${FIXED_STYLES.titleColor} ${FIXED_STYLES.titleWeight} ${FIXED_STYLES.titleTransform} ${FIXED_STYLES.titleTracking}`}
          style={{ fontSize: FIXED_STYLES.titleSize }}
        >
          {title}
        </h4>
      </div>
    </div>
  );
}