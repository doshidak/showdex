import * as React from 'react';
import cx from 'classnames';
import { type TooltipProps, BaseButton, Tooltip } from '@showdex/components/ui';
import { type CalcdexPokemon, useColorScheme } from '@showdex/redux/store';
import { formatId } from '@showdex/utils/core';
import { getDexForFormat } from '@showdex/utils/dex';
import { useUserAgent } from '@showdex/utils/hooks';
import { Picon } from '../Picon';
import styles from './PokeFormeTooltip.module.scss';

export interface PokeFormeTooltipProps {
  className?: string;
  style?: React.CSSProperties;
  format?: string;
  pokemon?: CalcdexPokemon;
  visible?: boolean;
  maxColumns?: number;
  columnWidth?: number;
  disabled?: boolean;
  children?: TooltipProps['children'];
  onPokemonChange?: (pokemon: DeepPartial<CalcdexPokemon>) => void;
  onRequestClose?: () => void;
}

export const PokeFormeTooltip = ({
  className,
  style,
  format,
  pokemon,
  visible,
  maxColumns = 4,
  columnWidth = 53,
  disabled,
  children,
  onPokemonChange,
  onRequestClose,
  ...props
}: PokeFormeTooltipProps): JSX.Element => {
  const dex = getDexForFormat(format);
  const colorScheme = useColorScheme();

  // detect non-macOS cause the Tippy's positioning is really fucked on Windows (and probably Linux)
  const userAgent = useUserAgent();
  const nonMacOS = !['macos', 'ios'].includes(formatId(userAgent?.os?.name));

  const {
    speciesForme,
    transformedForme,
    altFormes,
  } = pokemon || {};

  const altFormesCount = altFormes?.length || 0;
  const formeKey = transformedForme ? 'transformedForme' : 'speciesForme';

  const handleFormePress = (forme: string) => {
    const currentForme = transformedForme || speciesForme;

    // don't fire the callback if the forme is the same
    if (currentForme === forme) {
      return;
    }

    // make sure to close the tooltip once the forme is selected for that good good UX
    onPokemonChange?.({ [formeKey]: forme });
    onRequestClose?.();
  };

  return (
    <Tooltip
      {...props}
      className={styles.tooltipContainer}
      content={(
        <div
          className={cx(
            styles.container,
            !!colorScheme && styles[colorScheme],
            className,
          )}
          style={{
            ...style,
            gridTemplateColumns: `repeat(${Math.min(altFormesCount, maxColumns)}, ${columnWidth}px)`,
          }}
        >
          {altFormes?.map((altForme) => {
            const dexForme = dex?.species.get(altForme);
            const selected = (transformedForme || speciesForme) === altForme;

            return (
              <BaseButton
                key={`PokeFormeTooltip:${speciesForme}:AltForme:${altForme}`}
                className={cx(
                  styles.formeButton,
                  selected && styles.selected,
                )}
                display="block"
                hoverScale={1}
                activeScale={selected ? 0.98 : undefined}
                onPress={() => handleFormePress(altForme)}
              >
                <Picon
                  // className={styles.picon}
                  pokemon={altForme}
                />

                <div className={styles.piconLabel}>
                  {dexForme?.forme || 'Base'}
                </div>
              </BaseButton>
            );
          })}
        </div>
      )}
      visible={visible}
      interactive
      popperOptions={nonMacOS ? { strategy: 'fixed' } : undefined}
      placement="top-start"
      offset={[0, 7]}
      disabled={!speciesForme || !altFormesCount || disabled}
      onClickOutside={onRequestClose}
    >
      {children}
    </Tooltip>
  );
};
