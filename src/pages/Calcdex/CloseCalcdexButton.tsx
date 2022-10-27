import * as React from 'react';
import cx from 'classnames';
import { Button } from '@showdex/components/ui';
import type { ButtonElement, ButtonProps } from '@showdex/components/ui';
import styles from './CloseCalcdexButton.module.scss';

export type CloseCalcdexButtonProps = Omit<ButtonProps, 'label' | 'hoverScale' | 'absoluteHover' | 'children'>;

/* eslint-disable @typescript-eslint/indent */

/**
 * Note that this button should only be rendered in the Calcdex for mobile overlays only.
 *
 * * In overlay mode on mobile, the overlay actually overlays on top of the battle instead of the chat.
 *   - User must click another button to open the chat, which is very inconvenient after clicking the open Calcdex button.
 *
 * @since 1.0.5
 */
export const CloseCalcdexButton = React.forwardRef<ButtonElement, CloseCalcdexButtonProps>(({
  className,
  style,
  labelClassName,
  ...props
}: CloseCalcdexButtonProps, forwardedRef) => (
  <Button
    ref={forwardedRef}
    {...props}
    className={cx(
      styles.container,
      className,
    )}
    style={style}
    labelClassName={cx(
      styles.label,
      labelClassName,
    )}
    display="block"
    label="Close Calcdex"
    hoverScale={1}
    absoluteHover
    childrenFirst
  >
    <i
      className={cx(
        styles.icon,
        'fa',
        'fa-close',
      )}
    />
  </Button>
));

/* eslint-enable @typescript-eslint/indent */
