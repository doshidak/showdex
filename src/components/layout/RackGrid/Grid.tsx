import * as React from 'react';
import cx from 'classnames';
import { createModuleLayoutUtils } from './createModuleLayoutUtils';
import styles from './Grid.module.scss';

export interface GridSpecs {
  columns?: number;
  gridSize?: number;
  gridGap?: number;
}

export interface GridProps extends GridSpecs, React.ComponentPropsWithRef<'div'> {
  className?: string;
  style?: React.CSSProperties;

  /**
   * Minimum number of rows to display.
   *
   * * Rows will automatically expand to accommodate the modules.
   *
   * @since 1.2.3
   */
  minRows?: number;

  /**
   * If `true`, the grid will enable styling for module drag & drop.
   *
   * * **Required** for `active`, `invalid`, and `highlight`.
   *
   * @default false
   * @since 1.2.3
   */
  interactive?: boolean;

  /**
   * Typically used to indicate that the grid is ready to receive modules from the drawer.
   *
   * * Has no effect if `interactive` is `false` (default).
   *
   * @default false
   * @since 1.2.3
   */
  active?: boolean;

  /**
   * Typically used to indicate that the actively dragged module is not yet detected by the grid.
   *
   * * Has no effect if `interactive` is `false` (default).
   *
   * @default false
   * @since 1.2.3
   */
  invalid?: boolean;

  /**
   * Typically used to indicate that the grid is accepting the actively dragged module.
   *
   * * Has no effect if `interactive` is `false` (default).
   *
   * @default false
   * @since 1.2.3
   */
  highlight?: boolean;

  children?: React.ReactNode;
}

export const Grid = React.forwardRef<HTMLDivElement, GridProps>(({
  className,
  style,
  columns = 0,
  minRows = 0,
  gridSize = 0,
  gridGap = 0,
  interactive,
  active,
  invalid,
  highlight,
  children,
  ...props
}: GridProps, forwardedRef): JSX.Element => {
  const { toPixels } = createModuleLayoutUtils({
    gridSize,
    gridGap,
  });

  return (
    <div
      ref={forwardedRef}
      {...props}
      className={cx(
        styles.container,
        interactive && styles.interactive,
        interactive && active && styles.active,
        interactive && invalid && styles.invalid,
        interactive && highlight && styles.highlight,
        className,
      )}
      style={{
        ...style,
        ...(columns > 0 && { gridTemplateColumns: `repeat(${columns}, minmax(${gridSize}px, min-content))` }),
        ...(gridSize > 0 && { gridAutoRows: `minmax(${gridSize}px, max-content)` }),
        ...(gridGap > 0 && { columnGap: gridGap, rowGap: gridGap }),
        ...(minRows > 0 && { minHeight: toPixels(minRows) }),
      }}
    >
      {children}
    </div>
  );
});
