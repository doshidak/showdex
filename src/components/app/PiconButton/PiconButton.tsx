import * as React from 'react';
import cx from 'classnames';
import type { PiconProps } from '@showdex/components/app';
import type { BaseButtonProps, ButtonElement } from '@showdex/components/ui';
import { Picon, useColorScheme } from '@showdex/components/app';
import { BaseButton, Tooltip } from '@showdex/components/ui';
import styles from './PiconButton.module.scss';

export interface PiconButtonProps extends BaseButtonProps {
  piconClassName?: string;
  piconStyle?: React.CSSProperties;
  pokemon?: PiconProps['pokemon'];
  facingLeft?: PiconProps['facingLeft'];
  tooltip?: React.ReactNode;
}

/* eslint-disable react/prop-types -- this rule can't handle props from extended interfaces apparently lmaoo */

export const PiconButton = React.forwardRef<ButtonElement, PiconButtonProps>(({
  className,
  piconClassName,
  piconStyle,
  pokemon,
  facingLeft,
  tooltip,
  hoverScale = 1.1,
  disabled,
  children,
  ...props
}: PiconButtonProps, forwardedRef: React.ForwardedRef<ButtonElement>): JSX.Element => {
  const ref = React.useRef<ButtonElement>(null);
  const colorScheme = useColorScheme();

  React.useImperativeHandle(
    forwardedRef,
    () => ref.current,
    [ref],
  );

  return (
    <>
      <BaseButton
        ref={ref}
        {...props}
        className={cx(
          styles.container,
          !!colorScheme && styles[colorScheme],
          className,
        )}
        hoverScale={hoverScale}
        disabled={disabled}
      >
        <Picon
          className={cx(
            styles.picon,
            piconClassName,
          )}
          style={piconStyle}
          pokemon={pokemon}
          facingLeft={facingLeft}
        />

        {children}
      </BaseButton>

      <Tooltip
        reference={ref.current}
        content={tooltip}
        offset={[0, 5]}
        delay={[1250, 250]}
        trigger="mouseenter"
        touch="hold"
        disabled={!tooltip || disabled}
      />
    </>
  );
});

/* eslint-enable react/prop-types */
