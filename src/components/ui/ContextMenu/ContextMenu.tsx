import * as React from 'react';
import { type MenuProps, Menu } from 'react-contexify';
import cx from 'classnames';
import { useColorScheme } from '@showdex/redux/store';
import { determineColorScheme } from '@showdex/utils/ui';
import { type ContextMenuItemProps, ContextMenuItem } from './ContextMenuItem';
import { type ContextMenuSeparatorProps, ContextMenuSeparator } from './ContextMenuSeparator';
import { type ContextSubmenuProps, ContextSubmenu } from './ContextSubmenu';
import styles from './ContextMenu.module.scss';

export type ContextMenuEntityName =
  | 'submenu'
  | 'item'
  | 'separator';

export interface ContextMenuEntityItem<
  TEntity extends ContextMenuEntityName = ContextMenuEntityName,
  TProps extends object = TEntity extends 'submenu'
    ? ContextSubmenuProps
    : TEntity extends 'item'
      ? ContextMenuItemProps
      : TEntity extends 'separator'
        ? ContextMenuSeparatorProps
        : never,
> {
  key: string;
  entity: TEntity;
  props?: TProps;
}

export type ContextMenuTheme =
  | 'default'
  | 'info'
  | 'success'
  | 'warning'
  | 'error';

export interface ContextMenuProps extends Omit<MenuProps, 'animation' | 'theme' | 'children'> {
  className?: string;
  style?: React.CSSProperties;

  /**
   * Optional prefix to prepend to the keys of each item in `items`.
   *
   * @since 1.2.3
   */
  itemKeyPrefix?: string;

  /**
   * Convenient way of specifying menu items without having to import each component.
   *
   * * You can alternatively pass the items as `children`.
   *   - `children` components are rendered *after* those specified in `items`.
   *
   * @since 1.2.3
   */
  items?: ContextMenuEntityItem[];

  reverseColorScheme?: boolean;
  disabled?: boolean;
  children?: React.ReactNode;
}

/**
 * Custom fancy right-click menu.
 *
 * * Imported from `@tizeio/web/components/ui/ContextMenu`.
 *
 * @since 1.2.3
 */
export const ContextMenu = ({
  id,
  className,
  style,
  itemKeyPrefix,
  items = [],
  reverseColorScheme = true,
  disabled,
  children,
  ...props
}: ContextMenuProps): JSX.Element => {
  const currentColorScheme = useColorScheme();
  const colorScheme = determineColorScheme(currentColorScheme, reverseColorScheme);

  return (
    <Menu
      {...props}
      id={id}
      className={cx(
        styles.container,
        !!colorScheme && styles[colorScheme],
        className,
      )}
      style={style}
      animation="scale"
    >
      {items?.map((item) => {
        if (!item?.key || !item.entity) {
          return null;
        }

        const itemProps: ContextMenuItemProps & { key: string } = {
          key: `${itemKeyPrefix || 'ContextMenu'}:Item:${item.entity}:${item.key}`,
          label: '???',
          ...item.props,
        };

        switch (item.entity) {
          case 'submenu': {
            return <ContextSubmenu {...itemProps} />;
          }

          case 'item': {
            return <ContextMenuItem {...itemProps} />;
          }

          case 'separator': {
            return <ContextMenuSeparator {...itemProps} />;
          }

          default: {
            return null;
          }
        }
      })}

      {children}
    </Menu>
  );
};
