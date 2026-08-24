'use client';

import * as React from 'react';
import { ToggleGroup as ToggleGroupPrimitive } from 'radix-ui';
import { AnimatePresence, motion, type HTMLMotionProps, type Transition } from 'motion/react';

import { cn } from '../../lib/utils';
import {
  ToggleGroup as BaseToggleGroup,
  ToggleGroupItem as BaseToggleGroupItem,
} from './toggle-group';

const TABS_GROUP_CLASS =
  'inline-flex w-full items-center gap-0 rounded-full bg-zinc-100 p-1 text-muted-foreground dark:bg-zinc-800/60';

const TABS_ITEM_CLASS =
  'relative flex-1 rounded-full border-0 bg-transparent p-0 shadow-none outline-none hover:bg-transparent focus-visible:ring-0 data-[state=on]:bg-transparent data-[state=off]:bg-transparent';

type MotionToggleGroupContextProps = {
  type?: 'single' | 'multiple';
  transition?: Transition;
  activeClassName?: string;
  groupVariant?: 'default' | 'tabs';
  globalId: string;
};

const MotionToggleGroupContext = React.createContext<MotionToggleGroupContextProps | undefined>(
  undefined,
);

function useMotionToggleGroup(): MotionToggleGroupContextProps {
  const context = React.useContext(MotionToggleGroupContext);
  if (!context) {
    throw new Error('useMotionToggleGroup must be used within a MotionToggleGroup');
  }
  return context;
}

type MotionToggleGroupProps = React.ComponentProps<typeof BaseToggleGroup> & {
  transition?: Transition;
  activeClassName?: string;
  groupVariant?: 'default' | 'tabs';
};

function MotionToggleGroup({
  className,
  variant,
  size,
  children,
  transition = { type: 'spring', bounce: 0, stiffness: 200, damping: 25 },
  activeClassName,
  groupVariant = 'default',
  ...props
}: MotionToggleGroupProps) {
  const globalId = React.useId();
  const isSingle = props.type === 'single';
  const isTabs = groupVariant === 'tabs';

  const singleProps = props as React.ComponentProps<typeof BaseToggleGroup> & {
    type: 'single';
    value?: string;
    defaultValue?: string;
    onValueChange?: (value: string) => void;
  };

  const [singleValue, setSingleValue] = React.useState<string>(
    singleProps.defaultValue ?? singleProps.value ?? '',
  );

  React.useEffect(() => {
    if (isSingle && singleProps.value !== undefined) {
      setSingleValue(singleProps.value);
    }
  }, [isSingle, singleProps.value]);

  const handleSingleValueChange = React.useCallback(
    (nextValue: string) => {
      if (!nextValue) return;
      setSingleValue(nextValue);
      singleProps.onValueChange?.(nextValue);
    },
    [singleProps.onValueChange],
  );

  const contextValue = {
    type: props.type,
    transition,
    activeClassName,
    groupVariant,
    globalId,
  };

  if (isTabs && isSingle) {
    return (
      <MotionToggleGroupContext.Provider value={contextValue}>
        <ToggleGroupPrimitive.Root
          type="single"
          className={cn('relative', TABS_GROUP_CLASS, className)}
          value={singleValue}
          onValueChange={handleSingleValueChange}
          disabled={singleProps.disabled}
          rovingFocus={singleProps.rovingFocus}
          orientation={singleProps.orientation}
          dir={singleProps.dir}
          loop={singleProps.loop}
        >
          {children}
        </ToggleGroupPrimitive.Root>
      </MotionToggleGroupContext.Provider>
    );
  }

  return (
    <MotionToggleGroupContext.Provider value={contextValue}>
      {isSingle ? (
        <BaseToggleGroup
          className={cn('relative', className)}
          variant={variant}
          size={size}
          type="single"
          value={singleValue}
          onValueChange={handleSingleValueChange}
          disabled={singleProps.disabled}
          rovingFocus={singleProps.rovingFocus}
          orientation={singleProps.orientation}
          dir={singleProps.dir}
          loop={singleProps.loop}
        >
          {children}
        </BaseToggleGroup>
      ) : (
        <BaseToggleGroup
          className={cn('relative', className)}
          variant={variant}
          size={size}
          {...(props as React.ComponentProps<typeof BaseToggleGroup>)}
        >
          {children}
        </BaseToggleGroup>
      )}
    </MotionToggleGroupContext.Provider>
  );
}

type MotionToggleGroupItemProps = React.ComponentProps<typeof BaseToggleGroupItem> & {
  children?: React.ReactNode;
  buttonProps?: HTMLMotionProps<'button'>;
  spanProps?: React.ComponentProps<'span'>;
  ref?: React.Ref<HTMLButtonElement>;
};

function MotionToggleGroupItem({
  ref,
  className,
  children,
  buttonProps,
  spanProps,
  value,
  disabled,
  ...props
}: MotionToggleGroupItemProps) {
  const { activeClassName, transition, type, groupVariant, globalId } = useMotionToggleGroup();
  const itemRef = React.useRef<HTMLButtonElement | null>(null);

  React.useImperativeHandle(ref, () => itemRef.current as HTMLButtonElement);
  const [isActive, setIsActive] = React.useState(false);

  React.useEffect(() => {
    const node = itemRef.current;
    if (!node) return;

    const observer = new MutationObserver(() => {
      setIsActive(node.getAttribute('data-state') === 'on');
    });

    observer.observe(node, {
      attributes: true,
      attributeFilter: ['data-state'],
    });
    setIsActive(node.getAttribute('data-state') === 'on');

    return () => observer.disconnect();
  }, []);

  if (groupVariant === 'tabs') {
    return (
      <ToggleGroupPrimitive.Item
        value={value}
        disabled={disabled}
        asChild
        className={cn(TABS_ITEM_CLASS, className)}
        {...props}
      >
        <motion.button
          ref={itemRef}
          data-slot="motion-toggle-group-item"
          type="button"
          initial={{ scale: 1 }}
          whileTap={{ scale: 0.98 }}
          {...buttonProps}
          className={cn(
            'relative isolate w-full overflow-hidden rounded-full bg-transparent',
            buttonProps?.className,
          )}
        >
          <AnimatePresence initial={false}>
            {isActive && type === 'single' ? (
              <motion.span
                layoutId={`active-toggle-group-item-${globalId}`}
                data-slot="active-toggle-group-item"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={transition}
                className={cn(
                  'absolute inset-0 z-0 rounded-full bg-white shadow-sm',
                  activeClassName,
                )}
              />
            ) : null}
          </AnimatePresence>

          <span
            {...spanProps}
            className={cn(
              'relative z-10 inline-flex w-full items-center justify-center gap-2 text-sm font-medium',
              isActive ? 'text-foreground' : 'text-muted-foreground',
              spanProps?.className,
            )}
          >
            {children}
          </span>
        </motion.button>
      </ToggleGroupPrimitive.Item>
    );
  }

  return (
    <BaseToggleGroupItem
      ref={itemRef}
      value={value}
      disabled={disabled}
      {...props}
      asChild
      className={cn(
        'relative border-0 bg-transparent shadow-none hover:bg-transparent data-[state=on]:bg-transparent',
        className,
      )}
    >
      <motion.button
        data-slot="toggle-group-item"
        type="button"
        initial={{ scale: 1 }}
        whileTap={{ scale: 0.9 }}
        {...buttonProps}
        className={cn('relative bg-transparent hover:bg-transparent', buttonProps?.className)}
      >
        <span
          {...spanProps}
          data-state={isActive ? 'on' : 'off'}
          className={cn('relative z-1', spanProps?.className)}
        >
          {children}
        </span>

        <AnimatePresence initial={false}>
          {isActive && type === 'single' ? (
            <motion.span
              layoutId={`active-toggle-group-item-${globalId}`}
              data-slot="active-toggle-group-item"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={transition}
              className={cn('absolute inset-0 z-0 rounded-md bg-muted', activeClassName)}
            />
          ) : null}
        </AnimatePresence>
      </motion.button>
    </BaseToggleGroupItem>
  );
}

export {
  MotionToggleGroup,
  MotionToggleGroupItem,
  type MotionToggleGroupProps,
  type MotionToggleGroupItemProps,
};
