import * as React from 'react';
import { type ItemProps, type ItemParams, Item } from 'react-contexify';
import Svg from 'react-inlinesvg';
import cx from 'classnames';
import { getResourceUrl } from '@showdex/utils/core';
import { type ContextMenuTheme } from './ContextMenu';
import styles from './ContextMenu.module.scss';

export interface ContextMenuItemProps extends Omit<ItemProps, 'disabled' | 'children' | 'onClick'> {
  className?: string;
  style?: React.CSSProperties;
  labelClassName?: string;
  labelStyle?: React.CSSProperties;
  iconContainerClassName?: string;
  iconContainerStyle?: React.CSSProperties;
  iconClassName?: string;
  iconStyle?: React.CSSProperties;
  label: React.ReactNode;
  icon?: string;
  theme?: ContextMenuTheme;
  disabled?: boolean;
  children?: React.ReactNode;
  onPress?: (args: ItemParams) => void;
}

/**
 * Primary menu item used in `ContextMenu` & `ContextMenuSubMenu`.
 *
 * * Don't bother setting `tabIndex` here.
 *   - The underlying `Item` will overwrite it to `-1` due to it prioritizing its own keyboard navigation handler.
 *   - Use the CSS `:focus` selector to highlight the keyboard-selected item.
 * * Imported from `@tizeio/web/components/ui/ContextMenu`.
 *
 * @since 1.2.3
 */
export const ContextMenuItem = ({
  className,
  style,
  labelClassName,
  labelStyle,
  iconContainerClassName,
  iconContainerStyle,
  iconClassName,
  iconStyle,
  label,
  icon,
  theme = 'default',
  disabled,
  children,
  onPress,
  ...props
}: ContextMenuItemProps): JSX.Element => (
  <Item
    {...props}
    className={cx(
      styles.item,
      !!theme && styles[`theme-${theme}`],
      disabled && styles.disabled,
      className,
    )}
    style={style}
    disabled={disabled}
    onClick={onPress}
  >
    {
      !!icon &&
      <div
        className={cx(styles.icon, iconContainerClassName)}
        style={iconContainerStyle}
      >
        {icon.startsWith('fa-') ? (
          <i
            className={cx('fa', icon, iconClassName)}
            style={iconStyle}
          />
        ) : (
          <Svg
            className={iconClassName}
            style={iconStyle}
            src={getResourceUrl(`${icon}.svg`)}
          />
        )}
      </div>
    }

    <label
      className={cx(styles.label, labelClassName)}
      style={labelStyle}
    >
      {label}
    </label>

    {children}
  </Item>
);
