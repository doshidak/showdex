import * as React from 'react';
import { type SubMenuProps, Submenu } from 'react-contexify';
import Svg from 'react-inlinesvg';
import cx from 'classnames';
import { getResourceUrl } from '@showdex/utils/core';
import { type ContextMenuEntityItem, type ContextMenuTheme } from './ContextMenu';
import { type ContextMenuItemProps, ContextMenuItem } from './ContextMenuItem';
import { ContextMenuSeparator } from './ContextMenuSeparator';
import styles from './ContextMenu.module.scss';

export interface ContextSubmenuProps extends Omit<SubMenuProps, 'arrow' | 'disabled' | 'children'> {
  className?: string;
  style?: React.CSSProperties;
  labelClassName?: string;
  labelStyle?: React.CSSProperties;
  iconClassName?: string;
  iconStyle?: React.CSSProperties;
  arrowClassName?: string;
  arrowStyle?: React.CSSProperties;
  label: React.ReactNode;
  icon?: string;

  /**
   * Optional prefix to prepend to the keys of each item in `items`.
   *
   * @since 1.2.3
   */
  itemKeyPrefix?: string;

  /**
   * Convenient way of specifying sub-menu items without having to import each component.
   *
   * * You can alternatively pass the items as `children`.
   *   - `children` components are rendered *after* those specified in `items[]`.
   *
   * @since 1.2.3
   */
  items?: ContextMenuEntityItem[];

  theme?: ContextMenuTheme;
  disabled?: boolean;
  children?: React.ReactNode;
}

export const ContextSubmenu = ({
  className,
  style,
  labelClassName,
  labelStyle,
  iconClassName,
  iconStyle,
  arrowClassName,
  arrowStyle,
  label,
  icon,
  itemKeyPrefix,
  items = [],
  theme = 'default',
  disabled,
  children,
  ...props
}: ContextSubmenuProps): JSX.Element => (
  <Submenu
    {...props}
    className={cx(
      styles.subMenuContainer,
      !!theme && styles[`theme-${theme}`],
      disabled && styles.disabled,
      className,
    )}
    style={style}
    label={(
      <div className={styles.labelContainer}>
        {
          !!icon &&
          <div
            className={cx(styles.icon, iconClassName)}
            style={iconStyle}
          >
            {icon.startsWith('fa-') ? (
              <i className={cx('fa', icon)} />
            ) : (
              <Svg src={getResourceUrl(`${icon}.svg`)} />
            )}
          </div>
        }

        <label
          className={cx(styles.label, labelClassName)}
          style={labelStyle}
        >
          {label}
        </label>
      </div>
    )}
    arrow={(
      <i
        className={cx(
          'fa',
          'fa-chevron-right',
          arrowClassName,
        )}
        style={arrowStyle}
      />
    )}
  >
    {items?.map((item) => {
      if (!item?.key || !item.entity) {
        return null;
      }

      const itemProps: ContextMenuItemProps & { key: string } = {
        key: `${itemKeyPrefix || 'ContextSubmenu'}:Item:${item.entity}:${item.key}`,
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
  </Submenu>
);
