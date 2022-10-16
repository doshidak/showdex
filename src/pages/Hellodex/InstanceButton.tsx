import * as React from 'react';
import Svg from 'react-inlinesvg';
import cx from 'classnames';
import { BaseButton } from '@showdex/components/ui';
import { FormatLabels } from '@showdex/consts/battle';
import { useColorScheme } from '@showdex/redux/store';
import { detectGenFromFormat } from '@showdex/utils/battle';
import { getResourceUrl } from '@showdex/utils/core';
import type { BaseButtonProps, ButtonElement } from '@showdex/components/ui';
import styles from './InstanceButton.module.scss';

export interface InstanceButtonProps extends Omit<BaseButtonProps, 'display'> {
  format?: string;
  authName?: string;
  playerName?: string;
  opponentName?: string;
  active?: boolean;
}

export const InstanceButton = React.forwardRef<ButtonElement, InstanceButtonProps>(({
  className,
  format,
  authName,
  playerName,
  opponentName: opponentNameFromProps,
  hoverScale = 1,
  activeScale = 0.98,
  active,
  disabled,
  ...props
}: InstanceButtonProps, forwardedRef): JSX.Element => {
  const colorScheme = useColorScheme();

  const gen = detectGenFromFormat(format);
  const genlessFormat = gen > 0 ? format.replace(`gen${gen}`, '') : null;

  const authPlayer = !!authName
    && [playerName, opponentNameFromProps].includes(authName);

  const opponentName = !authPlayer || authName === playerName
    ? opponentNameFromProps
    : playerName;

  return (
    <BaseButton
      ref={forwardedRef}
      {...props}
      className={cx(
        styles.container,
        !!colorScheme && styles[colorScheme],
        active && styles.active,
        className,
      )}
      display="block"
      hoverScale={hoverScale}
      activeScale={activeScale}
    >
      <Svg
        className={styles.battleIcon}
        description="Sword Icon"
        src={getResourceUrl('sword.svg')}
      />

      <div className={styles.info}>
        {
          !!genlessFormat &&
          <div className={styles.format}>
            Gen {gen} &bull;{' '}
            <strong>{FormatLabels[genlessFormat] || genlessFormat}</strong>
          </div>
        }

        <div className={styles.players}>
          {
            (!!playerName && !!opponentName) &&
            <>
              {
                !authPlayer &&
                <div className={styles.username}>
                  {playerName}
                </div>
              }

              <div
                className={cx(
                  styles.versus,
                  authPlayer && styles.noPlayerName,
                )}
              >
                vs
              </div>

              <div className={styles.username}>
                {opponentName}
              </div>
            </>
          }
        </div>
      </div>
    </BaseButton>
  );
});
