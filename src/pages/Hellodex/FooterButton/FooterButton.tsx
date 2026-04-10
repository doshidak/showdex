/**
 * @file `FooterButton.tsx`
 * @author Keith Choison <keith@tize.io>
 * @since 1.0.1
 */

import * as React from 'react';
import Svg from 'react-inlinesvg';
import cx from 'classnames';
import {
  type BaseButtonProps,
  type ButtonElement,
  BaseButton,
  Tooltip,
} from '@showdex/components/ui';
import { getResourceUrl } from '@showdex/utils/core';
import styles from './FooterButton.module.scss';

export interface FooterButtonProps extends Omit<BaseButtonProps, 'display'> {
  iconClassName?: string;
  iconStyle?: React.CSSProperties;
  labelClassName?: string;
  iconAsset?: string;
  iconDescription?: string;
  label: string;
  tooltip?: React.ReactNode;
}

export const FooterButton = React.forwardRef<ButtonElement, FooterButtonProps>(({
  className,
  iconClassName,
  iconStyle,
  labelClassName,
  iconAsset,
  iconDescription,
  label,
  'aria-label': ariaLabel,
  tooltip,
  hoverScale = 1,
  disabled,
  ...props
}: FooterButtonProps, forwardedRef) => {
  const ref = React.useRef<ButtonElement>(null);

  React.useImperativeHandle(
    forwardedRef,
    () => ref.current,
  );

  return (
    <>
      <BaseButton
        ref={ref}
        {...props}
        className={cx(
          styles.container,
          disabled && styles.disabled,
          className,
        )}
        display="inline"
        aria-label={ariaLabel || label}
        hoverScale={hoverScale}
        disabled={disabled}
      >
        {iconAsset?.startsWith('fa-') ? (
          <i
            className={cx('fa', iconAsset, iconClassName)}
            style={iconStyle}
          />
        ) : iconAsset ? (
          <Svg
            className={cx(styles.icon, iconClassName)}
            style={iconStyle}
            description={iconDescription}
            src={getResourceUrl(iconAsset)}
          />
        ) : null}

        <span className={cx(styles.label, labelClassName)}>
          {label}
        </span>
      </BaseButton>

      <Tooltip
        reference={ref}
        content={tooltip}
        // offset={[0, 10]}
        delay={[1000, 50]}
        trigger="mouseenter"
        touch={['hold', 500]}
        disabled={!tooltip || disabled}
      />
    </>
  );
});
