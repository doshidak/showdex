import * as React from 'react';
import { useTranslation } from 'react-i18next';
import cx from 'classnames';
import { type TooltipProps, BaseButton, Tooltip } from '@showdex/components/ui';
import { type CalcdexPokemon } from '@showdex/interfaces/calc';
import { useColorScheme } from '@showdex/redux/store';
import { formatId } from '@showdex/utils/core';
import { getDexForFormat } from '@showdex/utils/dex';
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
  onPokemonChange?: (pokemon: Partial<CalcdexPokemon>) => void;
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
  const { t } = useTranslation('pokedex');
  const dex = getDexForFormat(format);
  const colorScheme = useColorScheme();

  const {
    speciesForme,
    transformedForme,
    altFormes,
  } = pokemon || {};

  const altFormesCount = altFormes?.length || 0;
  const formeKey = transformedForme ? 'transformedForme' : 'speciesForme';
  const currentForme = transformedForme || speciesForme;

  const dexForme = dex.species.get(currentForme);
  const baseForme = (dexForme?.exists && dexForme.baseSpecies) || null;
  const tBaseForme = t(`pokedex:species.${formatId(baseForme)}`, baseForme);

  const handleFormePress = (
    forme: string,
  ) => {
    // don't fire the callback if the forme is the same
    if (currentForme?.replace('-Tera', '') === forme) {
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
            if (!altForme || !altForme.startsWith(baseForme) || altForme.endsWith('-Tera')) {
              return null;
            }

            // const dexAltForme = dex?.species.get(altForme);
            const tAltForme = t(`pokedex:species.${formatId(altForme)}`, altForme);
            const formeName = tBaseForme === tAltForme
              ? t('common:labels.base', tBaseForme)
              : tAltForme.replace(`${tBaseForme}-`, '');

            const selected = currentForme?.replace('-Tera', '') === altForme;

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
                  {formeName}
                </div>
              </BaseButton>
            );
          })}
        </div>
      )}
      visible={visible}
      interactive
      placement="top-start"
      offset={[0, 7]}
      disabled={!speciesForme || !altFormesCount || disabled}
      onClickOutside={onRequestClose}
    >
      {children}
    </Tooltip>
  );
};
