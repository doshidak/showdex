import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { type FieldRenderProps } from 'react-final-form';
import cx from 'classnames';
import { romanize } from 'romans';
import { type GenerationNum } from '@smogon/calc';
import { useSandwich } from '@showdex/components/layout';
import {
  type BaseButtonProps,
  type ButtonElement,
  type TooltipProps,
  BaseButton,
  Tooltip,
} from '@showdex/components/ui';
import { GenLabels } from '@showdex/consts/dex';
import { useColorScheme } from '@showdex/redux/store';
import { determineColorScheme } from '@showdex/utils/ui';
import styles from './GenField.module.scss';

export interface GenFieldProps extends FieldRenderProps<GenerationNum, ButtonElement> {
  className?: string;
  style?: React.CSSProperties;
  optionClassName?: string;
  optionStyle?: React.CSSProperties;
  optionLabelClassName?: string;
  optionLabelStyle?: React.CSSProperties;
  optionSubLabelClassName?: string;
  optionSubLabelStyle?: React.CSSProperties;
  tabIndex?: number;
  label?: string;
  tooltipPlacement?: TooltipProps['placement'];
  tooltipPrefix?: React.ReactNode;
  tooltipSuffix?: React.ReactNode;
  hideDescription?: boolean;
  readOnly?: boolean;
  disabled?: boolean;
}

const options = (
  GenLabels
    ?.filter((l) => !!l?.gen && !!l.slug)
    .sort((a, b) => b.gen - a.gen)
) || [];

export const GenField = React.forwardRef<ButtonElement, GenFieldProps>(({
  className,
  style,
  optionClassName,
  optionStyle,
  optionLabelClassName,
  optionLabelStyle,
  optionSubLabelClassName,
  optionSubLabelStyle,
  tabIndex = 0,
  label,
  tooltipPlacement = 'top-start',
  tooltipPrefix,
  tooltipSuffix,
  input,
  hideDescription,
  readOnly,
  disabled,
}, forwardedRef): JSX.Element => {
  const containerRef = React.useRef<ButtonElement>(null);

  React.useImperativeHandle(
    forwardedRef,
    () => containerRef.current,
  );

  const { t } = useTranslation('pokedex');
  const colorScheme = useColorScheme();
  const reversedColorScheme = determineColorScheme(colorScheme, true);

  const selectedOption = React.useMemo(() => (
    !!input?.value
      && options?.find((l) => l.gen === input.value)
  ) || null, [
    input?.value,
  ]);

  const {
    id: optionsId,
    active: optionsVisible,
    requestOpen: requestOptionsOpen,
    notifyClose: notifyOptionsClose,
  } = useSandwich();

  const toggleOptions = optionsVisible ? notifyOptionsClose : requestOptionsOpen;

  const handleChange = (
    value: GenerationNum,
  ) => {
    if (value && typeof input?.onChange === 'function' && value !== input.value) {
      input.onChange(value);
    }

    notifyOptionsClose();
  };

  const [hoveredDescription, setHoveredDescription] = React.useState<string>(null);
  const selectedDescription = (!!selectedOption?.slug && t(`gens.${selectedOption.slug}.shortDesc`, '')) || null;
  const currentDescription = hoveredDescription || selectedDescription;

  const handleHover = (
    description: string,
  ): BaseButtonProps['onHover'] => (
    event,
  ) => {
    if (!event?.hovering) {
      if (hoveredDescription) {
        setHoveredDescription(null);
      }

      return;
    }

    if (hoveredDescription === description) {
      return;
    }

    setHoveredDescription(description);
  };

  return (
    <Tooltip
      className={styles.optionsTooltip}
      content={readOnly || !options.length || disabled ? null : (
        <div
          className={cx(
            styles.optionsContainer,
            !!reversedColorScheme && styles[reversedColorScheme],
          )}
        >
          {tooltipPrefix}

          <div className={styles.optionsGrid}>
            {options.map((item) => {
              const {
                gen,
                slug,
                // label: genLabel,
                // description,
              } = item || {};

              if (!gen || !slug) {
                return null;
              }

              const genLabel = t(`gens.${slug}.label`, slug.toUpperCase());
              const shortDesc = t(`gens.${slug}.shortDesc`);
              const selected = gen === input?.value;

              return (
                <BaseButton
                  key={`GenField:${input?.name || optionsId}:Option:${slug || gen}`}
                  className={cx(
                    styles.optionButton,
                    selected && styles.selected,
                    optionClassName,
                  )}
                  style={optionStyle}
                  display="block"
                  aria-label={t('honkdex:battle.gen.optionAria', { gen })}
                  hoverScale={1}
                  activeScale={selected ? 0.98 : undefined}
                  onHover={handleHover(shortDesc)}
                  onPress={() => handleChange(gen)}
                >
                  <div className={styles.genItem}>
                    <div
                      className={cx(styles.subLabel, optionSubLabelClassName)}
                      style={optionSubLabelStyle}
                    >
                      {gen ? romanize(gen) : ' '}
                    </div>

                    <div
                      className={cx(styles.label, optionLabelClassName)}
                      style={optionLabelStyle}
                    >
                      {genLabel}
                    </div>
                    <div
                      className={cx(styles.subLabel, optionSubLabelClassName)}
                      style={optionSubLabelStyle}
                    >
                      {t('honkdex:battle.gen.friendlyLabel', {
                        gen: gen || '--',
                        defaultValue: `Gen ${gen || '--'}`,
                      })}
                    </div>
                  </div>
                </BaseButton>
              );
            })}
          </div>

          {
            (!!currentDescription && !hideDescription) &&
            <div className={styles.optionDescription}>
              {currentDescription}
            </div>
          }

          {tooltipSuffix}
        </div>
      )}
      visible={optionsVisible}
      interactive
      placement={tooltipPlacement}
      offset={[0, 10]}
      onClickOutside={notifyOptionsClose}
    >
      <BaseButton
        ref={containerRef}
        className={cx(
          styles.container,
          !!colorScheme && styles[colorScheme],
          readOnly && styles.readOnly,
          (!options.length || disabled) && styles.disabled,
          className,
        )}
        style={style}
        display="block"
        aria-label={label}
        tabIndex={readOnly || !options.length || disabled ? -1 : tabIndex}
        hoverScale={1}
        onPress={toggleOptions}
      >
        <div
          className={cx(
            styles.genItem,
            !selectedOption?.gen && styles.empty,
          )}
        >
          {
            !!selectedOption?.gen &&
            <div className={styles.subLabel}>
              {romanize(selectedOption.gen)}
            </div>
          }

          <div className={styles.label}>
            {selectedOption?.slug ? t(`gens.${selectedOption.slug}.label`, {
              defaultValue: '???',
            }) : '???'}
          </div>

          {
            !!selectedOption?.gen &&
            <div className={styles.subLabel}>
              {t('honkdex:battle.gen.friendlyLabel', {
                gen: selectedOption.gen,
                defaultValue: `Gen ${selectedOption.gen}`,
              })}
            </div>
          }
        </div>
      </BaseButton>
    </Tooltip>
  );
});
