import * as React from 'react';
import { useTranslation } from 'react-i18next';
import cx from 'classnames';
import { type ButtonElement, type ButtonProps, Button } from '@showdex/components/ui';
import styles from './CloseButton.module.scss';

export type CloseButtonProps = Omit<ButtonProps, 'label' | 'hoverScale' | 'absoluteHover' | 'children'>;

/* eslint-disable @typescript-eslint/indent */

/**
 * Note that this button should only be rendered in the Calcdex for mobile overlays only.
 *
 * * In overlay mode on mobile, the overlay actually overlays on top of the battle instead of the chat.
 *   - User must click another button to open the chat, which is very inconvenient after clicking the open Calcdex button.
 *
 * @since 1.0.5
 */
export const CloseButton = React.forwardRef<ButtonElement, CloseButtonProps>(({
  className,
  style,
  labelClassName,
  ...props
}: CloseButtonProps, forwardedRef) => {
  const { t } = useTranslation('calcdex');

  return (
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
      label={t('overlay.control.activeLabel')}
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
  );
});

/* eslint-enable @typescript-eslint/indent */
