import * as React from 'react';
import { type GroupBase, type MenuListProps } from 'react-select';
import cx from 'classnames';
import { Scrollable } from '@showdex/components/ui';
import { type DropdownOption } from './Dropdown';
import { type SelectProps } from './SelectContainer';
import styles from './Dropdown.module.scss';

export type SelectMenuListProps<
  Option extends DropdownOption,
  Multi extends boolean,
  Group extends GroupBase<Option>,
> = Modify<MenuListProps<Option, Multi, Group>, {
  innerProps?: Omit<JSX.IntrinsicElements['div'], 'ref'>;
  selectProps?: SelectProps<Option, Multi, Group>;
}>;

/* eslint-disable @typescript-eslint/indent */

export const SelectMenuList = <
  Option extends DropdownOption,
  Multi extends boolean,
  Group extends GroupBase<Option>,
>({
  innerRef,
  className,
  maxHeight,
  isMulti,
  innerProps,
  selectProps: {
    scrollState,
  } = {},
  children,
}: SelectMenuListProps<Option, Multi, Group>): JSX.Element => {
  const frameRef = React.useRef<number>(null);

  const handleWheel = (
    // event: React.WheelEvent<HTMLDivElement>,
  ) => {
    if (scrollState?.[0] || typeof scrollState?.[1] !== 'function' || frameRef.current) {
      return;
    }

    frameRef.current = requestAnimationFrame(() => {
      scrollState[1](true);
      frameRef.current = null;
    });
  };

  return (
    <Scrollable
      scrollRef={innerRef}
      className={cx(
        styles.menuList,
        isMulti && styles.multi,
        className,
      )}
      style={{ maxHeight }}
      {...innerProps}
      // onWheel={handleWheel}
      onScroll={handleWheel}
    >
      {children}
    </Scrollable>
  );
};

/* eslint-enable @typescript-eslint/indent */
