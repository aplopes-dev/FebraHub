'use client';

import { LayoutGroup, motion } from 'motion/react';
import { ORDER_FULFILLMENT_OPTIONS, type OrderFulfillmentType } from '../types/order-fulfillment';

type OrderFulfillmentSwitchProps = {
  value: OrderFulfillmentType;
  onChange: (value: OrderFulfillmentType) => void;
};

/**
 * Interruptor tab Consumo local / Delivery — pill desliza com motion.
 */
export function OrderFulfillmentSwitch({
  value,
  onChange,
}: OrderFulfillmentSwitchProps) {
  return (
    <LayoutGroup id="pdv-order-fulfillment">
      <div
        role="tablist"
        aria-label="Tipo de pedido"
        className="pdv-order-fulfillment-switch"
      >
        {ORDER_FULFILLMENT_OPTIONS.map((option) => {
          const isActive = option.id === value;

          return (
            <button
              key={option.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              className="pdv-order-fulfillment-option"
              onClick={() => onChange(option.id)}
            >
              {isActive ? (
                <>
                  <motion.span
                    layoutId="pdv-order-fulfillment-thumb"
                    className="pdv-order-fulfillment-thumb"
                    transition={{ type: 'spring', stiffness: 380, damping: 34 }}
                  />
                  <motion.span
                    layoutId="pdv-order-fulfillment-accent"
                    className="pdv-order-fulfillment-accent"
                    aria-hidden
                    transition={{ type: 'spring', stiffness: 380, damping: 34 }}
                  />
                </>
              ) : null}
              <span className="pdv-order-fulfillment-label">{option.label}</span>
            </button>
          );
        })}
      </div>
    </LayoutGroup>
  );
}
