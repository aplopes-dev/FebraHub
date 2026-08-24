'use client';

import { LayoutGroup, motion } from 'motion/react';
import { cn } from '@citybox/ui';

export type PosTabOption<T extends string> = {
  id: T;
  label: string;
};

type PosTabsProps<T extends string> = {
  options: readonly PosTabOption<T>[];
  value: T;
  onChange: (value: T) => void;
  layoutGroupId: string;
  className?: string;
};

export function PosTabs<T extends string>({
  options,
  value,
  onChange,
  layoutGroupId,
  className,
}: PosTabsProps<T>) {
  return (
    <LayoutGroup id={layoutGroupId}>
      <div
        role="tablist"
        className={cn('pdv-order-fulfillment-switch', className)}
        style={{ display: 'inline-flex', width: 'auto' }}
      >
        {options.map((option) => {
          const isActive = option.id === value;
          return (
            <button
              key={option.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              className="pdv-order-fulfillment-option"
              style={{ paddingLeft: '24px', paddingRight: '24px' }}
              onClick={() => onChange(option.id)}
            >
              {isActive ? (
                <>
                  <motion.span
                    layoutId={`${layoutGroupId}-thumb`}
                    className="pdv-order-fulfillment-thumb"
                    transition={{
                      type: 'spring',
                      stiffness: 380,
                      damping: 34,
                    }}
                  />
                  <motion.span
                    layoutId={`${layoutGroupId}-accent`}
                    className="pdv-order-fulfillment-accent"
                    aria-hidden
                    transition={{
                      type: 'spring',
                      stiffness: 380,
                      damping: 34,
                    }}
                  />
                </>
              ) : null}
              <span className="pdv-order-fulfillment-label">
                {option.label}
              </span>
            </button>
          );
        })}
      </div>
    </LayoutGroup>
  );
}
