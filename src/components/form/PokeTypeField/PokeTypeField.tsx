import * as React from 'react';
// import { sticky } from 'tippy.js';
import cx from 'classnames';
import { PokeType } from '@showdex/components/app';
import { BaseButton, Tooltip } from '@showdex/components/ui';
import { PokemonTypes } from '@showdex/consts/pokemon';
import { useColorScheme } from '@showdex/redux/store';
import { formatId } from '@showdex/utils/app';
import { flattenAlts } from '@showdex/utils/battle';
import { useUserAgent } from '@showdex/utils/hooks';
import { percentage } from '@showdex/utils/humanize';
import { sortUsageAlts } from '@showdex/utils/redux';
import type { FieldRenderProps } from 'react-final-form';
import type { ButtonElement, TooltipProps } from '@showdex/components/ui';
import type { CalcdexPokemonUsageAlt } from '@showdex/redux/store';
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
  // teraTyping?: boolean;
  shorterAbbreviations?: boolean;
  highlight?: boolean;
  highlightTypes?: Showdown.TypeName[];
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
  tooltipPlacement = 'top-start',
  // tooltipDisabled,
  multi,
  maxMultiTypes = 2,
  defaultTypeLabel,
  // teraTyping,
  shorterAbbreviations,
  highlight = true,
  highlightTypes,
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

  // detect non-macOS cause the Tippy's positioning is really fucked on Windows (and probably Linux)
  const userAgent = useUserAgent();
  const nonMacOS = !['macos', 'ios'].includes(formatId(userAgent?.os?.name));

  // keep track of whether the options tooltip is open
  const [optionsVisible, setOptionsVisible] = React.useState(false);

  const colorScheme = useColorScheme();

  const handleChange = (value: Showdown.TypeName) => {
    if (multi) {
      const updatedValue: Showdown.TypeName[] = [
        ...((input?.value as Showdown.TypeName[]) || []),
      ];

      const valueIndex = updatedValue.findIndex((t) => t === value);

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
        const unknownTypeIndex = updatedValue.findIndex((t) => t === '???');

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
    const currentValue = (input?.value as Showdown.TypeName) || '???';

    // allow the singular type to be "toggled" off
    if (currentValue === value) {
      input?.onChange?.('???');

      return;
    }

    // only close the tooltip if an actual type (not '???') has been selected
    input?.onChange?.(value);
    setOptionsVisible(false);
  };

  // not scoped w/ handleChange() to avoid the dumbest type assertions
  const value = multi
    ? [...(input?.value as Showdown.TypeName[] || [])]
    : [input?.value as Showdown.TypeName].filter(Boolean);

  const flatTypeUsages = flattenAlts(typeUsages);
  const allTypes = PokemonTypes.filter((t) => !!t && t !== '???');

  const usageTypes: CalcdexPokemonUsageAlt<Showdown.TypeName>[] = (
    (!typeUsages?.length && [])
      || allTypes.filter((t) => flatTypeUsages.includes(t))
  ).map((typeName) => [
    typeName,
    typeUsages.find((t) => t?.[0] === typeName)?.[1],
  ] as CalcdexPokemonUsageAlt<Showdown.TypeName>)
    .filter(([, usage]) => (usage || 0) > 0)
    .sort(sortUsageAlts);

  // const gridTypes = (!typeUsages?.length && allTypes)
  //   || allTypes.filter((t) => !flatTypeUsages.includes(t));

  const renderTypeOptionButton = (
    pokemonType: Showdown.TypeName,
    key?: string,
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
          className={styles.typeOptionType}
          type={pokemonType}
          reverseColorScheme
          highlight={optionSelected}
        />
      </BaseButton>
    );
  };

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
                  key={`PokeTypeField:${input?.name || '?'}:UsageTypes:Option:${pokemonType || i || '?'}`}
                  className={styles.typeOption}
                >
                  {renderTypeOptionButton(pokemonType)}

                  <div className={styles.typeOptionUsage}>
                    {percentage(usage, 2)}
                  </div>
                </div>
              ))}
            </div>
          }

          <div className={styles.optionsTooltipContent}>
            {allTypes.map((pokemonType, i) => renderTypeOptionButton(
              pokemonType,
              `PokeTypeField:${input?.name || '?'}:AllTypes:Option:${pokemonType || i || '?'}`,
            ))}
          </div>
        </div>
      )}
      // visible={optionsVisible ? true : undefined}
      visible={optionsVisible}
      // interactive={optionsVisible}
      interactive
      popperOptions={nonMacOS ? { strategy: 'fixed' } : undefined}
      placement={tooltipPlacement}
      // trigger="mouseenter"
      // delay={[1000, 50]}
      offset={[0, 10]}
      // plugins={[sticky]}
      // sticky="popper"
      // disabled={optionsVisible ? undefined : disabled}
      onClickOutside={() => setOptionsVisible(false)}
    >
      <BaseButton
        ref={containerRef}
        className={cx(
          styles.container,
          !!colorScheme && styles[colorScheme],
          // teraTyping && styles.teraTyping,
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
        onPress={() => setOptionsVisible(!optionsVisible)}
      >
        {value.map((typeValue, i) => (
          <PokeType
            key={`PokeTypeField:${input?.name || '?'}:Value:${i}:${typeValue || '?'}`}
            className={styles.typeValue}
            type={typeValue}
            defaultLabel={defaultTypeLabel}
            // reverseColorScheme
            shorterAbbreviations={shorterAbbreviations}
            highlight={highlight}
          />
        ))}
      </BaseButton>
    </Tooltip>
  );
});

/* eslint-enable @typescript-eslint/indent */
