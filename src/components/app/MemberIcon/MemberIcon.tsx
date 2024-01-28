import * as React from 'react';
import Svg from 'react-inlinesvg';
import cx from 'classnames';
import { type ShowdexSupporterTierMember } from '@showdex/interfaces/app';
import { useColorScheme } from '@showdex/redux/store';
import { findPlayerTitle } from '@showdex/utils/app';
import { getResourceUrl } from '@showdex/utils/core';
import { determineColorScheme } from '@showdex/utils/ui';
import styles from './MemberIcon.module.scss';

export interface MemberIconProps {
  className?: string;
  style?: React.CSSProperties;
  iconClassName?: string;
  iconStyle?: React.CSSProperties;
  member: ShowdexSupporterTierMember;
  defaultSrc?: string;
  reverseColorScheme?: boolean;
}

export const MemberIcon = ({
  className,
  style,
  iconClassName,
  iconStyle,
  member,
  defaultSrc,
  reverseColorScheme,
}: MemberIconProps): JSX.Element => {
  const currentColorScheme = useColorScheme();
  const colorScheme = determineColorScheme(currentColorScheme, reverseColorScheme);

  const {
    name,
    showdownUser,
  } = member || {};

  const memberTitle = findPlayerTitle(name, showdownUser);

  if (!memberTitle?.icon) {
    return defaultSrc ? (
      <Svg
        className={cx(styles.icon, iconClassName)}
        src={getResourceUrl(`${defaultSrc}.svg`)}
      />
    ) : null;
  }

  const color = memberTitle.color?.[colorScheme];
  const iconColor = memberTitle.iconColor?.[colorScheme];
  const src = getResourceUrl(`${memberTitle.icon}.svg`);

  return (
    <div
      className={cx(styles.container, className)}
      style={style}
    >
      {
        memberTitle.iconColorGlow &&
        <div className={styles.glowContainer}>
          <Svg
            className={styles.glowIcon}
            style={{ color: iconColor || color }}
            src={src}
          />
        </div>
      }

      <Svg
        className={cx(styles.icon, iconClassName)}
        style={{
          ...iconStyle,
          color: iconColor || color,
          opacity: memberTitle.iconColorGlow ? 0.96 : undefined,
        }}
        description={memberTitle.iconDescription}
        src={src}
      />
    </div>
  );
};
