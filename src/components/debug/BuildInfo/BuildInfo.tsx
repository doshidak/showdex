import * as React from 'react';
import cx from 'classnames';
import { useColorScheme } from '@showdex/components/app';
import { printBuildInfo } from '@showdex/utils/debug';
import styles from './BuildInfo.module.scss';

export type BuildInfoPosition =
  | 'top-left'
  | 'top-right'
  | 'bottom-right'
  | 'bottom-left';

export interface BuildInfoProps {
  className?: string;
  style?: React.CSSProperties;
  position?: BuildInfoPosition;
  hideCredits?: boolean;
}

export const BuildInfo = ({
  className,
  style,
  position = 'top-right',
  hideCredits,
}: BuildInfoProps): JSX.Element => {
  const colorScheme = useColorScheme();

  return (
    <div
      className={cx(
        styles.container,
        !!colorScheme && styles[colorScheme],
        !!position && styles[position],
        className,
      )}
      style={style}
    >
      {printBuildInfo()}

      {
        !hideCredits &&
        <>
          <br />
          by sumfuk/doshidak &amp; camdawgboi
        </>
      }
    </div>
  );
};
