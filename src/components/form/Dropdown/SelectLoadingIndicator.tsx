import * as React from 'react';
import cx from 'classnames';
import type { GroupBase, LoadingIndicatorProps } from 'react-select';
import type { DropdownOption } from './Dropdown';
import styles from './Dropdown.module.scss';

/* eslint-disable @typescript-eslint/indent */

export const SelectLoadingIndicator = <
  Option extends DropdownOption,
  Multi extends boolean,
  Group extends GroupBase<Option>,
>({
  className,
  isRtl,
  innerProps,
  size = 4,
}: LoadingIndicatorProps<Option, Multi, Group>): JSX.Element => (
  <div
    className={cx(
      styles.loadingIndicator,
      className,
    )}
    style={typeof size === 'number' && size > 0 ? {
      marginRight: size,
      fontSize: size,
    } : undefined}
    {...innerProps}
  >
    <span
      className={cx(
        styles.loadingIndicatorDot,
        isRtl && styles.offset,
      )}
      // style={{ animationDelay: '0s' }}
    />

    <span
      className={cx(
        styles.loadingIndicatorDot,
        styles.offset,
      )}
      style={{ animationDelay: '160ms' }}
    />

    <span
      className={cx(
        styles.loadingIndicatorDot,
        !isRtl && styles.offset,
      )}
      style={{ animationDelay: '320ms' }}
    />
  </div>
);

/* eslint-enable @typescript-eslint/indent */
