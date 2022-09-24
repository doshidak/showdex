import * as React from 'react';
import cx from 'classnames';
import {
  PiconButton,
  PokeHpBar,
  PokeStatus,
  PokeType,
} from '@showdex/components/app';
import { Dropdown } from '@showdex/components/form';
import { Button } from '@showdex/components/ui';
import {
  FormatLabels,
  PokemonCommonNatures,
  PokemonNatureBoosts,
  // PokemonToggleAbilities,
} from '@showdex/consts';
import { useColorScheme } from '@showdex/redux/store';
import { openSmogonUniversity } from '@showdex/utils/app';
import {
  buildAbilityOptions,
  buildItemOptions,
  detectLegacyGen,
  detectToggledAbility,
  hasMegaForme,
} from '@showdex/utils/battle';
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
      dirtyAbility: preset.ability,
      // item: !pokemon.item || pokemon.item === '(exists)' ? preset.item : pokemon.item,
      // dirtyItem: pokemon.item && pokemon.item !== '(exists)' && pokemon.item !== preset.item ? preset.item : null,
      dirtyItem: preset.item,
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

    // don't apply the dirtyAbility/dirtyItem if we're applying the Pokemon's first preset and
    // their abilility/item was already revealed or it matches the Pokemon's revealed ability/item
    if ((!pokemon.preset && pokemon.ability) || pokemon.ability === preset.ability) {
      mutation.dirtyAbility = null;
    }

    if ((!pokemon.preset && pokemon.item && pokemon.item !== '(exists)') || pokemon.item === preset.item) {
      mutation.dirtyItem = null;
    }

    if (Array.isArray(preset.altAbilities)) {
      mutation.altAbilities = [...preset.altAbilities];
    }

    if (Array.isArray(preset.altItems)) {
      mutation.altItems = [...preset.altItems];
    }

    // only apply the ability/item (and remove their dirty counterparts) if there's only
    // 1 possible ability/item in the pool
    if (preset.format?.includes('random')) {
      if (mutation.altAbilities?.length === 1) {
        [mutation.ability] = mutation.altAbilities;
        mutation.dirtyAbility = null;
      }

      if (mutation.altItems?.length === 1) {
        [mutation.item] = mutation.altItems;
        mutation.dirtyItem = null;
      }
    }

    // remove spread if Pokemon is transformed and a spread was already present prior
    const shouldRemoveSpread = !!pokemon.transformedForme
      && !!pokemon.nature
      && !!Object.values({ ...pokemon.ivs, ...pokemon.evs }).filter(Boolean).length;

    if (shouldRemoveSpread) {
      delete mutation.nature;

      // we'll keep the original HP EVs/IVs (even if possibly illegal) since the max HP
      // of a transformed Pokemon is preserved, which is based off of the HP's base, IV & EV
      mutation.ivs.hp = pokemon.ivs.hp;
      mutation.evs.hp = pokemon.evs.hp;

      // if the Pokemon has an item set by a previous preset, ignore this preset's item
      if (pokemon.dirtyItem || pokemon.item) {
        delete mutation.dirtyItem;
      }
    }

    // only remove the dirtyAbility/dirtyItem from the mutation if they're undefined (but not null)
    // (means that the preset didn't define the ability/item, hence the undefined)
    if (mutation.dirtyAbility === undefined) {
      delete mutation.dirtyAbility;
    }

    if (mutation.dirtyItem === undefined) {
      delete mutation.dirtyItem;
    }

    // spreadStats will be recalculated in `onPokemonChange()` from `PokeCalc`
    onPokemonChange?.(mutation);
  }, [
    onPokemonChange,
    pokemon,
  ]);

  // automatically apply the first preset if the Pokemon has no/invalid preset
  // (invalid presets could be due to the forme changing, so new presets are loaded in)
  React.useEffect(() => {
    if (!pokemon?.calcdexId || !pokemon.autoPreset || !presets.length) {
      return;
    }

    const existingPreset = pokemon.preset
      ? presets.find((p) => p.calcdexId === pokemon.preset)
      : null;

    if (existingPreset) {
      return;
    }

    applyPreset(presets[0]);
  }, [
    applyPreset,
    pokemon,
    presets,
  ]);

  const legacy = detectLegacyGen(gen);

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
  const itemOptions = buildItemOptions(format, pokemon);

  // handle cycling through the Pokemon's available alternative formes, if any
  // (disabled for legacy gens -- this is enough since nextForme will be null if legacy)
  const formeIndex = !legacy && pokemon?.altFormes?.length
    ? pokemon.altFormes.findIndex((f) => pokemon.speciesForme === f)
    : -1;

  const nextFormeIndex = formeIndex > -1
    ? formeIndex + 1 > pokemon.altFormes.length - 1
      ? 0
      : formeIndex + 1
    : -1;

  const nextForme = nextFormeIndex > -1
    ? pokemon.altFormes[nextFormeIndex]
    : null;

  const switchToNextForme = React.useCallback(() => {
    if (!nextForme) {
      return;
    }

    onPokemonChange?.({
      speciesForme: nextForme,
    });
  }, [
    nextForme,
    onPokemonChange,
  ]);

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
              item: hasMegaForme(pokemon?.transformedForme || pokemon?.speciesForme)
                ? null
                : pokemon?.dirtyItem ?? pokemon?.item,
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
            {/* no nicknames, as requested by camdawgboi lol */}
            <Button
              className={cx(
                styles.pokemonNameButton,
                !pokemon?.speciesForme && styles.missingForme,
                !nextForme && styles.disabled,
              )}
              labelClassName={styles.pokemonNameLabel}
              label={pokemon?.speciesForme || 'MissingNo.'}
              tooltip={nextForme ? (
                <div>
                  Switch to{' '}
                  <strong>{nextForme}</strong>
                </div>
              ) : null}
              hoverScale={1}
              absoluteHover
              disabled={!nextForme}
              onPress={switchToNextForme}
            />

            <span className={styles.small}>
              {
                (typeof pokemon?.level === 'number' && pokemon.level !== 100) &&
                <span className={styles.pokemonLevel}>
                  L{pokemon.level}
                </span>
              }

              {
                !!pokemon?.types?.length &&
                <span className={styles.pokemonTypes}>
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
              (!!pokemon?.dirtyAbility && !!pokemon.ability && pokemon.ability !== pokemon.dirtyAbility) &&
              <>
                {' '}
                <Button
                  className={cx(styles.infoButton, styles.abilityButton)}
                  labelClassName={styles.infoButtonLabel}
                  label="Reset"
                  tooltip="Reset to Revealed Ability"
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
            hint={legacy ? 'N/A' : '???'}
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
            disabled={legacy || !pokemon?.speciesForme}
          />
        </div>

        <div className={styles.rowItem}>
          <div className={cx(styles.label, styles.dropdownLabel)}>
            Nature
          </div>

          <Dropdown
            aria-label={`Available Natures for Pokemon ${friendlyPokemonName}`}
            hint={legacy ? 'N/A' : '???'}
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
            disabled={legacy || !pokemon?.speciesForme}
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
                  tooltip="Reset to Revealed Item"
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
            hint={gen === 1 ? 'N/A' : 'None'}
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
            options={itemOptions}
            noOptionsMessage="No Items"
            disabled={gen === 1 || !pokemon?.speciesForme}
          />
        </div>
      </div>
    </div>
  );
};
