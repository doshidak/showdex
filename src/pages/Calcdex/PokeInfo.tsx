import * as React from 'react';
import cx from 'classnames';
import {
  PiconButton,
  PokeHpBar,
  PokeStatus,
  PokeType,
  useColorScheme,
} from '@showdex/components/app';
import { Dropdown } from '@showdex/components/form';
import { Button } from '@showdex/components/ui';
import {
  PokemonCommonNatures,
  PokemonNatureBoosts,
  PokemonToggleAbilities,
} from '@showdex/consts';
import { openSmogonUniversity } from '@showdex/utils/app';
import type { AbilityName, ItemName } from '@pkmn/data';
import type { GenerationNum } from '@pkmn/types';
import type { CalcdexPokemon } from './CalcdexReducer';
import { calcPokemonHp } from './calcPokemonHp';
import { detectToggledAbility } from './detectToggledAbility';
import styles from './PokeInfo.module.scss';

export interface PokeInfoProps {
  className?: string;
  style?: React.CSSProperties;
  gen?: GenerationNum;
  format?: string;
  pokemon: CalcdexPokemon;
  onPokemonChange?: (pokemon: Partial<CalcdexPokemon>) => void;
}

export const PokeInfo = ({
  className,
  style,
  gen,
  format,
  pokemon,
  onPokemonChange,
}: PokeInfoProps): JSX.Element => {
  const colorScheme = useColorScheme();

  const pokemonKey = pokemon?.calcdexId || pokemon?.name || '???';
  const friendlyPokemonName = pokemon?.speciesForme || pokemon?.name || pokemonKey;

  const currentHp = calcPokemonHp(pokemon);

  return (
    <div
      className={cx(
        styles.container,
        !!colorScheme && styles[colorScheme],
        className,
      )}
      style={style}
    >
      <div className={styles.row}>
        <div className={styles.piconContainer}>
          <PiconButton
            piconStyle={pokemon?.name ? { transform: 'scaleX(-1)' } : undefined}
            pokemon={{
              ...pokemon,
              speciesForme: pokemon?.rawSpeciesForme ?? pokemon?.speciesForme,
              item: pokemon?.dirtyItem ?? pokemon?.item,
            }}
            tooltip="Open Smogon Page"
            disabled={!pokemon?.speciesForme}
            onPress={() => openSmogonUniversity(
              gen,
              'pokemon',
              pokemon?.speciesForme,
              format,
            )}
          />
        </div>

        <div className={styles.infoContainer}>
          <div style={{ marginBottom: 1 }}>
            <span className={styles.pokemonName}>
              {pokemon?.name || '--'}
            </span>

            <span className={styles.small}>
              {
                (typeof pokemon?.level === 'number' && pokemon.level !== 100) &&
                <>
                  {' '}
                  <span style={{ opacity: 0.5 }}>
                    L{pokemon.level}
                  </span>
                </>
              }

              {
                !!pokemon?.types?.length &&
                <span style={{ userSelect: 'none' }}>
                  {' '}
                  {pokemon.types.map((type, i) => (
                    <PokeType
                      key={`PokeInfo:PokeType:${pokemonKey}:${type}`}
                      style={pokemon.types.length > 1 && i === 0 ? { marginRight: 2 } : null}
                      type={type}
                    />
                  ))}
                </span>
              }
            </span>
          </div>

          <div style={{ userSelect: 'none' }}>
            {/* <span className={styles.label}>
              HP{' '}
            </span> */}

            <PokeHpBar
              className={styles.hpBar}
              hp={currentHp}
            />

            {
              !!currentHp &&
              <span className={styles.currentHp}>
                {' '}
                {`${(currentHp * 100).toFixed(0)}%`}
              </span>
            }

            {
              (!!pokemon && (!!pokemon.status || pokemon.fainted || !currentHp)) &&
              <span>
                {' '}
                <PokeStatus
                  status={pokemon?.status}
                  fainted={pokemon?.fainted || !currentHp}
                />
              </span>
            }
          </div>
        </div>

        <div className={styles.presetContainer}>
          <div className={cx(styles.label, styles.dropdownLabel)}>
            Set

            {' '}
            <Button
              className={cx(
                styles.infoButton,
                styles.autoPresetButton,
              )}
              labelClassName={cx(
                styles.infoButtonLabel,
                styles.toggleButtonLabel,
                !pokemon?.autoPreset && styles.inactive,
              )}
              label="Auto"
              absoluteHover
              // disabled={!pokemon?.presets?.length}
              disabled /** @todo remove this after implementing auto-presets */
              onPress={() => onPokemonChange?.({
                autoPreset: !pokemon?.autoPreset,
              })}
            />
          </div>

          <Dropdown
            aria-label={`Available Sets for Pokemon ${friendlyPokemonName}`}
            hint="None"
            input={{
              name: `PokeInfo:Preset:${pokemonKey}`,
              value: pokemon?.preset,
              onChange: (calcdexId: string) => {
                const preset = pokemon.presets
                  .find((p) => p?.calcdexId === calcdexId);

                if (!preset) {
                  return;
                }

                onPokemonChange?.({
                  preset: calcdexId,
                  ivs: preset.ivs,
                  evs: preset.evs,
                  moves: preset.moves,
                  altMoves: preset.altMoves,
                  nature: preset.nature,
                  dirtyAbility: pokemon.ability !== preset.ability ? preset.ability : null,
                  altAbilities: preset.altAbilities,
                  altItems: preset.altItems,
                  item: !pokemon.item || pokemon.item === '(exists)' ? preset.item : pokemon.item,
                  dirtyItem: pokemon.item && pokemon.item !== '(exists)' && pokemon.item !== preset.item ? preset.item : null,
                });
              },
            }}
            options={pokemon?.presets?.filter((p) => p?.calcdexId).map((p) => ({
              label: p?.name,
              value: p?.calcdexId,
            }))}
            noOptionsMessage="No Sets"
            clearable={false}
            disabled={!pokemon?.speciesForme || !pokemon?.presets?.length}
          />
        </div>
      </div>

      <div
        className={styles.row}
        style={{ alignItems: 'flex-start' }}
      >
        <div className={styles.rowItem}>
          <div className={cx(styles.label, styles.dropdownLabel)}>
            Ability

            {
              PokemonToggleAbilities.includes(pokemon?.dirtyAbility ?? pokemon?.ability) &&
              <>
                {' '}
                <Button
                  className={cx(
                    styles.infoButton,
                    styles.abilityButton,
                  )}
                  labelClassName={cx(
                    styles.infoButtonLabel,
                    styles.toggleButtonLabel,
                    !pokemon.abilityToggled && styles.inactive,
                  )}
                  label="Active"
                  tooltip={`${pokemon.abilityToggled ? 'Deactivate' : 'Activate'} Ability`}
                  absoluteHover
                  onPress={() => onPokemonChange?.({
                    abilityToggled: !pokemon.abilityToggled,
                  })}
                />
              </>
            }

            {
              !!pokemon?.dirtyAbility &&
              <>
                {' '}
                <Button
                  className={cx(styles.infoButton, styles.abilityButton)}
                  labelClassName={styles.infoButtonLabel}
                  label="Reset"
                  absoluteHover
                  onPress={() => onPokemonChange?.({
                    dirtyAbility: null,
                    abilityToggled: detectToggledAbility(pokemon),
                  })}
                />
              </>
            }
          </div>

          <Dropdown
            aria-label={`Available Abilities for Pokemon ${friendlyPokemonName}`}
            hint="???"
            input={{
              name: `PokeInfo:Ability:${pokemonKey}`,
              value: pokemon?.dirtyAbility ?? pokemon?.ability,
              onChange: (ability: AbilityName) => onPokemonChange?.({
                dirtyAbility: ability,
                abilityToggled: detectToggledAbility({
                  ...pokemon,
                  ability,
                }),
              }),
            }}
            options={[!!pokemon?.altAbilities?.length && {
              label: 'Pool',
              options: pokemon.altAbilities.map((ability) => ({
                label: ability,
                value: ability,
              })),
            }, pokemon?.baseAbility === 'Trace' && pokemon.ability !== pokemon.baseAbility && {
              label: 'Traced',
              options: [{ label: pokemon.ability, value: pokemon.ability }],
            }, !!pokemon?.abilities?.length && {
              label: 'Other', /** @todo not saying 'All' since this isn't AAA (almost any ability) */
              options: pokemon.abilities
                .filter((a) => !!a && (!pokemon.altAbilities.length || !pokemon.altAbilities.includes(a)))
                .map((ability) => ({ label: ability, value: ability })),
            }].filter(Boolean)}
            noOptionsMessage="No Abilities"
            clearable={false}
            disabled={!pokemon?.speciesForme}
          />
        </div>

        <div className={styles.rowItem}>
          <div className={cx(styles.label, styles.dropdownLabel)}>
            Nature
          </div>

          <Dropdown
            aria-label={`Available Natures for Pokemon ${friendlyPokemonName}`}
            hint="???"
            input={{
              name: `PokeInfo:Nature:${pokemonKey}`,
              value: pokemon?.nature,
              onChange: (nature: Showdown.PokemonNature) => onPokemonChange?.({
                nature,
              }),
            }}
            options={PokemonCommonNatures.map((nature) => ({
              label: nature,
              subLabel: PokemonNatureBoosts[nature]?.length ? [
                !!PokemonNatureBoosts[nature][0] && `+${PokemonNatureBoosts[nature][0].toUpperCase()}`,
                !!PokemonNatureBoosts[nature][1] && `-${PokemonNatureBoosts[nature][1].toUpperCase()}`,
              ].filter(Boolean).join(' ') : 'Neutral',
              value: nature,
            }))}
            noOptionsMessage="No Natures"
            clearable={false}
            // hideSelections
            disabled={!pokemon?.speciesForme}
          />
        </div>

        <div className={styles.rowItem}>
          <div className={cx(styles.label, styles.dropdownLabel)}>
            Item

            {
              // (!!pokemon?.dirtyItem || (pokemon?.dirtyItem === '' && !!pokemon?.item)) &&
              (!!pokemon?.dirtyItem && (!!pokemon?.item || !!pokemon?.prevItem) && ((pokemon?.item || pokemon?.prevItem) !== pokemon?.dirtyItem)) &&
              <>
                {' '}
                <Button
                  className={cx(styles.infoButton, styles.abilityButton)}
                  labelClassName={styles.infoButtonLabel}
                  label="Reset"
                  tooltip="Reset to Actual Item"
                  absoluteHover
                  onPress={() => onPokemonChange?.({
                    dirtyItem: null,
                  })}
                />
              </>
            }
          </div>

          <Dropdown
            aria-label={`Available Items for Pokemon ${friendlyPokemonName}`}
            hint="None"
            tooltip={pokemon?.itemEffect || pokemon?.prevItem ? (
              <div className={styles.itemTooltip}>
                {
                  !!pokemon?.itemEffect &&
                  <div className={styles.label}>
                    {pokemon.itemEffect}
                  </div>
                }
                {
                  !!pokemon?.prevItem &&
                  <>
                    <div className={styles.label}>
                      {pokemon.prevItemEffect || 'Previous'}
                    </div>
                    <div>
                      {pokemon.prevItem}
                    </div>
                  </>
                }
              </div>
            ) : null}
            input={{
              name: `PokeInfo:Item:${pokemonKey}`,
              value: pokemon?.dirtyItem ?? pokemon?.item,
              onChange: (item: ItemName) => onPokemonChange?.({
                dirtyItem: item ?? ('' as ItemName),
              }),
            }}
            options={[!!pokemon?.altItems?.length && {
              label: 'Pool',
              options: pokemon.altItems.map((item) => ({
                label: item,
                value: item,
              })),
            }, !!BattleItems && {
              label: 'All',
              options: Object.values(BattleItems)
                .filter((i) => i?.name && (!pokemon?.altItems?.length || !pokemon.altItems.includes(i.name as ItemName)))
                .map((item) => ({ label: item.name, value: item.name })),
            }].filter(Boolean)}
            noOptionsMessage="No Items"
            disabled={!pokemon?.speciesForme}
          />
        </div>
      </div>
    </div>
  );
};
