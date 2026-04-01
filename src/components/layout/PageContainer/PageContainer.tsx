/**
 * @file `PageContainer.tsx`
 * @author Keith Choison <keith@tize.io>
 * @since 1.3.0
 */

import * as React from 'react';
import cx from 'classnames';
import { Scrollable } from '@showdex/components/ui';
import { useColorScheme, useColorTheme, useGlassyTerrain } from '@showdex/redux/store';
import styles from './PageContainer.module.scss';

export interface PageContainerProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'prefix' | 'suffix'> {
  contentRef?: React.RefObject<HTMLDivElement>;
  name?: string;
  className?: string;
  style?: React.CSSProperties;
  contentClassName?: string;
  contentStyle?: React.CSSProperties;
  scrollableContentClassName?: string; // yuck
  scrollableContentStyle?: React.CSSProperties;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
  contentScrollable?: boolean;
  children: React.ReactNode;
}

export const PageContainer = React.forwardRef<HTMLDivElement, PageContainerProps>(({
  contentRef,
  name,
  className,
  style,
  contentClassName,
  contentStyle,
  scrollableContentClassName,
  scrollableContentStyle,
  prefix,
  suffix,
  contentScrollable,
  children,
  ...props
}, forwardedRef): React.JSX.Element => {
  const colorScheme = useColorScheme();
  const colorTheme = useColorTheme();
  const glassyTerrain = useGlassyTerrain();

  return (
    <div
      ref={forwardedRef}
      {...props}
      className={cx(
        'showdex-module',
        styles.container,
        className,
      )}
      style={style}
      {...(!!name && { 'data-showdex-module': name })}
      {...(!!colorScheme && { 'data-showdex-scheme': colorScheme })}
      {...(!!colorTheme && { 'data-showdex-theme': colorTheme })}
      {...(glassyTerrain && { 'data-showdex-terrain': 'glassy' })}
    >
      {prefix}

      {contentScrollable ? (
        <Scrollable
          contentRef={contentRef}
          className={cx(styles.content, contentClassName)}
          style={contentStyle}
          contentClassName={scrollableContentClassName}
          contentStyle={scrollableContentStyle}
        >
          {children}
        </Scrollable>
      ) : (
        <div
          ref={contentRef}
          className={cx(styles.content, contentClassName)}
          style={contentStyle}
        >
          {children}
        </div>
      )}

      {suffix}
    </div>
  );
});

PageContainer.displayName = 'PageContainer';
