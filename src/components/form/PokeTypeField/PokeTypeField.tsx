import * as React from 'react';
// import { sticky } from 'tippy.js';
import cx from 'classnames';
import { PokeType } from '@showdex/components/app';
import { BaseButton, Tooltip } from '@showdex/components/ui';
import { PokemonTypes } from '@showdex/consts/pokemon';
import { useColorScheme } from '@showdex/redux/store';
import { formatId } from '@showdex/utils/app';
import { useUserAgent } from '@showdex/utils/hooks';
import type { FieldRenderProps } from 'react-final-form';
import type { ButtonElement } from '@showdex/components/ui';
import styles from './PokeTypeField.module.scss';

export interface PokeTypeFieldProps<
  Multi extends boolean = false,
> extends FieldRenderProps<Multi extends true ? Showdown.TypeName[] : Showdown.TypeName, ButtonElement> {
  className?: string;
  style?: React.CSSProperties;
  tabIndex?: number;
  label?: string;
  // tooltip?: React.ReactNode; // needs extra work lol
  // tooltipDisabled?: boolean;
  multi?: boolean;
  maxMultiTypes?: number;
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
  // tooltip,
  // tooltipDisabled,
  multi,
  maxMultiTypes = 2,
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

      // let didUpdate = false;
      const valueIndex = updatedValue.findIndex((t) => t === value);

      // remove an existing type if there are 2 or more,
      // or add a new type if there's only 1 type
      // if (valueIndex > -1 && updatedValue.length > 1) {
      //   updatedValue.splice(valueIndex, 1);
      //   didUpdate = true;
      // } else if (valueIndex < 0 && updatedValue.length < 2) {
      //   updatedValue.push(value);
      //   didUpdate = true;
      // }
      // } else if (valueIndex < 0) {
      //   if (updatedValue.length < 2) {
      //     updatedValue.push(value);
      //   } else {
      //     // const index0 = PokemonTypes.findIndex((t) => t === updatedValue[0]);
      //     const index1 = PokemonTypes.findIndex((t) => t === updatedValue[1]);
      //     const indexValue = PokemonTypes.findIndex((t) => t === value);
      //
      //     // const delta0 = Math.abs(index0 - indexValue);
      //     // const delta1 = Math.abs(index1 - indexValue);
      //     // const replacementIndex = delta0 > delta1 ? 1 : 0;
      //     const replacementIndex = indexValue > index1 ? 1 : 0;
      //
      //     updatedValue[replacementIndex] = value;
      //   }
      //
      //   didUpdate = true;
      // }

      if (valueIndex > -1) {
        updatedValue.splice(valueIndex, 1);
      } else {
        updatedValue.push(value);
      }

      if (updatedValue.length > Math.max(maxMultiTypes, 1)) {
        return;
      }

      if (updatedValue.length) {
        // updatedValue.sort((a, b) => {
        //   const indexA = PokemonTypes.findIndex((t) => t === a);
        //   const indexB = PokemonTypes.findIndex((t) => t === b);
        //
        //   return indexA - indexB;
        // });

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

    const currentValue = (input?.value as Showdown.TypeName) || '???';

    // allow the singular type to be "toggled" off
    if (currentValue === value) {
      input?.onChange?.('???');

      return;
    }

    input?.onChange?.(value);
  };

  // not scoped w/ handleChange() to avoid the dumbest type assertions
  const value = multi
    ? [...(input?.value as Showdown.TypeName[] || [])]
    : [input?.value as Showdown.TypeName].filter(Boolean);

  return (
    <Tooltip
      className={styles.optionsTooltip}
      content={disabled || readOnly ? null : (
        <div
          className={cx(
            styles.optionsTooltipContent,
            !!colorScheme && styles[colorScheme],
          )}
        >
          {PokemonTypes.map((pokemonType, i) => {
            if (pokemonType === '???') {
              return null;
            }

            const optionDisabled = value.length > (Math.max(maxMultiTypes, 1) - 1)
              && !value.includes(pokemonType);

            return (
              <BaseButton
                key={`PokeTypeField:${input?.name || '?'}:Option:${i}:${pokemonType || '?'}`}
                className={cx(
                  styles.typeOptionButton,
                  value.includes(pokemonType) && styles.selected,
                  optionDisabled && styles.disabled,
                )}
                hoverScale={1}
                disabled={optionDisabled}
                onPress={() => handleChange(pokemonType)}
              >
                <PokeType
                  className={styles.typeOption}
                  type={pokemonType}
                  reverseColorScheme
                />
              </BaseButton>
            );
          })}
        </div>
      )}
      // visible={optionsVisible ? true : undefined}
      visible={optionsVisible}
      // interactive={optionsVisible}
      interactive
      popperOptions={nonMacOS ? { strategy: 'fixed' } : undefined}
      placement="top-start"
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
            // reverseColorScheme
          />
        ))}
      </BaseButton>
    </Tooltip>
  );
});

/* eslint-enable @typescript-eslint/indent */
