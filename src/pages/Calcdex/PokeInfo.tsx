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
  FormatLabels,
  PokemonCommonNatures,
  PokemonNatureBoosts,
  // PokemonToggleAbilities,
} from '@showdex/consts';
import { openSmogonUniversity } from '@showdex/utils/app';
import { buildAbilityOptions, detectToggledAbility } from '@showdex/utils/battle';
import { calcPokemonHp } from '@showdex/utils/calc';
import type {
  AbilityName,
  Generation,
  GenerationNum,
  ItemName,
} from '@pkmn/data';
import type { CalcdexPokemon, CalcdexPokemonPreset } from '@showdex/redux/store';
import { usePresets } from './usePresets';
import styles from './PokeInfo.module.scss';

type PokeInfoPresetOptions = {
  label: string;
  options: {
    label: string;
    value: string;
  }[];
}[];

export interface PokeInfoProps {
  className?: string;
  style?: React.CSSProperties;
  dex?: Generation;
  gen?: GenerationNum;
  format?: string;
  pokemon: CalcdexPokemon;
  onPokemonChange?: (pokemon: DeepPartial<CalcdexPokemon>) => void;
}

/* eslint-disable no-nested-ternary */

export const PokeInfo = ({
  className,
  style,
  dex,
  gen,
  format,
  pokemon,
  onPokemonChange,
}: PokeInfoProps): JSX.Element => {
  const colorScheme = useColorScheme();

  const findPresets = usePresets({
    format,
  });

  const downloadedSets = React.useMemo(
    () => (pokemon?.speciesForme ? findPresets(pokemon.transformedForme || pokemon.speciesForme, true) : []),
    [findPresets, pokemon],
  );

  const presets = React.useMemo(() => [
    ...(pokemon?.presets || []),
    ...downloadedSets,
  ], [
    downloadedSets,
    pokemon?.presets,
  ]);

  const presetOptions = presets.reduce<PokeInfoPresetOptions>((options, preset) => {
    const genlessFormat = preset.format.replace(`gen${gen}`, '');
    const groupLabel = FormatLabels?.[genlessFormat] || genlessFormat;
    const group = options.find((option) => option.label === groupLabel);

    const option = {
      label: preset.name,
      value: preset.calcdexId,
    };

    if (!group) {
      options.push({
        label: groupLabel,
        options: [option],
      });
    } else {
      group.options.push(option);
    }

    return options;
  }, []);

  const applyPreset = React.useCallback((preset: CalcdexPokemonPreset) => {
    const mutation: DeepPartial<CalcdexPokemon> = {
      preset: preset.calcdexId,
      moves: preset.moves,
      altMoves: preset.altMoves,
      nature: preset.nature,
      dirtyAbility: pokemon.ability !== preset.ability ? preset.ability : null,
      item: !pokemon.item || pokemon.item === '(exists)' ? preset.item : pokemon.item,
      dirtyItem: pokemon.item && pokemon.item !== '(exists)' && pokemon.item !== preset.item ? preset.item : null,
      ivs: { ...preset.ivs },
      evs: { // not specifying the 0's may cause any unspecified EVs to remain!
        hp: preset.evs?.hp || 0,
        atk: preset.evs?.atk || 0,
        def: preset.evs?.def || 0,
        spa: preset.evs?.spa || 0,
        spd: preset.evs?.spd || 0,
        spe: preset.evs?.spe || 0,
      },
    };

    if (Array.isArray(preset.altAbilities)) {
      mutation.altAbilities = [...preset.altAbilities];
    }

    if (Array.isArray(preset.altItems)) {
      mutation.altItems = [...preset.altItems];
    }

    if (preset.format?.includes('random')) {
      mutation.ability = preset.ability;
      mutation.dirtyAbility = null;

      mutation.item = preset.item;
      mutation.dirtyItem = null;
    }

    // spreadStats will be recalculated in `onPokemonChange()` from `PokeCalc`
    onPokemonChange?.(mutation);
  }, [
    onPokemonChange,
    pokemon,
  ]);

  React.useEffect(() => {
    if (!pokemon?.calcdexId || !pokemon.autoPreset || pokemon.preset || !presets.length) {
      return;
    }

    applyPreset(presets[0]);
  }, [
    applyPreset,
    pokemon,
    presets,
  ]);

  const pokemonKey = pokemon?.calcdexId || pokemon?.name || '???';
  const friendlyPokemonName = pokemon?.speciesForme || pokemon?.name || pokemonKey;

  const hpPercentage = calcPokemonHp(pokemon);

  const abilityName = pokemon?.dirtyAbility ?? pokemon?.ability;
  const dexAbility = abilityName
    ? dex?.abilities?.get(abilityName)
    : null;

  const itemName = pokemon?.dirtyItem ?? pokemon?.item;
  const dexItem = itemName
    ? dex?.items?.get(itemName)
    : null;

  const abilityOptions = buildAbilityOptions(format, pokemon);

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
              speciesForme: pokemon?.transformedForme || pokemon?.speciesForme,
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
          <div className={styles.firstLine}>
            <span className={styles.pokemonName}>
              {/* no nicknames, as requested by camdawgboi lol */}
              {/* {pokemon?.name || '--'} */}
              {pokemon?.speciesForme || '--'}
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

          <div className={styles.secondLine}>
            {/* <span className={styles.label}>
              HP{' '}
            </span> */}

            <PokeHpBar
              className={styles.hpBar}
              hp={hpPercentage}
              width={115}
            />

            {
              !!hpPercentage &&
              <span className={styles.hpPercentage}>
                {' '}
                {`${(hpPercentage * 100).toFixed(0)}%`}
              </span>
            }

            {
              (!!pokemon && (!!pokemon.status || !hpPercentage)) &&
              <span>
                {' '}
                <PokeStatus
                  status={pokemon?.status}
                  fainted={!hpPercentage}
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
                const preset = presets.find((p) => p?.calcdexId === calcdexId);

                if (!preset) {
                  return;
                }

                applyPreset(preset);
              },
            }}
            // options={presets.filter((p) => p?.calcdexId).map((p) => ({
            //   label: p.name,
            //   value: p.calcdexId,
            // }))}
            options={presetOptions}
            noOptionsMessage="No Sets"
            clearable={false}
            disabled={!pokemon?.speciesForme || !presets.length}
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
              pokemon?.abilityToggleable &&
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
            tooltip={dexAbility?.desc ? (
              <div className={styles.descTooltip}>
                {dexAbility?.shortDesc || dexAbility?.desc}
              </div>
            ) : null}
            input={{
              name: `PokeInfo:Ability:${pokemonKey}`,
              value: abilityName,
              onChange: (name: AbilityName) => onPokemonChange?.({
                dirtyAbility: name,
                abilityToggled: detectToggledAbility({
                  ...pokemon,
                  ability: name,
                }),
              }),
            }}
            options={abilityOptions}
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
              onChange: (name: Showdown.PokemonNature) => onPokemonChange?.({
                nature: name,
              }),
            }}
            options={PokemonCommonNatures.map((name) => ({
              label: name,
              subLabel: PokemonNatureBoosts[name]?.length ? [
                !!PokemonNatureBoosts[name][0] && `+${PokemonNatureBoosts[name][0].toUpperCase()}`,
                !!PokemonNatureBoosts[name][1] && `-${PokemonNatureBoosts[name][1].toUpperCase()}`,
              ].filter(Boolean).join(' ') : 'Neutral',
              value: name,
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
              <div className={cx(styles.descTooltip, styles.itemTooltip)}>
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
            ) : dexItem?.desc ? (
              <div className={styles.descTooltip}>
                {dexItem?.shortDesc || dexItem?.desc}
              </div>
            ) : null}
            input={{
              name: `PokeInfo:Item:${pokemonKey}`,
              value: itemName,
              onChange: (name: ItemName) => onPokemonChange?.({
                dirtyItem: name ?? ('' as ItemName),
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
                .filter((i) => i?.name && (format?.includes('nationaldex') || gen === 6 || gen === 7 || (!i.megaStone && !i.zMove)) && (!pokemon?.altItems?.length || !pokemon.altItems.includes(i.name as ItemName)))
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

/* eslint-enable no-nested-ternary */
