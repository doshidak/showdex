import * as React from 'react';
import Svg from 'react-inlinesvg';
import cx from 'classnames';
import { useColorScheme } from '@showdex/components/app';
import { BaseButton } from '@showdex/components/ui';
import { getResourceUrl } from '@showdex/utils/core';
import type { BaseButtonProps, ButtonElement } from '@showdex/components/ui';
import styles from './InstanceButton.module.scss';

export interface InstanceButtonProps extends Omit<BaseButtonProps, 'display'> {
  format?: string;
  authName?: string;
  playerName?: string;
  opponentName?: string;
}

export const InstanceButton = React.forwardRef<ButtonElement, InstanceButtonProps>(({
  className,
  format,
  authName,
  playerName,
  opponentName,
  hoverScale = 1.015,
  disabled,
  ...props
}: InstanceButtonProps, forwardedRef): JSX.Element => {
  const colorScheme = useColorScheme();

  return (
    <BaseButton
      ref={forwardedRef}
      {...props}
      className={cx(
        styles.container,
        !!colorScheme && styles[colorScheme],
        // styles.tabOpen,
        className,
      )}
      display="block"
      hoverScale={hoverScale}
    >
      <Svg
        className={styles.battleIcon}
        description="Sword Icon"
        src={getResourceUrl('sword.svg')}
      />

      <div className={styles.info}>
        <div className={styles.format}>
          {format}
        </div>

        <div className={styles.players}>
          {
            (!!playerName && !!opponentName) &&
            <>
              {
                (!authName || authName !== playerName) &&
                <div className={styles.username}>
                  {playerName}
                </div>
              }

              <div className={styles.versus}>
                vs
              </div>

              <div className={styles.username}>
                {authName && authName === opponentName ? playerName : opponentName}
              </div>
            </>
          }
        </div>
      </div>
    </BaseButton>
  );
});
