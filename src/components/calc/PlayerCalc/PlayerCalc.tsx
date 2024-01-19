import * as React from 'react';
import { useTranslation } from 'react-i18next';
import cx from 'classnames';
import { PiconButton, PokeGlance } from '@showdex/components/app';
import { ContextMenu, useContextMenu } from '@showdex/components/ui';
import { type DropdownOption } from '@showdex/components/form';
import { type CalcdexPlayerKey } from '@showdex/interfaces/calc';
import { useColorScheme } from '@showdex/redux/store';
import { calcPokemonCurrentHp } from '@showdex/utils/calc';
import { env } from '@showdex/utils/core';
import { logger } from '@showdex/utils/debug';
import { useRandomUuid } from '@showdex/utils/hooks';
import { CalcdexPokeProvider } from '../CalcdexPokeContext';
import { useCalcdexContext } from '../CalcdexContext';
import { PlayerInfo } from '../PlayerInfo';
import { PokeCalc } from '../PokeCalc';
import styles from './PlayerCalc.module.scss';

export interface PlayerCalcProps {
  className?: string;
  style?: React.CSSProperties;
  position?: 'top' | 'bottom';
  playerKey?: CalcdexPlayerKey;
  defaultName?: string;
  playerOptions?: DropdownOption<CalcdexPlayerKey>[];
  mobile?: boolean;
}

const l = logger('@showdex/components/calc/PlayerCalc');

export const PlayerCalc = ({
  className,
  style,
  position = 'top',
  playerKey = 'p1',
  defaultName = '--',
  playerOptions,
  mobile,
}: PlayerCalcProps): JSX.Element => {
  const { t } = useTranslation('calcdex');
  const colorScheme = useColorScheme();

  const {
    state,
    settings,
    removePokemon,
    dupePokemon,
    selectPokemon,
    activatePokemon,
  } = useCalcdexContext();

  const {
    operatingMode,
    renderMode,
    containerSize,
    format,
    gameType,
  } = state;

  const minPokemonKey = (operatingMode === 'battle' && 'calcdex-player-min-pokemon')
    || (operatingMode === 'standalone' && 'honkdex-player-min-pokemon')
    || null;

  const minPokemon = (!!minPokemonKey && env.int(minPokemonKey)) || 0;

  const {
    pokemon: playerParty,
    maxPokemon,
    activeIndices: playerActives,
    selectionIndex: playerIndex,
  } = state[playerKey] || {};

  const playerPokemon = playerParty?.[playerIndex];

  const {
    show: showContextMenu,
    hideAfter,
  } = useContextMenu();

  const piconMenuId = useRandomUuid();
  const [contextPiconId, setContextPiconId] = React.useState<string>(null);

  const contextPokemonIndex = React.useMemo(() => (
    contextPiconId
      ? playerParty.findIndex((p) => p?.calcdexId === contextPiconId)
      : null
  ), [
    contextPiconId,
    playerParty,
  ]);

  const contextPokemon = (contextPokemonIndex ?? -1) > -1
    && playerParty[contextPokemonIndex];

  return (
    <div
      className={cx(
        styles.container,
        !!colorScheme && styles[colorScheme],
        containerSize === 'xs' && styles.verySmol,
        ['xs', 'sm'].includes(containerSize) && styles.smol,
        ['md', 'lg', 'xl'].includes(containerSize) && styles.big,
        containerSize === 'xl' && styles.veryThicc,
        (mobile && renderMode === 'overlay') && styles.mobileOverlay,
        operatingMode === 'standalone' && styles.standalone,
        className,
      )}
      style={style}
    >
      <div className={styles.playerBar}>
        {
          operatingMode === 'battle' &&
          <PlayerInfo
            className={styles.playerInfo}
            position={position}
            playerKey={playerKey}
            defaultName={defaultName}
            playerOptions={playerOptions}
            mobile={mobile}
          />
        }

        <div className={styles.teamList}>
          {Array(Math.max(maxPokemon || 0, minPokemon)).fill(null).map((_, i) => {
            const pokemon = playerParty?.[i];

            const pokemonKey = pokemon?.calcdexId
              || pokemon?.ident
              || pokemon?.searchid
              || pokemon?.details
              || pokemon?.name
              || pokemon?.speciesForme
              || String(i);

            const friendlyPokemonName = pokemon?.speciesForme
              || pokemon?.name
              || pokemonKey;

            const speciesForme = pokemon?.speciesForme; // don't show transformedForme here, as requested by camdawgboi
            const hp = calcPokemonCurrentHp(pokemon);
            const item = pokemon?.dirtyItem ?? pokemon?.item;

            const pokemonSelected = (
              operatingMode === 'standalone'
                && (playerIndex ?? -1) > -1
                && i === playerIndex
            ) || (
              !!pokemon?.calcdexId
                && !!playerPokemon?.calcdexId
                && playerPokemon.calcdexId === pokemon.calcdexId
            );

            const disabled = operatingMode === 'battle' && !pokemon?.speciesForme;

            return (
              <PiconButton
                key={`PlayerCalc:Picon:${playerKey}:${pokemonKey}`}
                className={cx(
                  styles.piconButton,
                  pokemon?.active && styles.active,
                  pokemonSelected && styles.selected,
                  !hp && styles.fainted,
                )}
                piconClassName={cx(
                  styles.picon,
                  !pokemon?.speciesForme && styles.none,
                )}
                display="block"
                aria-label={t('player.party.aria', { pokemon: friendlyPokemonName })}
                pokemon={pokemon?.speciesForme ? {
                  ...pokemon,
                  speciesForme: speciesForme?.replace(pokemon?.useMax ? '' : '-Gmax', ''),
                  item,
                } : 'pokeball-none'}
                tooltip={pokemon?.speciesForme ? (
                  <PokeGlance
                    className={styles.glanceTooltip}
                    pokemon={pokemon}
                    format={format}
                    showNickname={settings?.showNicknames}
                    showAbility={operatingMode === 'standalone' || pokemon?.abilityToggled}
                    showItem
                    showStatus
                    reverseColorScheme
                  />
                ) : undefined}
                tooltipPlacement="top"
                tooltipOffset={[0, -4]}
                disabled={disabled}
                onPress={() => selectPokemon(
                  playerKey,
                  i,
                  `${l.scope}:PiconButton~SelectionIndex:onPress()`,
                )}
                onContextMenu={(e) => {
                  if (operatingMode !== 'standalone' || !pokemon?.calcdexId) {
                    return;
                  }

                  showContextMenu?.({ id: piconMenuId, event: e });
                  setContextPiconId(pokemon.calcdexId);
                  e.stopPropagation();
                }}
              >
                <div className={styles.piconBackground} />

                {
                  (operatingMode === 'standalone' && !pokemon?.speciesForme) &&
                  <div className={styles.piconAdd}>
                    <i className="fa fa-plus" />
                  </div>
                }
              </PiconButton>
            );
          })}
        </div>
      </div>

      <CalcdexPokeProvider playerKey={playerKey}>
        <PokeCalc
          className={styles.pokeCalc}
        />
      </CalcdexPokeProvider>

      <ContextMenu
        id={piconMenuId}
        itemKeyPrefix="PlayerCalc:Picon:ContextMenu"
        items={[
          {
            key: 'select-pokemon',
            entity: 'item',
            props: {
              label: 'Select',
              icon: 'fa-mouse-pointer',
              hidden: contextPokemon?.calcdexId === playerParty?.[playerIndex]?.calcdexId,
              disabled: typeof contextPokemonIndex !== 'number',
              onPress: hideAfter(() => selectPokemon(playerKey, contextPokemonIndex)),
            },
          },
          {
            key: 'active-pokemon',
            entity: 'item',
            props: {
              theme: contextPokemon?.active ? 'info' : 'default',
              label: 'Active',
              icon: contextPokemon?.active ? 'ghost-boo' : 'ghost-smile',
              iconStyle: { strokeWidth: 2.5, transform: 'scale(1.2)' },
              disabled: typeof contextPokemonIndex !== 'number',
              onPress: hideAfter(() => {
                const indices = [...(playerActives || [])]
                  .filter((i) => contextPokemonIndex !== i || !contextPokemon.active);

                if (!contextPokemon.active && !indices.includes(contextPokemonIndex)) {
                  indices.push(contextPokemonIndex);
                }

                activatePokemon(playerKey, indices.slice(-(gameType === 'Doubles' ? 2 : 1)));
              }),
            },
          },
          {
            key: 'new-pokemon',
            entity: 'item',
            props: {
              label: 'New',
              icon: 'fa-plus',
              hidden: !contextPokemon?.calcdexId,
              onPress: hideAfter(() => selectPokemon(playerKey, playerParty.length)),
            },
          },
          {
            key: 'dupe-pokemon',
            entity: 'item',
            props: {
              label: 'Duplicate',
              icon: 'copy-plus',
              iconStyle: { strokeWidth: 2.5, transform: 'scale(1.2)' },
              disabled: !contextPokemon?.calcdexId,
              onPress: hideAfter(() => dupePokemon(playerKey, contextPokemon)),
            },
          },
          {
            key: 'delete-separator',
            entity: 'separator',
          },
          {
            key: 'delete-pokemon',
            entity: 'item',
            props: {
              theme: 'error',
              label: 'Delete',
              icon: 'fa-times-circle',
              disabled: !contextPokemon?.calcdexId,
              onPress: hideAfter(() => removePokemon(playerKey, contextPokemon)),
            },
          },
        ]}
        disabled={operatingMode === 'standalone'}
      />
    </div>
  );
};
