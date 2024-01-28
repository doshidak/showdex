import * as React from 'react';
import { useTranslation } from 'react-i18next';
import cx from 'classnames';
import { type PiconButtonProps, PiconButton, PokeGlance } from '@showdex/components/app';
import { type ButtonElement } from '@showdex/components/ui';
import { type CalcdexOperatingMode, type CalcdexPlayer, type CalcdexPokemon } from '@showdex/interfaces/calc';
import { useColorScheme } from '@showdex/redux/store';
import { calcPokemonCurrentHp } from '@showdex/utils/calc';
import styles from './PlayerPiconButton.module.scss';

export interface PlayerPiconButtonProps extends Pick<PiconButtonProps, 'nativeProps' | 'onPress' | 'onContextMenu'> {
  className?: string;
  style?: React.CSSProperties;
  player: CalcdexPlayer;
  pokemon: Partial<CalcdexPokemon> | string | number;
  operatingMode?: CalcdexOperatingMode;
  format?: string;
  showNickname?: boolean;
  dragging?: boolean;
  itemIndex?: number;
}

export const PlayerPiconButton = React.forwardRef<ButtonElement, PlayerPiconButtonProps>(({
  className,
  style,
  player,
  pokemon: searchString,
  operatingMode,
  format,
  showNickname,
  dragging,
  itemIndex,
  nativeProps,
  onPress,
  onContextMenu,
}, forwardedRef): JSX.Element => {
  const { t } = useTranslation('calcdex');
  const colorScheme = useColorScheme();

  const { pokemon: playerParty, selectionIndex } = player || {};
  const selectedPokemon = playerParty?.[selectionIndex];

  const partyIndex = typeof searchString === 'number'
    ? searchString
    : playerParty?.findIndex((p) => p?.calcdexId === (
      typeof searchString === 'string'
        ? searchString
        : searchString?.calcdexId
    ));

  const pokemon = playerParty?.[partyIndex];

  const pokemonKey = pokemon?.calcdexId
    || pokemon?.ident
    || pokemon?.searchid
    || pokemon?.details
    || pokemon?.name
    || pokemon?.speciesForme;

  const friendlyPokemonName = pokemon?.speciesForme
    || pokemon?.name
    || pokemonKey;

  // don't show transformedForme here, as requested by camdawgboi
  const speciesForme = pokemon?.speciesForme;
  const hp = calcPokemonCurrentHp(pokemon);
  const item = pokemon?.dirtyItem ?? pokemon?.item;

  const selected = (
    operatingMode === 'standalone'
      && (selectionIndex ?? -1) > -1
      && (itemIndex ?? partyIndex) === selectionIndex
  ) || (
    !!pokemon?.calcdexId
      && !!selectedPokemon?.calcdexId
      && selectedPokemon.calcdexId === pokemon.calcdexId
  );

  const disabled = operatingMode === 'battle' && !pokemon?.speciesForme;

  return (
    <PiconButton
      ref={forwardedRef}
      className={cx(
        styles.container,
        !!colorScheme && styles[colorScheme],
        pokemon?.active && styles.active,
        selected && styles.selected,
        !hp && styles.fainted,
        className,
      )}
      style={style}
      piconClassName={cx(
        styles.picon,
        !pokemon?.speciesForme && styles.none,
      )}
      display="block"
      aria-label={t('player.party.aria', { pokemon: friendlyPokemonName })}
      pokemon={speciesForme ? {
        ...pokemon,
        speciesForme: speciesForme?.replace(pokemon?.useMax ? '' : '-Gmax', ''),
        item,
      } : 'pokeball-none'}
      tooltip={pokemon?.speciesForme ? (
        <PokeGlance
          className={styles.glanceTooltip}
          pokemon={pokemon}
          format={format}
          showNickname={showNickname}
          showAbility={operatingMode === 'standalone' || pokemon?.abilityToggled}
          showItem
          showStatus
          reverseColorScheme
        />
      ) : undefined}
      tooltipPlacement="top"
      tooltipOffset={[0, -4]}
      tooltipDisabled={dragging}
      draggable={operatingMode === 'standalone' && !!pokemon?.speciesForme}
      nativeProps={operatingMode === 'standalone' ? {
        ...nativeProps,
        onClick: () => onPress?.(null),
      } : undefined}
      disabled={disabled}
      onPress={operatingMode !== 'standalone' || !pokemon?.speciesForme ? onPress : undefined}
      onContextMenu={onContextMenu}
    >
      <div
        className={cx(
          styles.piconBackground,
          !!colorScheme && styles[colorScheme],
        )}
      />

      {
        (operatingMode === 'standalone' && !pokemon?.speciesForme && !dragging) &&
        <div className={styles.piconAdd}>
          <i className="fa fa-plus" />
        </div>
      }
    </PiconButton>
  );
});
