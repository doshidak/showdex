import * as React from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { type FieldRenderProps } from 'react-final-form';
import cx from 'classnames';
import { useSandwich } from '@showdex/components/layout';
import {
  type ButtonElement,
  type TooltipProps,
  ToggleButton,
  Tooltip,
} from '@showdex/components/ui';
import { useColorScheme } from '@showdex/redux/store';
import { clamp } from '@showdex/utils/core';
import { determineColorScheme } from '@showdex/utils/ui';
import styles from './SpikesField.module.scss';

export interface SpikesFieldProps extends FieldRenderProps<number, ButtonElement> {
  className?: string;
  style?: React.CSSProperties;
  labelClassName?: string;
  labelStyle?: React.CSSProperties;
  tabIndex?: number;
  label?: string;
  defaultLabel?: string;
  override?: string;
  headerPrefix?: React.ReactNode;
  headerSuffix?: React.ReactNode;
  tooltipPlacement?: TooltipProps['placement'];
  max?: number;
  highlightLabel?: boolean;
  togglePrimary?: boolean;
  toggleActive?: boolean;
  absoluteHover?: boolean;
  readOnly?: boolean;
  disabled?: boolean;
}

export const SpikesField = React.forwardRef<ButtonElement, SpikesFieldProps>(({
  className,
  style,
  labelClassName,
  labelStyle,
  tabIndex = 0,
  label,
  defaultLabel = '???',
  override,
  headerPrefix,
  headerSuffix,
  tooltipPlacement = 'top',
  highlightLabel,
  input,
  max = 3,
  togglePrimary,
  toggleActive,
  absoluteHover,
  readOnly,
  disabled,
}, forwardedRef): JSX.Element => {
  const containerRef = React.useRef<ButtonElement>(null);

  React.useImperativeHandle(
    forwardedRef,
    () => containerRef.current,
  );

  const { t } = useTranslation('calcdex');
  const colorScheme = useColorScheme();
  const reversedColorScheme = determineColorScheme(colorScheme, true);

  const {
    id: optionsId,
    active: optionsVisible,
    requestOpen: requestOptionsOpen,
    notifyClose: notifyOptionsClose,
  } = useSandwich();

  const toggleOptions = optionsVisible ? () => {
    if (input?.value) {
      input.onChange?.(null);
    }

    notifyOptionsClose();
  } : requestOptionsOpen;

  const handleChange = (
    value: number,
  ) => {
    if (value && typeof input?.onChange === 'function') {
      input.onChange(value === input.value ? null : value);
    }

    notifyOptionsClose();
  };

  return (
    <Tooltip
      className={styles.optionsTooltip}
      content={readOnly || disabled ? null : (
        <div
          className={cx(
            styles.optionsContainer,
            !!reversedColorScheme && styles[reversedColorScheme],
          )}
        >
          {
            (!!headerPrefix || !!label || !!headerSuffix) &&
            <div className={styles.header}>
              {headerPrefix}

              {
                !!label &&
                <div
                  className={cx(
                    styles.label,
                    highlightLabel && styles.highlight,
                    labelClassName,
                  )}
                  style={labelStyle}
                >
                  {label}
                </div>
              }

              {headerSuffix}
            </div>
          }

          <div className={styles.options}>
            {Array(clamp(0, max)).fill(null).map((_, index) => {
              const value = index + 1;
              const active = input?.value === value;

              return (
                <ToggleButton
                  key={`SpikesField:${input?.name || optionsId}:Options:${value}`}
                  className={styles.optionButton}
                  aria-label={t('field.spikes.aria', { count: value })}
                  label={String(value)}
                  primary
                  active={active}
                  activeScale={active ? 0.98 : undefined}
                  forceColorScheme={reversedColorScheme}
                  onPress={() => handleChange(value)}
                />
              );
            })}
          </div>
        </div>
      )}
      visible={optionsVisible}
      interactive
      placement={tooltipPlacement}
      offset={[0, 10]}
      onClickOutside={notifyOptionsClose}
    >
      <ToggleButton
        ref={containerRef}
        className={cx(
          styles.container,
          readOnly && styles.readOnly,
          className,
        )}
        style={style}
        aria-label={label}
        tabIndex={readOnly || disabled ? -1 : tabIndex}
        label={override || (!input?.value && t('field.conditions.spikes', defaultLabel))}
        absoluteHover={absoluteHover}
        primary={togglePrimary}
        active={toggleActive}
        hoverScale={1}
        disabled={disabled}
        onPress={toggleOptions}
      >
        {
          (!override && !!input?.value) &&
          <Trans
            t={t}
            i18nKey="field.spikes.label"
            count={input.value}
            components={{ times: <span>&times;</span> }}
          />
        }
      </ToggleButton>
    </Tooltip>
  );
});
