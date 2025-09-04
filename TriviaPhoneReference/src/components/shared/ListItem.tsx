import React from 'react';
import { LucideIcon } from 'lucide-react';

export interface ListItemProps {
  /** Left side content - can be an emoji string or icon component */
  leftContent: string | React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  
  /** Main title/name text */
  title: string;
  
  /** Optional subtitle/description text */
  subtitle?: string;
  
  /** Right side content - can be an emoji string, icon component, or custom element */
  rightContent?: string | React.ComponentType<{ className?: string; style?: React.CSSProperties }> | React.ReactNode;
  
  /** Click handler for the entire item */
  onClick?: () => void;
  
  /** Click handler specifically for the right content (e.g., for favoriting) */
  onRightClick?: (e: React.MouseEvent) => void;
  
  /** Whether this item is unread/highlighted */
  isUnread?: boolean;
  
  /** Whether this item is selected/active */
  isSelected?: boolean;
  
  /** Additional CSS classes - USE SPARINGLY, styling should be consistent */
  className?: string;
}

export function ListItem({
  leftContent,
  title,
  subtitle,
  rightContent,
  onClick,
  onRightClick,
  isUnread = false,
  isSelected = false,
  className = ''
}: ListItemProps) {
  
  // FIXED STYLING - All instances use these exact values
  const FIXED_STYLES = {
    // Container styling
    padding: 'clamp(1rem, 5cqw, 1.5rem)',
    gap: 'clamp(0.75rem, 4cqw, 1rem)',
    
    // Left content styling
    leftSize: 'clamp(3rem, 12cqw, 4rem)',
    leftIconSize: 'clamp(1.5rem, 6cqw, 2rem)',
    leftBg: 'bg-blue-500',
    leftBorderRadius: 'rounded-xl',
    leftTextColor: 'text-white',
    
    // Text styling
    titleSize: 'clamp(1rem, 5cqw, 1.25rem)',
    titleWeight: '',  // Uses default from globals.css
    subtitleSize: 'clamp(0.875rem, 4cqw, 1rem)',
    subtitleColor: 'text-gray-600',
    subtitleWeight: '',  // Uses default from globals.css
    titleSubtitleGap: 'clamp(0.125rem, 1cqw, 0.25rem)',
    
    // Right content styling
    rightIconSize: 'clamp(1.25rem, 6cqw, 1.5rem)',
    rightPadding: 'clamp(0.5rem, 3cqw, 0.75rem)',
    rightIconColor: 'text-gray-400',
    
    // Background styling
    bgDefault: 'bg-white',
    bgHover: 'hover:bg-gray-50',
    bgUnread: 'bg-blue-50',
    bgSelected: 'bg-gray-100'
  };
  
  const renderLeftContent = () => {
    const leftStyle = {
      width: FIXED_STYLES.leftSize,
      height: FIXED_STYLES.leftSize,
      fontSize: FIXED_STYLES.leftIconSize
    };

    if (typeof leftContent === 'string') {
      // It's an emoji or text
      return (
        <div 
          className={`${FIXED_STYLES.leftBg} ${FIXED_STYLES.leftBorderRadius} ${FIXED_STYLES.leftTextColor} flex items-center justify-center flex-shrink-0`} 
          style={leftStyle}
        >
          {leftContent}
        </div>
      );
    } else {
      // It's an icon component
      const IconComponent = leftContent as React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
      return (
        <div 
          className={`${FIXED_STYLES.leftBg} ${FIXED_STYLES.leftBorderRadius} flex items-center justify-center flex-shrink-0`} 
          style={leftStyle}
        >
          <IconComponent 
            className={FIXED_STYLES.leftTextColor}
            style={{ 
              width: FIXED_STYLES.leftIconSize, 
              height: FIXED_STYLES.leftIconSize 
            }} 
          />
        </div>
      );
    }
  };

  const renderRightContent = () => {
    if (!rightContent) return null;

    if (typeof rightContent === 'string') {
      // It's an emoji or text
      return (
        <div 
          className="flex items-center justify-center"
          style={{ 
            fontSize: FIXED_STYLES.rightIconSize,
            padding: FIXED_STYLES.rightPadding
          }}
        >
          {rightContent}
        </div>
      );
    } else if (React.isValidElement(rightContent)) {
      // It's already a React element
      return rightContent;
    } else {
      // It's an icon component
      const IconComponent = rightContent as React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
      return (
        <div 
          className="flex items-center justify-center"
          style={{ padding: FIXED_STYLES.rightPadding }}
        >
          <IconComponent 
            className={FIXED_STYLES.rightIconColor}
            style={{ 
              width: FIXED_STYLES.rightIconSize, 
              height: FIXED_STYLES.rightIconSize 
            }} 
          />
        </div>
      );
    }
  };

  // Fixed background styling based on state
  let backgroundClasses = FIXED_STYLES.bgDefault;
  if (isUnread) backgroundClasses = FIXED_STYLES.bgUnread;
  if (isSelected) backgroundClasses = FIXED_STYLES.bgSelected;

  const interactiveClasses = onClick ? `cursor-pointer ${FIXED_STYLES.bgHover}` : '';
  const baseClasses = `w-full flex items-center text-left ${className}`;
  
  return (
    <button
      className={`${baseClasses} ${interactiveClasses} ${backgroundClasses}`}
      style={{ 
        padding: FIXED_STYLES.padding,
        gap: FIXED_STYLES.gap
      }}
      onClick={onClick}
      disabled={!onClick}
    >
      {/* Left Content */}
      {renderLeftContent()}

      {/* Main Content */}
      <div className="flex-1 min-w-0">
        <div style={{ 
          marginBottom: subtitle ? FIXED_STYLES.titleSubtitleGap : '0'
        }}>
          <h3 
            className={`truncate ${isUnread ? 'font-medium' : ''} ${FIXED_STYLES.titleWeight}`}
            style={{ fontSize: FIXED_STYLES.titleSize }}
          >
            {title}
          </h3>
        </div>
        {subtitle && (
          <p 
            className={`${FIXED_STYLES.subtitleColor} truncate ${isUnread ? 'font-medium' : ''} ${FIXED_STYLES.subtitleWeight}`}
            style={{ fontSize: FIXED_STYLES.subtitleSize }}
          >
            {subtitle}
          </p>
        )}
      </div>

      {/* Right Content */}
      {rightContent && (
        <div 
          className="flex items-center"
          onClick={onRightClick}
        >
          {renderRightContent()}
        </div>
      )}
    </button>
  );
}