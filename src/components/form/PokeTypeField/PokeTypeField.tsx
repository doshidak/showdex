import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { type FieldRenderProps } from 'react-final-form';
import cx from 'classnames';
import { PokeType } from '@showdex/components/app';
import { useSandwich } from '@showdex/components/layout';
import {
  type ButtonElement,
  type TooltipProps,
  BaseButton,
  ToggleButton,
  Tooltip,
} from '@showdex/components/ui';
import { PokemonTypes } from '@showdex/consts/dex';
import { type CalcdexPokemonUsageAlt } from '@showdex/interfaces/calc';
import { useColorScheme } from '@showdex/redux/store';
import { formatId, similarArrays } from '@showdex/utils/core';
import { type ElementSizeLabel } from '@showdex/utils/hooks';
import { percentage } from '@showdex/utils/humanize';
import { flattenAlts, sortUsageAlts } from '@showdex/utils/presets';
import styles from './PokeTypeField.module.scss';

export interface PokeTypeFieldProps<
  Multi extends boolean = false,
> extends FieldRenderProps<Multi extends true ? Showdown.TypeName[] : Showdown.TypeName, ButtonElement> {
  className?: string;
  style?: React.CSSProperties;
  tabIndex?: number;
  label?: string;
  title?: string;
  // tooltip?: React.ReactNode; // needs extra work lol
  tooltipPlacement?: TooltipProps['placement'];
  // tooltipDisabled?: boolean;
  multi?: boolean;
  maxMultiTypes?: number;
  defaultTypeLabel?: string;
  teraTyping?: boolean;
  containerSize?: ElementSizeLabel;
  highlight?: boolean;
  highlightTypes?: Showdown.TypeName[];
  revealedTypes?: Showdown.TypeName[];
  typeUsages?: CalcdexPokemonUsageAlt<Showdown.TypeName>[];
  readOnly?: boolean;
  disabled?: boolean;
}

/* eslint-disable @typescript-eslint/indent */

export const PokeTypeField = React.forwardRef<ButtonElement, PokeTypeFieldProps>(<
  Multi extends boolean = false,
>({
  className,
  style,
  tabIndex = 0,
  label,
  title,
  // tooltip,
  tooltipPlacement = 'top',
  // tooltipDisabled,
  multi,
  maxMultiTypes = 2,
  defaultTypeLabel,
  teraTyping,
  containerSize,
  highlight = true,
  highlightTypes,
  revealedTypes,
  typeUsages,
  input,
  readOnly,
  disabled,
}: PokeTypeFieldProps<Multi>, forwardedRef: React.ForwardedRef<ButtonElement>): JSX.Element => {
  const containerRef = React.useRef<ButtonElement>(null);

  React.useImperativeHandle(
    forwardedRef,
    () => containerRef.current,
  );

  const { t } = useTranslation('pokedex');
  const colorScheme = useColorScheme();

  // keep track of whether the options tooltip is open
  const {
    id: optionsId,
    active: optionsVisible,
    requestOpen: requestOptionsOpen,
    notifyClose: notifyOptionsClose,
  } = useSandwich();

  const toggleOptions = optionsVisible ? notifyOptionsClose : requestOptionsOpen;

  // if provided, fallback to using revealedTypes if input.value is empty
  const inputSource = input?.value?.length
    ? input.value
    : revealedTypes?.length
      ? (multi ? revealedTypes : revealedTypes[0])
      : (multi ? ['???'] : '???');

  const handleChange = (value: Showdown.TypeName) => {
    if (multi) {
      const updatedValue: Showdown.TypeName[] = [
        ...((inputSource as Showdown.TypeName[]) || []),
      ];

      const valueIndex = updatedValue.findIndex((tp) => tp === value);

      if (valueIndex > -1) {
        updatedValue.splice(valueIndex, 1);
      } else {
        updatedValue.push(value);
      }

      if (updatedValue.length > Math.max(maxMultiTypes, 1)) {
        return;
      }

      if (updatedValue.length) {
        // if sorting worked properly, should always be last in the array
        // (something's terribly wrong if index 0 is '???' here, probably about to have an empty array!)
        const unknownTypeIndex = updatedValue.findIndex((tp) => tp === '???');

        // update (2022/11/06): no longer sorting, so '???' at index 0 is ok
        if (unknownTypeIndex > -1) {
          updatedValue.splice(unknownTypeIndex, 1);
        }
      } else {
        updatedValue.push('???');
      }

      input?.onChange?.(updatedValue);

      return;
    }

    // note: at this point, we should be in singular type mode (i.e., `multi` is false)
    const currentValue = (inputSource as Showdown.TypeName) || '???';

    // allow the singular type to be "toggled" off
    if (currentValue === value) {
      input?.onChange?.('???');

      return;
    }

    // only close the tooltip if an actual type (not '???') has been selected
    input?.onChange?.(value);
    notifyOptionsClose();
  };

  // not scoped w/ handleChange() to avoid the dumbest type assertions
  const value = multi
    ? [...(inputSource as Showdown.TypeName[] || [])]
    : [inputSource as Showdown.TypeName].filter(Boolean);

  const flatTypeUsages = flattenAlts(typeUsages);

  const allTypes = PokemonTypes.filter((tp) => (
    !!tp
      && tp !== '???'
      && (teraTyping || tp !== 'Stellar')
  ));

  const usageTypes: CalcdexPokemonUsageAlt<Showdown.TypeName>[] = (
    (!typeUsages?.length && [])
      || allTypes.filter((tp) => flatTypeUsages.includes(tp))
  ).map((typeName) => [
    typeName,
    typeUsages.find((tp) => tp?.[0] === typeName)?.[1],
  ] as CalcdexPokemonUsageAlt<Showdown.TypeName>)
    .filter(([, usage]) => (usage || 0) > 0)
    .sort(sortUsageAlts);

  const renderTypeOptionButton = (
    pokemonType: Showdown.TypeName,
    key?: string,
    config?: {
      override?: string;
      reverseColorScheme?: boolean;
      spanAllColumns?: boolean;
    },
  ) => {
    const hasUsage = flatTypeUsages.includes(pokemonType);

    const optionSelected = value.includes(pokemonType);
    const optionHighlighted = !!highlightTypes?.length && highlightTypes.includes(pokemonType);
    const optionDisabled = !optionSelected && value.length > (Math.max(maxMultiTypes, 1) - 1);

    return (
      <BaseButton
        key={key}
        className={cx(
          styles.typeOptionButton,
          config?.spanAllColumns && styles.spanAllColumns,
          !key && hasUsage && styles.withUsage, // using key to distinguish whether we're rendering usage types
          optionSelected && styles.selected,
          optionHighlighted && styles.highlighted,
          optionDisabled && styles.disabled,
        )}
        hoverScale={1}
        disabled={optionDisabled}
        onPress={() => handleChange(pokemonType)}
      >
        <PokeType
          className={styles.typeOption}
          labelClassName={styles.typeOptionLabel}
          type={pokemonType}
          override={config?.override}
          reverseColorScheme={config?.reverseColorScheme}
          highlight={optionSelected}
        />
      </BaseButton>
    );
  };

  // I know this is gross, sorry lol
  const renderType = (
    pokemonType: Showdown.TypeName,
    key?: string,
    config?: {
      reverseColorScheme?: boolean;
      ignoreTeraTyping?: boolean;
      ignoreContainerSize?: boolean;
      highlightRenderedType?: boolean;
      spanAllColumns?: boolean;
    },
  ) => (
    <PokeType
      key={key}
      className={cx(
        styles.typeValue,
        config?.spanAllColumns && styles.spanAllColumns,
      )}
      type={pokemonType}
      defaultLabel={defaultTypeLabel}
      reverseColorScheme={config?.reverseColorScheme}
      teraTyping={config?.ignoreTeraTyping ? undefined : teraTyping}
      containerSize={config?.ignoreContainerSize ? undefined : containerSize}
      highlight={config?.highlightRenderedType ?? highlight}
    />
  );

  return (
    <Tooltip
      className={styles.optionsTooltip}
      content={disabled || readOnly ? null : (
        <div
          className={cx(
            styles.optionsTooltipContainer,
            !!colorScheme && styles[colorScheme],
          )}
        >
          {
            !!title &&
            <div className={styles.optionsTooltipTitle}>
              {title}
            </div>
          }

          {
            !!usageTypes?.length &&
            <div className={cx(styles.optionsTooltipContent, styles.usageTypes)}>
              {usageTypes.map(([
                pokemonType,
                usage,
              ], i) => (
                <div
                  key={`PokeTypeField:${input?.name || '???'}:UsageTypes:Option:${pokemonType || i || '???'}`}
                  className={styles.typeOption}
                >
                  {renderTypeOptionButton(
                    pokemonType,
                    null,
                    { reverseColorScheme: true },
                  )}

                  <div className={styles.typeOptionUsage}>
                    {percentage(usage, usage === 1 ? 0 : 2)}
                  </div>
                </div>
              ))}
            </div>
          }

          <div className={styles.optionsTooltipContent}>
            {allTypes.map((pokemonType, i) => renderTypeOptionButton(
              pokemonType,
              `PokeTypeField:${input?.name || '???'}:AllTypes:Option:${pokemonType || i || '???'}`,
              {
                override: (pokemonType === 'Stellar' && t(`types.${formatId(pokemonType)}.0`)) || null,
                reverseColorScheme: true,
                spanAllColumns: pokemonType === 'Stellar',
              },
            ))}
          </div>

          {
            (!!revealedTypes?.length && !similarArrays(revealedTypes, value)) &&
            <div className={styles.revealedTypes}>
              <div className={cx(styles.optionsTooltipTitle, styles.revealedTypesTitle)}>
                Revealed
              </div>

              <div className={styles.revealedTypesContent}>
                <div className={styles.revealedTypesValue}>
                  {revealedTypes.map((typeValue, i) => renderType(
                    typeValue,
                    `PokeTypeField:${input?.name || '???'}:RevealedType:${i}:${typeValue || '???'}`,
                    {
                      reverseColorScheme: true,
                      ignoreTeraTyping: true,
                      ignoreContainerSize: true,
                      highlightRenderedType: false,
                    },
                  ))}
                </div>

                <ToggleButton
                  className={styles.revealedTypesReset}
                  forceColorScheme={colorScheme === 'light' ? 'dark' : 'light'}
                  label="Reset"
                  // absoluteHover
                  active
                  onPress={() => input?.onChange?.(
                    multi
                      ? revealedTypes
                      : revealedTypes[0],
                  )}
                />
              </div>
            </div>
          }
        </div>
      )}
      visible={optionsVisible}
      interactive
      placement={tooltipPlacement}
      // trigger="mouseenter"
      // delay={[1000, 50]}
      offset={[0, 10]}
      // disabled={optionsVisible ? undefined : disabled}
      onClickOutside={notifyOptionsClose}
    >
      <BaseButton
        ref={containerRef}
        className={cx(
          styles.container,
          !!colorScheme && styles[colorScheme],
          highlight && styles.highlight,
          readOnly && styles.readOnly,
          disabled && styles.disabled,
          className,
        )}
        style={style}
        display="block"
        aria-label={label}
        tabIndex={readOnly || disabled ? -1 : tabIndex}
        hoverScale={1}
        onPress={toggleOptions}
      >
        {value.map((typeValue, i) => renderType(
          typeValue,
          `PokeTypeField:${input?.name || optionsId || '???'}:Value:${i}:${typeValue || '???'}`,
        ))}
      </BaseButton>
    </Tooltip>
  );
});

/* eslint-enable @typescript-eslint/indent */
