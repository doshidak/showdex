import * as React from 'react';
import cx from 'classnames';
import { createModuleLayoutUtils } from './createModuleLayoutUtils';
import { type GridSpecs } from './Grid';
import { type ModuleProps, Module } from './Module';
import styles from './OverlayModule.module.scss';

export interface OverlayModuleProps extends ModuleProps {
  gridSpecs: GridSpecs;
}

export const OverlayModule = React.forwardRef<HTMLDivElement, OverlayModuleProps>(({
  className,
  style,
  w,
  h,
  gridSpecs,
  children,
  ...props
}: OverlayModuleProps, forwardedRef): JSX.Element => {
  const { toPixels } = createModuleLayoutUtils(gridSpecs);

  const width = toPixels(w) || 0;
  const height = toPixels(h) || 0;

  return (
    <Module
      ref={forwardedRef}
      {...props}
      className={cx(styles.container, className)}
      style={{
        ...style,
        width,
        height: '100%',
        minHeight: height,
      }}
      w={w}
      h={h}
      sizeManually // required cause this won't be in a Grid (so we can't use CSS grid-area)
    >
      {children}
    </Module>
  );
});
