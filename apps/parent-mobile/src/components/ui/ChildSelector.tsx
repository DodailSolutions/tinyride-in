import React from 'react';
import { CORE_COLOURS, RADIUS_TOKENS } from '@tinyride/design-system';

export interface ChildItem {
  id: string;
  name: string;
  grade?: string;
  schoolName?: string;
  avatarUrl?: string;
}

export interface ChildSelectorProps {
  childrenList: ChildItem[];
  selectedId: string;
  onSelect: (id: string) => void;
  style?: React.CSSProperties;
}

export const ChildSelector: React.FC<ChildSelectorProps> = ({
  childrenList,
  selectedId,
  onSelect,
  style,
}) => {
  return (
    <div
      role="tablist"
      aria-label="Select Child"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '3px',
        backgroundColor: '#E2E8F0',
        borderRadius: RADIUS_TOKENS.md,
        gap: '4px',
        maxWidth: '100%',
        overflowX: 'auto',
        ...style,
      }}
    >
      {childrenList.map((child) => {
        const isSelected = child.id === selectedId;
        return (
          <button
            key={child.id}
            role="tab"
            aria-selected={isSelected}
            onClick={() => onSelect(child.id)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              fontSize: '13px',
              fontWeight: isSelected ? 600 : 500,
              color: isSelected ? '#0F172A' : '#475569',
              backgroundColor: isSelected ? '#FFFFFF' : 'transparent',
              borderRadius: RADIUS_TOKENS.sm,
              border: 'none',
              boxShadow: isSelected ? '0 1px 2px rgba(15, 23, 42, 0.08)' : 'none',
              cursor: 'pointer',
              transition: 'all 0.15s ease-in-out',
              whiteSpace: 'nowrap',
            }}
          >
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                backgroundColor: isSelected ? CORE_COLOURS.tinyRideGreen : '#94A3B8',
              }}
            />
            {child.name}
          </button>
        );
      })}
    </div>
  );
};
